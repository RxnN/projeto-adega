import { prisma } from "../prisma";
import { createId } from "../id";
import type { Filial } from "../types";
import { toIso } from "./shared";

export async function listFiliais(empresaId: string): Promise<Filial[]> {
  const filiais = await prisma.filial.findMany({ where: { empresaId }, orderBy: { createdAt: "asc" } });
  return filiais.map((f) => ({ ...f, createdAt: toIso(f.createdAt) }));
}

export async function getFilialById(id: string, empresaId: string): Promise<Filial | undefined> {
  const filial = await prisma.filial.findFirst({ where: { id, empresaId } });
  return filial ? { ...filial, createdAt: toIso(filial.createdAt) } : undefined;
}

export async function createFilial(empresaId: string, name: string): Promise<Filial> {
  const filial = await prisma.filial.create({
    data: { id: createId("filial"), empresaId, name: name.trim() },
  });
  return { ...filial, createdAt: toIso(filial.createdAt) };
}
