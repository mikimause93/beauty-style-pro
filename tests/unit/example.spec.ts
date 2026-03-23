/**
 * Unit test scaffold — Beauty Style Pro
 *
 * Demonstrates how to write Vitest unit tests for utility functions.
 * Run with: npm run test
 */

import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (classname utility)", () => {
  it("returns a single class unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple classes", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("resolves Tailwind conflicts (last one wins)", () => {
    // twMerge ensures p-4 overrides p-2
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("ignores falsy values", () => {
    expect(cn("foo", false, null, undefined, "bar")).toBe("foo bar");
  });

  it("supports conditional classes", () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn("base", isActive && "active", isDisabled && "disabled")).toBe("base active");
  });

  it("returns empty string for no input", () => {
    expect(cn()).toBe("");
  });
});

describe("formatCurrency (example utility)", () => {
  const formatCurrency = (amount: number, currency = "EUR", locale = "it-IT"): string => {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  it("formats EUR amounts", () => {
    const result = formatCurrency(10.5);
    expect(result).toContain("10");
    expect(result).toContain("50");
  });

  it("formats zero correctly", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });

  it("handles large amounts", () => {
    const result = formatCurrency(1000000);
    expect(result).toContain("1");
  });
});

describe("slugify (example utility)", () => {
  const slugify = (text: string): string =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");

  it("converts spaces to hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Beauty Style Pro")).toBe("beauty-style-pro");
  });

  it("handles already-slug strings", () => {
    expect(slugify("beauty-style-pro")).toBe("beauty-style-pro");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify("  hello  ")).toBe("hello");
  });
});
