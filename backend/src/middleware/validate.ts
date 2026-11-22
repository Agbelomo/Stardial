import type { RequestHandler } from "express";
import { type ZodTypeAny } from "zod";
import { AppError, ErrorCode, ErrorType } from "../lib/errors.js";

interface ValidationSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

/** Methods whose requests may carry a body that must satisfy a schema. */
const BODY_METHODS = new Set(["POST", "PUT", "PATCH"]);

/** A request body is expected to be a JSON object, never an array or a scalar. */
export function isJsonObjectBody(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function invalidBodyShapeError(): AppError {
  return new AppError(
    ErrorType.VALIDATION,
    ErrorCode.VALIDATION_ERROR,
    "Request body must be a JSON object."
  );
}

/**
 * App-wide guard: every write route in this API takes an object body, but
 * `express.json()` also parses a top-level JSON array. An array would reach a
 * handler as `req.body` with none of the fields its schema checks, so it is
 * rejected before any handler, cache or storage runs.
 *
 * A request with no body (`req.body` undefined) is left to the route schema,
 * which reports the missing required fields.
 */
export const requireJsonObjectBody: RequestHandler = (req, _res, next) => {
  if (!BODY_METHODS.has(req.method)) return next();
  const body = req.body;
  if (body === undefined || isJsonObjectBody(body)) return next();
  return next(invalidBodyShapeError());
};

/**
 * Validates `req.body`, `req.params` and `req.query` against the supplied
 * schemas and replaces them with the parsed (typed, transformed) values. The
 * body must be a JSON object: arrays and scalars are rejected before parsing.
 */
export function validateRequest(schemas: ValidationSchemas): RequestHandler {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        if (!isJsonObjectBody(req.body)) {
          throw invalidBodyShapeError();
        }
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as typeof req.query;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
