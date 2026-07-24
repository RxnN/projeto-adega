import { describe, expect, it } from "vitest";
import {
  getDefaultPermissions,
  normalizePermissionOverrides,
  resolvePermissions,
} from "../lib/permissions";

describe("permissões configuráveis", () => {
  it("mantém os padrões seguros por perfil", () => {
    expect(getDefaultPermissions("MANAGER").VIEW_REPORTS).toBe(true);
    expect(getDefaultPermissions("MANAGER").CANCEL_ORDERS).toBe(false);
    expect(getDefaultPermissions("EMPLOYEE").EDIT_ORDER_PRICE).toBe(false);
  });

  it("aplica exceções definidas pelo Dono", () => {
    const permissions = resolvePermissions("EMPLOYEE", {
      VIEW_REPORTS: true,
      CANCEL_ORDERS: true,
    });
    expect(permissions.VIEW_REPORTS).toBe(true);
    expect(permissions.CANCEL_ORDERS).toBe(true);
    expect(permissions.MANAGE_PRODUCTS).toBe(false);
  });

  it("ignora chaves e valores desconhecidos", () => {
    expect(normalizePermissionOverrides({
      VIEW_REPORTS: true,
      CANCEL_ORDERS: "sim",
      UNKNOWN: true,
    })).toEqual({ VIEW_REPORTS: true });
  });

  it("nunca reduz as permissões do Dono", () => {
    expect(resolvePermissions("OWNER", { MANAGE_PRODUCTS: false }).MANAGE_PRODUCTS).toBe(true);
  });
});
