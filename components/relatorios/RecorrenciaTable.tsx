import type { RecorrenciaItem } from "@/lib/reports";

export default function RecorrenciaTable({ items }: { items: RecorrenciaItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-gray-500">Sem dados de saída no período selecionado.</p>;
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="min-w-full text-sm">
        <thead className="bg-vinho-50 text-vinho-800">
          <tr>
            <th className="text-left px-4 py-2">#</th>
            <th className="text-left px-4 py-2">Produto</th>
            <th className="text-right px-4 py-2">Nº de saídas registradas</th>
            <th className="text-right px-4 py-2">Volume total vendido</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((i, idx) => (
            <tr key={i.productId}>
              <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
              <td className="px-4 py-2 font-medium">{i.productName}</td>
              <td className="px-4 py-2 text-right font-semibold text-vinho-700">{i.numeroSaidas}</td>
              <td className="px-4 py-2 text-right">
                {i.volumeTotal} {i.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
