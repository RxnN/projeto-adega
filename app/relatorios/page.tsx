import { requireRole, canAccessReportsFull } from "@/lib/auth";
import {
  getEstoqueAtual,
  getFaturamento,
  getFaturamentoPorProduto,
  getSugestaoCompra,
  getRankingRecorrencia,
  resolvePeriodo,
  type Periodo,
} from "@/lib/reports";
import EstoqueAtualTable from "@/components/relatorios/EstoqueAtualTable";
import FaturamentoSection from "@/components/relatorios/FaturamentoSection";
import SugestaoCompraTable from "@/components/relatorios/SugestaoCompraTable";
import RecorrenciaTable from "@/components/relatorios/RecorrenciaTable";
import PeriodoFilter from "@/components/relatorios/PeriodoFilter";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: { periodo?: string; from?: string; to?: string };
}) {
  const user = await requireRole(["OWNER", "MANAGER"]);
  const isOwner = canAccessReportsFull(user.role);

  // Gerente só pode ver o mês corrente; dono pode escolher qualquer período.
  const periodo: Periodo = isOwner ? ((searchParams.periodo as Periodo) || "mes") : "mes";
  const { from, to } = resolvePeriodo(periodo, searchParams.from, searchParams.to);

  const estoque = getEstoqueAtual(user.adegaId);
  const faturamento = getFaturamento(user.adegaId, from, to);
  const faturamentoPorProduto = getFaturamentoPorProduto(user.adegaId, from, to);

  const sugestaoCompra = isOwner ? getSugestaoCompra(user.adegaId) : null;
  const ranking = isOwner ? getRankingRecorrencia(user.adegaId, from, to) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-vinho-800">Relatórios</h1>
        <p className="text-gray-600 text-sm mt-1">
          {isOwner
            ? "Visão completa da adega: estoque, faturamento, sugestão de compra e produtos mais recorrentes."
            : "Visão gerencial: estoque atual e faturamento do mês corrente."}
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-vinho-800">Estoque atual</h2>
        <EstoqueAtualTable items={estoque} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-vinho-800">
            Faturamento e volume vendido {isOwner ? "" : "(mês corrente)"}
          </h2>
          {isOwner && <PeriodoFilter periodo={periodo} from={searchParams.from} to={searchParams.to} />}
        </div>
        <FaturamentoSection resumo={faturamento} porProduto={faturamentoPorProduto} from={from} to={to} />
      </section>

      {isOwner && sugestaoCompra && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-vinho-800">Sugestão de compra</h2>
          <p className="text-sm text-gray-600">
            Baseado no consumo médio diário (saídas dos últimos 30 dias) comparado ao estoque atual.
            Sugestão cobre a demanda média dos próximos 30 dias.
          </p>
          <SugestaoCompraTable items={sugestaoCompra} />
        </section>
      )}

      {isOwner && ranking && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-vinho-800">
            Produtos com maior recorrência de saída
          </h2>
          <p className="text-sm text-gray-600">
            Ranking por número de vezes que o produto saiu do estoque no período selecionado (frequência),
            não apenas pelo volume total.
          </p>
          <RecorrenciaTable items={ranking} />
        </section>
      )}
    </div>
  );
}
