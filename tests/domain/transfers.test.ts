import { describe, expect, it } from "vitest";
import { applyPartialAcceptance } from "../../src/lib/domain/transfers";

describe("transfers", () => {
  it("marks request partially filled when minutes remain", () => {
    expect(applyPartialAcceptance({ remainingMinutes: 180, acceptedMinutes: 60 })).toEqual({
      remainingMinutes: 120,
      status: "partially_filled",
    });
  });

  it("marks request filled when no minutes remain", () => {
    expect(applyPartialAcceptance({ remainingMinutes: 60, acceptedMinutes: 60 })).toEqual({
      remainingMinutes: 0,
      status: "filled",
    });
  });
});
