import http from "node:http";
import request from "supertest";
import { io as Client } from "socket.io-client";
import { Server } from "socket.io";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../server/app.js";
import { createDatabase } from "../server/db.js";

describe("realtime events", () => {
  let repository;
  let app;
  let server;
  let io;
  let baseUrl;

  beforeEach(async () => {
    repository = createDatabase(":memory:");
    app = createApp({ repository });
    server = http.createServer(app);
    io = new Server(server);
    app.locals.io = io;
    await new Promise((resolve) => server.listen(0, resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  afterEach(async () => {
    io.close();
    await new Promise((resolve) => server.close(resolve));
    repository.raw.close();
  });

  it("emits new orders to subscribed screens", async () => {
    const client = Client(baseUrl, { transports: ["websocket"] });
    await new Promise((resolve) => client.on("connect", resolve));
    client.emit("subscribe", { role: "kitchen", floor: 1 });

    const event = new Promise((resolve) => client.on("order.created", resolve));
    const menu = await request(app).get("/api/menu").expect(200);
    await request(app)
      .post("/api/orders")
      .send({
        tableNumber: 101,
        idempotencyKey: "socket-order",
        items: [{ menuItemId: menu.body.items[0].id, quantity: 1 }]
      })
      .expect(201);

    const payload = await event;
    expect(payload.tableNumber).toBe(101);
    client.disconnect();
  });
});
