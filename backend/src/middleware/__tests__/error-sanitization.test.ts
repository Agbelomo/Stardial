import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";

import { requestIdMiddleware } from "../request-id.js";
import { errorHandler } from "../error.js";
import { AppError, ErrorCode, ErrorType } from "../../lib/errors.js";

/**
 * Issue #4: runtime exceptions must never leak stack traces, file names or
 * server-internal messages to API consumers.
 *
 * These tests pin the response envelope produced by the central error
 * middleware, including the previously leaking path where
 * `translateSorobanError` put `{ stack, originalError }` into
 * `AppError.details` and the handler spread those details into the body.
 */

const STACK_TRACE = [
  "Error: connect ECONNREFUSED 10.0.0.5:5432",
  "    at Pool.connect (/srv/app/backend/src/services/database.ts:42:11)",
  "    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)",
].join("\n");

const INTERNAL_MESSAGE = "select * from payout_records failed";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestIdMiddleware);

  app.get("/unhandled", () => {
    throw new Error(INTERNAL_MESSAGE);
  });

  app.get("/app-error", () => {
    throw new AppError(
      ErrorType.INTERNAL,
      ErrorCode.INTERNAL_ERROR,
      INTERNAL_MESSAGE,
      { message: "Please try again later." },
      {
        stack: STACK_TRACE,
        originalError: new Error("nested driver error"),
        cause: "driver failure",
        safe: "kept",
        nested: { file: "/srv/app/backend/src/db.ts:10:2", ok: true },
        bigNumber: BigInt(42),
      },
    );
  });

  app.use(errorHandler);
  return app;
}

const app = buildApp();

function serialized(body: unknown): string {
  return JSON.stringify(body);
}

describe("Issue #4: unhandled exception sanitisation", () => {
  it("never returns stack frames or server file paths", async () => {
    const res = await request(app).get("/unhandled").expect(500);

    expect(res.body.error).toBe("internal_error");
    expect(res.body.code).toBe("INTERNAL_ERROR");
    expect(res.body.requestId).toBeTruthy();
    expect(res.body.details).toEqual({});

    const body = serialized(res.body);
    expect(body).not.toContain("at Pool.connect");
    expect(body).not.toContain("node:internal");
    expect(body).not.toContain("/srv/app");
    expect(body).not.toMatch(/\.ts:\d+:\d+/);
    expect(body).not.toContain("stack");
  });

  it("returns a generic message in production", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const res = await request(app).get("/unhandled").expect(500);

      expect(res.body.message).toBe("Unexpected server error.");
      expect(serialized(res.body)).not.toContain(INTERNAL_MESSAGE);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});

describe("Issue #4: AppError details sanitisation", () => {
  it("drops stack, originalError and cause keys", async () => {
    const res = await request(app).get("/app-error").expect(500);

    expect(res.body.details).not.toHaveProperty("stack");
    expect(res.body.details).not.toHaveProperty("originalError");
    expect(res.body.details).not.toHaveProperty("cause");
    expect(res.body.details.remediation).toEqual({ message: "Please try again later." });
  });

  it("keeps benign detail fields", async () => {
    const res = await request(app).get("/app-error").expect(500);

    expect(res.body.details.safe).toBe("kept");
    expect(res.body.details.nested.ok).toBe(true);
    // BigInt cannot be JSON-serialised — it is converted rather than throwing.
    expect(res.body.details.bigNumber).toBe("42");
  });

  it("redacts stack-shaped strings nested inside details", async () => {
    const res = await request(app).get("/app-error").expect(500);

    expect(res.body.details.nested.file).toBe("[REDACTED]");
    expect(serialized(res.body)).not.toContain("/srv/app/backend/src/db.ts");
  });

  it("returns a generic message for 5xx AppErrors in production", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const res = await request(app).get("/app-error").expect(500);

      expect(res.body.message).toBe("Unexpected server error.");
      expect(serialized(res.body)).not.toContain(INTERNAL_MESSAGE);
      // Machine-readable fields and the correlation id are still present.
      expect(res.body.code).toBe("INTERNAL_ERROR");
      expect(res.body.requestId).toBeTruthy();
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});

afterEach(() => {
  expect(process.env.NODE_ENV).not.toBe("production");
});
