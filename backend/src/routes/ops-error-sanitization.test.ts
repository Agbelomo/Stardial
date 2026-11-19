import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { requestIdMiddleware } from "../middleware/request-id.js";
import { errorHandler } from "../middleware/error.js";

/**
 * Issue #4: the ops routes used to hand-roll their error responses and echo
 * `error.message` / `String(error)` straight to the caller, leaking Postgres
 * and TypeORM internals (table names, SQL fragments, source paths).
 */

vi.mock("../services/EventListenerService.js", () => ({
  backfillEvents: vi.fn(),
  getLedgerLag: vi.fn(() => 0),
  getServiceHealth: vi.fn(() => ({ status: "healthy" })),
}));

vi.mock("../services/database.js", () => ({
  getDataSource: vi.fn(),
}));

vi.mock("../services/stellar.js", () => ({
  getCacheStats: vi.fn(() => ({})),
  // The central error handler narrows on these two classes; the mock must
  // expose them or it throws on import.
  RpcError: class RpcError extends Error {},
  RpcTimeoutError: class RpcTimeoutError extends Error {},
}));

vi.mock("../services/metrics.js", () => ({
  getIdempotencyConflictsTotal: vi.fn(() => 0),
  getIdempotencyReplaysTotal: vi.fn(() => 0),
}));

vi.mock("../config/env.js", () => ({
  getEnvDiagnostics: vi.fn(() => ({ ok: true, issues: [] })),
}));

import { opsRouter } from "./ops.js";
import { backfillEvents } from "../services/EventListenerService.js";
import { getDataSource } from "../services/database.js";

const LEAKY_MESSAGE =
  'relation "payout_records" does not exist at /srv/app/backend/src/db.ts:88:9';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(requestIdMiddleware);
  app.use("/ops", opsRouter);
  app.use(errorHandler);
  return app;
}

const app = buildApp();

beforeEach(() => {
  vi.mocked(backfillEvents).mockReset();
  vi.mocked(getDataSource).mockReset();
});

describe("POST /ops/backfill error sanitisation (#4)", () => {
  it("routes failures through the central handler instead of echoing the message", async () => {
    vi.mocked(backfillEvents).mockRejectedValue(new Error(LEAKY_MESSAGE));

    const res = await request(app)
      .post("/ops/backfill")
      .send({ fromLedger: 1000 })
      .expect(500);

    expect(res.body.error).toBe("internal_error");
    expect(res.body.code).toBe("INTERNAL_ERROR");
    expect(res.body.requestId).toBeTruthy();

    // Outside production the handler still surfaces the message for local
    // debugging (documented behaviour), but never stack frames or paths.
    const body = JSON.stringify(res.body);
    expect(body).not.toContain("\n    at");
    expect(body).not.toContain("node:internal");
    expect(res.body.details).toEqual({});
  });

  it("does not expose the driver message in production", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    vi.mocked(backfillEvents).mockRejectedValue(new Error(LEAKY_MESSAGE));

    try {
      const res = await request(app)
        .post("/ops/backfill")
        .send({ fromLedger: 1000 })
        .expect(500);

      expect(res.body.message).toBe("Unexpected server error.");
      expect(JSON.stringify(res.body)).not.toContain(LEAKY_MESSAGE);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });
});

describe("GET /ops/mainnet-readiness error sanitisation (#4)", () => {
  it("does not echo the database probe failure", async () => {
    vi.mocked(getDataSource).mockReturnValue({
      isInitialized: true,
      query: vi.fn().mockRejectedValue(new Error(LEAKY_MESSAGE)),
    } as unknown as ReturnType<typeof getDataSource>);

    const res = await request(app).get("/ops/mainnet-readiness").expect(503);

    expect(res.body.status).toBe("not_ready");
    expect(res.body.error).toBe("mainnet_readiness_failed");
    expect(res.body.components.db).toMatchObject({
      ok: false,
      message: "database_unavailable",
      details: {},
    });

    const body = JSON.stringify(res.body);
    expect(body).not.toContain("payout_records");
    expect(body).not.toContain("/srv/app");
  });
});
