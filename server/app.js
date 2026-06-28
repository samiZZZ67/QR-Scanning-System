import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import config from "./src/config/env.js";
import apiRoutes from "./src/routes/index.js";
import { errorHandler } from "./src/middlewares/errorHandler.js";
import { apiLimiter } from "./src/middlewares/rateLimiter.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp({ repository, io = null } = {}) {
  const app = express();

  // Trust reverse-proxy headers (X-Forwarded-For, X-Forwarded-Proto)
  app.set("trust proxy", true);
  app.disable("x-powered-by");

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

  // ── CORS ────────────────────────────────────────────────────────────────────
  const allowedOrigins =
    config.nodeEnv === "production"
      ? [config.publicBaseUrl].filter(Boolean)
      : [
          "http://localhost:5173",
          "http://localhost:3000",
          "http://localhost:5000",
        ];

  app.use(cors({ origin: allowedOrigins, credentials: true }));

  // ── HTTPS redirect (production only) ────────────────────────────────────────
  app.use((req, res, next) => {
    if (
      config.nodeEnv === "production" &&
      config.forceHttps &&
      req.get("x-forwarded-proto") &&
      req.get("x-forwarded-proto") !== "https"
    ) {
      return res.redirect(301, `https://${req.get("host")}${req.originalUrl}`);
    }
    return next();
  });

  // ── Request logging ─────────────────────────────────────────────────────────
  if (config.nodeEnv !== "test") {
    app.use(morgan("dev"));
  }

  // ── Body parsing ─────────────────────────────────────────────────────────────
  app.use(express.json({ limit: config.jsonLimit }));

  // ── App locals ───────────────────────────────────────────────────────────────
  app.locals.repository = repository;
  app.locals.io = io;

  // ── Static files ─────────────────────────────────────────────────────────────
  // Serve i18n locale files loaded by the client
  app.use("/locales", express.static(join(__dirname, "public", "locales")));

  // ── Health check (no rate limit) ─────────────────────────────────────────────
  app.get("/api/health", (req, res) =>
    res.json({ ok: true, env: config.nodeEnv }),
  );

  // ── API routes ───────────────────────────────────────────────────────────────
  app.use("/api", apiLimiter, apiRoutes);

  // ── Serve built React client in production ───────────────────────────────────
  const distDir = join(__dirname, "..", "client", "dist");
  if (existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get(/.*/, (req, res) => res.sendFile(join(distDir, "index.html")));
  }

  // ── Global error handler ─────────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
