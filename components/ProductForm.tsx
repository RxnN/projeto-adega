"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";

const CATEGORIAS_SUGERIDAS = [
  "Vinho Tinto",
  "Vinho Branco",
  "Vinho Rosé",
  "Espumante",
  "Whisky",
  "Licor",
  "Vodka",
  "Gin",
  "Cerveja Especial",
];

export default function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [unit, setUnit] = useState(product?.unit ?? "un");
  const [barcode, setBarcode] = useState(product?.barcode ?? "");
  const [costPrice, setCostPrice] = useState(String(product?.costPrice ?? ""));
  const [salePrice, setSalePrice] = useState(String(product?.salePrice ?? ""));
  const [currentStock, setCurrentStock] = useState(String(product?.currentStock ?? "0"));
  const [minStockAlert, setMinStockAlert] = useState(
    product?.minStockAlert != null ? String(product.minStockAlert) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /** Aceita apenas dígitos inteiros; qualquer outro caractere (ponto, vírgula, sinal) é ignorado. */
  function handleIntegerInput(setter: (v: string) => void, raw: string) {
    if (raw === "" || /^\d+$/.test(raw)) setter(raw);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      name,
      category,
      unit,
      costPrice: Number(costPrice),
      salePrice: Number(salePrice),
      currentStock: currentStock === "" ? 0 : Number(currentStock),
      minStockAlert: minStockAlert === "" ? null : Number(minStockAlert),
      barcode: barcode.trim() === "" ? null : barcode.trim(),
    };

    try {
      const res = await fetch(isEdit ? `/api/produtos/${product!.id}` : "/api/produtos", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível salvar o produto.");
        setLoading(false);
        return;
      }
      const id = isEdit ? product!.id : data.product.id;
      router.push(`/produtos/${id}`);
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card grid sm:grid-cols-2 gap-4 max-w-2xl">
      <div className="sm:col-span-2">
        <label className="label">Nome do produto</label>
        <input required className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {isEdit && (
        <div>
          <label className="label">Código</label>
          <input disabled className="input bg-gray-50 text-gray-500" value={product!.code} />
        </div>
      )}

      <div>
        <label className="label">Código de barras (opcional)</label>
        <input
          className="input"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Ex: código EAN ou do fornecedor"
        />
      </div>

      <div>
        <label className="label">Categoria</label>
        <input
          required
          list="categorias"
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <datalist id="categorias">
          {CATEGORIAS_SUGERIDAS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div>
        <label className="label">Unidade (un, L, ml...)</label>
        <input required className="input" value={unit} onChange={(e) => setUnit(e.target.value)} />
      </div>

      <div>
        <label className="label">Preço de custo (R$)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          required
          className="input"
          value={costPrice}
          onChange={(e) => setCostPrice(e.target.value)}
        />
      </div>

      <div>
        <label className="label">Preço de venda (R$)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          required
          className="input"
          value={salePrice}
          onChange={(e) => setSalePrice(e.target.value)}
        />
      </div>

      {!isEdit && (
        <div>
          <label className="label">Estoque inicial</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            className="input"
            value={currentStock}
            onChange={(e) => handleIntegerInput(setCurrentStock, e.target.value)}
          />
        </div>
      )}

      <div>
        <label className="label">Alerta de estoque mínimo (opcional)</label>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className="input"
          value={minStockAlert}
          onChange={(e) => handleIntegerInput(setMinStockAlert, e.target.value)}
        />
      </div>

      {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}

      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Cadastrar produto"}
        </button>
      </div>
    </form>
  );
}
