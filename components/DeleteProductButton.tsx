"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Excluir o produto "${productName}"? Isso também removerá seu histórico de movimentações.`)) {
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/produtos/${productId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/produtos");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Não foi possível excluir o produto.");
      setLoading(false);
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="btn-danger">
      {loading ? "Excluindo..." : "Excluir"}
    </button>
  );
}
