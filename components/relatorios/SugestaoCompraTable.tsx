import type { SugestaoCompraItem } from "@/lib/reports";

export default function SugestaoCompraTable({ items }: { items: SugestaoCompraItem[] }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="min-w-full text-sm">
        <thead className="bg-vinho-50 text-vinho-800">
          <tr>
            <th className="text-left px-4 py-2">Produto</th>
            <th className="text-right px-4 py-2">Estoque atual</th>
            <th className="text-right px-4 py-2">Consumo médio/dia (30d)</th>
            <th className="text-right px-4 py-2">Dias de estoque restante</th>
            <th className="text-right px-4 py-2">Sugestão de compra</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((i) => (
            <tr key={i.productId}>
              <td className="px-4 py-2 font-medium">{i.productName}</td>
              <td className="px-4 py-2 text-right">
                {i.currentStock} {i.unit}
              </td>
              <td className="px-4 py-2 text-right">{i.consumoMedioDiario}</td>
              <td className="px-4 py-2 text-right">
                {i.diasDeEstoqueRestante != null ? (
                  <span
                    className={i.diasDeEstoqueRestante <= 7 ? "text-red-600 font-semibold" : ""}
                  >
                    {i.diasDeEstoqueRestante} dias
                  </span>
                ) : (
                  "sem consumo recente"
                )}
              </td>
              <td className="px-4 py-2 text-right">
                {i.quantidadeSugerida > 0 ? (
                  <span className="font-semibold text-vinho-700">
                    {i.quantidadeSugerida} {i.unit}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
