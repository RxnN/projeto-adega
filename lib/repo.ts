import { createId, getDb, runAll, runExec, runGet } from "./db";
import type {
  Adega,
  User,
  Product,
  Pedido,
  PedidoItem,
  PedidoWithItems,
  Role,
  MovementType,
  MovementSource,
} from "./types";

// ---------- Adega ----------

export function getAdegaById(id: string): Adega | undefined {
  return runGet<Adega>("SELECT * FROM Adega WHERE id = $id", { $id: id });
}

// ---------- User ----------

export function getUserByEmail(email: string): User | undefined {
  return runGet<User>("SELECT * FROM User WHERE email = $email", { $email: email });
}

export function getUserById(id: string): User | undefined {
  return runGet<User>("SELECT * FROM User WHERE id = $id", { $id: id });
}

export function listUsersByAdega(adegaId: string): User[] {
  return runAll<User>("SELECT * FROM User WHERE adegaId = $adegaId ORDER BY createdAt ASC", {
    $adegaId: adegaId,
  });
}

export function createUser(input: {
  adegaId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}): User {
  const id = createId("user");
  runExec(
    `INSERT INTO User (id, adegaId, name, email, passwordHash, role)
     VALUES ($id, $adegaId, $name, $email, $passwordHash, $role)`,
    {
      $id: id,
      $adegaId: input.adegaId,
      $name: input.name,
      $email: input.email,
      $passwordHash: input.passwordHash,
      $role: input.role,
    }
  );
  return getUserById(id)!;
}

// ---------- Product ----------

export function listProducts(adegaId: string): Product[] {
  return runAll<Product>("SELECT * FROM Product WHERE adegaId = $adegaId ORDER BY name ASC", {
    $adegaId: adegaId,
  });
}

export function getProductById(id: string, adegaId: string): Product | undefined {
  return runGet<Product>("SELECT * FROM Product WHERE id = $id AND adegaId = $adegaId", {
    $id: id,
    $adegaId: adegaId,
  });
}

/** Busca um produto pelo código sequencial (aceita variações sem zeros à esquerda). */
export function getProductByCode(code: string, adegaId: string): Product | undefined {
  const trimmed = code.trim();
  let product = runGet<Product>("SELECT * FROM Product WHERE adegaId = $adegaId AND code = $code", {
    $adegaId: adegaId,
    $code: trimmed,
  });
  if (!product && /^\d+$/.test(trimmed)) {
    const padded = trimmed.padStart(4, "0");
    product = runGet<Product>("SELECT * FROM Product WHERE adegaId = $adegaId AND code = $code", {
      $adegaId: adegaId,
      $code: padded,
    });
  }
  return product;
}

export function getProductByBarcode(barcode: string, adegaId: string): Product | undefined {
  return runGet<Product>("SELECT * FROM Product WHERE adegaId = $adegaId AND barcode = $barcode", {
    $adegaId: adegaId,
    $barcode: barcode.trim(),
  });
}

export function isBarcodeTaken(barcode: string, adegaId: string, excludeId?: string): boolean {
  const row = runGet<{ id: string }>(
    `SELECT id FROM Product WHERE adegaId = $adegaId AND barcode = $barcode` +
      (excludeId ? " AND id != $excludeId" : ""),
    excludeId
      ? { $adegaId: adegaId, $barcode: barcode.trim(), $excludeId: excludeId }
      : { $adegaId: adegaId, $barcode: barcode.trim() }
  );
  return Boolean(row);
}

function nextProductCode(adegaId: string): string {
  const row = runGet<{ maxCode: number | null }>(
    "SELECT MAX(CAST(code AS INTEGER)) as maxCode FROM Product WHERE adegaId = $adegaId",
    { $adegaId: adegaId }
  );
  const next = (row?.maxCode ?? 0) + 1;
  return String(next).padStart(4, "0");
}

