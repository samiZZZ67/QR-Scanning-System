import "dotenv/config";
import http from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { createRepository } from "./src/db/repository.js";
import { setupSocket } from "./src/socket/index.js";
import config from "./src/config/env.js";

// Initialise the database (SQLite or PostgreSQL depending on config)
const repository = await createRepository();

// Create the Express app without io first, then wire io in
const app = createApp({ repository });
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin:
      config.nodeEnv === "production"
        ? [config.publicBaseUrl].filter(Boolean)
        : ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  },
});

// Make the io instance available to all route handlers
app.locals.io = io;

// Register socket room subscriptions
setupSocket(io);

server.listen(config.port, config.host, () => {
  console.log(`\n🏨  Hotel API running → http://${config.host}:${config.port}`);
  if (config.nodeEnv === "development") {
    console.log(`   Staff PIN: ${config.staffPin}`);
    console.log(
      `   DB: ${config.databaseUrl ? "PostgreSQL" : config.databasePath}\n`,
    );
  }
});

// Graceful shutdown
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    console.log(`\n[${signal}] Shutting down gracefully…`);
    server.close(async () => {
      try {
        if (typeof repository.close === "function") {
          await repository.close();
        } else if (typeof repository.raw?.close === "function") {
          repository.raw.close();
        }
      } catch (err) {
        console.error("Error during repository close:", err.message);
      }
      process.exit(0);
    });
  });
}
