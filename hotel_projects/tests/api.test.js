import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../server/app.js";
import { createDatabase } from "../server/db.js";

const pin = "1234";

describe("hotel API", () => {
  let repository;
  let app;

  beforeEach(() => {
    repository = createDatabase(":memory:");
    app = createApp({ repository });
  });

  afterEach(() => {
    repository.raw.close();
  });

  it("returns seeded menu data", async () => {
    const response = await request(app).get("/api/menu").expect(200);
    expect(response.body.categories.length).toBeGreaterThan(0);
    expect(response.body.items.length).toBeGreaterThan(0);
    expect(response.body.items[0].name.en).toBeTruthy();
  });

  it("creates an order and reuses the idempotency key", async () => {
    const menu = await request(app).get("/api/menu").expect(200);
    const item = menu.body.items[0];
    const body = {
      tableNumber: 101,
      idempotencyKey: "same-click",
      notes: "No spice",
      items: [{ menuItemId: item.id, quantity: 2 }]
    };

    const first = await request(app).post("/api/orders").send(body).expect(201);
    const second = await request(app).post("/api/orders").send(body).expect(201);

    expect(second.body.id).toBe(first.body.id);
    expect(first.body.floor).toBe(1);
    expect(first.body.total).toBe(item.price * 2);
  });

  it("blocks unavailable menu items from new orders", async () => {
    const menu = await request(app).get("/api/menu").expect(200);
    const item = menu.body.items[0];

    await request(app)
      .patch(`/api/menu-items/${item.id}`)
      .set("x-staff-pin", pin)
      .send({ available: false })
      .expect(200);

    await request(app)
      .post("/api/orders")
      .send({
        tableNumber: 101,
        idempotencyKey: "unavailable-item",
        items: [{ menuItemId: item.id, quantity: 1 }]
      })
      .expect(400);
  });

  it("requires the staff PIN for staff order lists and updates", async () => {
    await request(app).get("/api/orders").expect(401);

    const menu = await request(app).get("/api/menu").expect(200);
    const order = await request(app)
      .post("/api/orders")
      .send({
        tableNumber: 201,
        idempotencyKey: "status-flow",
        items: [{ menuItemId: menu.body.items[0].id, quantity: 1 }]
      })
      .expect(201);

    const updated = await request(app)
      .patch(`/api/orders/${order.body.id}/status`)
      .set("x-staff-pin", pin)
      .send({ status: "preparing" })
      .expect(200);

    expect(updated.body.status).toBe("preparing");
  });
});
