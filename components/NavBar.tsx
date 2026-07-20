"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SessionData } from "@/lib/session";

const roleLabel: Record<string, string> = {
  OWNER: "Dono",
  MANAGER: "Gerente",
  EMPLOYEE: "Funcionário",
};

export default function NavBar({ user }: { user: SessionData }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/pedidos", label: "Pedidos" },
    { href: "/entrada", label: "Entrada" },
    { href: "/movimentacao", label: "Movimentações" },
  ];
  if (user.role === "OWNER" || user.role === "MANAGER") {
    links.push({ href: "/relatorios", label: "Relatórios" });
  }
  links.push({ href: "/produtos", label: "Produtos" });

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="bg-vinho-800 text-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <span className="font-bold text-lg tracking-tight">🍷 {user.adegaName}</span>
          <nav className="flex gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  pathname?.startsWith(l.href)
                    ? "bg-white text-vinho-800"
                    : "text-vinho-100 hover:bg-vinho-700"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-vinho-100">
            {user.name} <span className="opacity-70">· {roleLabel[user.role]}</span>
          </span>
          <button onClick={handleLogout} className="btn-secondary !bg-vinho-900 !text-white !border-vinho-700">
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
