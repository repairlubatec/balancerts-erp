export type BalancertsRole = "admin" | "contabilista" | "financeiro" | "operador" | "auditor" | "user";
export type Permission = "read" | "create" | "update" | "validate" | "issue" | "post" | "reverse" | "close" | "reopen" | "audit";

const matrix: Record<BalancertsRole, Partial<Record<string, Permission[]>>> = {
  admin: { "*": ["read", "create", "update", "validate", "issue", "post", "reverse", "close", "reopen", "audit"] },
  contabilista: { companies: ["read"], accounting: ["read", "create", "validate", "post", "reverse"], documents: ["read", "validate", "issue"], purchases: ["read", "create", "validate", "issue"], customers: ["read", "create"], suppliers: ["read", "create"], catalog: ["read", "create"], fiscal: ["read", "validate"], normative: ["read"], stock: ["read", "create", "validate"], treasury: ["read", "update", "validate"], reports: ["read"], ia: ["read", "update", "validate"], close: ["read", "close", "reopen"] },
  financeiro: { companies: ["read"], customers: ["read", "create"], suppliers: ["read", "create"], catalog: ["read"], treasury: ["read", "create", "update", "validate"], documents: ["read", "create"], purchases: ["read", "create", "validate"], normative: ["read"], ia: ["read"], reports: ["read"] },
  operador: { companies: ["read"], customers: ["read", "create"], suppliers: ["read", "create"], catalog: ["read", "create"], documents: ["read", "create"], purchases: ["read", "create"], stock: ["read", "create"], ia: ["read"], treasury: ["read"] },
  auditor: { companies: ["read"], customers: ["read"], suppliers: ["read"], catalog: ["read"], accounting: ["read"], documents: ["read"], purchases: ["read"], fiscal: ["read"], normative: ["read"], ia: ["read"], treasury: ["read"], reports: ["read"], audit: ["read", "audit"] },
  user: {},
};

export function can(role: BalancertsRole, module: string, permission: Permission) {
  const allowed = matrix[role]["*"] ?? matrix[role][module] ?? [];
  return allowed.includes(permission);
}
