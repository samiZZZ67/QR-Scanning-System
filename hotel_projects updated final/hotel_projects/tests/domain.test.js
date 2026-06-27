import { describe, expect, it } from "vitest";
import { calculateOrderTotal, deriveFloor, isValidStatusTransition } from "../server/domain.js";

describe("domain helpers", () => {
  it("derives the floor from the first table digit", () => {
    expect(deriveFloor(101)).toBe(1);
    expect(deriveFloor(205)).toBe(2);
    expect(deriveFloor(603)).toBe(6);
  });

  it("rejects invalid table numbers", () => {
    expect(() => deriveFloor(15)).toThrow("Invalid table number");
  });

  it("calculates order totals from item snapshots", () => {
    expect(calculateOrderTotal([
      { price: 120, quantity: 2 },
      { price: 80, quantity: 1 }
    ])).toBe(320);
  });

  it("allows forward status transitions only", () => {
    expect(isValidStatusTransition("received", "preparing")).toBe(true);
    expect(isValidStatusTransition("preparing", "ready")).toBe(true);
    expect(isValidStatusTransition("ready", "delivered")).toBe(true);
    expect(isValidStatusTransition("ready", "received")).toBe(false);
  });
});
