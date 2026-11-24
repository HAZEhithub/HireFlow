import { afterEach, describe, expect, it } from "vitest";
import { isAdminUser } from "./admin";

const originalEmails = process.env.ADMIN_EMAILS;
const originalIds = process.env.ADMIN_USER_IDS;

afterEach(() => {
  process.env.ADMIN_EMAILS = originalEmails;
  process.env.ADMIN_USER_IDS = originalIds;
});

describe("isAdminUser", () => {
  it("does not grant admin from an unverified session email", () => {
    process.env.ADMIN_EMAILS = "ops@example.com";
    process.env.ADMIN_USER_IDS = "";
    expect(isAdminUser({ id: "u1", email: "ops@example.com", emailVerified: false })).toBe(false);
    expect(isAdminUser({ id: "u1", email: "ops@example.com" })).toBe(false);
  });

  it("grants admin from a verified email or an explicit user id", () => {
    process.env.ADMIN_EMAILS = "ops@example.com";
    process.env.ADMIN_USER_IDS = "admin-id";
    expect(isAdminUser({ id: "u1", email: "ops@example.com", emailVerified: true })).toBe(true);
    expect(isAdminUser({ id: "admin-id", email: "anyone@example.com", emailVerified: false })).toBe(true);
  });

  it("fails closed when allow-lists are empty", () => {
    process.env.ADMIN_EMAILS = "";
    process.env.ADMIN_USER_IDS = "";
    expect(isAdminUser({ id: "u1", email: "ops@example.com", emailVerified: true })).toBe(false);
  });
});
