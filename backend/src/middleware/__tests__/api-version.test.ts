import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../index.js";
import {
  API_MAJOR_VERSION,
  API_SEMANTIC_VERSION,
  SUPPORTED_API_MAJOR_VERSIONS,
  normalizeRequestedVersion,
} from "../api-version.js";

describe("API versioning strategy", () => {
  describe("normalizeRequestedVersion", () => {
    it("normalizes supported v1 aliases", () => {
      expect(normalizeRequestedVersion("v1")).toBe("v1");
      expect(normalizeRequestedVersion("V1")).toBe("v1");
      expect(normalizeRequestedVersion("1")).toBe("v1");
      expect(normalizeRequestedVersion("1.0")).toBe("v1");
      expect(normalizeRequestedVersion("1.0.0")).toBe("v1");
      expect(normalizeRequestedVersion("  v1  ")).toBe("v1");
    });

    it("returns null for unsupported versions", () => {
      expect(normalizeRequestedVersion("v2")).toBeNull();
      expect(normalizeRequestedVersion("2.0.0")).toBeNull();
      expect(normalizeRequestedVersion("0.9.0")).toBeNull();
      expect(normalizeRequestedVersion("latest")).toBeNull();
    });
  });

  describe("response headers", () => {
    it("advertises API-Version and X-API-Version on unversioned routes", async () => {
      const res = await request(app).get("/health/live");

      expect(res.status).toBe(200);
      expect(res.headers["api-version"]).toBe(API_SEMANTIC_VERSION);
      expect(res.headers["x-api-version"]).toBe(API_MAJOR_VERSION);
    });

    it("advertises API-Version and X-API-Version on /v1 routes", async () => {
      const res = await request(app).get("/v1/health/live");

      expect(res.status).toBe(200);
      expect(res.headers["api-version"]).toBe(API_SEMANTIC_VERSION);
      expect(res.headers["x-api-version"]).toBe(API_MAJOR_VERSION);
    });
  });

  describe("explicit /v1 route mounting", () => {
    it("serves /v1/health/live", async () => {
      const res = await request(app).get("/v1/health/live");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("status");
    });

    it("retains unversioned /health/live alias for backward compatibility", async () => {
      const res = await request(app).get("/health/live");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("status");
    });
  });

  describe("header-based version negotiation", () => {
    it("accepts valid X-API-Version header values", async () => {
      for (const value of ["v1", "1", "1.0", "1.0.0"]) {
        const res = await request(app)
          .get("/v1/health/live")
          .set("X-API-Version", value);

        expect(res.status).toBe(200);
        expect(res.headers["x-api-version"]).toBe(API_MAJOR_VERSION);
      }
    });

    it("accepts valid Accept-Version header values", async () => {
      const res = await request(app)
        .get("/v1/health/live")
        .set("Accept-Version", "1.0.0");

      expect(res.status).toBe(200);
      expect(res.headers["api-version"]).toBe(API_SEMANTIC_VERSION);
    });

    it("rejects unsupported X-API-Version with 400 UNSUPPORTED_API_VERSION", async () => {
      const res = await request(app)
        .get("/v1/health/live")
        .set("X-API-Version", "v2");

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        error: "unsupported_api_version",
        code: "UNSUPPORTED_API_VERSION",
        details: {
          requested: "v2",
          supported: [...SUPPORTED_API_MAJOR_VERSIONS],
          current: API_SEMANTIC_VERSION,
        },
      });
      expect(typeof res.body.requestId).toBe("string");
      expect(res.headers["api-version"]).toBe(API_SEMANTIC_VERSION);
    });

    it("rejects unsupported Accept-Version with 400 UNSUPPORTED_API_VERSION", async () => {
      const res = await request(app)
        .get("/health/live")
        .set("Accept-Version", "2.0.0");

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("UNSUPPORTED_API_VERSION");
      expect(res.body.details.requested).toBe("2.0.0");
    });

    it("rejects conflicting X-API-Version and Accept-Version headers", async () => {
      const res = await request(app)
        .get("/v1/health/live")
        .set("X-API-Version", "v1")
        .set("Accept-Version", "v2");

      expect(res.status).toBe(400);
      expect(res.body.code).toBe("UNSUPPORTED_API_VERSION");
    });
  });
});
