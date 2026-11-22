import { describe, expect, it } from "vitest";

import {
  projectDetailSchema,
  projectListResponseSchema,
  serializeProjectDetail,
  serializeProjectList,
  serializeProjectSummary,
} from "../projects.serializer.js";
import { serializeTransactionRecord } from "../transactions.serializer.js";

const onChainProject = {
  project_id: "afrobeats_001",
  title: "Afrobeats Vol. 1",
  project_type: "music",
  owner: "GBJRKIYXAAFD3NZCWJXGUTNKYUQFZC2ANS6LRMBPJCE4IZSMJJMZPQBT",
  token: "CDOVDY3MZDG7PHCGVP7EP2EKQ2ENV26DZW6FKLBRN42LOGIZGXZV3WX5",
  locked: false,
  total_distributed: 500n,
  distribution_round: 2,
  collaborators: [
    {
      address: "GCZTK3PNYXCVF7Z3ELVELEJZ7BVGPGPVJ3NVZNI7O6DVCHPA4JU6LXRV",
      alias: "Producer",
      basis_points: 6000,
      on_chain_extra: "must not be serialized",
    },
    {
      address: "GBG234UA6RBPDD5K6FHMQXHUXB5ALOENQGH24Y3W4ERX2YJNQ4MK4V25",
      alias: "Vocalist",
      basis_points: 4000,
    },
  ],
  // Internal fields a raw passthrough would have published.
  storage_key: "internal/ledger/afrobeats_001",
  balance: 250n,
  expires_at: "2027-01-01T00:00:00.000Z",
};

describe("project response serializers", () => {
  it("serializes a list item to the summary contract only", () => {
    const summary = serializeProjectSummary(onChainProject);

    expect(summary).toEqual({
      projectId: "afrobeats_001",
      title: "Afrobeats Vol. 1",
      projectType: "music",
      owner: onChainProject.owner,
      token: onChainProject.token,
      locked: false,
      totalDistributed: "500",
      distributionRound: 2,
    });
    // The large nested collaborator list and internal fields are dropped.
    expect(summary).not.toHaveProperty("collaborators");
    expect(summary).not.toHaveProperty("storage_key");
    expect(summary).not.toHaveProperty("project_id");
  });

  it("serializes the list envelope", () => {
    const body = serializeProjectList([onChainProject], 1, "next-page");

    expect(projectListResponseSchema.parse(body)).toEqual(body);
    expect(body.projects).toHaveLength(1);
    expect(body.total).toBe(1);
    expect(body.nextCursor).toBe("next-page");
  });

  it("serializes project detail with camelCase collaborators and no extra fields", () => {
    const detail = serializeProjectDetail(onChainProject, [
      {
        address: onChainProject.collaborators[0].address,
        alias: "Producer",
        basisPoints: 6000,
        status: "paid",
        roundId: "afrobeats_001",
        lastUpdated: 1_700_000_000,
      },
    ]);

    expect(projectDetailSchema.parse(detail)).toEqual(detail);
    expect(detail).toMatchObject({
      projectId: "afrobeats_001",
      balance: "250",
      expiresAt: "2027-01-01T00:00:00.000Z",
      collaborators: [
        { address: onChainProject.collaborators[0].address, alias: "Producer", basisPoints: 6000 },
        { address: onChainProject.collaborators[1].address, alias: "Vocalist", basisPoints: 4000 },
      ],
      participantPaymentStatuses: [
        {
          address: onChainProject.collaborators[0].address,
          alias: "Producer",
          basisPoints: 6000,
          status: "paid",
          roundId: "afrobeats_001",
          lastUpdated: 1_700_000_000,
        },
      ],
    });
    expect(detail).not.toHaveProperty("storage_key");
    expect(detail).not.toHaveProperty("collaborators.0.basis_points");
    expect(detail.collaborators[0]).not.toHaveProperty("on_chain_extra");
  });

  it("keeps participant payment statuses null when payout history is unavailable", () => {
    const detail = serializeProjectDetail({ project_id: "sparse" }, null);

    expect(detail.participantPaymentStatuses).toBeNull();
    expect(detail.expiresAt).toBeNull();
    expect(detail.balance).toBe("0");
  });

  it("normalizes an unrecognised participant status to unpaid", () => {
    const detail = serializeProjectDetail(onChainProject, [
      {
        address: "GCOLLAB",
        alias: null,
        basisPoints: 10_000,
        status: "mystery" as never,
        roundId: null,
        lastUpdated: Number.NaN,
      },
    ]);

    expect(detail.participantPaymentStatuses?.[0]).toEqual({
      address: "GCOLLAB",
      alias: null,
      basisPoints: 10_000,
      status: "unpaid",
      roundId: null,
      lastUpdated: null,
    });
  });
});

describe("transaction response serializer", () => {
  it("emits only the documented transaction fields", () => {
    const record = serializeTransactionRecord({
      id: "tx-1",
      roundId: "round-1",
      recipient: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      amount: "1000",
      token: "native",
      timestamp: 1_700_000_000,
      txHash: "a".repeat(64),
      status: "completed",
      // Entity/query-builder fields that must never reach the client.
      createdAt: new Date(),
      internalLedgerCursor: "cursor",
    });

    expect(record).toEqual({
      id: "tx-1",
      roundId: "round-1",
      recipient: "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
      amount: "1000",
      token: "native",
      timestamp: 1_700_000_000,
      txHash: "a".repeat(64),
      status: "completed",
    });
  });

  it("coerces snake_case and unknown statuses to the contract model", () => {
    const record = serializeTransactionRecord({
      id: "tx-2",
      round_id: "round-2",
      recipient: "GRECIPIENT",
      amount: "5",
      token: "native",
      timestamp: "1700000000",
      tx_hash: "b".repeat(64),
      status: "unexpected",
    });

    expect(record.roundId).toBe("round-2");
    expect(record.txHash).toBe("b".repeat(64));
    expect(record.timestamp).toBe(1_700_000_000);
    expect(record.status).toBe("pending");
  });
});
