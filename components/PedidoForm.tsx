"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { MovementType, Product } from "@/lib/types";

const QrScanner = dynamic(() => import("./QrScanner"), { ssr: false });

interface CartItem {
  productId: string;
  name: string;
  unit: string;
  category: string;
  quantity: number;
  unitValue: number;
  source: "MANUAL" | "QRCODE";
}

interface InsufficientItem {
  productId: string;
  productName: string;
  unit: string;
  available: number;
  requested: number;
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PedidoForm({ products, type }: { products: Product[]; type: MovementType }) {
  const router = useRouter();
  const isEntrada = type === "IN";
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [insufficient, setInsufficient] = useState<InsufficientItem[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const total = useMemo(() => cart.reduce((sum, item) => sum + item.quantity * item.unitValue, 0), [cart]);

  function resetMessages() {
    setError(null);
    setWarning(null);
    setInsufficient([]);
    setSuccess(null);
  }

  function addToCart(product: Product, source: "MANUAL" | "QRCODE") {
    resetMessages();
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1, source } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          unit: product.unit,
          category: product.category,
          quantity: 1,
          unitValue: isEntrada ? product.costPrice : product.salePrice,
          source,
        },
      ];
    });
  }

  function handleAddSelected() {
    const product = products.find((p) => p.id === selectedProductId);
    if (!product) return;
    addToCart(product, "MANUAL");
    setSelectedProductId("");
  }

  function handleScanResult(code: string) {
    setShowScanner(false);
    fetch(`/api/product-lookup?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.product) {
          addToCart(data.product, "QRCODE");
        } else {
          setError(data.error ?? "Produto não encontrado para o código lido.");
        }
      })
      .catch(() => setError("Erro ao consultar produto escaneado."));
  }

  /** Aceita apenas dígitos inteiros; qualquer outro caractere (ponto, vírgula, sinal) é ignorado. */
  function handleQuantityInput(productId: string, raw: string) {
    if (raw !== "" && !/^\d+$/.test(raw)) return;
    const quantity = raw === "" ? 0 : Number(raw);
    setCart((prev) => prev.map((item) => (item.productId === productId ? { ...item, quantity } : item)));
  }

  function updateUnitValue(productId: string, unitValue: number) {
    setCart((prev) => prev.map((item) => (item.productId === productId ? { ...item, unitValue } : item)));
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }

  async function closePedido(force = false) {
    setLoading(true);
    resetMessages();
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitValue: item.unitValue,
            source: item.source,
          })),
          force,
        }),
      });
      const data = await res.json();

      if (res.status === 409 && data.warning) {
        setWarning(data.warning);
        setInsufficient(data.insufficient ?? []);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "Não foi possível fechar o pedido.");
        setLoading(false);
        return;
      }

      setSuccess(
        `Pedido de ${isEntrada ? "entrada" : "saída"} #${data.pedido.number} fechado com sucesso. Total: ${formatBRL(
          data.pedido.totalValue
        )}.`
      );
      setCart([]);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) {
      setError("Adicione ao menos um produto ao pedido.");
      return;
    }
    if (cart.some((item) => !item.quantity || item.quantity <= 0)) {
      setError("Informe uma quantidade válida para todos os itens.");
      return;
    }
    closePedido(false);
  }

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[220px]">
          <label className="label">
            Adicionar produto ao pedido de {isEntrada ? "entrada" : "saída"}
          </label>
          <select
            className="input"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">Selecione um produto...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — estoque: {p.currentStock} {p.unit}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn-secondary" disabled={!selectedProductId} onClick={handleAddSelected}>
          + Adicionar
        </button>
        <button type="button" className="btn-secondary" onClick={() => setShowScanner((v) => !v)}>
          {showScanner ? "Ocultar câmera" : "📷 Escanear"}
        </button>
      </div>

      {showScanner && <QrScanner onResult={handleScanResult} onClose={() => setShowScanner(false)} />}

      {cart.length === 0 ? (
        <p className="text-sm text-gray-500">
          Nenhum produto no pedido de {isEntrada ? "entrada" : "saída"} ainda. Adicione produtos acima.
        </p>
      ) : (
        <div className="overflow-x-auto -mx-2">
          <table className="min-w-full text-sm">
            <thead className="text-vinho-800">
              <tr>
                <th className="text-left px-2 py-1">Produto</th>
                <th className="text-right px-2 py-1 w-24">Qtde</th>
                <th className="text-right px-2 py-1 w-32">Valor unit. (R$)</th>
                <th className="text-right px-2 py-1 w-28">Subtotal</th>
                <th className="px-2 py-1"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cart.map((item) => (
                <tr key={item.productId}>
                  <td className="px-2 py-1.5">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.category}
                      {item.source === "QRCODE" && (
                        <span className="ml-2 text-vinho-700 font-medium">(QR Code)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="input text-right w-20 inline-block"
                      value={item.quantity === 0 ? "" : item.quantity}
                      onChange={(e) => handleQuantityInput(item.productId, e.target.value)}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input text-right w-24 inline-block"
                      value={item.unitValue}
                      onChange={(e) => updateUnitValue(item.productId, Number(e.target.value))}
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right font-medium">
                    {formatBRL(item.quantity * item.unitValue)}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-red-600 hover:underline text-xs"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-sm text-gray-600">Total do pedido</span>
        <span className="text-xl font-bold text-vinho-800">{formatBRL(total)}</span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">{success}</p>}
      {warning && (
        <div className="bg-amber-50 border border-amber-300 rounded-md p-3 space-y-2">
          <p className="text-sm text-amber-800">{warning}</p>
          {insufficient.length > 0 && (
            <ul className="text-xs text-amber-800 list-disc list-inside">
              {insufficient.map((i) => (
                <li key={i.productId}>
                  {i.productName}: disponível {i.available} {i.unit}, pedido {i.requested} {i.unit}
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => closePedido(true)} className="btn-danger" disabled={loading}>
            Confirmar mesmo assim
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <button type="submit" disabled={loading || cart.length === 0} className="btn-primary w-full sm:w-auto">
          {loading ? "Fechando pedido..." : `Fechar pedido de ${isEntrada ? "entrada" : "saída"}`}
        </button>
      </form>
    </div>
  );
}
