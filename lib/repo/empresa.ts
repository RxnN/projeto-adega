import { prisma } from "../prisma";
import { createId } from "../id";
import type { Empresa } from "../types";
import { toIso } from "./shared";

export async function getEmpresaById(id: string): Promise<Empresa | undefined> {
  const empresa = await prisma.empresa.findUnique({ where: { id } });
  return empresa
    ? { ...empresa, paidUntil: empresa.paidUntil ? toIso(empresa.paidUntil) : null, createdAt: toIso(empresa.createdAt) }
    : undefined;
}

export async function createEmpresa(name: string, cnpjCpf: string): Promise<Empresa> {
  const empresa = await prisma.empresa.create({
    data: { id: createId("empresa"), name: name.trim(), cnpjCpf },
  });
  return { ...empresa, paidUntil: null, createdAt: toIso(empresa.createdAt) };
}
