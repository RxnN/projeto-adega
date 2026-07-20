import type { FaturamentoPorProduto, FaturamentoResumo } from "@/lib/reports";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR");
}

export default function FaturamentoSection({
  resumo,
  porProduto,
  from,
  to,
}: {
  resumo: FaturamentoResumo;
  porProduto: FaturamentoPorProduto[];
  from: Date;
  to: Date;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Período: {formatDate(from)} até {formatDate(to)}
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Faturamento</p>
          <p className="text-2xl font-bold text-vinho-800">{formatBRL(resumo.faturamento)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Volume vendido</p>
          <p className="text-2xl font-bold text-vinho-800">{resumo.volumeVendido}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Nº de vendas (saídas)</p>
          <p className="text-2xl font-bold text-vinho-800">{resumo.numeroSaidas}</p>
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-vinho-50 text-vinho-800">
            <tr>
              <th className="text-left px-4 py-2">Produto</th>
              <th className="text-right px-4 py-2">Volume vendido</th>
              <th className="text-right px-4 py-2">Faturamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {porProduto
              .filter((p) => p.volumeVendido > 0)
              .map((p) => (
                <tr key={p.productId}>
                  <td className="px-4 py-2 font-medium">{p.productName}</td>
                  <td className="px-4 py-2 text-right">
                    {p.volumeVendido} {p.unit}
                  </td>
                  <td className="px-4 py-2 text-right">{formatBRL(p.faturamento)}</td>
                </tr>
              ))}
            {porProduto.every((p) => p.volumeVendido === 0) && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                  Nenhuma venda registrada neste período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
