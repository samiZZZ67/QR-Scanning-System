import { describe, expect, it } from "vitest";
import { getLanguageDirection } from "../src/i18nDirection.js";

describe("language direction", () => {
  it("uses rtl for Arabic and ltr for English and Amharic", () => {
    expect(getLanguageDirection("ar")).toBe("rtl");
    expect(getLanguageDirection("ar-EG")).toBe("rtl");
    expect(getLanguageDirection("en")).toBe("ltr");
    expect(getLanguageDirection("am")).toBe("ltr");
  });
});
