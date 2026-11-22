# API Versioning & Deprecation Policy

This document defines how the Stardial backend API is versioned, how clients
select and verify an API version, and how breaking changes and deprecations are
communicated and rolled out.

## Semantic Versioning

The API follows [Semantic Versioning 2.0.0](https://semver.org/) (`MAJOR.MINOR.PATCH`):

- **MAJOR (`v1`, `v2`, …)**: Incremented only for backwards-incompatible contract
  changes (removing an endpoint or field, renaming a field without an alias,
  changing a field type or error code semantics, tightening validation on
  previously accepted inputs).
- **MINOR (`1.1.0`, `1.2.0`, …)**: Backwards-compatible additions (new endpoints,
  optional request parameters, additive response fields, new enum values where
  clients are expected to ignore unknown values).
- **PATCH (`1.0.1`, `1.0.2`, …)**: Backwards-compatible bug fixes, performance
  improvements, and security hardening that do not alter the documented contract.

The current active contract is **`1.0.0`** (major version **`v1`**).

## Version Selection & Discovery

### 1. Explicit URL Versioning (Canonical)

All API endpoints are mounted under the explicit `/v1` prefix:

- `/v1/health/*`
- `/v1/splits/*`
- `/v1/users/*`
- `/v1/auth/*`
- `/v1/collaboration/*`
- `/v1/transactions/*`
- `/v1/events/*`
- `/v1/ledger/*`
- `/v1/notifications/*`
- `/v1/webhooks/*`
- `/v1/ops/*`

New clients and integrations should always target `/v1/...` routes.

Existing unversioned routes (e.g. `/splits`, `/users`, `/transactions`,
`/webhooks`, `/api/ledger`) remain mounted as backwards-compatible aliases for
`v1` so existing clients do not break.

### 2. Header-Based Version Negotiation

Clients may optionally declare the API version they expect using either
`X-API-Version` or `Accept-Version`:

```http
GET /v1/health/live HTTP/1.1
X-API-Version: v1
```

Accepted values for `v1` are `v1`, `1`, `1.0`, and `1.0.0` (case-insensitive).

If a client requests an unsupported version (for example `X-API-Version: v2`) or
sends conflicting `X-API-Version` and `Accept-Version` headers, the server
rejects the request with `400 Bad Request` using the standard error envelope:

```json
{
  "error": "unsupported_api_version",
  "code": "UNSUPPORTED_API_VERSION",
  "message": "Unsupported API version. Supported versions: v1.",
  "requestId": "b6f1a2d4-8c3e-4a1b-9f2e-6d5c7a8b9c0d",
  "details": {
    "requested": "v2",
    "supported": ["v1"],
    "current": "1.0.0"
  }
}
```

### 3. Response Headers

Every API response includes:

| Header          | Example | Meaning                                       |
| :-------------- | :------ | :-------------------------------------------- |
| `API-Version`   | `1.0.0` | Full semantic version of the API contract.    |
| `X-API-Version` | `v1`    | Resolved major API version serving the route. |

Both headers are exposed via CORS `Access-Control-Expose-Headers`.

## Deprecation & Sunset Policy

Endpoints or versions scheduled for removal follow a predictable lifecycle:

| Change Type                      | Minimum Notice Window | Mechanism                                                         |
| :------------------------------- | :-------------------- | :---------------------------------------------------------------- |
| Individual endpoint / alias      | **6 months (180 days)** | `Deprecation`, `Sunset`, and `Link` headers + changelog notice. |
| Full major API version (e.g. v1) | **12 months (365 days)** | Next major (`/v2`) runs in parallel + headers + migration guide. |
| Critical security vulnerability  | Immediate (as needed) | Coordinated security advisory (`SECURITY.md`) and release notes.  |

### Deprecation Response Headers

Deprecated routes emit standard IETF headers via
`deprecationHeaders("<policy-key>")` in `backend/src/middleware/deprecation.ts`:

- `Deprecation` (RFC 9745): HTTP-date when the endpoint was deprecated.
- `Sunset` (RFC 8594): HTTP-date after which the endpoint may be removed.
- `Link` (RFC 8288): `<replacement>; rel="deprecation"` pointing to the
  replacement path or migration guide.

### Adding a Deprecation

1. Register the policy in `API_DEPRECATIONS` in
   `backend/src/middleware/deprecation.ts` with `deprecatedAt`, `sunset` (must be
   strictly after `deprecatedAt`), and `replacement`.
2. Attach `deprecationHeaders("<key>")` to the deprecated route.
3. Add a test in `backend/src/middleware/__tests__/deprecation.test.ts`.
4. Document the deprecation date, sunset date, and migration path in
   `CHANGELOG.md`.

## Implementation Reference

- Version middleware and constants: `backend/src/middleware/api-version.ts`
- Deprecation registry and headers: `backend/src/middleware/deprecation.ts`
- Route mounting: `backend/src/index.ts`
- Tests: `backend/src/middleware/__tests__/api-version.test.ts` and
  `backend/src/middleware/__tests__/deprecation.test.ts`
