import { requirePermission } from "@/lib/auth";
import { listProducts, listPromotionsByFilial } from "@/lib/repo";
import { getCurrentFilialId } from "@/lib/filial-context";
import PromocaoForm from "@/components/PromocaoForm";
import PromocoesList from "@/components/PromocoesList";
import PageHeader from "@/components/PageHeader";

export default async function PromocoesPage() {
  const user = await requirePermission("MANAGE_PROMOTIONS");
  const filialId = await getCurrentFilialId(user);
  const [products, promotions] = await Promise.all([
    listProducts(filialId, { activeOnly: true }),
    listPromotionsByFilial(filialId),
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader eyebrow="Preço e giro" title="Promoções" description="Crie descontos por produto e quantidade mínima para esta filial." />

      <div className="card space-y-3">
        <h2 className="font-semibold">Promoções cadastradas</h2>
        <PromocoesList promotions={promotions} products={products} />
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Nova promoção</h2>
        <PromocaoForm products={products} />
      </div>
    </div>
  );
}
