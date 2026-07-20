import { requireUser } from "@/lib/auth";
import { listProducts, listPedidos } from "@/lib/repo";
import PedidoForm from "@/components/PedidoForm";
import HistoricoPedidos from "@/components/HistoricoPedidos";

export default async function EntradaPage() {
  const user = await requireUser();
  const products = listProducts(user.adegaId);
  const pedidos = listPedidos(user.adegaId, { type: "IN", limit: 20 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-vinho-800">Entrada</h1>
        <p className="text-gray-600 text-sm mt-1">
          Registre a chegada de mercadoria com múltiplos produtos de uma vez (ex: carga do fornecedor).
        </p>
      </div>

      <PedidoForm products={products} type="IN" />

      <div>
        <h2 className="text-lg font-semibold text-vinho-800 mb-3">Últimas entradas</h2>
        <HistoricoPedidos pedidos={pedidos} />
      </div>
    </div>
  );
}
