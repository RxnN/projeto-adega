import type { EstoqueItem } from "@/lib/reports";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function EstoqueAtualTable({ items }: { items: EstoqueItem[] }) {
  const totalValor = items.reduce((acc, i) => acc + i.valorEmEstoque, 0);

  return (
    <div className="card overflow-x-auto p-0">
      <table className="min-w-full text-sm">
        <thead className="bg-vinho-50 text-vinho-800">
          <tr>
            <th className="text-left px-4 py-2">Produto</th>
            <th className="text-left px-4 py-2">Categoria</th>
            <th className="text-right px-4 py-2">Quantidade</th>
            <th className="text-right px-4 py-2">Valor em estoque (custo)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((i) => (
            <tr key={i.id}>
              <td className="px-4 py-2 font-medium">{i.name}</td>
              <td className="px-4 py-2 text-gray-600">{i.category}</td>
              <td className="px-4 py-2 text-right">
                <span
                  className={
                    i.minStockAlert != null && i.currentStock <= i.minStockAlert
                      ? "text-amber-700 font-semibold"
                      : ""
                  }
                >
                  {i.currentStock} {i.unit}
                </span>
              </td>
              <td className="px-4 py-2 text-right">{formatBRL(i.valorEmEstoque)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-semibold">
            <td className="px-4 py-2" colSpan={3}>
              Total em estoque (valor de custo)
            </td>
            <td className="px-4 py-2 text-right">{formatBRL(totalValor)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
