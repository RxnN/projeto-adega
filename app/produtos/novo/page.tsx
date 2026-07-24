import { requirePermission } from "@/lib/auth";
import ProductForm from "@/components/ProductForm";

export default async function NovoProdutoPage() {
  await requirePermission("MANAGE_PRODUCTS");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Novo produto</h1>
      <ProductForm />
    </div>
  );
}
