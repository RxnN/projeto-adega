import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { requireUser, canManageProducts } from "@/lib/auth";
import { getProductById } from "@/lib/repo";
import DeleteProductButton from "@/components/DeleteProductButton";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function ProdutoDetalhePage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const product = getProductById(params.id, user.adegaId);
  if (!product) notFound();

  const canManage = canManageProducts(user.role);
  const qrDataUrl = await QRCode.toDataURL(product.id, { width: 280, margin: 2 });

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-vinho-800">{product.name}</h1>
          <p className="text-gray-600 text-sm">{product.category}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/produtos" className="btn-secondary">
            Voltar
          </Link>
          {canManage && (
            <>
              <Link href={`/produtos/${product.id}/editar`} className="btn-secondary">
                Editar
              </Link>
              <DeleteProductButton productId={product.id} productName={product.name} />
            </>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="card space-y-3">
          <h2 className="font-semibold text-vinho-800">Dados do produto</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-500">Unidade</dt>
              <dd>{product.unit}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Estoque atual</dt>
              <dd className="font-medium">
                {product.currentStock} {product.unit}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Preço de custo</dt>
              <dd>{formatBRL(product.costPrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Preço de venda</dt>
              <dd>{formatBRL(product.salePrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Alerta de estoque mínimo</dt>
              <dd>{product.minStockAlert != null ? `${product.minStockAlert} ${product.unit}` : "-"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Código</dt>
              <dd className="font-mono text-xs">{product.code}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Código de barras</dt>
              <dd className="font-mono text-xs">{product.barcode ?? "-"}</dd>
            </div>
          </dl>
        </div>

        <div className="card space-y-3 text-center">
          <h2 className="font-semibold text-vinho-800">QR Code do produto</h2>
          <p className="text-xs text-gray-500">
            Use este código para identificar o produto rapidamente na tela de Movimentação (saída).
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrDataUrl}
            alt={`QR Code do produto ${product.name}`}
            className="mx-auto border border-gray-200 rounded-md"
            width={220}
            height={220}
          />
          <a
            href={qrDataUrl}
            download={`qrcode-${product.name.replace(/\s+/g, "-").toLowerCase()}.png`}
            className="btn-secondary inline-block"
          >
            Baixar / Imprimir QR Code
          </a>
        </div>
      </div>
    </div>
  );
}
