"use client";

import { useMemo, useState } from "react";
import type {
  EffectivePermissions,
  PermissionKey,
  PermissionOverrides,
  Role,
} from "@/lib/types";
import type { PermissionDefinition } from "@/lib/permissions";

interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: Exclude<Role, "OWNER">;
  filialName: string;
  defaults: EffectivePermissions;
  overrides: PermissionOverrides;
  effective: EffectivePermissions;
}

const ROLE_LABEL: Record<Exclude<Role, "OWNER">, string> = {
  MANAGER: "Gerente",
  EMPLOYEE: "Funcionário",
};

function UserPermissionCard({
  user,
  definitions,
}: {
  user: ManagedUser;
  definitions: PermissionDefinition[];
}) {
  const [effective, setEffective] = useState(user.effective);
  const [saved, setSaved] = useState(user.effective);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const dirty = useMemo(
    () => definitions.some(({ key }) => effective[key] !== saved[key]),
    [definitions, effective, saved]
  );

  function toggle(key: PermissionKey) {
    setEffective((current) => ({ ...current, [key]: !current[key] }));
    setMessage(null);
  }

  async function persist(reset = false) {
    setLoading(true);
    setMessage(null);
    const overrides: PermissionOverrides = {};
    if (!reset) {
      for (const { key } of definitions) {
        if (effective[key] !== user.defaults[key]) overrides[key] = effective[key];
      }
    }

    try {
      const response = await fetch(`/api/usuarios/${user.id}/permissoes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset, permissions: overrides }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data.error ?? "Não foi possível salvar as permissões.");
        return;
      }
      setEffective(data.effective);
      setSaved(data.effective);
      setMessage(reset ? "Perfil padrão restaurado." : "Permissões salvas.");
    } catch {
      setMessage("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="card space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-lg font-extrabold">{user.name}</h2>
            <span className="pill pill-muted">{ROLE_LABEL[user.role]}</span>
          </div>
          <p className="text-sm mt-1" style={{ color: "var(--ink-soft)" }}>{user.email}</p>
          <p className="text-xs mt-1" style={{ color: "var(--ink-soft)" }}>Filial: {user.filialName}</p>
        </div>
        {dirty && <span className="pill pill-warn">Alterações não salvas</span>}
      </div>

      {(["Estoque", "Pedidos", "Gestão"] as const).map((group) => (
        <section key={group} className="space-y-2">
          <h3 className="text-xs uppercase tracking-wider font-bold" style={{ color: "var(--accent)" }}>
            {group}
          </h3>
          <div className="grid lg:grid-cols-2 gap-2">
            {definitions.filter((item) => item.group === group).map((item) => {
              const custom = effective[item.key] !== user.defaults[item.key];
              return (
                <label
                  key={item.key}
                  className="rounded-xl border p-3 flex items-start gap-3 cursor-pointer"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--surface-2)" }}
                >
                  <input
                    type="checkbox"
                    checked={effective[item.key]}
                    onChange={() => toggle(item.key)}
                    className="mt-1 h-4 w-4 accent-blue-600"
                  />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm">{item.label}</strong>
                      {item.sensitive && <span className="pill pill-warn">Sensível</span>}
                      {custom && <span className="pill pill-muted">Personalizada</span>}
                    </span>
                    <span className="block text-xs mt-1" style={{ color: "var(--ink-soft)" }}>
                      {item.description}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <button type="button" className="btn-secondary" disabled={loading} onClick={() => persist(true)}>
          Restaurar perfil padrão
        </button>
        <div className="flex items-center gap-3">
          {message && <p className="text-sm" style={{ color: message.includes("salv") || message.includes("restaur") ? "var(--ok)" : "var(--danger)" }}>{message}</p>}
          <button type="button" className="btn-primary" disabled={loading || !dirty} onClick={() => persist(false)}>
            {loading ? "Salvando..." : "Salvar permissões"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function UserPermissionsManager({
  users,
  definitions,
}: {
  users: ManagedUser[];
  definitions: PermissionDefinition[];
}) {
  if (users.length === 0) {
    return (
      <div className="card">
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          Ainda não há Gerentes ou Funcionários cadastrados nesta empresa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {users.map((user) => <UserPermissionCard key={user.id} user={user} definitions={definitions} />)}
    </div>
  );
}

