import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import {
  calculateOrderTotal,
  deriveFloor,
  isValidStatusTransition,
  normalizeTranslations,
  requireText
} from '../domain/order.js';
import {
  seedCategories,
  seedFloors,
  seedMenuItems,
  seedStaffMembers,
  seedTables,
  defaultAssets,
  fallbackMenuImage
} from './seed.js';
import { buildDemoNotifications, buildDemoOrders } from './demoData.js';
import config from '../config/env.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const json = (value) => JSON.stringify(value ?? {});
const bool = (value) => (value ? 1 : 0);

function parseJson(value, fallback = {}) {
  if (value && typeof value === 'object') return value;
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function makeInternalId(prefix) {
  return `${prefix}_${randomUUID()}`;
}

function buildQrUrl(internalId, fallbackParam = {}) {
  try {
    const url = new URL('/order', config.publicBaseUrl);
    if (internalId) {
      url.searchParams.set('id', internalId);
    } else {
      for (const [key, value] of Object.entries(fallbackParam)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  } catch {
    const params = internalId
      ? `id=${encodeURIComponent(internalId)}`
      : new URLSearchParams(fallbackParam).toString();
    return `/order?${params}`;
  }
}

function numberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function floorFromNumber(value, fallback = 1) {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= 100) return Math.floor(parsed / 100);
  return Number(fallback) || 1;
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

function mapCategory(row) {
  return {
    id: row.id,
    name: parseJson(row.name_json),
    icon: row.icon,
    image: row.image || '',
    imagePublicId: row.image_public_id || '',
    imageThumbnail: row.image_thumbnail || row.image || '',
    sortOrder: row.sort_order,
    active: Boolean(row.active)
  };
}

function mapMenuItem(row) {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: parseJson(row.name_json),
    description: parseJson(row.description_json),
    price: row.price,
    image: row.image || fallbackMenuImage(row),
    imagePublicId: row.image_public_id || '',
    imageThumbnail: row.image_thumbnail || row.image || fallbackMenuImage(row),
    prepMinutes: row.prep_minutes,
    popular: Boolean(row.popular),
    chefPick: Boolean(row.chef_pick),
    available: Boolean(row.available),
    sortOrder: row.sort_order,
    ratingAverage: Number(row.rating_average || 0),
    ratingCount: Number(row.rating_count || 0)
  };
}

function mapFloor(row) {
  return {
    id: row.id,
    name: row.name,
    number: row.number,
    description: row.description || '',
    active: Boolean(row.active),
    createdAt: row.created_at
  };
}

function mapTable(row) {
  return {
    id: row.id || row.number,
    internalId: row.internal_id || '',
    number: row.number,
    floor: row.floor,
    floorId: row.floor_id || null,
    floorName: row.floor_name || `Floor ${row.floor}`,
    seats: row.seats,
    active: Boolean(row.active),
    qrUrl: buildQrUrl(row.internal_id, { table: row.number })
  };
}

function mapRoom(row) {
  return {
    id: row.id,
    internalId: row.internal_id || '',
    number: row.room_number,
    roomNumber: row.room_number,
    floor: row.floor,
    floorId: row.floor_id || null,
    floorName: row.floor_name || `Floor ${row.floor}`,
    active: Boolean(row.active),
    qrUrl: buildQrUrl(row.internal_id, { room: row.room_number })
  };
}

function locationLabel(row) {
  if (row.location_type === 'room') {
    return `Room ${row.room_number || row.table_number}`;
  }
  return `Table ${row.table_number}`;
}

function mapStaffMember(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    assignedFloor: row.assigned_floor,
    online: Boolean(row.online),
    active: Boolean(row.active),
    createdAt: row.created_at
  };
}

function mapManagerNotification(row) {
  return {
    id: row.id,
    staffName: row.staff_name,
    staffRole: row.staff_role,
    assignedFloor: row.assigned_floor,
    reason: row.reason || '',
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at
  };
}

function mapNotification(row) {
  return {
    id: row.id,
    type: row.type,
    tableNumber: row.table_number,
    roomNumber: row.room_number || '',
    locationType: row.location_type || 'table',
    locationId: row.location_id || '',
    locationLabel: locationLabel(row),
    floor: row.floor,
    note: row.reason || '',
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at
  };
}

function mapOrderFeedback(row) {
  if (!row) return null;
  return {
    id: row.id,
    orderId: row.order_id,
    tableNumber: row.table_number,
    floor: row.floor,
    rating: row.rating,
    name: row.name || '',
    comment: row.comment || '',
    createdAt: row.created_at
  };
}

function mapMenuReview(row) {
  return {
    id: row.id,
    menuItemId: row.menu_item_id,
    orderId: row.order_id,
    tableNumber: row.table_number,
    rating: row.rating,
    name: row.name || '',
    comment: row.comment || '',
    createdAt: row.created_at
  };
}

function mapAsset(row) {
  return {
    key: row.key,
    label: row.label,
    url: row.url,
    thumbnail: row.thumbnail || row.url,
    publicId: row.public_id || '',
    updatedAt: row.updated_at
  };
}

// ─── Migration ────────────────────────────────────────────────────────────────

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER NOT NULL UNIQUE,
      floor INTEGER NOT NULL,
      internal_id TEXT NOT NULL DEFAULT '',
      seats INTEGER NOT NULL DEFAULT 4,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS floors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      number INTEGER NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number INTEGER NOT NULL UNIQUE,
      floor INTEGER NOT NULL,
      internal_id TEXT NOT NULL UNIQUE,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_json TEXT NOT NULL,
      icon TEXT NOT NULL,
      image TEXT NOT NULL DEFAULT '',
      image_public_id TEXT NOT NULL DEFAULT '',
      image_thumbnail TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      name_json TEXT NOT NULL,
      description_json TEXT NOT NULL,
      price INTEGER NOT NULL CHECK(price >= 0),
      image TEXT NOT NULL DEFAULT '',
      image_public_id TEXT NOT NULL DEFAULT '',
      image_thumbnail TEXT NOT NULL DEFAULT '',
      prep_minutes INTEGER NOT NULL DEFAULT 0,
      popular INTEGER NOT NULL DEFAULT 0,
      chef_pick INTEGER NOT NULL DEFAULT 0,
      available INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number INTEGER NOT NULL,
      floor INTEGER NOT NULL,
      location_type TEXT NOT NULL DEFAULT 'table' CHECK(location_type IN ('table', 'room')),
      location_id TEXT NOT NULL DEFAULT '',
      room_number TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'received',
      notes TEXT NOT NULL DEFAULT '',
      total INTEGER NOT NULL,
      idempotency_key TEXT UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
      table_number INTEGER NOT NULL,
      floor INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      name TEXT NOT NULL DEFAULT '',
      comment TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS menu_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      table_number INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      name TEXT NOT NULL DEFAULT '',
      comment TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id INTEGER,
      name_json TEXT NOT NULL,
      unit_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      line_total INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS service_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('call-waiter', 'request-bill')),
      table_number INTEGER NOT NULL,
      floor INTEGER NOT NULL,
      location_type TEXT NOT NULL DEFAULT 'table' CHECK(location_type IN ('table', 'room', 'kitchen')),
      location_id TEXT NOT NULL DEFAULT '',
      room_number TEXT NOT NULL DEFAULT '',
      reason TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'resolved')),
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS staff_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      assigned_floor INTEGER,
      online INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS manager_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_name TEXT NOT NULL,
      staff_role TEXT NOT NULL,
      assigned_floor INTEGER,
      reason TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'resolved')),
      created_at TEXT NOT NULL,
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS app_assets (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail TEXT NOT NULL DEFAULT '',
      public_id TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL
    );
  `);

  ensureColumn(db, 'categories', 'image TEXT NOT NULL DEFAULT \'\'');
  ensureColumn(db, 'categories', 'image_public_id TEXT NOT NULL DEFAULT \'\'');
  ensureColumn(db, 'categories', 'image_thumbnail TEXT NOT NULL DEFAULT \'\'');
  ensureColumn(db, 'menu_items', 'image_public_id TEXT NOT NULL DEFAULT \'\'');
  ensureColumn(db, 'menu_items', 'image_thumbnail TEXT NOT NULL DEFAULT \'\'');
  ensureColumn(db, 'tables', 'internal_id TEXT NOT NULL DEFAULT \'\'');
  ensureColumn(db, 'orders', 'location_type TEXT NOT NULL DEFAULT \'table\'');
  ensureColumn(db, 'orders', 'location_id TEXT NOT NULL DEFAULT \'\'');
  ensureColumn(db, 'orders', 'room_number TEXT NOT NULL DEFAULT \'\'');
  ensureColumn(db, 'order_items', 'note TEXT NOT NULL DEFAULT \'\'');
  ensureColumn(db, 'service_notifications', 'location_type TEXT NOT NULL DEFAULT \'table\'');
  ensureColumn(db, 'service_notifications', 'location_id TEXT NOT NULL DEFAULT \'\'');
  ensureColumn(db, 'service_notifications', 'room_number TEXT NOT NULL DEFAULT \'\'');
  ensureColumn(db, 'service_notifications', 'reason TEXT NOT NULL DEFAULT \'\'');

  db.prepare('SELECT rowid AS rowid FROM tables WHERE internal_id = ? OR internal_id IS NULL').all('').forEach((row) => {
    db.prepare('UPDATE tables SET internal_id = ? WHERE rowid = ?').run(
      makeInternalId('table'),
      row.rowid
    );
  });

  db.exec(`
    INSERT INTO floors (name, number, description, active)
    SELECT 'Floor ' || floor, floor, '', 1
    FROM (SELECT DISTINCT floor FROM tables WHERE floor IS NOT NULL)
    WHERE floor NOT IN (SELECT number FROM floors);

    CREATE UNIQUE INDEX IF NOT EXISTS idx_tables_internal_id
      ON tables(internal_id)
      WHERE internal_id <> '';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_internal_id
      ON rooms(internal_id);
    CREATE INDEX IF NOT EXISTS idx_orders_location
      ON orders(location_type, location_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_location
      ON service_notifications(location_type, location_id);
    CREATE INDEX IF NOT EXISTS idx_manager_notifications_status
      ON manager_notifications(status, created_at DESC);
  `);
}

function ensureColumn(db, table, definition) {
  const [name] = definition.split(/\s+/);
  const exists = db
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .some((col) => col.name === name);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition};`);
  }
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

