import { requireUser, canCancelPedidos } from "@/lib/auth";
import { listProducts, listPedidos } from "@/lib/repo";
import { getCurrentFilialId } from "@/lib/filial-context";
import PedidoForm from "@/components/PedidoForm";
import HistoricoPedidos from "@/components/HistoricoPedidos";
import PageHeader from "@/components/PageHeader";

export default async function EntradaPage() {
  const user = await requireUser();
  const filialId = await getCurrentFilialId(user);
  const [products, pedidos] = await Promise.all([listProducts(filialId, { activeOnly: true }), listPedidos(filialId, { type: "IN", limit: 20 })]);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Abastecimento" title="Entrada" description="Registre a chegada de mercadorias com múltiplos produtos de uma vez." />
      <PedidoForm products={products} type="IN" userRole={user.role} />
      <section className="space-y-4 pt-6 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="section-heading"><h2>Últimas entradas</h2></div>
        <HistoricoPedidos pedidos={pedidos} canManage={canCancelPedidos(user.role)} />
      </section>
    </div>
  );
}
