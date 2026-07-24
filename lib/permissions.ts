import type {
  EffectivePermissions,
  PermissionKey,
  PermissionOverrides,
  Role,
} from "./types";

export interface PermissionDefinition {
  key: PermissionKey;
  group: "Estoque" | "Pedidos" | "Gestão";
  label: string;
  description: string;
  sensitive?: boolean;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    key: "REGISTER_ENTRIES",
    group: "Estoque",
    label: "Registrar entradas",
    description: "Receber mercadorias e aumentar o saldo do estoque.",
  },
  {
    key: "MANAGE_PRODUCTS",
    group: "Estoque",
    label: "Gerenciar produtos",
    description: "Criar, editar, ativar e desativar produtos.",
    sensitive: true,
  },
  {
    key: "IMPORT_PRODUCTS",
    group: "Estoque",
    label: "Importar e exportar produtos",
    description: "Usar planilhas para atualizar o catálogo em lote.",
    sensitive: true,
  },
  {
    key: "EDIT_ORDER_PRICE",
    group: "Pedidos",
    label: "Alterar preço no pedido",
    description: "Negociar um valor diferente do preço vigente.",
    sensitive: true,
  },
  {
    key: "FORCE_STOCK",
    group: "Pedidos",
    label: "Vender sem estoque suficiente",
    description: "Confirmar uma saída que deixará o saldo negativo.",
    sensitive: true,
  },
  {
    key: "CANCEL_ORDERS",
    group: "Pedidos",
    label: "Cancelar pedidos e entradas",
    description: "Estornar operações já concluídas e seus movimentos.",
    sensitive: true,
  },
  {
    key: "VIEW_REPORTS",
    group: "Gestão",
    label: "Acessar relatórios",
    description: "Consultar estoque e faturamento da própria filial.",
  },
  {
    key: "VIEW_COSTS_MARGIN",
    group: "Gestão",
    label: "Ver custos e margem",
    description: "Exibir custos no catálogo e relatórios de rentabilidade.",
    sensitive: true,
  },
  {
    key: "MANAGE_PROMOTIONS",
    group: "Gestão",
    label: "Gerenciar promoções",
    description: "Criar e remover condições promocionais na filial.",
    sensitive: true,
  },
  {
    key: "MANAGE_BRANCHES",
    group: "Gestão",
    label: "Gerenciar filiais",
    description: "Cadastrar novas unidades da empresa.",
    sensitive: true,
  },
];

const OWNER_DEFAULTS: EffectivePermissions = {
  REGISTER_ENTRIES: true,
  MANAGE_PRODUCTS: true,
  IMPORT_PRODUCTS: true,
  EDIT_ORDER_PRICE: true,
  FORCE_STOCK: true,
  CANCEL_ORDERS: true,
  VIEW_REPORTS: true,
  VIEW_COSTS_MARGIN: true,
  MANAGE_PROMOTIONS: true,
  MANAGE_BRANCHES: true,
};

const MANAGER_DEFAULTS: EffectivePermissions = {
  REGISTER_ENTRIES: true,
  MANAGE_PRODUCTS: false,
  IMPORT_PRODUCTS: false,
  EDIT_ORDER_PRICE: true,
  FORCE_STOCK: false,
  CANCEL_ORDERS: false,
  VIEW_REPORTS: true,
  VIEW_COSTS_MARGIN: false,
  MANAGE_PROMOTIONS: false,
  MANAGE_BRANCHES: false,
};

const EMPLOYEE_DEFAULTS: EffectivePermissions = {
  REGISTER_ENTRIES: true,
  MANAGE_PRODUCTS: false,
  IMPORT_PRODUCTS: false,
  EDIT_ORDER_PRICE: false,
  FORCE_STOCK: false,
  CANCEL_ORDERS: false,
  VIEW_REPORTS: false,
  VIEW_COSTS_MARGIN: false,
  MANAGE_PROMOTIONS: false,
  MANAGE_BRANCHES: false,
};

export function getDefaultPermissions(role: Role): EffectivePermissions {
  if (role === "OWNER") return { ...OWNER_DEFAULTS };
  if (role === "MANAGER") return { ...MANAGER_DEFAULTS };
  return { ...EMPLOYEE_DEFAULTS };
}

export function normalizePermissionOverrides(value: unknown): PermissionOverrides {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  const result: PermissionOverrides = {};
  for (const { key } of PERMISSION_DEFINITIONS) {
    if (typeof source[key] === "boolean") result[key] = source[key] as boolean;
  }
  return result;
}

export function resolvePermissions(
  role: Role,
  overrides?: PermissionOverrides | null
): EffectivePermissions {
  // O Dono nunca pode perder acesso administrativo por uma configuração acidental.
  if (role === "OWNER") return getDefaultPermissions("OWNER");
  return { ...getDefaultPermissions(role), ...normalizePermissionOverrides(overrides) };
}

