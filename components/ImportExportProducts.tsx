"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

export default function ImportExportProducts({ canImport }: { canImport: boolean }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/produtos/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível importar a planilha.");
      } else {
        setResult(data);
        router.refresh();
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <a href="/api/produtos/export" className="btn-secondary">
          Exportar planilha
        </a>
        {canImport && (
          <>
            <button
              type="button"
              className="btn-secondary"
              disabled={importing}
              onClick={() => fileInputRef.current?.click()}
            >
              {importing ? "Importando..." : "Importar planilha"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>

      {error && <p className="text-sm text-red-600 max-w-xs text-right">{error}</p>}

      {result && (
        <div className="text-right">
          <p className="text-sm text-gray-600">
            {result.created} criado(s), {result.updated} atualizado(s)
            {result.errors.length > 0 ? `, ${result.errors.length} linha(s) com erro.` : "."}
          </p>
          {result.errors.length > 0 && (
            <ul className="text-xs text-red-600 list-disc list-inside max-w-xs text-left">
              {result.errors.slice(0, 10).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
