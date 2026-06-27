import { describe, expect, it } from "vitest";
import { buildAnalytics } from "../src/analytics.js";

describe("buildAnalytics", () => {
  it("summarizes orders and comparisons", () => {
    const orders = [
      { id: 1, total: 120, createdAt: "2026-06-27T10:00:00.000Z", status: "delivered", items: [{ quantity: 2, name: "Tea" }], tableNumber: 101 },
      { id: 2, total: 80, createdAt: "2026-06-27T12:00:00.000Z", status: "preparing", items: [{ quantity: 1, name: "Cake" }], tableNumber: 102 }
    ];

    const analytics = buildAnalytics(orders, "today", null, false, new Date("2026-06-27T13:00:00.000Z"));

    expect(analytics.summary.totalRevenue).toBe(200);
    expect(analytics.summary.totalSales).toBe(3);
    expect(analytics.summary.totalOrders).toBe(2);
    expect(analytics.summary.bestSellingItems[0].name).toBe("Tea");
    expect(analytics.summary.completedOrders).toBe(1);
    expect(analytics.summary.pendingOrders).toBe(1);
  });

  it("normalizes translated item names for the dashboard", () => {
    const orders = [
      {
        id: 3,
        total: 90,
        createdAt: "2026-06-27T10:30:00.000Z",
        status: "delivered",
        items: [{ quantity: 2, name: { en: "Coffee", am: "ቡና", ar: "قهوة" } }],
        tableNumber: 201
      }
    ];

    const analytics = buildAnalytics(orders, "today", null, false, new Date("2026-06-27T13:00:00.000Z"));

    expect(analytics.summary.bestSellingItems[0].name).toBe("Coffee");
  });
});
