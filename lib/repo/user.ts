import { prisma } from "../prisma";
import { createId } from "../id";
import type { Role, User } from "../types";
import { toIso } from "./shared";

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({ where: { email } });
  return user ? { ...user, role: user.role as Role, createdAt: toIso(user.createdAt) } : undefined;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? { ...user, role: user.role as Role, createdAt: toIso(user.createdAt) } : undefined;
}

export async function listUsersByEmpresa(empresaId: string): Promise<User[]> {
  const users = await prisma.user.findMany({ where: { empresaId }, orderBy: { createdAt: "asc" } });
  return users.map((u) => ({ ...u, role: u.role as Role, createdAt: toIso(u.createdAt) }));
}

export async function createUser(input: {
  empresaId: string;
  name: string;
  phone?: string;
  email: string;
  passwordHash: string;
  role: Role;
}): Promise<User> {
  const user = await prisma.user.create({
    data: {
      id: createId("user"),
      empresaId: input.empresaId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
    },
  });
  return { ...user, role: user.role as Role, createdAt: toIso(user.createdAt) };
}
