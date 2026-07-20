import { requireUser } from "@/lib/auth";
import { listPedidos } from "@/lib/repo";
import MovimentacoesToggle from "@/components/MovimentacoesToggle";

export default async function MovimentacaoPage() {
  const user = await requireUser();
  const saidas = listPedidos(user.adegaId, { type: "OUT", limit: 50 });
  const entradas = listPedidos(user.adegaId, { type: "IN", limit: 50 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-vinho-800">Movimentações</h1>
        <p className="text-gray-600 text-sm mt-1">
          Consulte o histórico completo de pedidos de saída e entrada. Clique em um pedido para ver os itens.
        </p>
      </div>

      <MovimentacoesToggle saidas={saidas} entradas={entradas} />
    </div>
  );
}
