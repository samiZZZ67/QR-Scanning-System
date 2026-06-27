import express from "express";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createDatabase } from "./db.js";
import { generateGrokImage, runGrokTask } from "./grok.js";
import { notifyManager } from "./telegram.js";
import { uploadImage } from "./uploads.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");

function emit(io, event, payload) {
  if (io) {
    io.emit(event, payload);
  }
}

function staffPin() {
  return process.env.STAFF_PIN || "1234";
}

function requireStaffPin(req, res, next) {
  if (req.get("x-staff-pin") === staffPin()) {
    return next();
  }
  return res.status(401).json({ error: "Staff PIN required" });
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function createApp({ repository = createDatabase(), io = null } = {}) {
  const app = express();
  app.locals.repository = repository;
  app.locals.io = io;
  app.set("trust proxy", true);
  app.disable("x-powered-by");

  app.use((req, res, next) => {
    if (
      process.env.NODE_ENV === "production" &&
      process.env.FORCE_HTTPS !== "false" &&
      req.get("x-forwarded-proto") &&
      req.get("x-forwarded-proto") !== "https"
    ) {
      res.redirect(301, `https://${req.get("host")}${req.originalUrl}`);
      return;
    }
    next();
  });

  app.use(express.json({ limit: process.env.JSON_LIMIT || "15mb" }));
  app.use("/locales", express.static(join(rootDir, "public", "locales")));

  app.get("/api/health", (req, res) => {
    res.json({ ok: true });
  });

  app.post("/api/staff/session", (req, res) => {
    if (req.body?.pin === staffPin()) {
      res.json({ ok: true });
      return;
    }
    res.status(401).json({ error: "Invalid PIN" });
  });

  app.get("/api/menu", asyncRoute(async (req, res) => {
    const includeUnavailable = req.query.includeUnavailable === "1" || req.query.includeUnavailable === "true";
    res.json(await repository.getMenu(includeUnavailable));
  }));

  app.get("/api/assets", asyncRoute(async (req, res) => {
    res.json(await repository.listAssets());
  }));

  app.patch("/api/assets/:key", requireStaffPin, asyncRoute(async (req, res) => {
    const asset = await repository.updateAsset(req.params.key, req.body);
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    emit(app.locals.io, "assets.changed", await repository.listAssets());
    return res.json(asset);
  }));

  app.post("/api/uploads/image", requireStaffPin, asyncRoute(async (req, res) => {
    const uploaded = await uploadImage(req.body);
    res.status(201).json(uploaded);
  }));

  app.post("/api/categories", requireStaffPin, asyncRoute(async (req, res) => {
    const category = await repository.createCategory(req.body);
    emit(app.locals.io, "menu.changed", await repository.getMenu(true));
    res.status(201).json(category);
  }));

  app.patch("/api/categories/:id", requireStaffPin, asyncRoute(async (req, res) => {
    const category = await repository.updateCategory(req.params.id, req.body);
    if (!category) return res.status(404).json({ error: "Category not found" });
    emit(app.locals.io, "menu.changed", await repository.getMenu(true));
    return res.json(category);
  }));

  app.delete("/api/categories/:id", requireStaffPin, asyncRoute(async (req, res) => {
    const changes = await repository.deleteCategory(req.params.id);
    if (!changes) return res.status(404).json({ error: "Category not found" });
    emit(app.locals.io, "menu.changed", await repository.getMenu(true));
    return res.status(204).end();
  }));

  app.post("/api/menu-items", requireStaffPin, asyncRoute(async (req, res) => {
    const item = await repository.createMenuItem(req.body);
    emit(app.locals.io, "menu.changed", await repository.getMenu(true));
    res.status(201).json(item);
  }));

  app.patch("/api/menu-items/:id", requireStaffPin, asyncRoute(async (req, res) => {
    const item = await repository.updateMenuItem(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: "Menu item not found" });
    emit(app.locals.io, "menu.changed", await repository.getMenu(true));
    return res.json(item);
  }));

  app.delete("/api/menu-items/:id", requireStaffPin, asyncRoute(async (req, res) => {
    const changes = await repository.deleteMenuItem(req.params.id);
    if (!changes) return res.status(404).json({ error: "Menu item not found" });
    emit(app.locals.io, "menu.changed", await repository.getMenu(true));
    return res.status(204).end();
  }));

  app.get("/api/menu-items/:id/reviews", asyncRoute(async (req, res) => {
    res.json(await repository.listMenuItemReviews(req.params.id));
  }));

  app.get("/api/tables", requireStaffPin, asyncRoute(async (req, res) => {
    res.json(await repository.listTables());
  }));

  app.post("/api/tables", requireStaffPin, asyncRoute(async (req, res) => {
    const table = await repository.addTable(req.body);
    res.status(201).json(table);
  }));

  app.delete("/api/tables/:number", requireStaffPin, asyncRoute(async (req, res) => {
    const changes = await repository.deleteTable(req.params.number);
    if (!changes) return res.status(404).json({ error: "Table not found" });
    return res.status(204).end();
  }));

  app.post("/api/orders", asyncRoute(async (req, res) => {
    const order = await repository.createOrder(req.body);
    emit(app.locals.io, "order.created", order);
    notifyManager(order).catch((error) => console.warn(error.message));
    res.status(201).json(order);
  }));

  app.get("/api/orders", requireStaffPin, asyncRoute(async (req, res) => {
    res.json(await repository.listOrders({
      floor: req.query.floor,
      status: req.query.status,
      active: req.query.active === "1" || req.query.active === "true"
    }));
  }));

  app.get("/api/orders/:id", asyncRoute(async (req, res) => {
    const order = await repository.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    return res.json(order);
  }));

  app.patch("/api/orders/:id/status", requireStaffPin, asyncRoute(async (req, res) => {
    const order = await repository.updateOrderStatus(req.params.id, req.body.status);
    if (!order) return res.status(404).json({ error: "Order not found" });
    emit(app.locals.io, "order.statusChanged", order);
    return res.json(order);
  }));

  app.post("/api/orders/:id/feedback", asyncRoute(async (req, res) => {
    const feedback = await repository.submitOrderFeedback(req.params.id, req.body);
    if (!feedback) return res.status(404).json({ error: "Order not found" });
    const order = await repository.getOrder(req.params.id);
    emit(app.locals.io, "feedback.created", feedback);
    emit(app.locals.io, "order.statusChanged", order);
    emit(app.locals.io, "menu.changed", await repository.getMenu(true));
    return res.status(201).json(feedback);
  }));

  app.get("/api/feedback", requireStaffPin, asyncRoute(async (req, res) => {
    res.json(await repository.listFeedback({ limit: req.query.limit }));
  }));

  app.post("/api/service-notifications", asyncRoute(async (req, res) => {
    const row = await repository.createServiceNotification(req.body);
    const notification = (await repository.listServiceNotifications()).find((item) => item.id === row.id);
    emit(app.locals.io, "serviceNotification.created", notification);
    res.status(201).json(notification);
  }));

  app.get("/api/service-notifications", requireStaffPin, asyncRoute(async (req, res) => {
    res.json(await repository.listServiceNotifications({
      floor: req.query.floor,
      status: req.query.status
    }));
  }));

  app.patch("/api/service-notifications/:id/resolve", requireStaffPin, asyncRoute(async (req, res) => {
    const notification = await repository.resolveServiceNotification(req.params.id);
    if (!notification) return res.status(404).json({ error: "Notification not found" });
    emit(app.locals.io, "serviceNotification.resolved", notification);
    return res.json(notification);
  }));

  app.get("/api/reports/today", requireStaffPin, asyncRoute(async (req, res) => {
    res.json(await repository.todayReport());
  }));

  app.post("/api/ai/grok", requireStaffPin, asyncRoute(async (req, res) => {
    res.json(await runGrokTask(req.body));
  }));

  app.post("/api/ai/grok/image", requireStaffPin, asyncRoute(async (req, res) => {
    res.json(await generateGrokImage(req.body));
  }));

  const distDir = join(rootDir, "dist");
  if (existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get(/.*/, (req, res) => {
      if (req.query.table && req.path === "/") {
        res.redirect(`/order?table=${encodeURIComponent(req.query.table)}`);
        return;
      }
      res.sendFile(join(distDir, "index.html"));
    });
  } else {
    app.get("/", (req, res) => {
      if (req.query.table) {
        res.redirect(`/order?table=${encodeURIComponent(req.query.table)}`);
        return;
      }
      res.json({ message: "Run npm run dev for the React client, or npm run build before npm start." });
    });
  }

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(400).json({ error: err.message || "Request failed" });
  });

  return app;
}

export { requireStaffPin };
