import pg from 'pg';
import { randomUUID } from 'node:crypto';
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

const { Pool } = pg;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const json = (value) => value ?? {};
const bool = (value) => Boolean(value);

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
      // Also include fallback params where available (e.g., table or room)
      for (const [key, value] of Object.entries(fallbackParam)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
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

function poolConfig(connectionString) {
  const useSsl =
    process.env.DATABASE_SSL === 'true' ||
    process.env.PGSSLMODE === 'require' ||
    connectionString?.includes('sslmode=require');

  return {
    connectionString,
    max: Number(process.env.DATABASE_POOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS || 10000),
    ssl: useSsl ? { rejectUnauthorized: false } : undefined
  };
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
    price: Number(row.price),
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

async function migrate(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tables (
      id SERIAL,
      number INTEGER PRIMARY KEY,
      floor INTEGER NOT NULL,
      internal_id TEXT NOT NULL DEFAULT '',
      seats INTEGER NOT NULL DEFAULT 4,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS floors (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      number INTEGER NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      room_number INTEGER NOT NULL UNIQUE,
      floor INTEGER NOT NULL,
      internal_id TEXT NOT NULL UNIQUE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name_json JSONB NOT NULL,
      icon TEXT NOT NULL,
      image TEXT NOT NULL DEFAULT '',
      image_public_id TEXT NOT NULL DEFAULT '',
      image_thumbnail TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
      name_json JSONB NOT NULL,
      description_json JSONB NOT NULL,
      price INTEGER NOT NULL CHECK(price >= 0),
      image TEXT NOT NULL DEFAULT '',
      image_public_id TEXT NOT NULL DEFAULT '',
      image_thumbnail TEXT NOT NULL DEFAULT '',
      prep_minutes INTEGER NOT NULL DEFAULT 0,
      popular BOOLEAN NOT NULL DEFAULT FALSE,
      chef_pick BOOLEAN NOT NULL DEFAULT FALSE,
      available BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      table_number INTEGER NOT NULL,
      floor INTEGER NOT NULL,
      location_type TEXT NOT NULL DEFAULT 'table' CHECK(location_type IN ('table', 'room')),
      location_id TEXT NOT NULL DEFAULT '',
      room_number TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'received',
      notes TEXT NOT NULL DEFAULT '',
      total INTEGER NOT NULL,
      idempotency_key TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      menu_item_id INTEGER,
      name_json JSONB NOT NULL,
      unit_price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      line_total INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS service_notifications (
      id SERIAL PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('call-waiter', 'request-bill')),
      table_number INTEGER NOT NULL,
      floor INTEGER NOT NULL,
      location_type TEXT NOT NULL DEFAULT 'table' CHECK(location_type IN ('table', 'room', 'kitchen')),
      location_id TEXT NOT NULL DEFAULT '',
      room_number TEXT NOT NULL DEFAULT '',
      reason TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'resolved')),
      created_at TIMESTAMPTZ NOT NULL,
      resolved_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS staff_members (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      assigned_floor INTEGER,
      online BOOLEAN NOT NULL DEFAULT FALSE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS manager_notifications (
      id SERIAL PRIMARY KEY,
      staff_name TEXT NOT NULL,
      staff_role TEXT NOT NULL,
      assigned_floor INTEGER,
      reason TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'resolved')),
      created_at TIMESTAMPTZ NOT NULL,
      resolved_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS order_feedback (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
      table_number INTEGER NOT NULL,
      floor INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      name TEXT NOT NULL DEFAULT '',
      comment TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS menu_reviews (
      id SERIAL PRIMARY KEY,
      menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      table_number INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
      name TEXT NOT NULL DEFAULT '',
      comment TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_assets (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail TEXT NOT NULL DEFAULT '',
      public_id TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL
    );

    ALTER TABLE categories ADD COLUMN IF NOT EXISTS image TEXT NOT NULL DEFAULT '';
    ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_public_id TEXT NOT NULL DEFAULT '';
    ALTER TABLE categories ADD COLUMN IF NOT EXISTS image_thumbnail TEXT NOT NULL DEFAULT '';
    ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_public_id TEXT NOT NULL DEFAULT '';
    ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS image_thumbnail TEXT NOT NULL DEFAULT '';
    ALTER TABLE tables ADD COLUMN IF NOT EXISTS internal_id TEXT NOT NULL DEFAULT '';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS location_type TEXT NOT NULL DEFAULT 'table';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS location_id TEXT NOT NULL DEFAULT '';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS room_number TEXT NOT NULL DEFAULT '';
    ALTER TABLE order_items ADD COLUMN IF NOT EXISTS note TEXT NOT NULL DEFAULT '';
    ALTER TABLE service_notifications ADD COLUMN IF NOT EXISTS location_type TEXT NOT NULL DEFAULT 'table';
    ALTER TABLE service_notifications ADD COLUMN IF NOT EXISTS location_id TEXT NOT NULL DEFAULT '';
    ALTER TABLE service_notifications ADD COLUMN IF NOT EXISTS room_number TEXT NOT NULL DEFAULT '';
    ALTER TABLE service_notifications ADD COLUMN IF NOT EXISTS reason TEXT NOT NULL DEFAULT '';

    UPDATE tables
    SET internal_id = 'table_' || number::text || '_' || floor::text
    WHERE internal_id = '';

    INSERT INTO floors (name, number, description, active)
    SELECT 'Floor ' || floor::text, floor, '', TRUE
    FROM (SELECT DISTINCT floor FROM tables WHERE floor IS NOT NULL) AS existing_floors
    ON CONFLICT (number) DO NOTHING;

    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_floor ON orders(floor);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_orders_location ON orders(location_type, location_id);
    CREATE INDEX IF NOT EXISTS idx_menu_reviews_item ON menu_reviews(menu_item_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_created ON order_feedback(created_at DESC);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tables_internal_id
      ON tables(internal_id)
      WHERE internal_id <> '';
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rooms_internal_id ON rooms(internal_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_location
      ON service_notifications(location_type, location_id);
    CREATE INDEX IF NOT EXISTS idx_manager_notifications_status
      ON manager_notifications(status, created_at DESC);
  `);
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed(pool) {
  const floorCount = Number(
    (await pool.query('SELECT COUNT(*) AS count FROM floors')).rows[0].count
  );
  if (!floorCount) {
    for (const floor of seedFloors()) {
      await pool.query(
        'INSERT INTO floors (name, number, description, active) VALUES ($1, $2, $3, TRUE)',
        [floor.name, floor.number, floor.description || '']
      );
    }
  }

  const tableCount = Number(
    (await pool.query('SELECT COUNT(*) AS count FROM tables')).rows[0].count
  );
  if (!tableCount) {
    for (const t of seedTables()) {
      await pool.query(
        'INSERT INTO tables (number, floor, internal_id, seats, active) VALUES ($1, $2, $3, $4, TRUE)',
        [t.number, t.floor, makeInternalId('table'), t.seats]
      );
    }
  }

  const staffCount = Number(
    (await pool.query('SELECT COUNT(*) AS count FROM staff_members')).rows[0].count
  );
  if (!staffCount) {
    for (const staff of seedStaffMembers()) {
      await pool.query(
        'INSERT INTO staff_members (name, role, assigned_floor, online, active) VALUES ($1, $2, $3, $4, TRUE)',
        [staff.name, staff.role, staff.assignedFloor ?? null, bool(staff.online)]
      );
    }
  }

  const categoryCount = Number(
    (await pool.query('SELECT COUNT(*) AS count FROM categories')).rows[0].count
  );
  if (!categoryCount) {
    for (const cat of seedCategories) {
      await pool.query(
        'INSERT INTO categories (id, name_json, icon, sort_order, active) VALUES ($1, $2, $3, $4, TRUE)',
        [cat.id, json(cat.name), cat.icon, cat.sortOrder]
      );
    }
    await pool.query(
      "SELECT setval(pg_get_serial_sequence('categories', 'id'), (SELECT COALESCE(MAX(id), 1) FROM categories))"
    );
  }

  const itemCount = Number(
    (await pool.query('SELECT COUNT(*) AS count FROM menu_items')).rows[0].count
  );
  if (!itemCount) {
    for (const [index, item] of seedMenuItems.entries()) {
      await pool.query(
        `INSERT INTO menu_items
           (category_id, name_json, description_json, price, image, prep_minutes,
            popular, chef_pick, available, sort_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9, $10)`,
        [
          item.categoryId,
          json(item.name),
          json(item.description),
          item.price,
          item.image || '',
          item.prepMinutes || 0,
          bool(item.popular),
          bool(item.chefPick),
          index + 1,
          nowIso()
        ]
      );
    }
  }

  for (const asset of defaultAssets) {
    await pool.query(
      `INSERT INTO app_assets (key, label, url, thumbnail, public_id, updated_at)
       VALUES ($1, $2, $3, $4, '', $5)
       ON CONFLICT (key) DO NOTHING`,
      [asset.key, asset.label, asset.url, asset.thumbnail, nowIso()]
    );
  }

  if (config.sampleDataMode === 'full') {
    await seedFullDemo(pool);
  }
}

async function seedFullDemo(pool) {
  const menuRows = (
    await pool.query('SELECT * FROM menu_items ORDER BY sort_order, id')
  ).rows;
  const menuById = new Map(menuRows.map((row) => [row.id, row]));

  for (const order of buildDemoOrders(menuRows)) {
    const existing = (
      await pool.query('SELECT id FROM orders WHERE idempotency_key = $1', [order.key])
    ).rows[0];
    if (existing) continue;

    const snapshots = order.items
      .map((requested) => {
        const row = menuById.get(requested.menuItemId);
        if (!row) return null;
        const quantity = Number(requested.quantity || 1);
        const unitPrice = Number(row.price);
        return {
          menuItemId: row.id,
          nameJson: row.name_json,
          unitPrice,
          quantity,
          lineTotal: unitPrice * quantity
        };
      })
      .filter(Boolean);
    if (!snapshots.length) continue;

    const total = snapshots.reduce((sum, item) => sum + item.lineTotal, 0);
    const floor = deriveFloor(order.tableNumber);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const inserted = await client.query(
        `INSERT INTO orders
           (table_number, floor, status, notes, total, idempotency_key, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
         RETURNING id`,
        [
          order.tableNumber,
          floor,
          order.status,
          order.notes || '',
          total,
          order.key,
          order.createdAt
        ]
      );
      const orderId = inserted.rows[0].id;

      for (const item of snapshots) {
        await client.query(
          `INSERT INTO order_items
             (order_id, menu_item_id, name_json, unit_price, quantity, line_total)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            orderId,
            item.menuItemId,
            item.nameJson,
            item.unitPrice,
            item.quantity,
            item.lineTotal
          ]
        );
      }

      if (order.feedback) {
        await client.query(
          `INSERT INTO order_feedback
             (order_id, table_number, floor, rating, name, comment, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            orderId,
            order.tableNumber,
            floor,
            order.feedback.rating,
            order.feedback.name,
            order.feedback.comment,
            order.createdAt
          ]
        );
        for (const item of snapshots) {
          await client.query(
            `INSERT INTO menu_reviews
               (menu_item_id, order_id, table_number, rating, name, comment, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              item.menuItemId,
              orderId,
              order.tableNumber,
              order.feedback.rating,
              order.feedback.name,
              order.feedback.comment,
              order.createdAt
            ]
          );
        }
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  const notificationCount = Number(
    (
      await pool.query(
        "SELECT COUNT(*) AS count FROM service_notifications WHERE created_at::date = CURRENT_DATE"
      )
    ).rows[0].count
  );
  if (!notificationCount) {
    for (const item of buildDemoNotifications()) {
      await pool.query(
        `INSERT INTO service_notifications
           (type, table_number, floor, status, created_at, resolved_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          item.type,
          item.tableNumber,
          item.floor,
          item.status,
          item.createdAt,
          item.resolvedAt || null
        ]
      );
    }
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export async function createPostgresRepository(
  connectionString = process.env.DATABASE_URL
) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required for PostgreSQL');
  }

  const pool = new Pool(poolConfig(connectionString));
  await migrate(pool);
  await seed(pool);

  async function hydrateOrder(row) {
    const items = (
      await pool.query(
        'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id',
        [row.id]
      )
    ).rows.map((item) => ({
      id: item.id,
      menuItemId: item.menu_item_id,
      name: parseJson(item.name_json),
      unitPrice: item.unit_price,
      quantity: item.quantity,
      note: item.note || '',
      lineTotal: item.line_total
    }));

    const feedback = (
      await pool.query('SELECT * FROM order_feedback WHERE order_id = $1', [row.id])
    ).rows[0];

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
      feedback: mapOrderFeedback(feedback),
      items
    };
  }

  async function getOrder(id) {
    const row = (
      await pool.query('SELECT * FROM orders WHERE id = $1', [Number(id)])
    ).rows[0];
    return row ? hydrateOrder(row) : null;
  }

  async function resolveLocation(input = {}) {
    const internalId = requireText(input.locationId ?? input.id, '');
    if (internalId) {
      const table = (
        await pool.query(
          'SELECT * FROM tables WHERE internal_id = $1 AND active = TRUE',
          [internalId]
        )
      ).rows[0];
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

      const room = (
        await pool.query(
          'SELECT * FROM rooms WHERE internal_id = $1 AND active = TRUE',
          [internalId]
        )
      ).rows[0];
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
      const room = (
        await pool.query(
          'SELECT * FROM rooms WHERE room_number = $1 AND active = TRUE',
          [roomNumber]
        )
      ).rows[0];
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
    const table = (
      await pool.query(
        'SELECT * FROM tables WHERE number = $1 AND active = TRUE',
        [tableNumber]
      )
    ).rows[0];
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
    raw: pool,
    close: () => pool.end(),

    async listFloors(includeInactive = false) {
      const sql = `SELECT * FROM floors ${includeInactive ? '' : 'WHERE active = TRUE'} ORDER BY number, id`;
      return (await pool.query(sql)).rows.map(mapFloor);
    },

    async createFloor(input) {
      const number = Number(input.number);
      if (!Number.isInteger(number) || number < 1) {
        throw new Error('Floor number must be a positive number');
      }
      const result = await pool.query(
        `INSERT INTO floors (name, number, description, active, created_at)
         VALUES ($1, $2, $3, TRUE, $4)
         RETURNING id`,
        [
          requireText(input.name, `Floor ${number}`),
          number,
          requireText(input.description, ''),
          nowIso()
        ]
      );
      return (await this.listFloors(true)).find((floor) => floor.id === result.rows[0].id);
    },

    async updateFloor(id, input) {
      const current = (
        await pool.query('SELECT * FROM floors WHERE id = $1', [Number(id)])
      ).rows[0];
      if (!current) return null;
      const nextNumber = Number(input.number ?? current.number);
      if (!Number.isInteger(nextNumber) || nextNumber < 1) {
        throw new Error('Floor number must be a positive number');
      }

      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          `UPDATE floors
           SET name = $1, number = $2, description = $3, active = $4
           WHERE id = $5`,
          [
            requireText(input.name, current.name),
            nextNumber,
            requireText(input.description, current.description),
            input.active === undefined ? current.active : bool(input.active),
            Number(id)
          ]
        );
        if (nextNumber !== current.number) {
          await client.query('UPDATE tables SET floor = $1 WHERE floor = $2', [
            nextNumber,
            current.number
          ]);
          await client.query('UPDATE rooms SET floor = $1 WHERE floor = $2', [
            nextNumber,
            current.number
          ]);
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
      return (await this.listFloors(true)).find((floor) => floor.id === Number(id));
    },

    async deleteFloor(id) {
      const floor = (
        await pool.query('SELECT * FROM floors WHERE id = $1', [Number(id)])
      ).rows[0];
      if (!floor) return 0;
      const tableCount = Number(
        (await pool.query('SELECT COUNT(*) AS count FROM tables WHERE floor = $1', [
          floor.number
        ])).rows[0].count
      );
      const roomCount = Number(
        (await pool.query('SELECT COUNT(*) AS count FROM rooms WHERE floor = $1', [
          floor.number
        ])).rows[0].count
      );
      if (tableCount || roomCount) {
        throw new Error('Move or delete tables and rooms before deleting this floor');
      }
      return (await pool.query('DELETE FROM floors WHERE id = $1', [Number(id)])).rowCount;
    },

    async listTables() {
      return (
        await pool.query(
          `SELECT tables.*, floors.id AS floor_id, floors.name AS floor_name
           FROM tables
           LEFT JOIN floors ON floors.number = tables.floor
           ORDER BY tables.floor, tables.number`
        )
      ).rows.map(mapTable);
    },

    async addTable(input) {
      const number = Number(input.number);
      const seats = Number(input.seats || 4);
      const floor = Number(input.floor ?? input.floorNumber ?? floorFromNumber(number));
      if (!Number.isInteger(number) || number < 1) {
        throw new Error('Table number must be a positive number');
      }
      if (!Number.isInteger(floor) || floor < 1) {
        throw new Error('Table floor is required');
      }
      const floorExists = (
        await pool.query('SELECT id FROM floors WHERE number = $1', [floor])
      ).rows[0];
      if (!floorExists) {
        throw new Error('Please create the floor before adding tables to it');
      }
      await pool.query(
        'INSERT INTO tables (number, floor, internal_id, seats, active) VALUES ($1, $2, $3, $4, TRUE)',
        [number, floor, makeInternalId('table'), seats]
      );
      return (await this.listTables()).find((t) => t.number === number);
    },

    async updateTable(number, input) {
      const current = (
        await pool.query('SELECT * FROM tables WHERE number = $1', [Number(number)])
      ).rows[0];
      if (!current) return null;
      const nextNumber = Number(input.number ?? current.number);
      const floor = Number(input.floor ?? input.floorNumber ?? current.floor);
      if (!Number.isInteger(nextNumber) || nextNumber < 1) {
        throw new Error('Table number must be a positive number');
      }
      const floorExists = (
        await pool.query('SELECT id FROM floors WHERE number = $1', [floor])
      ).rows[0];
      if (!floorExists) {
        throw new Error('Please create the floor before assigning tables to it');
      }
      await pool.query(
        `UPDATE tables
         SET number = $1, floor = $2, seats = $3, active = $4
         WHERE number = $5`,
        [
          nextNumber,
          floor,
          Number(input.seats ?? current.seats),
          input.active === undefined ? current.active : bool(input.active),
          Number(number)
        ]
      );
      return (await this.listTables()).find((t) => t.number === nextNumber);
    },

    async deleteTable(number) {
      return (
        await pool.query('DELETE FROM tables WHERE number = $1', [Number(number)])
      ).rowCount;
    },

    async listRooms() {
      return (
        await pool.query(
          `SELECT rooms.*, floors.id AS floor_id, floors.name AS floor_name
           FROM rooms
           LEFT JOIN floors ON floors.number = rooms.floor
           ORDER BY rooms.floor, rooms.room_number`
        )
      ).rows.map(mapRoom);
    },

    async addRoom(input) {
      const roomNumber = Number(input.roomNumber ?? input.number);
      const floor = Number(input.floor ?? input.floorNumber);
      if (!Number.isInteger(roomNumber) || roomNumber < 1) {
        throw new Error('Room number must be a positive number');
      }
      if (!Number.isInteger(floor) || floor < 1) {
        throw new Error('Room floor is required');
      }
      const floorExists = (
        await pool.query('SELECT id FROM floors WHERE number = $1', [floor])
      ).rows[0];
      if (!floorExists) {
        throw new Error('Please create the floor before adding rooms to it');
      }
      const result = await pool.query(
        `INSERT INTO rooms (room_number, floor, internal_id, active, created_at)
         VALUES ($1, $2, $3, TRUE, $4)
         RETURNING id`,
        [roomNumber, floor, makeInternalId('room'), nowIso()]
      );
      return (await this.listRooms()).find((room) => room.id === result.rows[0].id);
    },

    async updateRoom(id, input) {
      const current = (
        await pool.query('SELECT * FROM rooms WHERE id = $1', [Number(id)])
      ).rows[0];
      if (!current) return null;
      const roomNumber = Number(input.roomNumber ?? input.number ?? current.room_number);
      const floor = Number(input.floor ?? input.floorNumber ?? current.floor);
      if (!Number.isInteger(roomNumber) || roomNumber < 1) {
        throw new Error('Room number must be a positive number');
      }
      const floorExists = (
        await pool.query('SELECT id FROM floors WHERE number = $1', [floor])
      ).rows[0];
      if (!floorExists) {
        throw new Error('Please create the floor before assigning rooms to it');
      }
      await pool.query(
        `UPDATE rooms
         SET room_number = $1, floor = $2, active = $3
         WHERE id = $4`,
        [
          roomNumber,
          floor,
          input.active === undefined ? current.active : bool(input.active),
          Number(id)
        ]
      );
      return (await this.listRooms()).find((room) => room.id === Number(id));
    },

    async deleteRoom(id) {
      return (await pool.query('DELETE FROM rooms WHERE id = $1', [Number(id)])).rowCount;
    },

    async listCategories(includeInactive = false) {
      const sql = `SELECT * FROM categories ${includeInactive ? '' : 'WHERE active = TRUE'} ORDER BY sort_order, id`;
      return (await pool.query(sql)).rows.map(mapCategory);
    },

    async createCategory(input) {
      const result = await pool.query(
        `INSERT INTO categories
           (name_json, icon, image, image_public_id, image_thumbnail, sort_order, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          json(normalizeTranslations(input.name)),
          requireText(input.icon, 'Utensils'),
          requireText(input.image, ''),
          requireText(input.imagePublicId, ''),
          requireText(input.imageThumbnail, input.image || ''),
          Number(input.sortOrder || 0),
          input.active === false ? false : true
        ]
      );
      return (await this.listCategories(true)).find(
        (c) => c.id === result.rows[0].id
      );
    },

    async updateCategory(id, input) {
      const current = (
        await pool.query('SELECT * FROM categories WHERE id = $1', [Number(id)])
      ).rows[0];
      if (!current) return null;
      await pool.query(
        `UPDATE categories
         SET name_json = $1, icon = $2, image = $3, image_public_id = $4,
             image_thumbnail = $5, sort_order = $6, active = $7
         WHERE id = $8`,
        [
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
        ]
      );
      return (await this.listCategories(true)).find((c) => c.id === Number(id));
    },

    async deleteCategory(id) {
      return (
        await pool.query('DELETE FROM categories WHERE id = $1', [Number(id)])
      ).rowCount;
    },

    async listMenuItems(includeUnavailable = false) {
      const where = includeUnavailable ? '' : 'WHERE menu_items.available = TRUE';
      return (
        await pool.query(
          `SELECT menu_items.*,
                  COALESCE(ROUND(AVG(menu_reviews.rating)::numeric, 1), 0) AS rating_average,
                  COUNT(menu_reviews.id)::int AS rating_count
           FROM menu_items
           LEFT JOIN menu_reviews ON menu_reviews.menu_item_id = menu_items.id
           ${where}
           GROUP BY menu_items.id
           ORDER BY menu_items.sort_order, menu_items.id`
        )
      ).rows.map(mapMenuItem);
    },

    async createMenuItem(input) {
      const result = await pool.query(
        `INSERT INTO menu_items
           (category_id, name_json, description_json, price, image, image_public_id,
            image_thumbnail, prep_minutes, popular, chef_pick, available, sort_order, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
        [
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
          input.available === false ? false : true,
          Number(input.sortOrder || 0),
          nowIso()
        ]
      );
      return (await this.listMenuItems(true)).find(
        (item) => item.id === result.rows[0].id
      );
    },

    async updateMenuItem(id, input) {
      const current = (
        await pool.query('SELECT * FROM menu_items WHERE id = $1', [Number(id)])
      ).rows[0];
      if (!current) return null;
      await pool.query(
        `UPDATE menu_items
         SET category_id = $1, name_json = $2, description_json = $3, price = $4,
             image = $5, image_public_id = $6, image_thumbnail = $7, prep_minutes = $8,
             popular = $9, chef_pick = $10, available = $11, sort_order = $12, updated_at = $13
         WHERE id = $14`,
        [
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
        ]
      );
      return (await this.listMenuItems(true)).find((item) => item.id === Number(id));
    },

    async deleteMenuItem(id) {
      return (
        await pool.query('DELETE FROM menu_items WHERE id = $1', [Number(id)])
      ).rowCount;
    },

    async getMenu(includeUnavailable = false) {
      return {
        categories: await this.listCategories(includeUnavailable),
        items: await this.listMenuItems(includeUnavailable)
      };
    },

    async listMenuItemReviews(menuItemId) {
      return (
        await pool.query(
          'SELECT * FROM menu_reviews WHERE menu_item_id = $1 ORDER BY created_at DESC, id DESC LIMIT 25',
          [Number(menuItemId)]
        )
      ).rows.map(mapMenuReview);
    },

    async createOrder(input) {
      const idempotencyKey = requireText(input.idempotencyKey, '');
      if (idempotencyKey) {
        const existing = (
          await pool.query('SELECT * FROM orders WHERE idempotency_key = $1', [idempotencyKey])
        ).rows[0];
        if (existing) return hydrateOrder(existing);
      }

      const location = await resolveLocation(input);

      const requestedItems = Array.isArray(input.items) ? input.items : [];
      if (!requestedItems.length) {
        throw new Error('Order must include at least one item');
      }

      const snapshots = [];
      for (const requested of requestedItems) {
        const item = (
          await pool.query(
            'SELECT * FROM menu_items WHERE id = $1 AND available = TRUE',
            [Number(requested.menuItemId)]
          )
        ).rows[0];
        const quantity = Number(requested.quantity);
        if (!item || !Number.isInteger(quantity) || quantity < 1) {
          throw new Error('Invalid or unavailable menu item');
        }
        snapshots.push({
          menuItemId: item.id,
          name: parseJson(item.name_json),
          unitPrice: item.price,
          quantity,
          note: requireText(requested.note, ''),
          lineTotal: item.price * quantity
        });
      }

      const total = calculateOrderTotal(
        snapshots.map((s) => ({ price: s.unitPrice, quantity: s.quantity }))
      );
      const createdAt = nowIso();
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        const orderInfo = await client.query(
          `INSERT INTO orders
             (table_number, floor, location_type, location_id, room_number, status, notes,
              total, idempotency_key, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'received', $6, $7, $8, $9, $10)
           RETURNING id`,
          [
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
          ]
        );

        for (const s of snapshots) {
          await client.query(
            `INSERT INTO order_items
               (order_id, menu_item_id, name_json, unit_price, quantity, note, line_total)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              orderInfo.rows[0].id,
              s.menuItemId,
              json(s.name),
              s.unitPrice,
              s.quantity,
              s.note,
              s.lineTotal
            ]
          );
        }

        await client.query('COMMIT');
        return getOrder(orderInfo.rows[0].id);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },

    getOrder,

    async listOrders(filters = {}) {
      const where = [];
      const params = [];
      if (filters.floor) {
        params.push(Number(filters.floor));
        where.push(`floor = $${params.length}`);
      }
      if (filters.status) {
        const statuses = String(filters.status)
          .split(',')
          .map((status) => status.trim())
          .filter(Boolean);
        if (statuses.length > 1) {
          const placeholders = statuses.map((status) => {
            params.push(status);
            return `$${params.length}`;
          });
          where.push(`status IN (${placeholders.join(', ')})`);
        } else {
          params.push(filters.status);
          where.push(`status = $${params.length}`);
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
      const rows = (await pool.query(sql, params)).rows;
      return Promise.all(rows.map(hydrateOrder));
    },

    async listOrdersInRange(from, to) {
      // from / to are ISO date strings: 'YYYY-MM-DD'
      const rows = (
        await pool.query(
          `SELECT * FROM orders
           WHERE created_at >= $1::date AND created_at < ($2::date + INTERVAL '1 day')
           ORDER BY created_at DESC, id DESC`,
          [from, to]
        )
      ).rows;
      return Promise.all(rows.map(hydrateOrder));
    },

    async updateOrderStatus(id, status) {
      const current = (
        await pool.query('SELECT * FROM orders WHERE id = $1', [Number(id)])
      ).rows[0];
      if (!current) return null;
      if (!isValidStatusTransition(current.status, status)) {
        throw new Error('Invalid order status transition');
      }
      await pool.query(
        'UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3',
        [status, nowIso(), Number(id)]
      );
      return getOrder(id);
    },

    async updateOrderNotes(id, notes) {
      const current = (
        await pool.query('SELECT * FROM orders WHERE id = $1', [Number(id)])
      ).rows[0];
      if (!current) return null;
      await pool.query(
        'UPDATE orders SET notes = $1, updated_at = $2 WHERE id = $3',
        [notes || '', nowIso(), Number(id)]
      );
      return getOrder(id);
    },

    async submitOrderFeedback(orderId, input) {
      const order = await getOrder(orderId);
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
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const feedbackResult = await client.query(
          `INSERT INTO order_feedback
             (order_id, table_number, floor, rating, name, comment, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [
            order.id,
            order.tableNumber,
            order.floor,
            rating,
            requireText(input.name, ''),
            requireText(input.comment, ''),
            createdAt
          ]
        );

        for (const item of order.items) {
          await client.query(
            `INSERT INTO menu_reviews
               (menu_item_id, order_id, table_number, rating, name, comment, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
              item.menuItemId,
              order.id,
              order.tableNumber,
              rating,
              requireText(input.name, ''),
              requireText(input.comment, ''),
              createdAt
            ]
          );
        }

        await client.query('COMMIT');
        return mapOrderFeedback(feedbackResult.rows[0]);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },

    async listFeedback(filters = {}) {
      const limit = Math.max(1, Math.min(Number(filters.limit || 50), 100));
      return (
        await pool.query(
          'SELECT * FROM order_feedback ORDER BY created_at DESC, id DESC LIMIT $1',
          [limit]
        )
      ).rows.map(mapOrderFeedback);
    },

    async createServiceNotification(input) {
      const location = await resolveLocation(input);
      const type = input.type === 'request-bill' ? 'request-bill' : 'call-waiter';
      return (
        await pool.query(
          `INSERT INTO service_notifications
             (type, table_number, floor, location_type, location_id, room_number, reason, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'open', $8)
           RETURNING *`,
          [
            type,
            location.tableNumber,
            location.floor,
            location.type,
            location.internalId,
            location.roomNumber,
            requireText(input.note ?? input.reason, ''),
            nowIso()
          ]
        )
      ).rows[0];
    },

    async listServiceNotifications(filters = {}) {
      const where = [];
      const params = [];
      if (filters.floor) {
        params.push(Number(filters.floor));
        where.push(`floor = $${params.length}`);
      }
      if (filters.status) {
        params.push(filters.status);
        where.push(`status = $${params.length}`);
      }
      const sql = `
        SELECT * FROM service_notifications
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY created_at DESC
      `;
      return (await pool.query(sql, params)).rows.map(mapNotification);
    },

    async resolveServiceNotification(id) {
      const row = (
        await pool.query('SELECT * FROM service_notifications WHERE id = $1', [Number(id)])
      ).rows[0];
      if (!row) return null;
      const result = await pool.query(
        "UPDATE service_notifications SET status = 'resolved', resolved_at = $1 WHERE id = $2 RETURNING *",
        [nowIso(), Number(id)]
      );
      return mapNotification(result.rows[0]);
    },

    async listStaffMembers() {
      return (
        await pool.query(
          `SELECT * FROM staff_members
           WHERE active = TRUE
           ORDER BY
             CASE WHEN role = 'Kitchen' THEN 999 ELSE COALESCE(assigned_floor, 998) END,
             role,
             name`
        )
      ).rows.map(mapStaffMember);
    },

    async createManagerNotification(input) {
      const staffName = requireText(input.staffName ?? input.name, '');
      const staffRole = requireText(input.staffRole ?? input.role, 'Staff');
      if (!staffName) {
        throw new Error('Staff name is required');
      }
      const assignedFloor = numberOrNull(input.assignedFloor ?? input.floor);
      const result = await pool.query(
        `INSERT INTO manager_notifications
           (staff_name, staff_role, assigned_floor, reason, status, created_at)
         VALUES ($1, $2, $3, $4, 'open', $5)
         RETURNING *`,
        [
          staffName,
          staffRole,
          assignedFloor,
          requireText(input.reason, ''),
          nowIso()
        ]
      );
      return mapManagerNotification(result.rows[0]);
    },

    async listManagerNotifications(filters = {}) {
      const where = [];
      const params = [];
      if (filters.status) {
        params.push(filters.status);
        where.push(`status = $${params.length}`);
      }
      const sql = `
        SELECT * FROM manager_notifications
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY created_at DESC, id DESC
      `;
      return (await pool.query(sql, params)).rows.map(mapManagerNotification);
    },

    async resolveManagerNotification(id) {
      const row = (
        await pool.query('SELECT * FROM manager_notifications WHERE id = $1', [
          Number(id)
        ])
      ).rows[0];
      if (!row) return null;
      const result = await pool.query(
        "UPDATE manager_notifications SET status = 'resolved', resolved_at = $1 WHERE id = $2 RETURNING *",
        [nowIso(), Number(id)]
      );
      return mapManagerNotification(result.rows[0]);
    },

    async todayReport() {
      const today = new Date().toDateString();
      const orders = (await this.listOrders()).filter(
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
      const feedbackStats = (
        await pool.query(
          'SELECT COUNT(*)::int AS count, COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS average FROM order_feedback'
        )
      ).rows[0];

      return {
        orders: orders.length,
        revenue,
        averageOrder: orders.length ? Math.round(revenue / orders.length) : 0,
        activeOrders: orders.filter((o) => o.status !== 'delivered').length,
        feedbackCount: Number(feedbackStats.count || 0),
        averageRating: Number(feedbackStats.average || 0),
        popularItems: [...counts.values()]
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)
      };
    },

    async listAssets() {
      return (
        await pool.query('SELECT * FROM app_assets ORDER BY key')
      ).rows.map(mapAsset);
    },

    async updateAsset(key, input) {
      const current = (
        await pool.query('SELECT * FROM app_assets WHERE key = $1', [String(key)])
      ).rows[0];
      if (!current) return null;
      const result = await pool.query(
        `UPDATE app_assets
         SET url = $1, thumbnail = $2, public_id = $3, updated_at = $4
         WHERE key = $5
         RETURNING *`,
        [
          requireText(input.url, current.url),
          requireText(input.thumbnail, input.url || current.thumbnail || current.url),
          requireText(input.publicId, current.public_id),
          nowIso(),
          String(key)
        ]
      );
      return mapAsset(result.rows[0]);
    },

    async createStaffMember(input) {
      const name = requireText(input.name, '');
      const role = requireText(input.role, 'Staff');
      if (!name) throw new Error('Staff name is required');
      const result = await pool.query(
        `INSERT INTO staff_members (name, role, assigned_floor, online, active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING *`,
        [name, role, numberOrNull(input.assignedFloor), bool(input.online ?? false)]
      );
      return mapStaffMember(result.rows[0]);
    },

    async updateStaffMember(id, input) {
      const current = (
        await pool.query('SELECT * FROM staff_members WHERE id = $1', [Number(id)])
      ).rows[0];
      if (!current) return null;
      const result = await pool.query(
        `UPDATE staff_members
         SET name = $1, role = $2, assigned_floor = $3, online = $4
         WHERE id = $5
         RETURNING *`,
        [
          requireText(input.name, current.name),
          requireText(input.role, current.role),
          numberOrNull(input.assignedFloor ?? current.assigned_floor),
          input.online !== undefined ? bool(input.online) : current.online,
          Number(id)
        ]
      );
      return mapStaffMember(result.rows[0]);
    },

    async deleteStaffMember(id) {
      const result = await pool.query(
        'UPDATE staff_members SET active = false WHERE id = $1',
        [Number(id)]
      );
      return result.rowCount;
    },

    async setStaffOnline(id, online) {
      const result = await pool.query(
        'UPDATE staff_members SET online = $1 WHERE id = $2 RETURNING *',
        [bool(online), Number(id)]
      );
      return result.rows[0] ? mapStaffMember(result.rows[0]) : null;
    }
  };
}