export function createProduct(input: {
  adegaId: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  currentStock: number;
  minStockAlert: number | null;
  barcode: string | null;
  packageType: PackageType | null;
  unitsPerPackage: number | null;
}): Product {
  const id = createId("prod");
  const code = nextProductCode(input.adegaId);
  runExec(
    `INSERT INTO Product (id, adegaId, code, barcode, name, category, unit, costPrice, salePrice, currentStock, minStockAlert, packageType, unitsPerPackage)
     VALUES ($id, $adegaId, $code, $barcode, $name, $category, $unit, $costPrice, $salePrice, $currentStock, $minStockAlert, $packageType, $unitsPerPackage)`,
    {
      $id: id,
      $adegaId: input.adegaId,
      $code: code,
      $barcode: input.barcode,
      $name: input.name,
      $category: input.category,
      $unit: input.unit,
      $costPrice: input.costPrice,
      $salePrice: input.salePrice,
      $currentStock: input.currentStock,
      $minStockAlert: input.minStockAlert,
      $packageType: input.packageType,
      $unitsPerPackage: input.unitsPerPackage,
    }
  );
  return getProductById(id, input.adegaId)!;
}

export function updateProduct(
  id: string,
  adegaId: string,
  input: {
    name: string;
    category: string;
    unit: string;
    costPrice: number;
    salePrice: number;
    minStockAlert: number | null;
    barcode: string | null;
    packageType: PackageType | null;
    unitsPerPackage: number | null;
  }
): Product | undefined {
  runExec(
    `UPDATE Product SET name = $name, category = $category, unit = $unit,
       costPrice = $costPrice, salePrice = $salePrice, minStockAlert = $minStockAlert, barcode = $barcode,
       packageType = $packageType, unitsPerPackage = $unitsPerPackage
     WHERE id = $id AND adegaId = $adegaId`,
    {
      $id: id,
      $adegaId: adegaId,
      $name: input.name,
      $category: input.category,
      $unit: input.unit,
      $costPrice: input.costPrice,
      $salePrice: input.salePrice,
      $minStockAlert: input.minStockAlert,
      $barcode: input.barcode,
      $packageType: input.packageType,
      $unitsPerPackage: input.unitsPerPackage,
    }
  );
  return getProductById(id, adegaId);
}

export function deleteProduct(id: string, adegaId: string): void {
  runExec("DELETE FROM Movement WHERE productId = $id AND adegaId = $adegaId", {
    $id: id,
    $adegaId: adegaId,
  });
  runExec("DELETE FROM Product WHERE id = $id AND adegaId = $adegaId", {
    $id: id,
    $adegaId: adegaId,
  });
}

// ---------- Pedido ----------

function nextPedidoNumber(adegaId: string, type: MovementType): number {
  const row = runGet<{ maxNumber: number | null }>(
    "SELECT MAX(number) as maxNumber FROM Pedido WHERE adegaId = $adegaId AND type = $type",
    { $adegaId: adegaId, $type: type }
  );
  return (row?.maxNumber ?? 0) + 1;
}

export interface PedidoItemInput {
  productId: string;
  quantity: number;
  unitValue: number;
  source: MovementSource;
}

/** Verifica quais itens de um pedido de saída excedem o estoque atual (para aviso antes de forçar o fechamento).
 * Não se aplica a pedidos de entrada, que sempre aumentam o estoque. */
export function checkPedidoStock(
  adegaId: string,
  items: { productId: string; quantity: number }[]
): { productId: string; productName: string; unit: string; available: number; requested: number }[] {
  const insufficient: { productId: string; productName: string; unit: string; available: number; requested: number }[] =
    [];
  for (const item of items) {
    const product = getProductById(item.productId, adegaId);
    if (product && product.currentStock - item.quantity < 0) {
      insufficient.push({
        productId: product.id,
        productName: product.name,
        unit: product.unit,
        available: product.currentStock,
        requested: item.quantity,
      });
    }
  }
  return insufficient;
}

/** Fecha um pedido (entrada ou saída): cria o registro de Pedido, uma Movement por item e
 * ajusta o estoque de cada produto, tudo em uma única transação (tudo ou nada). */
