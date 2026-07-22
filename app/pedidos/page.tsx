import { requireUser, canCancelPedidos } from "@/lib/auth";
import { listProducts, listPedidos, listPromotionsByFilial } from "@/lib/repo";
import { getCurrentFilialId } from "@/lib/filial-context";
import PedidoForm from "@/components/PedidoForm";
import HistoricoPedidos from "@/components/HistoricoPedidos";
import PageHeader from "@/components/PageHeader";

export default async function PedidosPage() {
  const user = await requireUser();
  const filialId = await getCurrentFilialId(user);
  const [products, pedidos, promotions] = await Promise.all([
    listProducts(filialId, { activeOnly: true }),
    listPedidos(filialId, { type: "OUT", limit: 20 }),
    listPromotionsByFilial(filialId),
  ]);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Operação de venda" title="Pedidos" description="Monte pedidos de venda com múltiplos produtos e feche tudo de uma vez." />
      <PedidoForm products={products} type="OUT" userRole={user.role} promotions={promotions} />
      <section className="space-y-4 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="section-heading"><h2>Últimos pedidos</h2></div>
        <HistoricoPedidos pedidos={pedidos} canManage={canCancelPedidos(user.role)} />
      </section>
    </div>
  );
}
