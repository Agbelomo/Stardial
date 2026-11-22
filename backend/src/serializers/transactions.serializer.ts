/**
 * Response contract for payout transactions (issue #21).
 *
 * `TransactionRecord` is a TypeORM entity: it is shaped by the database
 * schema, not by the API contract, and it is returned directly by the
 * transaction endpoints. Serializing through `transactionRecordSchema` keeps
 * the response limited to the documented fields, so a column added to the
 * entity (or any extra property a caller hands the route) cannot leak into a
 * public payload.
 */

import {
  transactionRecordSchema,
  type TransactionRecord,
} from "../schemas/transactions.schemas.js";
import { TRANSACTION_STATUSES } from "../entities/Transaction.js";
import { asRecord, pickEnum, pickNumber, pickString } from "./fields.js";

export function serializeTransactionRecord(value: unknown): TransactionRecord {
  const record = asRecord(value);
  return transactionRecordSchema.parse({
    id: pickString(record, ["id"]),
    roundId: pickString(record, ["roundId", "round_id"]),
    recipient: pickString(record, ["recipient"]),
    amount: pickString(record, ["amount"], "0"),
    token: pickString(record, ["token"]),
    timestamp: pickNumber(record, ["timestamp"]),
    txHash: pickString(record, ["txHash", "tx_hash"]),
    status: pickEnum(record.status, TRANSACTION_STATUSES, "pending"),
  });
}

export function serializeTransactionRecords(values: readonly unknown[]): TransactionRecord[] {
  return values.map(serializeTransactionRecord);
}
