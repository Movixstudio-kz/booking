import { describe, expect, it } from "vitest";
import { defaultOrganizations } from "@/features/organizations/data";
import { StaticOrganizationRepository } from "@/features/organizations/repositories";
import { publicBookingContext } from "@/repositories";

describe("StaticOrganizationRepository", () => {
  const repository = new StaticOrganizationRepository(defaultOrganizations);

  it("finds the public organization by slug", async () => {
    const result = await repository.getBySlug(
      publicBookingContext,
      "karo-beauty",
    );

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.name).toBe("KARO Beauty");
  });

  it("does not expose an organization to another tenant", async () => {
    const result = await repository.list({
      ...publicBookingContext,
      organizationId: "another-organization",
    });

    expect(result).toEqual({ ok: true, data: [] });
  });
});
