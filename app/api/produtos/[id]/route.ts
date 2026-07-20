import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { canManageProducts } from "@/lib/auth";
import { deleteProduct, getProductById, isBarcodeTaken, updateProduct } from "@/lib/repo";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!canManageProducts(user.role)) {
    return NextResponse.json({ error: "Você não tem permissão para editar produtos." }, { status: 403 });
  }

  const existing = getProductById(params.id, user.adegaId);
  if (!existing) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });

  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "").trim();
  const unit = String(body.unit ?? "").trim();
  const costPrice = Number(body.costPrice);
  const salePrice = Number(body.salePrice);
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
  if (minStockAlert !== null && (!Number.isInteger(minStockAlert) || minStockAlert < 0)) {
    return NextResponse.json(
      { error: "Alerta de estoque mínimo deve ser um número inteiro maior ou igual a zero." },
      { status: 400 }
    );
  }
  if (barcode && isBarcodeTaken(barcode, user.adegaId, params.id)) {
    return NextResponse.json({ error: "Já existe um produto com esse código de barras." }, { status: 400 });
  }

  const product = updateProduct(params.id, user.adegaId, {
    name,
    category,
    unit,
    costPrice,
    salePrice,
    minStockAlert,
    barcode,
  });

  return NextResponse.json({ ok: true, product });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!canManageProducts(user.role)) {
    return NextResponse.json({ error: "Você não tem permissão para excluir produtos." }, { status: 403 });
  }

  const existing = getProductById(params.id, user.adegaId);
  if (!existing) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  deleteProduct(params.id, user.adegaId);
  return NextResponse.json({ ok: true });
}
