import { describe, expect, it } from "vitest";
import { connectionText, edgeLabel, parseQuantity } from "./quantity";

describe("parseQuantity", () => {
  it("treats an empty field as no amount", () => {
    expect(parseQuantity("")).toEqual({ value: undefined });
    expect(parseQuantity("   ")).toEqual({ value: undefined });
  });

  it("reads a whole number, ignoring spaces around it", () => {
    expect(parseQuantity(" 20 ")).toEqual({ value: 20 });
    expect(parseQuantity("9999")).toEqual({ value: 9999 });
  });

  it.each(["0", "10000"])("rejects %s as out of range", (text) => {
    expect(parseQuantity(text)).toHaveProperty("error");
  });

  it.each(["1.5", "-3", "2e3", "20 wood", "abc"])("rejects %s as not a whole number", (text) => {
    expect(parseQuantity(text)).toHaveProperty("error");
  });
});

describe("connectionText", () => {
  it("shows only the title when there is no amount (as in the web template)", () => {
    expect(connectionText({ otherTitle: "Button" })).toBe("Button");
  });

  it("puts the amount first on the item that needs it", () => {
    expect(connectionText({ otherTitle: "Wood", amount: { value: 20, isSource: true } })).toBe("20 × Wood");
  });

  it("puts the amount after the title on the other side", () => {
    expect(connectionText({ otherTitle: "House 2", amount: { value: 20, isSource: false } })).toBe("House 2 (20)");
  });
});

describe("edgeLabel", () => {
  it("is only the wording when there is no amount (as in the web template)", () => {
    expect(edgeLabel("uses", undefined)).toBe("uses");
    expect(edgeLabel("uses", null)).toBe("uses");
  });

  it("adds the amount after the wording", () => {
    expect(edgeLabel("ingredient in", 20)).toBe("ingredient in (20)");
  });
});
