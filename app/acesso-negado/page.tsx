import Link from "next/link";

export default function AcessoNegadoPage() {
  return (
    <div className="max-w-md mx-auto text-center py-20">
      <h1 className="text-2xl font-bold text-vinho-800 mb-2">Acesso negado</h1>
      <p className="text-gray-600 mb-6">
        Seu perfil de usuário não tem permissão para acessar esta página.
      </p>
      <Link href="/pedidos" className="btn-primary">
        Voltar para Pedidos
      </Link>
    </div>
  );
}
