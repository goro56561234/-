import { describe, it, expect } from "vitest";
import { sample, validateBook, newBook } from "./model";
describe("portable book format", () => {
  it("round trips five sample pages with embedded artwork and interactive actors", () => {
    const book = JSON.parse(JSON.stringify(sample()));
    expect(validateBook(book)).toBe(true);
    expect(book.pages).toHaveLength(5);
    expect(
      book.pages.every((p: any) =>
        p.elements.some((e: any) => e.motion !== "none"),
      ),
    ).toBe(true);
    expect(
      book.pages[0].elements.some((e: any) =>
        e.alternate?.startsWith("data:image/svg+xml"),
      ),
    ).toBe(true);
  });
  it("rejects malformed imports and remote image references", () => {
    expect(validateBook({})).toBe(false);
    const b = sample();
    b.pages[0].elements[0].src = "https://example.com/tracker.png";
    expect(validateBook(b)).toBe(false);
    expect(validateBook(newBook())).toBe(true);
  });
});
