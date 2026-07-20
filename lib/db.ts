import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

// Camada de acesso a dados usando o módulo nativo `node:sqlite` do Node.js.
// O modelo de dados segue exatamente o schema documentado em prisma/schema.prisma.
// (Ver nota nesse arquivo sobre por que o Prisma Client não é usado em runtime
// neste protótipo.)

const DB_PATH = process.env.DATABASE_FILE || path.join(process.cwd(), "prisma", "dev.db");

const globalForDb = globalThis as unknown as { __adegasDb?: DatabaseSync };

function createId(prefix = "c") {
  return `${prefix}_${crypto.randomBytes(12).toString("hex")}`;
}

function openDb(): DatabaseSync {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__adegasDb) {
    globalForDb.__adegasDb = openDb();
    initSchema(globalForDb.__adegasDb);
    migrateProductCodeColumns(globalForDb.__adegasDb);
    migrateMovementPedidoColumn(globalForDb.__adegasDb);
    migratePedidoTypeColumn(globalForDb.__adegasDb);
    migrateProductPackageColumns(globalForDb.__adegasDb);
  }
  return globalForDb.__adegasDb;
}

/** Migração para bancos criados antes da introdução de embalagem (CX/PCT) em Product. */
function migrateProductPackageColumns(db: DatabaseSync) {
  const columns = db.prepare("PRAGMA table_info(Product)").all() as { name: string }[];
  const hasPackageType = columns.some((c) => c.name === "packageType");
  const hasUnitsPerPackage = columns.some((c) => c.name === "unitsPerPackage");
  if (!hasPackageType) {
    db.exec("ALTER TABLE Product ADD COLUMN packageType TEXT;");
  }
  if (!hasUnitsPerPackage) {
    db.exec("ALTER TABLE Product ADD COLUMN unitsPerPackage INTEGER;");
  }
}

/** Migração para bancos criados antes da introdução de Pedido.type (entradas em lote).
 * Pedidos já existentes eram sempre de saída, então recebem type = 'OUT'. */
function migratePedidoTypeColumn(db: DatabaseSync) {
  const columns = db.prepare("PRAGMA table_info(Pedido)").all() as { name: string }[];
  const hasType = columns.some((c) => c.name === "type");
  if (!hasType) {
    db.exec("ALTER TABLE Pedido ADD COLUMN type TEXT NOT NULL DEFAULT 'OUT';");
    db.exec("DROP INDEX IF EXISTS idx_pedido_number;");
    db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_pedido_number ON Pedido(adegaId, type, number);");
  }
}

/** Migração para bancos criados antes da introdução de Pedido/pedidoId. */
function migrateMovementPedidoColumn(db: DatabaseSync) {
  const columns = db.prepare("PRAGMA table_info(Movement)").all() as { name: string }[];
  const hasPedidoId = columns.some((c) => c.name === "pedidoId");
  if (!hasPedidoId) {
    db.exec("ALTER TABLE Movement ADD COLUMN pedidoId TEXT REFERENCES Pedido(id);");
  }
  db.exec("CREATE INDEX IF NOT EXISTS idx_movement_pedido ON Movement(pedidoId);");
}

/** Migração para bancos criados antes da introdução de `code`/`barcode` em Product:
 * adiciona as colunas se ainda não existirem e preenche `code` com uma sequência
 * por adega (0001, 0002...), na ordem de criação dos produtos. */
