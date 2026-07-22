import { requireRole } from "@/lib/auth";
import { getEmpresaById, listFiliais } from "@/lib/repo";
import FilialForm from "@/components/FilialForm";
import { formatDateShort } from "@/lib/format";
import PageHeader from "@/components/PageHeader";

export default async function FiliaisPage() {
  const user = await requireRole(["OWNER"]);
  const [filiais, empresa] = await Promise.all([listFiliais(user.empresaId), getEmpresaById(user.empresaId)]);
  const limite = empresa?.maxFiliais ?? 1;
  const noLimite = filiais.length >= limite;

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader eyebrow="Estrutura da empresa" title="Filiais" description="Gerencie as unidades e mantenha catálogos e estoques separados." />

      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Filiais cadastradas</h2>
          <span className="text-xs" style={{ color: "var(--ink-soft)" }}>
            {filiais.length} de {limite} licenciada(s)
          </span>
        </div>
        <ul className="grid sm:grid-cols-2 gap-3">
          {filiais.map((f) => (
            <li key={f.id} className="rounded-xl border p-4 flex items-center justify-between gap-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}>
              <span><strong className="block">{f.name}</strong><small style={{ color: "var(--ink-soft)" }}>Filial ativa</small></span>
              <span className="text-xs" style={{ color: "var(--ink-soft)" }}>
                criada em {formatDateShort(new Date(f.createdAt))}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="card space-y-3">
        <h2 className="font-semibold">Nova filial</h2>
        {noLimite ? (
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
            Sua conta está licenciada para {limite} filial(is) e já atingiu o limite. Fale com a gente pra liberar
            mais.
          </p>
        ) : (
          <FilialForm />
        )}
      </div>
    </div>
  );
}
