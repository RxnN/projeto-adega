// Script de seed do banco de dados de demonstração.
// Usa a camada de dados baseada em `node:sqlite` (lib/db.ts e lib/repo.ts),
// que segue exatamente o modelo de dados documentado em prisma/schema.prisma.
// Veja o README.md para detalhes sobre essa decisão técnica.

import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { getDb, createId } from "../lib/db";

function daysAgo(n: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, Math.floor(Math.random() * 60), 0, 0);
  return d.toISOString();
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  for (const suffix of ["", "-wal", "-shm"]) {
    const p = dbPath + suffix;
    if (fs.existsSync(p)) fs.rmSync(p);
  }

  const db = getDb();

  console.log("Criando adega...");
  const adegaId = createId("adega");
  db.prepare("INSERT INTO Adega (id, name) VALUES ($id, $name)").run({
    $id: adegaId,
    $name: "Adega do Renan",
  });

  console.log("Criando usuários...");
  const passwordHash = await bcrypt.hash("senha123", 10);

  function insertUser(name: string, email: string, role: string) {
    const id = createId("user");
    db.prepare(
      `INSERT INTO User (id, adegaId, name, email, passwordHash, role) VALUES ($id, $adegaId, $name, $email, $passwordHash, $role)`
    ).run({ $id: id, $adegaId: adegaId, $name: name, $email: email, $passwordHash: passwordHash, $role: role });
    return id;
  }

  const donoId = insertUser("Renan Fernandes", "dono@adega.com", "OWNER");
  const gerenteId = insertUser("Marina Souza", "gerente@adega.com", "MANAGER");
  const funcionarioId = insertUser("João Pereira", "funcionario@adega.com", "EMPLOYEE");
  const userIds = [donoId, gerenteId, funcionarioId];

  console.log("Criando produtos...");
  const productDefs = [
    { name: "Vinho Tinto Reserva Malbec", category: "Vinho Tinto", unit: "un", costPrice: 45.0, salePrice: 89.9, minStockAlert: 10, freq: 0.9 },
    { name: "Vinho Tinto Cabernet Sauvignon", category: "Vinho Tinto", unit: "un", costPrice: 38.0, salePrice: 74.9, minStockAlert: 10, freq: 0.85 },
    { name: "Vinho Branco Sauvignon Blanc", category: "Vinho Branco", unit: "un", costPrice: 32.0, salePrice: 64.9, minStockAlert: 8, freq: 0.6 },
    { name: "Vinho Branco Chardonnay", category: "Vinho Branco", unit: "un", costPrice: 40.0, salePrice: 79.9, minStockAlert: 8, freq: 0.5 },
    { name: "Espumante Brut Rosé", category: "Espumante", unit: "un", costPrice: 55.0, salePrice: 109.9, minStockAlert: 6, freq: 0.4 },
    { name: "Espumante Moscatel", category: "Espumante", unit: "un", costPrice: 28.0, salePrice: 54.9, minStockAlert: 12, freq: 0.7 },
    { name: "Whisky 12 Anos", category: "Whisky", unit: "un", costPrice: 120.0, salePrice: 219.9, minStockAlert: 5, freq: 0.3 },
    { name: "Whisky Single Malt", category: "Whisky", unit: "un", costPrice: 180.0, salePrice: 349.9, minStockAlert: 4, freq: 0.15 },
    { name: "Vinho Rosé Provence", category: "Vinho Rosé", unit: "un", costPrice: 42.0, salePrice: 84.9, minStockAlert: 6, freq: 0.35 },
    { name: "Licor de Cacau Artesanal", category: "Licor", unit: "un", costPrice: 25.0, salePrice: 49.9, minStockAlert: 8, freq: 0.25 },
  ];

  const products: { id: string; costPrice: number; salePrice: number; freq: number }[] = [];
  for (let i = 0; i < productDefs.length; i++) {
    const p = productDefs[i];
    const id = createId("prod");
    const code = String(i + 1).padStart(4, "0");
    db.prepare(
      `INSERT INTO Product (id, adegaId, code, name, category, unit, costPrice, salePrice, currentStock, minStockAlert)
       VALUES ($id, $adegaId, $code, $name, $category, $unit, $costPrice, $salePrice, 0, $minStockAlert)`
    ).run({
      $id: id,
      $adegaId: adegaId,
      $code: code,
      $name: p.name,
      $category: p.category,
      $unit: p.unit,
      $costPrice: p.costPrice,
      $salePrice: p.salePrice,
      $minStockAlert: p.minStockAlert,
    });
    products.push({ id, costPrice: p.costPrice, salePrice: p.salePrice, freq: p.freq });
  }

  function insertMovement(opts: {
    productId: string;
    type: "IN" | "OUT";
    quantity: number;
    unitValue: number;
    createdAt: string;
    createdByUserId: string;
    source: "MANUAL" | "QRCODE";
  }) {
    const id = createId("mov");
    db.prepare(
      `INSERT INTO Movement (id, adegaId, productId, type, quantity, unitValue, totalValue, createdAt, createdByUserId, source)
       VALUES ($id, $adegaId, $productId, $type, $quantity, $unitValue, $totalValue, $createdAt, $createdByUserId, $source)`
    ).run({
      $id: id,
      $adegaId: adegaId,
      $productId: opts.productId,
      $type: opts.type,
      $quantity: opts.quantity,
      $unitValue: opts.unitValue,
      $totalValue: opts.quantity * opts.unitValue,
      $createdAt: opts.createdAt,
      $createdByUserId: opts.createdByUserId,
      $source: opts.source,
    });
  }

  function addStock(productId: string, delta: number) {
    db.prepare("UPDATE Product SET currentStock = currentStock + $delta WHERE id = $id").run({
      $delta: delta,
      $id: productId,
    });
  }

  function getStock(productId: string): number {
    const row = db.prepare("SELECT currentStock FROM Product WHERE id = $id").get({ $id: productId }) as
      | { currentStock: number }
      | undefined;
    return row?.currentStock ?? 0;
  }

  console.log("Criando movimentações dos últimos 45 dias...");

  for (const product of products) {
    const qty = randInt(40, 80);
    insertMovement({
      productId: product.id,
      type: "IN",
      quantity: qty,
      unitValue: product.costPrice,
      createdAt: daysAgo(45, 8),
      createdByUserId: donoId,
      source: "MANUAL",
    });
    addStock(product.id, qty);
  }

  let movementCount = products.length;

  for (let day = 44; day >= 0; day--) {
    for (const product of products) {
      if (Math.random() < product.freq) {
        const qty = randInt(1, 5);
        const userId = userIds[randInt(0, userIds.length - 1)];
        const source = Math.random() < 0.4 ? "QRCODE" : "MANUAL";
        const current = getStock(product.id);
        const effectiveQty = Math.min(qty, current);
        if (effectiveQty > 0) {
          insertMovement({
            productId: product.id,
            type: "OUT",
            quantity: effectiveQty,
            unitValue: product.salePrice,
            createdAt: daysAgo(day, randInt(9, 20)),
            createdByUserId: userId,
            source,
          });
          addStock(product.id, -effectiveQty);
          movementCount++;
        }
      }

      if (day % 10 === 0 && Math.random() < 0.5) {
        const qty = randInt(10, 30);
        insertMovement({
          productId: product.id,
          type: "IN",
          quantity: qty,
          unitValue: product.costPrice,
          createdAt: daysAgo(day, randInt(7, 9)),
          createdByUserId: donoId,
          source: "MANUAL",
        });
        addStock(product.id, qty);
        movementCount++;
      }
    }
  }

  console.log(
    `Seed concluído: 1 adega, ${userIds.length} usuários, ${products.length} produtos, ${movementCount} movimentações.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
