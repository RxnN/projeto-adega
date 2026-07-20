import type { Metadata } from "next";
import "./globals.css";
import { getCurrentUser } from "@/lib/session";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "Adegas — Gestão de Estoque e Vendas",
  description: "Sistema de gestão de estoque e vendas para adegas",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR">
      <body>
        {user && <NavBar user={user} />}
        <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
