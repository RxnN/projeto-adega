import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { checkPedidoStock, createPedido, getProductById } from "@/lib/repo";
import type { PedidoItemInput } from "@/lib/repo";
import type { MovementSource, MovementType } from "@/lib/types";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  // Todos os papéis (OWNER, MANAGER, EMPLOYEE) podem fechar pedidos.

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });

  const type = body.type === "IN" ? "IN" : body.type === "OUT" ? "OUT" : null;
  if (!type) {
    return NextResponse.json({ error: "Tipo de pedido inválido." }, { status: 400 });
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const force = Boolean(body.force);

  if (rawItems.length === 0) {
    return NextResponse.json({ error: "Adicione ao menos um produto ao pedido." }, { status: 400 });
  }

  const items: PedidoItemInput[] = [];
  for (const raw of rawItems) {
    const productId = String(raw.productId ?? "");
    const quantity = Number(raw.quantity);
    const source = (raw.source === "QRCODE" ? "QRCODE" : "MANUAL") as MovementSource;

    if (!productId) {
      return NextResponse.json({ error: "Item do pedido sem produto selecionado." }, { status: 400 });
    }
    if (!quantity || quantity <= 0 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { error: "A quantidade deve ser um número inteiro maior que zero." },
        { status: 400 }
      );
    }

    const product = getProductById(productId, user.adegaId);
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado nesta adega." }, { status: 404 });
    }

    const unitValueRaw = raw.unitValue;
    const defaultUnitValue = type === "IN" ? product.costPrice : product.salePrice;
    const unitValue =
      unitValueRaw !== null && unitValueRaw !== undefined && unitValueRaw !== "" && !Number.isNaN(Number(unitValueRaw))
        ? Number(unitValueRaw)
        : defaultUnitValue;

    items.push({ productId, quantity, unitValue, source });
  }

  if (type === "OUT" && !force) {
    const insufficient = checkPedidoStock(
      user.adegaId,
      items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
    );
    if (insufficient.length > 0) {
      const details = insufficient
        .map((i) => `${i.productName} (disponível: ${i.available} ${i.unit}, pedido: ${i.requested} ${i.unit})`)
        .join("; ");
      return NextResponse.json(
        {
          warning: `Estoque insuficiente para: ${details}. Confirme para fechar o pedido mesmo assim (estoque ficará negativo).`,
          insufficient,
        },
        { status: 409 }
      );
    }
  }

  const pedido = createPedido({
    adegaId: user.adegaId,
    type: type as MovementType,
    createdByUserId: user.userId,
    items,
  });

  return NextResponse.json({ ok: true, pedido });
}
