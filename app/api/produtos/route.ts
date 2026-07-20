import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { canManageProducts } from "@/lib/auth";
import { createProduct, isBarcodeTaken } from "@/lib/repo";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!canManageProducts(user.role)) {
    return NextResponse.json({ error: "Você não tem permissão para cadastrar produtos." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });

  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "").trim();
  const unit = String(body.unit ?? "").trim();
  const costPrice = Number(body.costPrice);
  const salePrice = Number(body.salePrice);
  const currentStock = body.currentStock === undefined || body.currentStock === "" ? 0 : Number(body.currentStock);
  const minStockAlert =
    body.minStockAlert !== undefined && body.minStockAlert !== null && body.minStockAlert !== ""
      ? Number(body.minStockAlert)
      : null;
  const barcode = String(body.barcode ?? "").trim() || null;

  if (!name || !category || !unit) {
    return NextResponse.json({ error: "Preencha nome, categoria e unidade." }, { status: 400 });
  }
  if (Number.isNaN(costPrice) || Number.isNaN(salePrice) || costPrice < 0 || salePrice < 0) {
    return NextResponse.json({ error: "Preços inválidos." }, { status: 400 });
  }
  if (!Number.isInteger(currentStock) || currentStock < 0) {
    return NextResponse.json({ error: "Estoque inicial deve ser um número inteiro maior ou igual a zero." }, { status: 400 });
  }
  if (minStockAlert !== null && (!Number.isInteger(minStockAlert) || minStockAlert < 0)) {
    return NextResponse.json(
      { error: "Alerta de estoque mínimo deve ser um número inteiro maior ou igual a zero." },
      { status: 400 }
    );
  }
  if (barcode && isBarcodeTaken(barcode, user.adegaId)) {
    return NextResponse.json({ error: "Já existe um produto com esse código de barras." }, { status: 400 });
  }

  const product = createProduct({
    adegaId: user.adegaId,
    name,
    category,
    unit,
    costPrice,
    salePrice,
    currentStock,
    minStockAlert,
    barcode,
  });

  return NextResponse.json({ ok: true, product });
}
