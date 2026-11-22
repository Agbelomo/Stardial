import compression from "compression";
import type { NextFunction, Request, Response } from "express";

export const DEFAULT_COMPRESSION_THRESHOLD = 1024;

const COMPRESSIBLE_CONTENT_TYPE =
  /^(?:application\/(?:json|javascript|xml|x-www-form-urlencoded|[a-z0-9.+-]+\+json)(?:[;\s]|$)|text\/(?!event-stream)|image\/svg\+xml(?:[;\s]|$))/i;
const NO_TRANSFORM = /(?:^|,)\s*no-transform\s*(?:,|$)/i;

export interface ResponseCompressionOptions {
  threshold?: number;
}

export function responseCompression(options: ResponseCompressionOptions = {}) {
  const threshold = options.threshold ?? DEFAULT_COMPRESSION_THRESHOLD;

  const filter = (req: Request, res: Response): boolean => {
    if (req.headers["x-no-compression"]) return false;
    if (res.getHeader("Content-Encoding")) return false;

    const cacheControl = res.getHeader("Cache-Control");
    if (typeof cacheControl === "string" && NO_TRANSFORM.test(cacheControl)) return false;

    const contentType = res.getHeader("Content-Type");
    if (typeof contentType !== "string" || !COMPRESSIBLE_CONTENT_TYPE.test(contentType)) {
      return false;
    }

    const contentLength = res.getHeader("Content-Length");
    if (contentLength !== undefined && Number(contentLength) < threshold) return false;

    return compression.filter(req, res);
  };

  const middleware = compression({ threshold: 0, filter });

  return (req: Request, res: Response, next: NextFunction) => {
    const vary = res.getHeader("Vary");
    if (vary === undefined) {
      res.setHeader("Vary", "Accept-Encoding");
    } else if (typeof vary === "string" && !/\baccept-encoding\b/i.test(vary)) {
      res.setHeader("Vary", `${vary}, Accept-Encoding`);
    }
    middleware(req, res, next);
  };
}
