import http, { type IncomingHttpHeaders } from "node:http";
import type { AddressInfo } from "node:net";
import { gunzipSync } from "node:zlib";
import express from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { responseCompression } from "../compression.js";
import { app as apiApp } from "../../index.js";

const largePayload = {
  items: Array.from({ length: 2000 }, (_, index) => ({
    id: index,
    name: `item-${index}`,
    note: "x".repeat(24)
  }))
};

function buildApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(responseCompression());

  app.get("/small", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/large", (_req, res) => {
    res.json(largePayload);
  });

  app.get("/stream", (_req, res) => {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.write("id,name\n");
    for (let index = 0; index < 2000; index++) {
      res.write(`${index},name-${index}\n`);
    }
    res.end();
  });

  app.get("/events", (_req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.write("data: ping\n\n");
    res.end();
  });

  app.get("/binary", (_req, res) => {
    res.send(Buffer.alloc(4096, 7));
  });

  app.get("/no-transform", (_req, res) => {
    res.setHeader("Cache-Control", "no-transform");
    res.json(largePayload);
  });

  return app;
}

interface RawResponse {
  status: number;
  headers: IncomingHttpHeaders;
  body: Buffer;
}

async function rawGet(
  port: number,
  path: string,
  headers: Record<string, string> = {}
): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "127.0.0.1", port, path, method: "GET", headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () =>
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers,
          body: Buffer.concat(chunks)
        })
      );
      res.on("error", reject);
    });
    req.on("error", reject);
    req.end();
  });
}

const testApp = buildApp();
let server: http.Server;
let port: number;

beforeAll(async () => {
  server = testApp.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  port = (server.address() as AddressInfo).port;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

describe("Issue #23: HTTP response compression", () => {
  it("gzip-compresses large JSON responses and measurably reduces their size", async () => {
    const response = await rawGet(port, "/large", { "Accept-Encoding": "gzip" });

    expect(response.status).toBe(200);
    expect(response.headers["content-encoding"]).toBe("gzip");
    expect(String(response.headers["vary"]).toLowerCase()).toContain("accept-encoding");
    expect(JSON.parse(gunzipSync(response.body).toString("utf8"))).toEqual(largePayload);

    const uncompressedSize = Buffer.byteLength(JSON.stringify(largePayload));
    expect(response.body.length).toBeLessThan(uncompressedSize / 2);
  });

  it("leaves small responses uncompressed but still varies on Accept-Encoding", async () => {
    const response = await rawGet(port, "/small", { "Accept-Encoding": "gzip" });

    expect(response.headers["content-encoding"]).toBeUndefined();
    expect(String(response.headers["vary"]).toLowerCase()).toContain("accept-encoding");
    expect(JSON.parse(response.body.toString("utf8"))).toEqual({ ok: true });
  });

  it("does not compress when the client did not request an encoding", async () => {
    const response = await rawGet(port, "/large");

    expect(response.headers["content-encoding"]).toBeUndefined();
    expect(JSON.parse(response.body.toString("utf8"))).toEqual(largePayload);
  });

  it("compresses streamed CSV responses without buffering or dropping data", async () => {
    const response = await rawGet(port, "/stream", { "Accept-Encoding": "gzip" });

    expect(response.headers["content-encoding"]).toBe("gzip");
    expect(response.headers["transfer-encoding"]).toBe("chunked");
    const csv = gunzipSync(response.body).toString("utf8");
    expect(csv.startsWith("id,name\n")).toBe(true);
    expect(csv).toContain("1999,name-1999");
    expect(response.body.length).toBeLessThan(Buffer.byteLength(csv));
  });

  it("skips SSE streams, binary payloads and no-transform responses", async () => {
    for (const path of ["/events", "/binary", "/no-transform"]) {
      const response = await rawGet(port, path, { "Accept-Encoding": "gzip" });
      expect(response.headers["content-encoding"], path).toBeUndefined();
    }
  });

  it("honours the x-no-compression request header", async () => {
    const response = await rawGet(port, "/large", {
      "Accept-Encoding": "gzip",
      "X-No-Compression": "1"
    });

    expect(response.headers["content-encoding"]).toBeUndefined();
  });

  it("does not compress HEAD responses", async () => {
    const response = await request(testApp).head("/large").set("Accept-Encoding", "gzip");

    expect(response.headers["content-encoding"]).toBeUndefined();
  });

  it("is registered on the real API and compresses the large OpenAPI document", async () => {
    const response = await request(apiApp).get("/api/openapi.json").set("Accept-Encoding", "gzip");

    expect(response.status).toBe(200);
    expect(response.headers["content-encoding"]).toBe("gzip");
    expect(response.body).toBeTruthy();
  });
});
