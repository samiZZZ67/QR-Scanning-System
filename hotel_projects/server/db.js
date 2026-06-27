import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { calculateOrderTotal, deriveFloor, isValidStatusTransition, normalizeTranslations, requireText } from "./domain.js";
import { seedCategories, seedMenuItems, seedTables } from "./seedData.js";

const json = (value) => JSON.stringify(value ?? {});
const bool = (value) => (value ? 1 : 0);
const parseJson = (value, fallback = {}) => {
  if (value && typeof value === "object") {
    return value;
  }
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const defaultMenuImages = [
  "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1631515242808-497c3fbd3972?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80"
];

const defaultAssets = [
  {
    key: "landingHero",
    label: "Landing hero",
    url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1800&q=85",
    thumbnail: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=75"
  },
  {
    key: "menuBanner",
    label: "Menu banner",
    url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1800&q=85",
    thumbnail: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=75"
  }
];

function fallbackMenuImage(row) {
  const id = Number(row.id || 1);
  const categoryId = Number(row.category_id || row.categoryId || 1);
  return defaultMenuImages[(id + categoryId) % defaultMenuImages.length];
}

function nowIso() {
  return new Date().toISOString();
}

function mapCategory(row) {
  return {
    id: row.id,
    name: parseJson(row.name_json),
    icon: row.icon,
    image: row.image || "",
    imagePublicId: row.image_public_id || "",
    imageThumbnail: row.image_thumbnail || row.image || "",
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
    imagePublicId: row.image_public_id || "",
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

function mapTable(row) {
  return {
    number: row.number,
    floor: row.floor,
    seats: row.seats,
    active: Boolean(row.active)
  };
}

function mapNotification(row) {
  return {
    id: row.id,
    type: row.type,
    tableNumber: row.table_number,
    floor: row.floor,
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
    name: row.name || "",
    comment: row.comment || "",
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
    name: row.name || "",
    comment: row.comment || "",
    createdAt: row.created_at
  };
}

function mapAsset(row) {
  return {
    key: row.key,
    label: row.label,
    url: row.url,
    thumbnail: row.thumbnail || row.url,
    publicId: row.public_id || "",
    updatedAt: row.updated_at
  };
}

export function createDatabase(filename = process.env.DATABASE_PATH || "./data/hotel.sqlite") {
  const dbPath = filename === ":memory:" ? filename : resolve(filename);
  if (dbPath !== ":memory:") {
    mkdirSync(dirname(dbPath), { recursive: true });
  }

  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON;");
  migrate(db);
  seed(db);
  return buildRepository(db);
}

function migrate(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tables (
      number INTEGER PRIMARY KEY,
      floor INTEGER NOT NULL,
      seats INTEGER NOT NULL DEFAULT 4,
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
      line_total INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS service_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('call-waiter', 'request-bill')),
      table_number INTEGER NOT NULL,
      floor INTEGER NOT NULL,
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

  ensureColumn(db, "categories", "image TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "categories", "image_public_id TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "categories", "image_thumbnail TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "menu_items", "image_public_id TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "menu_items", "image_thumbnail TEXT NOT NULL DEFAULT ''");
}

function ensureColumn(db, table, definition) {
  const [name] = definition.split(/\s+/);
  const exists = db.prepare(`PRAGMA table_info(${table})`).all().some((column) => column.name === name);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition};`);
  }
}

function seed(db) {
  const tableCount = db.prepare("SELECT COUNT(*) AS count FROM tables").get().count;
  if (!tableCount) {
    const insert = db.prepare("INSERT INTO tables (number, floor, seats, active) VALUES (?, ?, ?, 1)");
    for (const table of seedTables()) {
      insert.run(table.number, table.floor, table.seats);
    }
  }

  const categoryCount = db.prepare("SELECT COUNT(*) AS count FROM categories").get().count;
  if (!categoryCount) {
    const insert = db.prepare("INSERT INTO categories (id, name_json, icon, sort_order, active) VALUES (?, ?, ?, ?, 1)");
    for (const category of seedCategories) {
      insert.run(category.id, json(category.name), category.icon, category.sortOrder);
    }
  }

  const itemCount = db.prepare("SELECT COUNT(*) AS count FROM menu_items").get().count;
  if (!itemCount) {
    const insert = db.prepare(`
      INSERT INTO menu_items
        (category_id, name_json, description_json, price, image, prep_minutes, popular, chef_pick, available, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    seedMenuItems.forEach((item, index) => {
      insert.run(
        item.categoryId,
        json(item.name),
        json(item.description),
        item.price,
        item.image || "",
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
}

function buildRepository(db) {
  function getOrder(id) {
    const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(Number(id));
    if (!row) return null;
    return hydrateOrder(row);
  }

  function hydrateOrder(row) {
    const items = db
      .prepare("SELECT * FROM order_items WHERE order_id = ? ORDER BY id")
      .all(row.id)
      .map((item) => ({
        id: item.id,
        menuItemId: item.menu_item_id,
        name: parseJson(item.name_json),
        unitPrice: item.unit_price,
        quantity: item.quantity,
        lineTotal: item.line_total
      }));

    return {
      id: row.id,
      tableNumber: row.table_number,
      floor: row.floor,
      status: row.status,
      notes: row.notes,
      total: row.total,
      idempotencyKey: row.idempotency_key,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      feedback: mapOrderFeedback(db.prepare("SELECT * FROM order_feedback WHERE order_id = ?").get(row.id)),
      items
    };
  }

  return {
    raw: db,

    listTables() {
      return db.prepare("SELECT * FROM tables ORDER BY floor, number").all().map(mapTable);
    },

    addTable(input) {
      const number = Number(input.number);
      const seats = Number(input.seats || 4);
      const floor = deriveFloor(number);
      db.prepare("INSERT INTO tables (number, floor, seats, active) VALUES (?, ?, ?, 1)").run(number, floor, seats);
      return this.listTables().find((table) => table.number === number);
    },

    deleteTable(number) {
      return db.prepare("DELETE FROM tables WHERE number = ?").run(Number(number)).changes;
    },

    listCategories(includeInactive = false) {
      const where = includeInactive ? "" : "WHERE active = 1";
      return db.prepare(`SELECT * FROM categories ${where} ORDER BY sort_order, id`).all().map(mapCategory);
    },

    createCategory(input) {
      const info = db
        .prepare("INSERT INTO categories (name_json, icon, image, image_public_id, image_thumbnail, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .run(
          json(normalizeTranslations(input.name)),
          requireText(input.icon, "Utensils"),
          requireText(input.image, ""),
          requireText(input.imagePublicId, ""),
          requireText(input.imageThumbnail, input.image || ""),
          Number(input.sortOrder || 0),
          input.active === false ? 0 : 1
        );
      return this.listCategories(true).find((category) => category.id === info.lastInsertRowid);
    },

    updateCategory(id, input) {
      const current = db.prepare("SELECT * FROM categories WHERE id = ?").get(Number(id));
      if (!current) return null;
      db.prepare("UPDATE categories SET name_json = ?, icon = ?, image = ?, image_public_id = ?, image_thumbnail = ?, sort_order = ?, active = ? WHERE id = ?").run(
        json(normalizeTranslations(input.name ?? parseJson(current.name_json))),
        requireText(input.icon, current.icon),
        requireText(input.image, current.image),
        requireText(input.imagePublicId, current.image_public_id),
        requireText(input.imageThumbnail, current.image_thumbnail || input.image || current.image),
        Number(input.sortOrder ?? current.sort_order),
        input.active === undefined ? current.active : bool(input.active),
        Number(id)
      );
      return this.listCategories(true).find((category) => category.id === Number(id));
    },

    deleteCategory(id) {
      return db.prepare("DELETE FROM categories WHERE id = ?").run(Number(id)).changes;
    },

    listMenuItems(includeUnavailable = false) {
      const where = includeUnavailable ? "" : "WHERE menu_items.available = 1";
      return db.prepare(`
        SELECT menu_items.*,
               COALESCE(ROUND(AVG(menu_reviews.rating), 1), 0) AS rating_average,
               COUNT(menu_reviews.id) AS rating_count
        FROM menu_items
        LEFT JOIN menu_reviews ON menu_reviews.menu_item_id = menu_items.id
        ${where}
        GROUP BY menu_items.id
        ORDER BY menu_items.sort_order, menu_items.id
      `).all().map(mapMenuItem);
    },

    createMenuItem(input) {
      const info = db
        .prepare(`
          INSERT INTO menu_items
            (category_id, name_json, description_json, price, image, image_public_id, image_thumbnail, prep_minutes, popular, chef_pick, available, sort_order, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          Number(input.categoryId),
          json(normalizeTranslations(input.name)),
          json(normalizeTranslations(input.description || {})),
          Number(input.price || 0),
          requireText(input.image, ""),
          requireText(input.imagePublicId, ""),
          requireText(input.imageThumbnail, input.image || ""),
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
      const current = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(Number(id));
      if (!current) return null;

      db.prepare(`
        UPDATE menu_items
        SET category_id = ?, name_json = ?, description_json = ?, price = ?, image = ?, image_public_id = ?, image_thumbnail = ?,
            prep_minutes = ?, popular = ?, chef_pick = ?, available = ?, sort_order = ?, updated_at = ?
        WHERE id = ?
      `).run(
        Number(input.categoryId ?? current.category_id),
        json(normalizeTranslations(input.name ?? parseJson(current.name_json))),
        json(normalizeTranslations(input.description ?? parseJson(current.description_json))),
        Number(input.price ?? current.price),
        requireText(input.image, current.image),
        requireText(input.imagePublicId, current.image_public_id),
        requireText(input.imageThumbnail, current.image_thumbnail || input.image || current.image),
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
        .prepare("SELECT * FROM menu_reviews WHERE menu_item_id = ? ORDER BY created_at DESC, id DESC LIMIT 25")
        .all(Number(menuItemId))
        .map(mapMenuReview);
    },

    deleteMenuItem(id) {
      return db.prepare("DELETE FROM menu_items WHERE id = ?").run(Number(id)).changes;
    },

    getMenu(includeUnavailable = false) {
      return {
        categories: this.listCategories(includeUnavailable),
        items: this.listMenuItems(includeUnavailable)
      };
    },

    createOrder(input) {
      const idempotencyKey = requireText(input.idempotencyKey, "");
      if (idempotencyKey) {
        const existing = db.prepare("SELECT * FROM orders WHERE idempotency_key = ?").get(idempotencyKey);
        if (existing) {
          return hydrateOrder(existing);
        }
      }

      const tableNumber = Number(input.tableNumber ?? input.table);
      const table = db.prepare("SELECT * FROM tables WHERE number = ? AND active = 1").get(tableNumber);
      const floor = table ? table.floor : deriveFloor(tableNumber);
      const requestedItems = Array.isArray(input.items) ? input.items : [];
      if (!requestedItems.length) {
        throw new Error("Order must include at least one item");
      }

      const snapshots = requestedItems.map((requested) => {
        const item = db.prepare("SELECT * FROM menu_items WHERE id = ? AND available = 1").get(Number(requested.menuItemId));
        const quantity = Number(requested.quantity);
        if (!item || !Number.isInteger(quantity) || quantity < 1) {
          throw new Error("Invalid or unavailable menu item");
        }
        return {
          menuItemId: item.id,
          name: parseJson(item.name_json),
          unitPrice: item.price,
          quantity,
          lineTotal: item.price * quantity
        };
      });

      const total = calculateOrderTotal(snapshots.map((item) => ({ price: item.unitPrice, quantity: item.quantity })));
      const createdAt = nowIso();

      db.exec("BEGIN");
      try {
        const orderInfo = db
          .prepare(`
            INSERT INTO orders (table_number, floor, status, notes, total, idempotency_key, created_at, updated_at)
            VALUES (?, ?, 'received', ?, ?, ?, ?, ?)
          `)
          .run(tableNumber, floor, requireText(input.notes, ""), total, idempotencyKey || null, createdAt, createdAt);

        const insertItem = db.prepare(`
          INSERT INTO order_items (order_id, menu_item_id, name_json, unit_price, quantity, line_total)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const item of snapshots) {
          insertItem.run(orderInfo.lastInsertRowid, item.menuItemId, json(item.name), item.unitPrice, item.quantity, item.lineTotal);
        }

        db.exec("COMMIT");
        return getOrder(orderInfo.lastInsertRowid);
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },

    getOrder,

    listOrders(filters = {}) {
      const where = [];
      const params = [];
      if (filters.floor) {
        where.push("floor = ?");
        params.push(Number(filters.floor));
      }
      if (filters.status) {
        where.push("status = ?");
        params.push(filters.status);
      }
      if (filters.active) {
        where.push("status != 'delivered'");
      }
      const sql = `SELECT * FROM orders ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC, id DESC`;
      return db.prepare(sql).all(...params).map(hydrateOrder);
    },

    updateOrderStatus(id, status) {
      const current = db.prepare("SELECT * FROM orders WHERE id = ?").get(Number(id));
      if (!current) return null;
      if (!isValidStatusTransition(current.status, status)) {
        throw new Error("Invalid order status transition");
      }
      db.prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").run(status, nowIso(), Number(id));
      return getOrder(id);
    },

    submitOrderFeedback(orderId, input) {
      const order = getOrder(orderId);
      if (!order) return null;
      if (order.status !== "delivered") {
        throw new Error("Feedback can be submitted after delivery");
      }
      if (order.feedback) {
        throw new Error("Feedback was already submitted for this order");
      }
      const rating = Number(input.rating);
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        throw new Error("Please choose a rating from 1 to 5");
      }
      const createdAt = nowIso();
      db.exec("BEGIN");
      try {
        const info = db
          .prepare(`
            INSERT INTO order_feedback (order_id, table_number, floor, rating, name, comment, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `)
          .run(
            order.id,
            order.tableNumber,
            order.floor,
            rating,
            requireText(input.name, ""),
            requireText(input.comment, ""),
            createdAt
          );

        const insertReview = db.prepare(`
          INSERT INTO menu_reviews (menu_item_id, order_id, table_number, rating, name, comment, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        for (const item of order.items) {
          insertReview.run(item.menuItemId, order.id, order.tableNumber, rating, requireText(input.name, ""), requireText(input.comment, ""), createdAt);
        }
        db.exec("COMMIT");
        return mapOrderFeedback(db.prepare("SELECT * FROM order_feedback WHERE id = ?").get(info.lastInsertRowid));
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },

    listFeedback(filters = {}) {
      const limit = Math.max(1, Math.min(Number(filters.limit || 50), 100));
      return db
        .prepare("SELECT * FROM order_feedback ORDER BY created_at DESC, id DESC LIMIT ?")
        .all(limit)
        .map(mapOrderFeedback);
    },

    createServiceNotification(input) {
      const tableNumber = Number(input.tableNumber ?? input.table);
      const type = input.type === "request-bill" ? "request-bill" : "call-waiter";
      const floor = deriveFloor(tableNumber);
      const info = db
        .prepare(`
          INSERT INTO service_notifications (type, table_number, floor, status, created_at)
          VALUES (?, ?, ?, 'open', ?)
        `)
        .run(type, tableNumber, floor, nowIso());
      return db.prepare("SELECT * FROM service_notifications WHERE id = ?").get(info.lastInsertRowid);
    },

    listServiceNotifications(filters = {}) {
      const where = [];
      const params = [];
      if (filters.floor) {
        where.push("floor = ?");
        params.push(Number(filters.floor));
      }
      if (filters.status) {
        where.push("status = ?");
        params.push(filters.status);
      }
      const sql = `SELECT * FROM service_notifications ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC`;
      return db.prepare(sql).all(...params).map(mapNotification);
    },

    resolveServiceNotification(id) {
      const row = db.prepare("SELECT * FROM service_notifications WHERE id = ?").get(Number(id));
      if (!row) return null;
      db.prepare("UPDATE service_notifications SET status = 'resolved', resolved_at = ? WHERE id = ?").run(nowIso(), Number(id));
      return mapNotification(db.prepare("SELECT * FROM service_notifications WHERE id = ?").get(Number(id)));
    },

    todayReport() {
      const orders = this.listOrders().filter((order) => new Date(order.createdAt).toDateString() === new Date().toDateString());
      const revenue = orders.reduce((sum, order) => sum + order.total, 0);
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
        activeOrders: orders.filter((order) => order.status !== "delivered").length,
        feedbackCount: db.prepare("SELECT COUNT(*) AS count FROM order_feedback").get().count,
        averageRating: Number(db.prepare("SELECT COALESCE(ROUND(AVG(rating), 1), 0) AS average FROM order_feedback").get().average || 0),
        popularItems: [...counts.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5)
      };
    },

    listAssets() {
      return db.prepare("SELECT * FROM app_assets ORDER BY key").all().map(mapAsset);
    },

    updateAsset(key, input) {
      const current = db.prepare("SELECT * FROM app_assets WHERE key = ?").get(String(key));
      if (!current) return null;
      db.prepare(`
        UPDATE app_assets
        SET url = ?, thumbnail = ?, public_id = ?, updated_at = ?
        WHERE key = ?
      `).run(
        requireText(input.url, current.url),
        requireText(input.thumbnail, input.url || current.thumbnail || current.url),
        requireText(input.publicId, current.public_id),
        nowIso(),
        String(key)
      );
      return mapAsset(db.prepare("SELECT * FROM app_assets WHERE key = ?").get(String(key)));
    }
  };
}

export { defaultAssets, defaultMenuImages, fallbackMenuImage, mapAsset, mapMenuItem, mapOrderFeedback };
