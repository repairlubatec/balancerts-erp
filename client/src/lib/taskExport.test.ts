import { describe, expect, it } from "vitest";
import { buildTasksCsv, taskExportFilename } from "./taskExport";

describe("exportação CSV de tarefas", () => {
  it("gera cabeçalhos em português, escapa aspas e preserva acentos", () => {
    const csv = buildTasksCsv([{
      title: 'Rever "mapa" salarial',
      description: "Descrição da tarefa",
      priority: "Alta",
      state: "Pendente",
      origin: "Recursos Humanos",
      company: "Repair Lubatec",
      assigneeLabel: "Fausto Silva",
      dueDate: "2026-08-20",
    }]);

    expect(csv.startsWith("\uFEFF\"Tarefa\",\"Descrição\"")).toBe(true);
    expect(csv).toContain('"Rever ""mapa"" salarial"');
    expect(csv).toContain('"20/08/2026"');
    expect(csv).toContain("Repair Lubatec");
  });

  it("representa campos opcionais vazios e nomeia o ficheiro por empresa e data", () => {
    const csv = buildTasksCsv([{
      title: "Tarefa simples",
      priority: "Média",
      state: "Em curso",
      origin: "Operações",
      company: "Empresa",
    }]);

    expect(csv).toContain('"Sem responsável"');
    expect(csv).toContain('"Sem prazo"');
    expect(taskExportFilename(12)).toMatch(/^tarefas-filtradas-12-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});