function seed(db) {
  const floorCount = db.prepare('SELECT COUNT(*) AS count FROM floors').get().count;
  if (!floorCount) {
    const insert = db.prepare(
      'INSERT INTO floors (name, number, description, active) VALUES (?, ?, ?, 1)'
    );
    for (const floor of seedFloors()) {
      insert.run(floor.name, floor.number, floor.description || '');
    }
  }

  const tableCount = db.prepare('SELECT COUNT(*) AS count FROM tables').get().count;
  if (!tableCount) {
    const insert = db.prepare(
      'INSERT INTO tables (number, floor, internal_id, seats, active) VALUES (?, ?, ?, ?, 1)'
    );
    for (const t of seedTables()) {
      insert.run(t.number, t.floor, makeInternalId('table'), t.seats);
    }
  }

  const staffCount = db.prepare('SELECT COUNT(*) AS count FROM staff_members').get().count;
  if (!staffCount) {
    const insert = db.prepare(
      'INSERT INTO staff_members (name, role, assigned_floor, online, active) VALUES (?, ?, ?, ?, 1)'
    );
    for (const staff of seedStaffMembers()) {
      insert.run(
        staff.name,
        staff.role,
        staff.assignedFloor ?? null,
        bool(staff.online)
      );
    }
  }

  const categoryCount = db.prepare('SELECT COUNT(*) AS count FROM categories').get().count;
  if (!categoryCount) {
    const insert = db.prepare(
      'INSERT INTO categories (id, name_json, icon, sort_order, active) VALUES (?, ?, ?, ?, 1)'
    );
    for (const cat of seedCategories) {
      insert.run(cat.id, json(cat.name), cat.icon, cat.sortOrder);
    }
  }

  const itemCount = db.prepare('SELECT COUNT(*) AS count FROM menu_items').get().count;
  if (!itemCount) {
    const insert = db.prepare(`
      INSERT INTO menu_items
        (category_id, name_json, description_json, price, image, prep_minutes,
         popular, chef_pick, available, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);
    seedMenuItems.forEach((item, index) => {
      insert.run(
        item.categoryId,
        json(item.name),
        json(item.description),
        item.price,
        item.image || '',
        item.prepMinutes || 0,
        bool(item.popular),
        bool(item.chefPick),
        index + 1
      );
    });
  }

  for (const asset of defaultAssets) {
    db.prepare(`
      INSERT INTO app_assets (key, label, url, thumbnail, public_id, updated_at)
      VALUES (?, ?, ?, ?, '', ?)
      ON CONFLICT(key) DO NOTHING
    `).run(asset.key, asset.label, asset.url, asset.thumbnail, nowIso());
  }

  if (config.sampleDataMode === 'full') {
    seedFullDemo(db);
  }
}

function seedFullDemo(db) {
  const menuRows = db.prepare('SELECT * FROM menu_items ORDER BY sort_order, id').all();
  const menuById = new Map(menuRows.map((row) => [row.id, row]));
  const demoOrders = buildDemoOrders(menuRows);

  const insertOrder = db.prepare(`
    INSERT INTO orders
      (table_number, floor, status, notes, total, idempotency_key, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertOrderItem = db.prepare(`
    INSERT INTO order_items
      (order_id, menu_item_id, name_json, unit_price, quantity, line_total)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const insertFeedback = db.prepare(`
    INSERT INTO order_feedback
      (order_id, table_number, floor, rating, name, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const insertReview = db.prepare(`
    INSERT INTO menu_reviews
      (menu_item_id, order_id, table_number, rating, name, comment, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const order of demoOrders) {
    const existing = db
      .prepare('SELECT id FROM orders WHERE idempotency_key = ?')
      .get(order.key);
    if (existing) continue;

    const snapshots = order.items
      .map((requested) => {
        const row = menuById.get(requested.menuItemId);
        if (!row) return null;
        const quantity = Number(requested.quantity || 1);
        return {
          menuItemId: row.id,
          nameJson: row.name_json,
          unitPrice: row.price,
          quantity,
          lineTotal: row.price * quantity
        };
      })
      .filter(Boolean);
    if (!snapshots.length) continue;

    const total = snapshots.reduce((sum, item) => sum + item.lineTotal, 0);
    const floor = deriveFloor(order.tableNumber);
    const info = insertOrder.run(
      order.tableNumber,
      floor,
      order.status,
      order.notes || '',
      total,
      order.key,
      order.createdAt,
      order.createdAt
    );

    for (const item of snapshots) {
      insertOrderItem.run(
        info.lastInsertRowid,
        item.menuItemId,
        item.nameJson,
        item.unitPrice,
        item.quantity,
        item.lineTotal
      );
    }

    if (order.feedback) {
      insertFeedback.run(
        info.lastInsertRowid,
        order.tableNumber,
        floor,
        order.feedback.rating,
        order.feedback.name,
        order.feedback.comment,
        order.createdAt
      );
      for (const item of snapshots) {
        insertReview.run(
          item.menuItemId,
          info.lastInsertRowid,
          order.tableNumber,
          order.feedback.rating,
          order.feedback.name,
          order.feedback.comment,
          order.createdAt
        );
      }
    }
  }

  const notificationCount = db
    .prepare("SELECT COUNT(*) AS count FROM service_notifications WHERE created_at LIKE ?")
    .get(`${new Date().toISOString().slice(0, 10)}%`).count;
  if (!notificationCount) {
    const insertNotification = db.prepare(`
      INSERT INTO service_notifications
        (type, table_number, floor, status, created_at, resolved_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const item of buildDemoNotifications()) {
      insertNotification.run(
        item.type,
        item.tableNumber,
        item.floor,
        item.status,
        item.createdAt,
        item.resolvedAt || null
      );
    }
  }
}

// ─── Repository builder ───────────────────────────────────────────────────────

function buildRepository(db) {
  function getOrder(id) {
    const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id));
    if (!row) return null;
    return hydrateOrder(row);
  }

  function hydrateOrder(row) {
    const items = db
      .prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id')
      .all(row.id)
      .map((item) => ({
        id: item.id,
        menuItemId: item.menu_item_id,
        name: parseJson(item.name_json),
        unitPrice: item.unit_price,
        quantity: item.quantity,
        note: item.note || '',
        lineTotal: item.line_total
      }));

    return {
      id: row.id,
      tableNumber: row.table_number,
      roomNumber: row.room_number || '',
      locationType: row.location_type || 'table',
      locationId: row.location_id || '',
      locationLabel: locationLabel(row),
      floor: row.floor,
      status: row.status,
      notes: row.notes,
      total: row.total,
      idempotencyKey: row.idempotency_key,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      feedback: mapOrderFeedback(
        db.prepare('SELECT * FROM order_feedback WHERE order_id = ?').get(row.id)
      ),
      items
    };
  }

  function resolveLocation(input = {}) {
    const internalId = requireText(input.locationId ?? input.id, '');
    if (internalId) {
      const table = db
        .prepare('SELECT * FROM tables WHERE internal_id = ? AND active = 1')
        .get(internalId);
      if (table) {
        return {
          type: 'table',
          tableNumber: table.number,
          roomNumber: '',
          floor: table.floor,
          internalId: table.internal_id,
          label: `Table ${table.number}`
        };
      }

      const room = db
        .prepare('SELECT * FROM rooms WHERE internal_id = ? AND active = 1')
        .get(internalId);
      if (room) {
        return {
          type: 'room',
          tableNumber: room.room_number,
          roomNumber: String(room.room_number),
          floor: room.floor,
          internalId: room.internal_id,
          label: `Room ${room.room_number}`
        };
      }
      throw new Error('QR location was not found');
    }

    const roomInput = input.roomNumber ?? input.room;
    if (roomInput !== undefined && roomInput !== null && roomInput !== '') {
      const roomNumber = Number(roomInput);
      const room = db
        .prepare('SELECT * FROM rooms WHERE room_number = ? AND active = 1')
        .get(roomNumber);
      if (room) {
        return {
          type: 'room',
          tableNumber: room.room_number,
          roomNumber: String(room.room_number),
          floor: room.floor,
          internalId: room.internal_id,
          label: `Room ${room.room_number}`
        };
      }
      return {
        type: 'room',
        tableNumber: roomNumber,
        roomNumber: String(roomNumber),
        floor: floorFromNumber(roomNumber, input.floor),
        internalId: '',
        label: `Room ${roomNumber}`
      };
    }

    const tableNumber = Number(input.tableNumber ?? input.table);
    if (!Number.isInteger(tableNumber) || tableNumber < 1) {
      throw new Error('Valid table, room, or QR location is required');
    }
    const table = db
      .prepare('SELECT * FROM tables WHERE number = ? AND active = 1')
      .get(tableNumber);
    if (table) {
      return {
        type: 'table',
        tableNumber: table.number,
        roomNumber: '',
        floor: table.floor,
        internalId: table.internal_id,
        label: `Table ${table.number}`
      };
    }
    return {
      type: 'table',
      tableNumber,
      roomNumber: '',
      floor: floorFromNumber(tableNumber, input.floor),
      internalId: '',
      label: `Table ${tableNumber}`
    };
  }

  return {
    raw: db,

    listFloors(includeInactive = false) {
      const where = includeInactive ? '' : 'WHERE active = 1';
      return db
        .prepare(`SELECT * FROM floors ${where} ORDER BY number, id`)
        .all()
        .map(mapFloor);
    },

    createFloor(input) {
      const number = Number(input.number);
      if (!Number.isInteger(number) || number < 1) {
        throw new Error('Floor number must be a positive number');
      }
      const info = db
        .prepare(
          `INSERT INTO floors (name, number, description, active, created_at)
           VALUES (?, ?, ?, 1, ?)`
        )
        .run(
          requireText(input.name, `Floor ${number}`),
          number,
          requireText(input.description, ''),
          nowIso()
        );
      return this.listFloors(true).find((floor) => floor.id === info.lastInsertRowid);
    },

    updateFloor(id, input) {
      const current = db.prepare('SELECT * FROM floors WHERE id = ?').get(Number(id));
      if (!current) return null;
      const nextNumber = Number(input.number ?? current.number);
      if (!Number.isInteger(nextNumber) || nextNumber < 1) {
        throw new Error('Floor number must be a positive number');
      }

      db.exec('BEGIN');
      try {
        db.prepare(
          `UPDATE floors
           SET name = ?, number = ?, description = ?, active = ?
           WHERE id = ?`
        ).run(
          requireText(input.name, current.name),
          nextNumber,
          requireText(input.description, current.description),
          input.active === undefined ? current.active : bool(input.active),
          Number(id)
        );
        if (nextNumber !== current.number) {
          db.prepare('UPDATE tables SET floor = ? WHERE floor = ?').run(nextNumber, current.number);
          db.prepare('UPDATE rooms SET floor = ? WHERE floor = ?').run(nextNumber, current.number);
        }
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
      return this.listFloors(true).find((floor) => floor.id === Number(id));
    },

    deleteFloor(id) {
      const floor = db.prepare('SELECT * FROM floors WHERE id = ?').get(Number(id));
      if (!floor) return 0;
      const tableCount = db
        .prepare('SELECT COUNT(*) AS count FROM tables WHERE floor = ?')
        .get(floor.number).count;
      const roomCount = db
        .prepare('SELECT COUNT(*) AS count FROM rooms WHERE floor = ?')
        .get(floor.number).count;
      if (tableCount || roomCount) {
        throw new Error('Move or delete tables and rooms before deleting this floor');
      }
      return db.prepare('DELETE FROM floors WHERE id = ?').run(Number(id)).changes;
    },

    listTables() {
      return db
        .prepare(
          `SELECT tables.*, floors.id AS floor_id, floors.name AS floor_name
           FROM tables
           LEFT JOIN floors ON floors.number = tables.floor
           ORDER BY tables.floor, tables.number`
        )
        .all()
        .map(mapTable);
    },

    addTable(input) {
      const number = Number(input.number);
      const seats = Number(input.seats || 4);
      const floor = Number(input.floor ?? input.floorNumber ?? floorFromNumber(number));
      if (!Number.isInteger(number) || number < 1) {
        throw new Error('Table number must be a positive number');
      }
      if (!Number.isInteger(floor) || floor < 1) {
        throw new Error('Table floor is required');
      }
      const floorExists = db.prepare('SELECT id FROM floors WHERE number = ?').get(floor);
      if (!floorExists) {
        throw new Error('Please create the floor before adding tables to it');
      }
      db.prepare(
        'INSERT INTO tables (number, floor, internal_id, seats, active) VALUES (?, ?, ?, ?, 1)'
      ).run(number, floor, makeInternalId('table'), seats);
      return this.listTables().find((t) => t.number === number);
    },

    updateTable(number, input) {
      const current = db.prepare('SELECT * FROM tables WHERE number = ?').get(Number(number));
      if (!current) return null;
      const nextNumber = Number(input.number ?? current.number);
      const floor = Number(input.floor ?? input.floorNumber ?? current.floor);
      if (!Number.isInteger(nextNumber) || nextNumber < 1) {
        throw new Error('Table number must be a positive number');
      }
      if (!db.prepare('SELECT id FROM floors WHERE number = ?').get(floor)) {
        throw new Error('Please create the floor before assigning tables to it');
      }
      db.prepare(
        `UPDATE tables
         SET number = ?, floor = ?, seats = ?, active = ?
         WHERE number = ?`
      ).run(
        nextNumber,
        floor,
        Number(input.seats ?? current.seats),
        input.active === undefined ? current.active : bool(input.active),
        Number(number)
      );
      return this.listTables().find((t) => t.number === nextNumber);
    },

    deleteTable(number) {
      return db.prepare('DELETE FROM tables WHERE number = ?').run(Number(number)).changes;
    },

    listRooms() {
      return db
        .prepare(
          `SELECT rooms.*, floors.id AS floor_id, floors.name AS floor_name
           FROM rooms
           LEFT JOIN floors ON floors.number = rooms.floor
           ORDER BY rooms.floor, rooms.room_number`
        )
        .all()
        .map(mapRoom);
    },

    addRoom(input) {
      const roomNumber = Number(input.roomNumber ?? input.number);
      const floor = Number(input.floor ?? input.floorNumber);
      if (!Number.isInteger(roomNumber) || roomNumber < 1) {
        throw new Error('Room number must be a positive number');
      }
      if (!Number.isInteger(floor) || floor < 1) {
        throw new Error('Room floor is required');
      }
      if (!db.prepare('SELECT id FROM floors WHERE number = ?').get(floor)) {
        throw new Error('Please create the floor before adding rooms to it');
      }
      const info = db
        .prepare(
          `INSERT INTO rooms (room_number, floor, internal_id, active, created_at)
           VALUES (?, ?, ?, 1, ?)`
        )
        .run(roomNumber, floor, makeInternalId('room'), nowIso());
      return this.listRooms().find((room) => room.id === info.lastInsertRowid);
    },

    updateRoom(id, input) {
      const current = db.prepare('SELECT * FROM rooms WHERE id = ?').get(Number(id));
      if (!current) return null;
      const roomNumber = Number(input.roomNumber ?? input.number ?? current.room_number);
      const floor = Number(input.floor ?? input.floorNumber ?? current.floor);
      if (!Number.isInteger(roomNumber) || roomNumber < 1) {
        throw new Error('Room number must be a positive number');
      }
      if (!db.prepare('SELECT id FROM floors WHERE number = ?').get(floor)) {
        throw new Error('Please create the floor before assigning rooms to it');
      }
      db.prepare(
        `UPDATE rooms
         SET room_number = ?, floor = ?, active = ?
         WHERE id = ?`
      ).run(
        roomNumber,
        floor,
        input.active === undefined ? current.active : bool(input.active),
        Number(id)
      );
      return this.listRooms().find((room) => room.id === Number(id));
    },

    deleteRoom(id) {
      return db.prepare('DELETE FROM rooms WHERE id = ?').run(Number(id)).changes;
    },

    listCategories(includeInactive = false) {
      const where = includeInactive ? '' : 'WHERE active = 1';
      return db
        .prepare(`SELECT * FROM categories ${where} ORDER BY sort_order, id`)
        .all()
        .map(mapCategory);
    },

    createCategory(input) {
      const info = db
        .prepare(
          `INSERT INTO categories
             (name_json, icon, image, image_public_id, image_thumbnail, sort_order, active)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          json(normalizeTranslations(input.name)),
          requireText(input.icon, 'Utensils'),
          requireText(input.image, ''),
          requireText(input.imagePublicId, ''),
          requireText(input.imageThumbnail, input.image || ''),
          Number(input.sortOrder || 0),
          input.active === false ? 0 : 1
        );
      return this.listCategories(true).find((c) => c.id === info.lastInsertRowid);
    },

    updateCategory(id, input) {
      const current = db
        .prepare('SELECT * FROM categories WHERE id = ?')
        .get(Number(id));
      if (!current) return null;
      db.prepare(
        `UPDATE categories
         SET name_json = ?, icon = ?, image = ?, image_public_id = ?,
             image_thumbnail = ?, sort_order = ?, active = ?
         WHERE id = ?`
      ).run(
        json(normalizeTranslations(input.name ?? parseJson(current.name_json))),
        requireText(input.icon, current.icon),
        requireText(input.image, current.image),
        requireText(input.imagePublicId, current.image_public_id),
        requireText(
          input.imageThumbnail,
          current.image_thumbnail || input.image || current.image
        ),
        Number(input.sortOrder ?? current.sort_order),
        input.active === undefined ? current.active : bool(input.active),
        Number(id)
      );
      return this.listCategories(true).find((c) => c.id === Number(id));
    },

    deleteCategory(id) {
      return db.prepare('DELETE FROM categories WHERE id = ?').run(Number(id)).changes;
    },

    listMenuItems(includeUnavailable = false) {
      const where = includeUnavailable ? '' : 'WHERE menu_items.available = 1';
      return db
        .prepare(
          `SELECT menu_items.*,
                  COALESCE(ROUND(AVG(menu_reviews.rating), 1), 0) AS rating_average,
                  COUNT(menu_reviews.id) AS rating_count
           FROM menu_items
           LEFT JOIN menu_reviews ON menu_reviews.menu_item_id = menu_items.id
           ${where}
           GROUP BY menu_items.id
           ORDER BY menu_items.sort_order, menu_items.id`
        )
        .all()
        .map(mapMenuItem);
    },

    createMenuItem(input) {
      const info = db
        .prepare(
          `INSERT INTO menu_items
             (category_id, name_json, description_json, price, image, image_public_id,
              image_thumbnail, prep_minutes, popular, chef_pick, available, sort_order, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          Number(input.categoryId),
          json(normalizeTranslations(input.name)),
          json(normalizeTranslations(input.description || {})),
          Number(input.price || 0),
          requireText(input.image, ''),
          requireText(input.imagePublicId, ''),
          requireText(input.imageThumbnail, input.image || ''),
          Number(input.prepMinutes || 0),
          bool(input.popular),
          bool(input.chefPick),
          input.available === false ? 0 : 1,
          Number(input.sortOrder || 0),
          nowIso()
        );
      return this.listMenuItems(true).find((item) => item.id === info.lastInsertRowid);
    },

    updateMenuItem(id, input) {
      const current = db
        .prepare('SELECT * FROM menu_items WHERE id = ?')
        .get(Number(id));
      if (!current) return null;
      db.prepare(
        `UPDATE menu_items
         SET category_id = ?, name_json = ?, description_json = ?, price = ?,
             image = ?, image_public_id = ?, image_thumbnail = ?,
             prep_minutes = ?, popular = ?, chef_pick = ?, available = ?,
             sort_order = ?, updated_at = ?
         WHERE id = ?`
      ).run(
        Number(input.categoryId ?? current.category_id),
        json(normalizeTranslations(input.name ?? parseJson(current.name_json))),
        json(normalizeTranslations(input.description ?? parseJson(current.description_json))),
        Number(input.price ?? current.price),
        requireText(input.image, current.image),
        requireText(input.imagePublicId, current.image_public_id),
        requireText(
          input.imageThumbnail,
          current.image_thumbnail || input.image || current.image
        ),
        Number(input.prepMinutes ?? current.prep_minutes),
        input.popular === undefined ? current.popular : bool(input.popular),
        input.chefPick === undefined ? current.chef_pick : bool(input.chefPick),
        input.available === undefined ? current.available : bool(input.available),
        Number(input.sortOrder ?? current.sort_order),
        nowIso(),
        Number(id)
      );
      return this.listMenuItems(true).find((item) => item.id === Number(id));
    },

    listMenuItemReviews(menuItemId) {
      return db
        .prepare(
          'SELECT * FROM menu_reviews WHERE menu_item_id = ? ORDER BY created_at DESC, id DESC LIMIT 25'
        )
        .all(Number(menuItemId))
        .map(mapMenuReview);
    },

    deleteMenuItem(id) {
      return db.prepare('DELETE FROM menu_items WHERE id = ?').run(Number(id)).changes;
    },

    getMenu(includeUnavailable = false) {
      return {
        categories: this.listCategories(includeUnavailable),
        items: this.listMenuItems(includeUnavailable)
      };
    },

    createOrder(input) {
      const idempotencyKey = requireText(input.idempotencyKey, '');
      if (idempotencyKey) {
        const existing = db
          .prepare('SELECT * FROM orders WHERE idempotency_key = ?')
          .get(idempotencyKey);
        if (existing) return hydrateOrder(existing);
      }

      const location = resolveLocation(input);

      const requestedItems = Array.isArray(input.items) ? input.items : [];
      if (!requestedItems.length) {
        throw new Error('Order must include at least one item');
      }

      const snapshots = requestedItems.map((requested) => {
        const item = db
          .prepare('SELECT * FROM menu_items WHERE id = ? AND available = 1')
          .get(Number(requested.menuItemId));
        const quantity = Number(requested.quantity);
        if (!item || !Number.isInteger(quantity) || quantity < 1) {
          throw new Error('Invalid or unavailable menu item');
        }
        return {
          menuItemId: item.id,
          name: parseJson(item.name_json),
          unitPrice: item.price,
          quantity,
          note: requireText(requested.note, ''),
          lineTotal: item.price * quantity
        };
      });

      const total = calculateOrderTotal(
        snapshots.map((s) => ({ price: s.unitPrice, quantity: s.quantity }))
      );
      const createdAt = nowIso();

      db.exec('BEGIN');
      try {
        const orderInfo = db
          .prepare(
            `INSERT INTO orders
               (table_number, floor, location_type, location_id, room_number, status, notes,
                total, idempotency_key, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'received', ?, ?, ?, ?, ?)`
          )
          .run(
            location.tableNumber,
            location.floor,
            location.type,
            location.internalId,
            location.roomNumber,
            requireText(input.notes, ''),
            total,
            idempotencyKey || null,
            createdAt,
            createdAt
          );

        const insertItem = db.prepare(
          `INSERT INTO order_items
             (order_id, menu_item_id, name_json, unit_price, quantity, note, line_total)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        for (const s of snapshots) {
          insertItem.run(
            orderInfo.lastInsertRowid,
            s.menuItemId,
            json(s.name),
            s.unitPrice,
            s.quantity,
            s.note,
            s.lineTotal
          );
        }

        db.exec('COMMIT');
        return getOrder(orderInfo.lastInsertRowid);
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },

    getOrder,

    listOrders(filters = {}) {
      const where = [];
      const params = [];
      if (filters.floor) {
        where.push('floor = ?');
        params.push(Number(filters.floor));
      }
      if (filters.status) {
        const statuses = String(filters.status)
          .split(',')
          .map((status) => status.trim())
          .filter(Boolean);
        if (statuses.length > 1) {
          where.push(`status IN (${statuses.map(() => '?').join(', ')})`);
          params.push(...statuses);
        } else {
          where.push('status = ?');
          params.push(filters.status);
        }
      }
      if (filters.active) {
        where.push("status != 'delivered'");
      }
      const sql = `
        SELECT * FROM orders
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY created_at DESC, id DESC
      `;
      return db.prepare(sql).all(...params).map(hydrateOrder);
    },

    listOrdersInRange(from, to) {
      // from / to are ISO date strings: 'YYYY-MM-DD'
      return db
        .prepare(
          `SELECT * FROM orders
           WHERE date(created_at) >= date(?) AND date(created_at) <= date(?)
           ORDER BY created_at DESC, id DESC`
        )
        .all(from, to)
        .map(hydrateOrder);
    },

    updateOrderStatus(id, status) {
      const current = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id));
      if (!current) return null;
      if (!isValidStatusTransition(current.status, status)) {
        throw new Error('Invalid order status transition');
      }
      db.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(
        status,
        nowIso(),
        Number(id)
      );
      return getOrder(id);
    },

    updateOrderNotes(id, notes) {
      const current = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id));
      if (!current) return null;
      db.prepare('UPDATE orders SET notes = ?, updated_at = ? WHERE id = ?').run(
        notes || '',
        nowIso(),
        Number(id)
      );
      return getOrder(id);
    },

    submitOrderFeedback(orderId, input) {
      const order = getOrder(orderId);
      if (!order) return null;
      if (order.status !== 'delivered') {
        throw new Error('Feedback can be submitted after delivery');
      }
      if (order.feedback) {
        throw new Error('Feedback was already submitted for this order');
      }
      const rating = Number(input.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error('Please choose a rating from 1 to 5');
      }
      const createdAt = nowIso();

      db.exec('BEGIN');
      try {
        const info = db
          .prepare(
            `INSERT INTO order_feedback
               (order_id, table_number, floor, rating, name, comment, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            order.id,
            order.tableNumber,
            order.floor,
            rating,
            requireText(input.name, ''),
            requireText(input.comment, ''),
            createdAt
          );

        const insertReview = db.prepare(
          `INSERT INTO menu_reviews
             (menu_item_id, order_id, table_number, rating, name, comment, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        for (const item of order.items) {
          insertReview.run(
            item.menuItemId,
            order.id,
            order.tableNumber,
            rating,
            requireText(input.name, ''),
            requireText(input.comment, ''),
            createdAt
          );
        }

        db.exec('COMMIT');
        return mapOrderFeedback(
          db.prepare('SELECT * FROM order_feedback WHERE id = ?').get(info.lastInsertRowid)
        );
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },

    listFeedback(filters = {}) {
      const limit = Math.max(1, Math.min(Number(filters.limit || 50), 100));
      return db
        .prepare(
          'SELECT * FROM order_feedback ORDER BY created_at DESC, id DESC LIMIT ?'
        )
        .all(limit)
        .map(mapOrderFeedback);
    },

    createServiceNotification(input) {
      const location = resolveLocation(input);
      const type = input.type === 'request-bill' ? 'request-bill' : 'call-waiter';
      const info = db
        .prepare(
          `INSERT INTO service_notifications
             (type, table_number, floor, location_type, location_id, room_number, reason, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)`
        )
        .run(
          type,
          location.tableNumber,
          location.floor,
          location.type,
          location.internalId,
          location.roomNumber,
          requireText(input.note ?? input.reason, ''),
          nowIso()
        );
      return db
        .prepare('SELECT * FROM service_notifications WHERE id = ?')
        .get(info.lastInsertRowid);
    },

    listServiceNotifications(filters = {}) {
      const where = [];
      const params = [];
      if (filters.floor) {
        where.push('floor = ?');
        params.push(Number(filters.floor));
      }
      if (filters.status) {
        where.push('status = ?');
        params.push(filters.status);
      }
      const sql = `
        SELECT * FROM service_notifications
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY created_at DESC
      `;
      return db.prepare(sql).all(...params).map(mapNotification);
    },

    resolveServiceNotification(id) {
      const row = db
        .prepare('SELECT * FROM service_notifications WHERE id = ?')
        .get(Number(id));
      if (!row) return null;
      db.prepare(
        "UPDATE service_notifications SET status = 'resolved', resolved_at = ? WHERE id = ?"
      ).run(nowIso(), Number(id));
      return mapNotification(
        db.prepare('SELECT * FROM service_notifications WHERE id = ?').get(Number(id))
      );
    },

    listStaffMembers() {
      return db
        .prepare(
          `SELECT * FROM staff_members
           WHERE active = 1
           ORDER BY
             CASE WHEN role = 'Kitchen' THEN 999 ELSE COALESCE(assigned_floor, 998) END,
             role,
             name`
        )
        .all()
        .map(mapStaffMember);
    },

    createManagerNotification(input) {
      const staffName = requireText(input.staffName ?? input.name, '');
      const staffRole = requireText(input.staffRole ?? input.role, 'Staff');
      if (!staffName) {
        throw new Error('Staff name is required');
      }
      const assignedFloor = numberOrNull(input.assignedFloor ?? input.floor);
      const info = db
        .prepare(
          `INSERT INTO manager_notifications
             (staff_name, staff_role, assigned_floor, reason, status, created_at)
           VALUES (?, ?, ?, ?, 'open', ?)`
        )
        .run(
          staffName,
          staffRole,
          assignedFloor,
          requireText(input.reason, ''),
          nowIso()
        );
      return mapManagerNotification(
        db.prepare('SELECT * FROM manager_notifications WHERE id = ?').get(info.lastInsertRowid)
      );
    },

    listManagerNotifications(filters = {}) {
      const where = [];
      const params = [];
      if (filters.status) {
        where.push('status = ?');
        params.push(filters.status);
      }
      const sql = `
        SELECT * FROM manager_notifications
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY created_at DESC, id DESC
      `;
      return db.prepare(sql).all(...params).map(mapManagerNotification);
    },

    resolveManagerNotification(id) {
      const row = db
        .prepare('SELECT * FROM manager_notifications WHERE id = ?')
        .get(Number(id));
      if (!row) return null;
      db.prepare(
        "UPDATE manager_notifications SET status = 'resolved', resolved_at = ? WHERE id = ?"
      ).run(nowIso(), Number(id));
      return mapManagerNotification(
        db.prepare('SELECT * FROM manager_notifications WHERE id = ?').get(Number(id))
      );
    },

    todayReport() {
      const today = new Date().toDateString();
      const orders = this.listOrders().filter(
        (o) => new Date(o.createdAt).toDateString() === today
      );
      const revenue = orders.reduce((sum, o) => sum + o.total, 0);
      const counts = new Map();
      for (const order of orders) {
        for (const item of order.items) {
          const key = item.menuItemId || item.name.en;
          const existing = counts.get(key) || { name: item.name, quantity: 0, revenue: 0 };
          existing.quantity += item.quantity;
          existing.revenue += item.lineTotal;
          counts.set(key, existing);
        }
      }
      return {
        orders: orders.length,
        revenue,
        averageOrder: orders.length ? Math.round(revenue / orders.length) : 0,
        activeOrders: orders.filter((o) => o.status !== 'delivered').length,
        feedbackCount: db
          .prepare('SELECT COUNT(*) AS count FROM order_feedback')
          .get().count,
        averageRating: Number(
          db
            .prepare(
              'SELECT COALESCE(ROUND(AVG(rating), 1), 0) AS average FROM order_feedback'
            )
            .get().average || 0
        ),
        popularItems: [...counts.values()]
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)
      };
    },

    listAssets() {
      return db.prepare('SELECT * FROM app_assets ORDER BY key').all().map(mapAsset);
    },

    updateAsset(key, input) {
      const current = db
        .prepare('SELECT * FROM app_assets WHERE key = ?')
        .get(String(key));
      if (!current) return null;
      db.prepare(
        `UPDATE app_assets
         SET url = ?, thumbnail = ?, public_id = ?, updated_at = ?
         WHERE key = ?`
      ).run(
        requireText(input.url, current.url),
        requireText(input.thumbnail, input.url || current.thumbnail || current.url),
        requireText(input.publicId, current.public_id),
        nowIso(),
        String(key)
      );
      return mapAsset(
        db.prepare('SELECT * FROM app_assets WHERE key = ?').get(String(key))
      );
    },

    createStaffMember(input) {
      const name = requireText(input.name, '');
      const role = requireText(input.role, 'Staff');
      if (!name) throw new Error('Staff name is required');
      const info = db
        .prepare(
          `INSERT INTO staff_members (name, role, assigned_floor, online, active)
           VALUES (?, ?, ?, ?, 1)`
        )
        .run(name, role, numberOrNull(input.assignedFloor), bool(input.online ?? false));
      return mapStaffMember(
        db.prepare('SELECT * FROM staff_members WHERE id = ?').get(info.lastInsertRowid)
      );
    },

    updateStaffMember(id, input) {
      const current = db
        .prepare('SELECT * FROM staff_members WHERE id = ?')
        .get(Number(id));
      if (!current) return null;
      db.prepare(
        `UPDATE staff_members
         SET name = ?, role = ?, assigned_floor = ?, online = ?
         WHERE id = ?`
      ).run(
        requireText(input.name, current.name),
        requireText(input.role, current.role),
        numberOrNull(input.assignedFloor ?? current.assigned_floor),
        input.online !== undefined ? bool(input.online) : current.online,
        Number(id)
      );
      return mapStaffMember(
        db.prepare('SELECT * FROM staff_members WHERE id = ?').get(Number(id))
      );
    },

    deleteStaffMember(id) {
      const row = db
        .prepare('SELECT id FROM staff_members WHERE id = ?')
        .get(Number(id));
      if (!row) return 0;
      return db
        .prepare('UPDATE staff_members SET active = 0 WHERE id = ?')
        .run(Number(id)).changes;
    },

    setStaffOnline(id, online) {
      const row = db
        .prepare('SELECT id FROM staff_members WHERE id = ?')
        .get(Number(id));
      if (!row) return null;
      db.prepare('UPDATE staff_members SET online = ? WHERE id = ?').run(
        bool(online),
        Number(id)
      );
      return mapStaffMember(
        db.prepare('SELECT * FROM staff_members WHERE id = ?').get(Number(id))
      );
    }
  };
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export function createDatabase(
  filename = process.env.DATABASE_PATH || './data/hotel.sqlite'
) {
  const dbPath = filename === ':memory:' ? filename : resolve(filename);
  if (dbPath !== ':memory:') {
    mkdirSync(dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON;');
  migrate(db);
  seed(db);
  return buildRepository(db);
}
