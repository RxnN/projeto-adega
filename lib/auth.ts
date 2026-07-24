import { redirect } from "next/navigation";
import { getCurrentUser, SessionData } from "./session";
import { getEmpresaById, getUserById } from "./repo";
import { resolvePermissions } from "./permissions";
import type { EffectivePermissions, Empresa, PermissionKey, Role } from "./types";

const EXPIRING_SOON_DAYS = 5;

/** Verdadeiro quando a assinatura foi aprovada mas a data de vencimento já passou —
 * conta deve ser tratada como travada mesmo com approved = true. */
export function isSubscriptionExpired(empresa: Pick<Empresa, "paidUntil">): boolean {
  return Boolean(empresa.paidUntil && new Date(empresa.paidUntil) < new Date());
}

export interface SubscriptionStatus {
  expired: boolean;
  daysRemaining: number | null;
  expiringSoon: boolean;
}

/** Dias restantes até o vencimento (null = sem data de vencimento controlada) e se está
 * perto o suficiente pra avisar o dono (usado pelo banner no layout). */
export function getSubscriptionStatus(empresa: Pick<Empresa, "paidUntil">): SubscriptionStatus {
  if (!empresa.paidUntil) {
    return { expired: false, daysRemaining: null, expiringSoon: false };
  }
  const msRemaining = new Date(empresa.paidUntil).getTime() - Date.now();
  const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
  return {
    expired: daysRemaining < 0,
    daysRemaining,
    expiringSoon: daysRemaining >= 0 && daysRemaining <= EXPIRING_SOON_DAYS,
  };
}

/** Garante que existe um usuário logado e que a conta da empresa já foi aprovada
 * (pagamento confirmado) e não está com a assinatura vencida; caso contrário
 * redireciona para login ou tela de espera. */
export async function requireUser(): Promise<SessionData> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/");
  }
  const empresa = await getEmpresaById((user as SessionData).empresaId);
  if (!empresa?.approved || isSubscriptionExpired(empresa)) {
    redirect("/aguardando-aprovacao");
  }
  return user as SessionData;
}

/** Garante que o usuário logado possui um dos papéis (roles) permitidos. */
export async function requireRole(allowed: Role[]): Promise<SessionData> {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    redirect("/acesso-negado");
  }
  return user;
}

/** Permissões efetivas são lidas do banco em cada autorização, evitando que uma
 * alteração feita pelo Dono dependa de novo login do usuário afetado. */
export async function getEffectivePermissions(
  user: Pick<SessionData, "userId" | "role">
): Promise<EffectivePermissions> {
  if (user.role === "OWNER") return resolvePermissions("OWNER");
  const current = await getUserById(user.userId);
  return resolvePermissions(user.role, current?.permissions);
}

export async function hasPermission(
  user: Pick<SessionData, "userId" | "role">,
  permission: PermissionKey
): Promise<boolean> {
  const permissions = await getEffectivePermissions(user);
  return permissions[permission];
}

export async function requirePermission(permission: PermissionKey): Promise<SessionData> {
  const user = await requireUser();
  if (!(await hasPermission(user, permission))) redirect("/acesso-negado");
  return user;
}

export function canAccessReportsFull(role: Role) {
  return role === "OWNER";
}

export function canAccessReportsLimited(role: Role) {
  return role === "OWNER" || role === "MANAGER";
}

export function canManageProducts(role: Role) {
  return role === "OWNER";
}

export function canCancelPedidos(role: Role) {
  return role === "OWNER";
}
