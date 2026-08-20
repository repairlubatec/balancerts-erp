import { describe, expect, it } from "vitest";
import { clearTaskPreferences, readTaskPreferences, taskPreferencesKey, writeTaskPreferences } from "./taskPreferences";

describe("preferências do Centro de Tarefas", () => {
  it("cria uma chave isolada por utilizador e empresa", () => {
    expect(taskPreferencesKey(1, 2)).toBe("balancerts.taskCenterPreferences.v1:1:2");
  });

  it("guarda e recupera ordenação e filtros", () => {
    const values = new Map<string, string>();
    const storage = { setItem: (key: string, value: string) => values.set(key, value), getItem: (key: string) => values.get(key) ?? null };
    const key = taskPreferencesKey(1, 2);
    const preferences = { sort: { field: "dueDate" as const, direction: "asc" as const }, filters: { search: "folha", priority: "Alta", state: "Pendente", assignee: "Fausto", due: "HOJE_AMANHA" } };
    writeTaskPreferences(storage, key, preferences);
    expect(readTaskPreferences(storage, key)).toEqual(preferences);
  });

  it("rejeita valores de ordenação inválidos e permite limpar", () => {
    const values = new Map<string, string>([["x", JSON.stringify({ sort: { field: "ingles", direction: "desc" }, filters: { due: "INVALIDO" } })]]);
    const storage = { getItem: (key: string) => values.get(key) ?? null, removeItem: (key: string) => values.delete(key) };
    expect(readTaskPreferences(storage, "x").sort).toEqual({ field: "name", direction: "asc" });
    clearTaskPreferences(storage, "x");
    expect(values.has("x")).toBe(false);
  });
});
