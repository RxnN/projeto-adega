"use client";

import type { PackageType } from "@/lib/types";
import { formatBRL } from "@/lib/format";

/** Shape de apresentação de uma linha do carrinho — todo cálculo (subtotal, quantidade
 * base, se está com preço promocional) já vem pronto do PedidoForm; este componente só
 * exibe e repassa eventos de edição, sem decidir nenhuma regra. */
export interface CartRowView {
  productId: string;
  name: string;
  category: string;
  packageType: PackageType | null;
  unitsPerPackage: number | null;
  mode: "UNIT" | "PACKAGE";
  displayQty: number;
  unitValue: number;
  baseQty: number;
  subtotal: number;
  isPromo: boolean;
}

const TRASH_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function PedidoCartTable({
  rows,
  canEditPrice,
  emptyMessage,
  onQuantityChange,
  onModeChange,
  onUnitValueChange,
  onRemove,
}: {
  rows: CartRowView[];
  canEditPrice: boolean;
  emptyMessage: string;
  onQuantityChange: (productId: string, raw: string) => void;
  onModeChange: (productId: string, mode: "UNIT" | "PACKAGE") => void;
  onUnitValueChange: (productId: string, value: number) => void;
  onRemove: (productId: string) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="panel text-center border-dashed" style={{ padding: "2.5rem 1.5rem" }}>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="panel data-card overflow-hidden">
      {/* Desktop / tablet: tabela compacta — larguras aproximadas via style (Produto
          maior coluna, Ação com largura fixa mínima), alturas controladas via inline
          style nos inputs pra não depender da ordem de cascata com .input. */}
      <table className="hidden md:table w-full text-sm table-fixed data-table">
        <colgroup>
          <col style={{ width: "37%" }} />
          <col style={{ width: "17%" }} />
          <col style={{ width: "25%" }} />
          <col style={{ width: "17%" }} />
          <col style={{ width: "44px" }} />
        </colgroup>
        <thead>
          <tr style={{ color: "var(--ink-soft)", backgroundColor: "var(--surface-2)" }}>
            <th
              className="text-left px-4 py-3 font-semibold uppercase text-xs tracking-wide"
              style={{ width: "37%" }}
            >
              Produto
            </th>
            <th
              className="text-center px-2 py-3 font-semibold uppercase text-xs tracking-wide"
              style={{ width: "17%" }}
            >
              Qtd
            </th>
            <th
              className="text-right px-2 py-3 font-semibold uppercase text-xs tracking-wide"
              style={{ width: "25%" }}
            >
              Valor unitário
            </th>
            <th
              className="text-right px-4 py-3 font-semibold uppercase text-xs tracking-wide"
              style={{ width: "17%" }}
            >
              Subtotal
            </th>
            <th className="px-1 py-3" style={{ width: "44px" }}>
              <span className="sr-only">Ação</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
          {rows.map((row) => (
            <tr key={row.productId}>
              <td className="px-4 py-3.5 align-top">
                <p className="font-semibold leading-tight">{row.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>
                  {row.category}
                </p>
                {row.isPromo && (
                  <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--ok)" }}>
                    🏷 preço promocional aplicado
                  </p>
                )}
              </td>
              <td className="px-2 py-3.5 align-top text-center">
                <div className="flex flex-col items-center gap-1">
                  {row.packageType && (
                    <select
                      className="input text-xs w-full"
                      style={{ height: "2.25rem" }}
                      value={row.mode}
                      onChange={(e) => onModeChange(row.productId, e.target.value as "UNIT" | "PACKAGE")}
                    >
                      <option value="UNIT">UNID</option>
                      <option value="PACKAGE">
                        {row.packageType} ({row.unitsPerPackage} un)
                      </option>
                    </select>
                  )}
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="input text-center tabular"
                    style={{ height: "2.25rem", width: "3.25rem" }}
                    value={row.displayQty === 0 ? "" : row.displayQty}
                    onChange={(e) => onQuantityChange(row.productId, e.target.value)}
                  />
                  {row.mode === "PACKAGE" && row.unitsPerPackage && (
                    <span className="text-xs" style={{ color: "var(--ink-soft)" }}>
                      = {row.baseQty} un
                    </span>
                  )}
                </div>
              </td>
              <td className="px-2 py-3.5 align-top text-right">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!canEditPrice}
                  title={canEditPrice ? undefined : "Só dono ou gerente pode alterar o preço de venda"}
                  className="input text-right tabular disabled:opacity-60 ml-auto"
                  style={{ height: "2.25rem", width: "6rem" }}
                  value={row.unitValue}
                  onChange={(e) => onUnitValueChange(row.productId, Number(e.target.value))}
                />
              </td>
              <td className="px-4 py-3.5 align-top text-right font-semibold tabular">{formatBRL(row.subtotal)}</td>
              <td className="px-1 py-3.5 text-center">
                <button
                  type="button"
                  onClick={() => onRemove(row.productId)}
                  aria-label={`Remover ${row.name} do pedido`}
                  title={`Remover ${row.name}`}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-[var(--surface-2)]"
                  style={{ color: "var(--danger)" }}
                >
                  {TRASH_ICON}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: cards preservando as mesmas informações da tabela */}
      <ul className="md:hidden divide-y" style={{ borderColor: "var(--border)" }}>
        {rows.map((row) => (
          <li key={row.productId} className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{row.name}</p>
                <p className="text-xs truncate" style={{ color: "var(--ink-soft)" }}>
                  {row.category}
                </p>
                {row.isPromo && (
                  <p className="text-xs font-semibold mt-1" style={{ color: "var(--ok)" }}>
                    🏷 preço promocional aplicado
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(row.productId)}
                aria-label={`Remover ${row.name} do pedido`}
                title={`Remover ${row.name}`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: "var(--danger)" }}
              >
                {TRASH_ICON}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>
                  Qtd
                </p>
                <div className="flex flex-col gap-1 mt-1">
                  {row.packageType && (
                    <select
                      className="input text-xs py-1"
                      value={row.mode}
                      onChange={(e) => onModeChange(row.productId, e.target.value as "UNIT" | "PACKAGE")}
                    >
                      <option value="UNIT">UNID</option>
                      <option value="PACKAGE">
                        {row.packageType} ({row.unitsPerPackage} un)
                      </option>
                    </select>
                  )}
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="input text-center py-1 tabular"
                    value={row.displayQty === 0 ? "" : row.displayQty}
                    onChange={(e) => onQuantityChange(row.productId, e.target.value)}
                  />
                  {row.mode === "PACKAGE" && row.unitsPerPackage && (
                    <span className="text-xs" style={{ color: "var(--ink-soft)" }}>
                      = {row.baseQty} un
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>
                  Unitário
                </p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  disabled={!canEditPrice}
                  title={canEditPrice ? undefined : "Só dono ou gerente pode alterar o preço de venda"}
                  className="input text-right py-1 tabular disabled:opacity-60 mt-1"
                  value={row.unitValue}
                  onChange={(e) => onUnitValueChange(row.productId, Number(e.target.value))}
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: "var(--ink-soft)" }}>
                  Subtotal
                </p>
                <p className="font-semibold tabular mt-1">{formatBRL(row.subtotal)}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
