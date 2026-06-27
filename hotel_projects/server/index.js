import "dotenv/config";
import http from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { createRepository } from "./repository.js";

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";

const repository = await createRepository();
const app = createApp({ repository });
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true
  }
});

app.locals.io = io;

io.on("connection", (socket) => {
  socket.on("subscribe", (subscription = {}) => {
    const role = subscription.role || "guest";
    socket.join(`role:${role}`);
    if (subscription.floor) {
      socket.join(`floor:${subscription.floor}`);
    }
    if (subscription.orderId) {
      socket.join(`order:${subscription.orderId}`);
    }
  });
});

server.listen(port, host, () => {
  console.log(`Hotel Digital Menu MVP running at http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    server.close(async () => {
      if (typeof repository.close === "function") {
        await repository.close();
      } else if (typeof repository.raw?.close === "function") {
        repository.raw.close();
      }
      process.exit(0);
    });
  });
}