export function createPedido(input: {
  adegaId: string;
  type: MovementType;
  createdByUserId: string;
  items: PedidoItemInput[];
}): PedidoWithItems {
  const db = getDb();
  const pedidoId = createId("pedido");
  const number = nextPedidoNumber(input.adegaId, input.type);
  const totalValue = input.items.reduce((sum, it) => sum + it.quantity * it.unitValue, 0);
  const stockSign = input.type === "IN" ? 1 : -1;

  db.exec("BEGIN");
  try {
    db.prepare(
      `INSERT INTO Pedido (id, adegaId, type, number, totalValue, createdByUserId)
       VALUES ($id, $adegaId, $type, $number, $totalValue, $createdByUserId)`
    ).run({
      $id: pedidoId,
      $adegaId: input.adegaId,
      $type: input.type,
      $number: number,
      $totalValue: totalValue,
      $createdByUserId: input.createdByUserId,
    } as never);

    for (const item of input.items) {
      const movementId = createId("mov");
      const itemTotal = item.quantity * item.unitValue;
      db.prepare(
        `INSERT INTO Movement (id, adegaId, productId, type, quantity, unitValue, totalValue, createdByUserId, source, pedidoId)
         VALUES ($id, $adegaId, $productId, $type, $quantity, $unitValue, $totalValue, $createdByUserId, $source, $pedidoId)`
      ).run({
        $id: movementId,
        $adegaId: input.adegaId,
        $productId: item.productId,
        $type: input.type,
        $quantity: item.quantity,
        $unitValue: item.unitValue,
        $totalValue: itemTotal,
        $createdByUserId: input.createdByUserId,
        $source: item.source,
        $pedidoId: pedidoId,
      } as never);
      db.prepare(
        `UPDATE Product SET currentStock = currentStock + $delta WHERE id = $id AND adegaId = $adegaId`
      ).run({ $delta: stockSign * item.quantity, $id: item.productId, $adegaId: input.adegaId } as never);
    }
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  return getPedidoById(pedidoId, input.adegaId)!;
}

function attachPedidoItems(pedido: Pedido & { createdByName: string }): PedidoWithItems {
  const items = runAll<PedidoItem>(
    `SELECT m.id, m.productId, p.name as productName, p.unit as productUnit, m.quantity, m.unitValue, m.totalValue
     FROM Movement m JOIN Product p ON p.id = m.productId
     WHERE m.pedidoId = $pedidoId ORDER BY m.createdAt ASC`,
    { $pedidoId: pedido.id }
  );
  return { ...pedido, items };
}

export function getPedidoById(id: string, adegaId: string): PedidoWithItems | undefined {
  const pedido = runGet<Pedido & { createdByName: string }>(
    `SELECT ped.*, u.name as createdByName FROM Pedido ped
     JOIN User u ON u.id = ped.createdByUserId
     WHERE ped.id = $id AND ped.adegaId = $adegaId`,
    { $id: id, $adegaId: adegaId }
  );
  return pedido ? attachPedidoItems(pedido) : undefined;
}

export function listPedidos(
  adegaId: string,
  opts: { type?: MovementType; from?: Date; to?: Date; limit?: number } = {}
): PedidoWithItems[] {
  let sql = `
    SELECT ped.*, u.name as createdByName
    FROM Pedido ped
    JOIN User u ON u.id = ped.createdByUserId
    WHERE ped.adegaId = $adegaId
  `;
  const params: Record<string, string | number> = { $adegaId: adegaId };
  if (opts.type) {
    sql += " AND ped.type = $type";
    params.$type = opts.type;
  }
  if (opts.from) {
    sql += " AND ped.createdAt >= $from";
    params.$from = opts.from.toISOString();
  }
  if (opts.to) {
    sql += " AND ped.createdAt <= $to";
    params.$to = opts.to.toISOString();
  }
  sql += " ORDER BY ped.createdAt DESC";
  if (opts.limit) {
    sql += " LIMIT $limit";
    params.$limit = opts.limit;
  }
  const pedidos = runAll<Pedido & { createdByName: string }>(sql, params);
  return pedidos.map(attachPedidoItems);
}
