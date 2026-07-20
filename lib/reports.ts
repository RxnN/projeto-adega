import { runAll, runGet } from "./db";
import type { Product } from "./types";

export interface EstoqueItem extends Product {
  valorEmEstoque: number;
}

export function getEstoqueAtual(adegaId: string): EstoqueItem[] {
  const products = runAll<Product>("SELECT * FROM Product WHERE adegaId = $adegaId ORDER BY name ASC", {
    $adegaId: adegaId,
  });
  return products.map((p) => ({ ...p, valorEmEstoque: p.currentStock * p.costPrice }));
}

export interface FaturamentoResumo {
  faturamento: number;
  volumeVendido: number;
  numeroSaidas: number;
}

export function getFaturamento(adegaId: string, from: Date, to: Date): FaturamentoResumo {
  const row = runGet<FaturamentoResumo>(
    `SELECT COALESCE(SUM(totalValue), 0) as faturamento,
            COALESCE(SUM(quantity), 0) as volumeVendido,
            COUNT(*) as numeroSaidas
     FROM Movement
     WHERE adegaId = $adegaId AND type = 'OUT' AND createdAt >= $from AND createdAt <= $to`,
    { $adegaId: adegaId, $from: from.toISOString(), $to: to.toISOString() }
  );
  return row ?? { faturamento: 0, volumeVendido: 0, numeroSaidas: 0 };
}

export interface FaturamentoPorProduto {
  productId: string;
  productName: string;
  unit: string;
  volumeVendido: number;
  faturamento: number;
}

export function getFaturamentoPorProduto(adegaId: string, from: Date, to: Date): FaturamentoPorProduto[] {
  return runAll<FaturamentoPorProduto>(
    `SELECT p.id as productId, p.name as productName, p.unit as unit,
            COALESCE(SUM(m.quantity), 0) as volumeVendido,
            COALESCE(SUM(m.totalValue), 0) as faturamento
     FROM Product p
     LEFT JOIN Movement m ON m.productId = p.id AND m.type = 'OUT'
       AND m.createdAt >= $from AND m.createdAt <= $to
     WHERE p.adegaId = $adegaId
     GROUP BY p.id
     ORDER BY faturamento DESC`,
    { $adegaId: adegaId, $from: from.toISOString(), $to: to.toISOString() }
  );
}

export interface SugestaoCompraItem {
  productId: string;
  productName: string;
  unit: string;
  currentStock: number;
  consumoMedioDiario: number;
  diasDeEstoqueRestante: number | null;
  quantidadeSugerida: number;
}

/** Consumo médio diário baseado nas saídas dos últimos 30 dias e sugestão de reposição
 * para cobrir os próximos 30 dias de demanda média, descontando o estoque atual. */
export function getSugestaoCompra(adegaId: string): SugestaoCompraItem[] {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const products = runAll<Product>("SELECT * FROM Product WHERE adegaId = $adegaId ORDER BY name ASC", {
    $adegaId: adegaId,
  });

  const consumption = runAll<{ productId: string; total: number }>(
    `SELECT productId, COALESCE(SUM(quantity), 0) as total
     FROM Movement
     WHERE adegaId = $adegaId AND type = 'OUT' AND createdAt >= $since
     GROUP BY productId`,
    { $adegaId: adegaId, $since: since.toISOString() }
  );

  const consumptionMap = new Map(consumption.map((c) => [c.productId, c.total]));

  return products.map((p) => {
    const total30d = consumptionMap.get(p.id) ?? 0;
    const consumoMedioDiario = total30d / 30;
    const diasDeEstoqueRestante = consumoMedioDiario > 0 ? p.currentStock / consumoMedioDiario : null;
    const demandaProximos30Dias = consumoMedioDiario * 30;
    const quantidadeSugerida = Math.max(0, Math.ceil(demandaProximos30Dias - p.currentStock));
    return {
      productId: p.id,
      productName: p.name,
      unit: p.unit,
      currentStock: p.currentStock,
      consumoMedioDiario: Number(consumoMedioDiario.toFixed(2)),
      diasDeEstoqueRestante: diasDeEstoqueRestante != null ? Number(diasDeEstoqueRestante.toFixed(1)) : null,
      quantidadeSugerida,
    };
  });
}

export interface RecorrenciaItem {
  productId: string;
  productName: string;
  unit: string;
  numeroSaidas: number;
  volumeTotal: number;
}

/** Ranking de produtos por número de movimentações de saída (frequência), não apenas volume. */
export function getRankingRecorrencia(adegaId: string, from: Date, to: Date): RecorrenciaItem[] {
  return runAll<RecorrenciaItem>(
    `SELECT p.id as productId, p.name as productName, p.unit as unit,
            COUNT(m.id) as numeroSaidas,
            COALESCE(SUM(m.quantity), 0) as volumeTotal
     FROM Product p
     JOIN Movement m ON m.productId = p.id AND m.type = 'OUT'
       AND m.createdAt >= $from AND m.createdAt <= $to
     WHERE p.adegaId = $adegaId
     GROUP BY p.id
     ORDER BY numeroSaidas DESC
     LIMIT 20`,
    { $adegaId: adegaId, $from: from.toISOString(), $to: to.toISOString() }
  );
}

export type Periodo = "dia" | "semana" | "mes" | "customizado";

export function resolvePeriodo(periodo: Periodo, customFrom?: string, customTo?: string): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);

  if (periodo === "customizado" && customFrom && customTo) {
    const from = new Date(customFrom + "T00:00:00");
    const toCustom = new Date(customTo + "T23:59:59");
    return { from, to: toCustom };
  }

  const from = new Date(now);
  if (periodo === "dia") {
    from.setHours(0, 0, 0, 0);
  } else if (periodo === "semana") {
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
  } else {
    // mes: mês corrente
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  }
  return { from, to };
}
