# Request body validation contract

Every request that carries a body is checked against a Zod schema before any
handler, cache, database write or contract simulation runs. This is the
contract behind issue #15 ("Missing request body schema validation").

## Rules

1. **A write body is a JSON object.** `POST`, `PUT` and `PATCH` requests that
   send a body must send a JSON object. A top-level array or scalar is rejected
   by the app-wide `requireJsonObjectBody` guard (`middleware/validate.ts`)
   before routing:

   ```json
   {
     "error": "validation_error",
     "code": "VALIDATION_ERROR",
     "message": "Request body must be a JSON object.",
     "requestId": "…",
     "details": {}
   }
   ```

2. **Contracts are strict.** Request schemas are declared with `.strict()`, so
   unknown top-level fields are rejected instead of silently dropped, and
   nested objects (for example each collaborator in `POST /splits`) are strict
   too. Legacy or spoofed fields (`actor`, `currentOwner`, `inviterWalletAddress`,
   `financial`, …) therefore produce `400 VALIDATION_ERROR`; they are never
   read as authoritative input.

3. **Types, required fields and nested values are validated together.** A
   malformed body never reaches storage: address formats, integer basis points,
   basis-point totals, duplicate collaborators, datetimes, enums and array
   bounds are all enforced by the schema. Transforms (for example text
   sanitising) run only after the shape is accepted.

4. **One error envelope.** Shape failures reach the central error handler and
   return the shared envelope with `code: "VALIDATION_ERROR"` and
   `details.fieldErrors` / `details.formErrors` describing the failing fields.
   Route-specific validation keeps its extension fields but uses the same
   status and correlation id.

## Where the schemas live

| Area | Schema module |
| --- | --- |
| Splits, admin, claims | `backend/src/schemas/splits.ts` |
| Users and profiles | `backend/src/schemas/user.schemas.ts` |
| Ops backfill | `backend/src/schemas/admin.schemas.ts` |
| Auth, invitations, notifications, collaboration | defined next to their routers |

## Adding a route

Define the body schema with `.strict()` and parse it before doing any work:

```ts
const body = myBodySchema.parse(req.body);
```

or mount the shared middleware, which also rejects non-object bodies:

```ts
router.post("/things", validateRequest({ body: myBodySchema }), handler);
```

Never read a field from `req.body` without a schema; add the field to the
schema instead. `backend/src/__tests__/request-body-validation.test.ts` covers
the guard, the strict contracts and representative routes.
