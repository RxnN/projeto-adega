import { describe, expect, it } from "vitest";
import { getSubscriptionStatus, isSubscriptionExpired } from "@/lib/auth";
import { getEmpresaById } from "@/lib/repo";
import { prisma } from "@/lib/prisma";
import { seedFixture } from "./helpers";

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

describe("getSubscriptionStatus", () => {
  it("sem paidUntil, não é considerado vencido nem prestes a vencer", () => {
    const status = getSubscriptionStatus({ paidUntil: null });
    expect(status).toEqual({ expired: false, daysRemaining: null, expiringSoon: false });
  });

  it("vencimento distante não avisa", () => {
    const status = getSubscriptionStatus({ paidUntil: daysFromNow(20) });
    expect(status.expired).toBe(false);
    expect(status.expiringSoon).toBe(false);
    expect(status.daysRemaining).toBeGreaterThan(5);
  });

  it("vencimento em 3 dias avisa (expiringSoon)", () => {
    const status = getSubscriptionStatus({ paidUntil: daysFromNow(3) });
    expect(status.expired).toBe(false);
    expect(status.expiringSoon).toBe(true);
    expect(status.daysRemaining).toBe(3);
  });

  it("data no passado é considerada vencida", () => {
    const status = getSubscriptionStatus({ paidUntil: daysFromNow(-2) });
    expect(status.expired).toBe(true);
    expect(status.expiringSoon).toBe(false);
  });
});

describe("isSubscriptionExpired", () => {
  it("false quando não há paidUntil", () => {
    expect(isSubscriptionExpired({ paidUntil: null })).toBe(false);
  });

  it("false quando paidUntil está no futuro", () => {
    expect(isSubscriptionExpired({ paidUntil: daysFromNow(1) })).toBe(false);
  });

  it("true quando paidUntil já passou", () => {
    expect(isSubscriptionExpired({ paidUntil: daysFromNow(-1) })).toBe(true);
  });
});

describe("Empresa.paidUntil (integração)", () => {
  it("nasce nula e reflete o valor aprovado via getEmpresaById", async () => {
    const { empresa } = await seedFixture();
    expect((await getEmpresaById(empresa.id))?.paidUntil).toBeNull();

    const until = new Date(daysFromNow(30));
    await prisma.empresa.update({ where: { id: empresa.id }, data: { approved: true, paidUntil: until } });

    const reloaded = await getEmpresaById(empresa.id);
    expect(reloaded?.approved).toBe(true);
    expect(new Date(reloaded!.paidUntil!).getTime()).toBe(until.getTime());
  });
});
