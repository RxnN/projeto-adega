import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/pedidos");
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-vinho-800">🍷 Adegas</h1>
          <p className="text-gray-600 mt-1">Gestão de estoque e vendas</p>
        </div>
        <div className="card">
          <LoginForm />
        </div>
        <div className="card mt-4 text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-600">Credenciais de demonstração (senha: senha123)</p>
          <p>Dono: dono@adega.com</p>
          <p>Gerente: gerente@adega.com</p>
          <p>Funcionário: funcionario@adega.com</p>
        </div>
      </div>
    </div>
  );
}
