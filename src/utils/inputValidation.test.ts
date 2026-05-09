import { describe, it, expect, beforeEach } from "vitest";
import {
  sanitizeInput,
  validateLeagueId,
  validateUsername,
  validateSalary,
  validateContractLength,
  validateNumber,
  validateAndSanitizeLeagueId,
  rateLimiter,
} from "./inputValidation";

describe("sanitizeInput", () => {
  it("strips HTML tags and trims whitespace", () => {
    expect(sanitizeInput("  <script>alert('x')</script>hello  ")).toBe("hello");
  });

  it("removes attribute-style XSS vectors", () => {
    expect(sanitizeInput('<img src=x onerror="bad()">caption')).toBe("caption");
  });

  it("returns empty string when input is only HTML", () => {
    expect(sanitizeInput("<div></div>")).toBe("");
  });
});

describe("validateLeagueId", () => {
  it("accepts a valid 18-digit Sleeper league id", () => {
    const result = validateLeagueId("123456789012345678");
    expect(result.isValid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts 15- and 20-digit edges", () => {
    expect(validateLeagueId("123456789012345").isValid).toBe(true);
    expect(validateLeagueId("12345678901234567890").isValid).toBe(true);
  });

  it("rejects ids that are too short or too long", () => {
    expect(validateLeagueId("12345").isValid).toBe(false);
    expect(validateLeagueId("123456789012345678901").isValid).toBe(false);
  });

  it("rejects non-numeric input", () => {
    expect(validateLeagueId("abcdefghijklmnopqr").isValid).toBe(false);
  });

  it("rejects empty input", () => {
    const result = validateLeagueId("");
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("required");
  });
});

describe("validateUsername", () => {
  it("accepts valid alphanumeric usernames", () => {
    expect(validateUsername("user_123").isValid).toBe(true);
    expect(validateUsername("abc").isValid).toBe(true);
  });

  it("rejects too-short or too-long usernames", () => {
    expect(validateUsername("ab").isValid).toBe(false);
    expect(validateUsername("a".repeat(21)).isValid).toBe(false);
  });

  it("rejects usernames with disallowed characters", () => {
    expect(validateUsername("user-name").isValid).toBe(false);
    expect(validateUsername("user.name").isValid).toBe(false);
  });
});

describe("validateSalary", () => {
  it("accepts non-negative numbers up to the cap", () => {
    expect(validateSalary(0)).toEqual({ isValid: true, value: 0 });
    expect(validateSalary("100")).toEqual({ isValid: true, value: 100 });
    expect(validateSalary(10_000_000)).toEqual({ isValid: true, value: 10_000_000 });
  });

  it("rejects negative numbers", () => {
    const result = validateSalary(-5);
    expect(result.isValid).toBe(false);
    expect(result.error).toContain("negative");
  });

  it("rejects values above the sanity cap", () => {
    const result = validateSalary(10_000_001);
    expect(result.isValid).toBe(false);
  });

  it("rejects non-numeric strings", () => {
    expect(validateSalary("not a number").isValid).toBe(false);
  });
});

describe("validateContractLength", () => {
  // NOTE: the rest of the codebase treats contract_length === 0 as a
  // sentinel for "no contract" (see usePendingFreeAgents and the
  // commissioner override allowing 0–10). This validator is stricter
  // and rejects 0 — it's intended for user-facing input where 0 is not
  // a meaningful selection. Pin the asymmetry so it doesn't drift.
  it("accepts 1–10 inclusive", () => {
    expect(validateContractLength(1).isValid).toBe(true);
    expect(validateContractLength(10).isValid).toBe(true);
  });

  it("rejects 0 (input form does not accept 'no contract' as a length)", () => {
    expect(validateContractLength(0).isValid).toBe(false);
  });

  it("rejects values above 10", () => {
    expect(validateContractLength(11).isValid).toBe(false);
  });

  it("parses string input", () => {
    expect(validateContractLength("3")).toEqual({ isValid: true, value: 3 });
  });
});

describe("validateNumber", () => {
  it("respects min and max bounds when supplied", () => {
    expect(validateNumber(5, 1, 10).isValid).toBe(true);
    expect(validateNumber(0, 1, 10).isValid).toBe(false);
    expect(validateNumber(11, 1, 10).isValid).toBe(false);
  });

  it("works without bounds", () => {
    expect(validateNumber(-100).isValid).toBe(true);
  });

  it("includes the field name in error messages", () => {
    const result = validateNumber("nope", 0, 10, "Salary cap");
    expect(result.error).toContain("Salary cap");
  });
});

describe("validateAndSanitizeLeagueId", () => {
  it("returns the sanitized id when valid", () => {
    const result = validateAndSanitizeLeagueId("  123456789012345678  ");
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe("123456789012345678");
  });

  it("rejects HTML-padded input that fails the digit check after sanitization", () => {
    const result = validateAndSanitizeLeagueId("<b>123</b>");
    expect(result.isValid).toBe(false);
  });
});

describe("rateLimiter", () => {
  // Exported as a singleton — clear its internal state between cases.
  beforeEach(() => {
    // The class doesn't expose a reset, so use a unique key per test.
  });

  it("allows up to maxRequests within the window, then blocks", () => {
    const key = `unit-test-${Math.random()}`;
    expect(rateLimiter.isAllowed(key, 3, 60_000)).toBe(true);
    expect(rateLimiter.isAllowed(key, 3, 60_000)).toBe(true);
    expect(rateLimiter.isAllowed(key, 3, 60_000)).toBe(true);
    expect(rateLimiter.isAllowed(key, 3, 60_000)).toBe(false);
  });

  it("decrements remaining requests as calls accumulate", () => {
    const key = `unit-test-${Math.random()}`;
    expect(rateLimiter.getRemainingRequests(key, 5)).toBe(5);
    rateLimiter.isAllowed(key, 5, 60_000);
    rateLimiter.isAllowed(key, 5, 60_000);
    expect(rateLimiter.getRemainingRequests(key, 5)).toBe(3);
  });
});
