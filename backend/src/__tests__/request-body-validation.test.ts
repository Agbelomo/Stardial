import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

import { app } from "../index.js";
import { errorHandler } from "../middleware/error.js";
import { requireJsonObjectBody, validateRequest } from "../middleware/validate.js";
import { OpsBackfillRequestSchema } from "../schemas/admin.schemas.js";
import { createSplitSchema } from "../schemas/splits.js";
import { userRegistrationSchema, userUpdateSchema } from "../schemas/user.schemas.js";

// Both addresses are valid Ed25519 public keys used elsewhere in the suite.
const OWNER = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const PARTNER = "GBIRMAYQUTHQC762ZTJTNXWDSHSDGN64ZXPXJ6XRLWJCAF6TS4Z7J7IO";

function validCreatePayload() {
  return {
    owner: OWNER,
    projectId: "proj_1",
    title: "Stellar split",
    projectType: "album",
    token: OWNER,
    collaborators: [
      { address: OWNER, alias: "Owner", basisPoints: 7000 },
      { address: PARTNER, alias: "Partner", basisPoints: 3000 },
    ],
  };
}

function guardApp() {
  const guarded = express();
  guarded.use(express.json());
  guarded.use(requireJsonObjectBody);
  const handler = vi.fn((req, res) => res.json({ body: req.body }));
  guarded.post("/echo", handler);
  guarded.use(errorHandler);
  return { guarded, handler };
}

describe("request body shape guard", () => {
  it("rejects a top-level JSON array before any handler runs", async () => {
    const { guarded, handler } = guardApp();

    const response = await request(guarded)
      .post("/echo")
      .set("Content-Type", "application/json")
      .send("[1,2,3]");

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.message).toBe("Request body must be a JSON object.");
    expect(handler).not.toHaveBeenCalled();
  });

  it("rejects a JSON scalar body", async () => {
    const { guarded, handler } = guardApp();

    const response = await request(guarded)
      .post("/echo")
      .set("Content-Type", "application/json")
      .send('"just-a-string"');

    expect(response.status).toBe(400);
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes an object body through untouched", async () => {
    const { guarded, handler } = guardApp();

    const response = await request(guarded).post("/echo").send({ amount: 10 });

    expect(response.status).toBe(200);
    expect(response.body.body).toEqual({ amount: 10 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("rejects an array body in the validation middleware", async () => {
    const guarded = express();
    guarded.use(express.json());
    guarded.post(
      "/validated",
      validateRequest({ body: OpsBackfillRequestSchema }),
      (_req, res) => res.json({ ok: true }),
    );
    guarded.use(errorHandler);

    const response = await request(guarded).post("/validated").send([{ fromLedger: 5 }]);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });
});

describe("strict request body contracts", () => {
  it("accepts a complete create-split payload", () => {
    expect(createSplitSchema.safeParse(validCreatePayload()).success).toBe(true);
  });

  it("rejects unknown top-level fields instead of silently dropping them", () => {
    const parsed = createSplitSchema.safeParse({
      ...validCreatePayload(),
      share: 10_000,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects unknown nested collaborator fields", () => {
    const payload = validCreatePayload();
    const parsed = createSplitSchema.safeParse({
      ...payload,
      collaborators: [
        { ...payload.collaborators[0], share: 7000 },
        payload.collaborators[1],
      ],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects collaborators that are not objects", () => {
    const payload = validCreatePayload();
    const parsed = createSplitSchema.safeParse({
      ...payload,
      collaborators: ["not-an-object", payload.collaborators[1]],
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects unknown fields on registration", () => {
    const parsed = userRegistrationSchema.safeParse({
      walletAddress: OWNER,
      isActive: true,
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects an empty profile update", () => {
    expect(userUpdateSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a mistyped ops backfill body", () => {
    expect(OpsBackfillRequestSchema.safeParse({ fromLedger: "12" }).success).toBe(false);
    expect(OpsBackfillRequestSchema.safeParse({ fromLedger: 12, force: true }).success).toBe(false);
  });
});

describe("write routes reject bodies that fail their contract", () => {
  it("POST /ops/backfill rejects an array body", async () => {
    const response = await request(app)
      .post("/ops/backfill")
      .set("Content-Type", "application/json")
      .send([{ fromLedger: 5 }]);

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.message).toBe("Request body must be a JSON object.");
  });

  it("POST /ops/backfill rejects unknown and mistyped fields", async () => {
    const response = await request(app)
      .post("/ops/backfill")
      .send({ fromLedger: 5, force: true });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("invalid_backfill_request");
  });

  it("POST /users/register rejects unknown fields before touching storage", async () => {
    const response = await request(app)
      .post("/users/register")
      .send({ walletAddress: OWNER, isActive: true });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.body.details.formErrors.join(" ")).toMatch(/unrecognized key/i);
  });

  it("POST /users/login rejects a body mixing both login shapes", async () => {
    const response = await request(app)
      .post("/users/login")
      .send({ walletAddress: OWNER, email: "a@example.com", password: "secret123" });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
  });

  it("POST /users/register rejects an array body", async () => {
    const response = await request(app)
      .post("/users/register")
      .set("Content-Type", "application/json")
      .send([{ walletAddress: OWNER }]);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Request body must be a JSON object.");
  });
});
