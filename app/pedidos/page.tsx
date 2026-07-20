import { requireUser } from "@/lib/auth";
import { listProducts, listPedidos } from "@/lib/repo";
import PedidoForm from "@/components/PedidoForm";
import HistoricoPedidos from "@/components/HistoricoPedidos";

export default async function PedidosPage() {
  const user = await requireUser();
  const products = listProducts(user.adegaId);
  const pedidos = listPedidos(user.adegaId, { type: "OUT", limit: 20 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-vinho-800">Pedidos</h1>
        <p className="text-gray-600 text-sm mt-1">
          Monte pedidos de venda com múltiplos produtos e feche tudo de uma vez.
        </p>
      </div>

      <PedidoForm products={products} type="OUT" />

      <div>
        <h2 className="text-lg font-semibold text-vinho-800 mb-3">Últimos pedidos</h2>
        <HistoricoPedidos pedidos={pedidos} />
      </div>
    </div>
  );
}
