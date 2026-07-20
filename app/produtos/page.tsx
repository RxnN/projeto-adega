import Link from "next/link";
import { requireUser, canManageProducts } from "@/lib/auth";
import { listProducts } from "@/lib/repo";
import ImportExportProducts from "@/components/ImportExportProducts";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ProdutosPage() {
  const user = await requireUser();
  const products = listProducts(user.adegaId);
  const canManage = canManageProducts(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-vinho-800">Produtos</h1>
          <p className="text-gray-600 text-sm mt-1">
            {canManage
              ? "Cadastro e edição de produtos do estoque."
              : "Consulta de produtos cadastrados (somente leitura)."}
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <ImportExportProducts canImport={canManage} />
          {canManage && (
            <Link href="/produtos/novo" className="btn-primary">
              + Novo produto
            </Link>
          )}
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="min-w-full text-sm">
          <thead className="bg-vinho-50 text-vinho-800">
            <tr>
              <th className="text-left px-4 py-2">Código</th>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2">Categoria</th>
              <th className="text-right px-4 py-2">Estoque</th>
              <th className="text-right px-4 py-2">Custo</th>
              <th className="text-right px-4 py-2">Venda</th>
              <th className="text-left px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2 font-mono text-xs text-gray-500">{p.code}</td>
                <td className="px-4 py-2 font-medium">{p.name}</td>
                <td className="px-4 py-2 text-gray-600">{p.category}</td>
                <td className="px-4 py-2 text-right">
                  <span
                    className={
                      p.minStockAlert != null && p.currentStock <= p.minStockAlert
                        ? "text-amber-700 font-semibold"
                        : ""
                    }
                  >
                    {p.currentStock} {p.unit}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">{formatBRL(p.costPrice)}</td>
                <td className="px-4 py-2 text-right">{formatBRL(p.salePrice)}</td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/produtos/${p.id}`} className="text-vinho-700 hover:underline">
                    Ver / QR Code
                  </Link>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                  Nenhum produto cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
