import { afterAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { createEmpresa, createFilial, createProduct, createUser } from "@/lib/repo";
import type { Filial, Product } from "@/lib/types";

// Os testes rodam contra o mesmo Postgres (Neon) usado em desenvolvimento, mas
// cada teste cria sua própria Empresa isolada (nunca toca nos dados reais/seed),
// e tudo o que foi criado é apagado ao final do arquivo de teste.
const createdEmpresaIds: string[] = [];
let emailCounter = 0;

afterAll(async () => {
  for (const empresaId of createdEmpresaIds) {
    await prisma.movement.deleteMany({ where: { empresaId } });
    await prisma.pedido.deleteMany({ where: { empresaId } });
    await prisma.promotion.deleteMany({ where: { empresaId } });
    await prisma.product.deleteMany({ where: { empresaId } });
    await prisma.counter.deleteMany({ where: { filial: { empresaId } } });
    await prisma.user.deleteMany({ where: { empresaId } });
    await prisma.filial.deleteMany({ where: { empresaId } });
    await prisma.empresa.deleteMany({ where: { id: empresaId } });
  }
  await prisma.$disconnect();
});

export async function seedFixture() {
  const empresa = await createEmpresa(`Empresa de Teste ${Math.random().toString(36).slice(2)}`, "12345678901");
  createdEmpresaIds.push(empresa.id);
  const filial = await createFilial(empresa.id, "Matriz");
  const user = await createUser({
    empresaId: empresa.id,
    name: "Usuário de Teste",
    email: `teste-${emailCounter++}-${Date.now()}@example.com`,
    passwordHash: "hash-fake",
    role: "OWNER",
  });
  return { empresa, filial, user };
}

export async function seedProduct(
  filial: Pick<Filial, "id" | "empresaId">,
  overrides: Partial<Parameters<typeof createProduct>[0]> = {}
): Promise<Product> {
  return createProduct({
    empresaId: filial.empresaId,
    filialId: filial.id,
    name: overrides.name ?? "Produto de Teste",
    category: overrides.category ?? "Categoria",
    unit: overrides.unit ?? "un",
    costPrice: overrides.costPrice ?? 10,
    salePrice: overrides.salePrice ?? 20,
    currentStock: overrides.currentStock ?? 0,
    minStockAlert: overrides.minStockAlert ?? null,
    barcode: overrides.barcode ?? null,
    packageType: overrides.packageType ?? null,
    unitsPerPackage: overrides.unitsPerPackage ?? null,
  });
}
