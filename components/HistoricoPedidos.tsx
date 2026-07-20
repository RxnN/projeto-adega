"use client";

import { Fragment, useState } from "react";
import type { PedidoWithItems } from "@/lib/types";

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoricoPedidos({ pedidos }: { pedidos: PedidoWithItems[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (pedidos.length === 0) {
    return <p className="text-sm text-gray-500">Nenhum pedido registrado ainda.</p>;
  }

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="min-w-full text-sm">
        <thead className="bg-vinho-50 text-vinho-800">
          <tr>
            <th className="text-left px-4 py-2 w-8"></th>
            <th className="text-left px-4 py-2">Pedido</th>
            <th className="text-left px-4 py-2">Data</th>
            <th className="text-left px-4 py-2">Itens</th>
            <th className="text-right px-4 py-2">Total</th>
            <th className="text-left px-4 py-2">Usuário</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {pedidos.map((pedido) => {
            const isOpen = expanded.has(pedido.id);
            const qtdItens = pedido.items.reduce((sum, i) => sum + i.quantity, 0);
            return (
              <Fragment key={pedido.id}>
                <tr
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => toggle(pedido.id)}
                >
                  <td className="px-4 py-2 text-gray-400">{isOpen ? "▾" : "▸"}</td>
                  <td className="px-4 py-2 font-medium">#{pedido.number}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{formatDate(pedido.createdAt)}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {pedido.items.length} produto(s) · {qtdItens} un.
                  </td>
                  <td className="px-4 py-2 text-right font-medium">{formatBRL(pedido.totalValue)}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{pedido.createdByName}</td>
                </tr>
                {isOpen && (
                  <tr>
                    <td></td>
                    <td colSpan={5} className="px-4 pb-3">
                      <table className="min-w-full text-xs bg-gray-50 rounded-md overflow-hidden">
                        <thead className="text-gray-500">
                          <tr>
                            <th className="text-left px-3 py-1.5">Produto</th>
                            <th className="text-right px-3 py-1.5">Qtde</th>
                            <th className="text-right px-3 py-1.5">Valor unit.</th>
                            <th className="text-right px-3 py-1.5">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {pedido.items.map((item) => (
                            <tr key={item.id}>
                              <td className="px-3 py-1.5">{item.productName}</td>
                              <td className="px-3 py-1.5 text-right">
                                {item.quantity} {item.productUnit}
                              </td>
                              <td className="px-3 py-1.5 text-right">{formatBRL(item.unitValue)}</td>
                              <td className="px-3 py-1.5 text-right font-medium">{formatBRL(item.totalValue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