function migrateProductCodeColumns(db: DatabaseSync) {
  const columns = db.prepare("PRAGMA table_info(Product)").all() as { name: string }[];
  const hasCode = columns.some((c) => c.name === "code");
  const hasBarcode = columns.some((c) => c.name === "barcode");

  if (!hasCode) {
    db.exec("ALTER TABLE Product ADD COLUMN code TEXT;");
    const products = db
      .prepare("SELECT id, adegaId FROM Product ORDER BY adegaId ASC, createdAt ASC, rowid ASC")
      .all() as { id: string; adegaId: string }[];
    const counters = new Map<string, number>();
    const update = db.prepare("UPDATE Product SET code = ? WHERE id = ?");
    for (const p of products) {
      const next = (counters.get(p.adegaId) ?? 0) + 1;
      counters.set(p.adegaId, next);
      update.run(String(next).padStart(4, "0"), p.id);
    }
  }

  if (!hasBarcode) {
    db.exec("ALTER TABLE Product ADD COLUMN barcode TEXT;");
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_product_code ON Product(adegaId, code);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_product_barcode ON Product(adegaId, barcode) WHERE barcode IS NOT NULL;
  `);
}

export function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Adega (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      adegaId TEXT NOT NULL REFERENCES Adega(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('OWNER','MANAGER','EMPLOYEE')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS Product (
      id TEXT PRIMARY KEY,
      adegaId TEXT NOT NULL REFERENCES Adega(id),
      code TEXT NOT NULL DEFAULT '',
      barcode TEXT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      unit TEXT NOT NULL,
      costPrice REAL NOT NULL,
      salePrice REAL NOT NULL,
      currentStock REAL NOT NULL DEFAULT 0,
      minStockAlert REAL,
      packageType TEXT CHECK (packageType IN ('CX','PCT')),
      unitsPerPackage INTEGER,
      createdAt TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_product_adega ON Product(adegaId);

    CREATE TABLE IF NOT EXISTS Pedido (
      id TEXT PRIMARY KEY,
      adegaId TEXT NOT NULL REFERENCES Adega(id),
      type TEXT NOT NULL DEFAULT 'OUT' CHECK (type IN ('IN','OUT')),
      number INTEGER NOT NULL,
      totalValue REAL NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      createdByUserId TEXT NOT NULL REFERENCES User(id)
    );
    CREATE INDEX IF NOT EXISTS idx_pedido_adega ON Pedido(adegaId);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pedido_number ON Pedido(adegaId, type, number);

    CREATE TABLE IF NOT EXISTS Movement (
      id TEXT PRIMARY KEY,
      adegaId TEXT NOT NULL REFERENCES Adega(id),
      productId TEXT NOT NULL REFERENCES Product(id),
      type TEXT NOT NULL CHECK (type IN ('IN','OUT')),
      quantity REAL NOT NULL,
      unitValue REAL NOT NULL,
      totalValue REAL NOT NULL,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      createdByUserId TEXT NOT NULL REFERENCES User(id),
      source TEXT NOT NULL DEFAULT 'MANUAL' CHECK (source IN ('MANUAL','QRCODE')),
      pedidoId TEXT REFERENCES Pedido(id)
    );
    CREATE INDEX IF NOT EXISTS idx_movement_adega ON Movement(adegaId);
    CREATE INDEX IF NOT EXISTS idx_movement_product ON Movement(productId);
    CREATE INDEX IF NOT EXISTS idx_movement_createdAt ON Movement(createdAt);
  `);
}

export { createId };

/** node:sqlite retorna objetos com protótipo nulo, o que quebra a serialização
 * de Server Components para Client Components do Next.js. Estas funções
 * auxiliares convertem o resultado para objetos JS "planos" comuns. */
export function runGet<T = Record<string, unknown>>(
  sql: string,
  params: Record<string, string | number | null> = {}
): T | undefined {
  const db = getDb();
  const row = db.prepare(sql).get(params as never) as Record<string, unknown> | undefined;
  return row ? ({ ...row } as T) : undefined;
}

export function runAll<T = Record<string, unknown>>(
  sql: string,
  params: Record<string, string | number | null> = {}
): T[] {
  const db = getDb();
  const rows = db.prepare(sql).all(params as never) as Record<string, unknown>[];
  return rows.map((r) => ({ ...r })) as T[];
}

export function runExec(sql: string, params: Record<string, string | number | null> = {}) {
  const db = getDb();
  return db.prepare(sql).run(params as never);
}
