import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { buildTasksXlsx, taskExcelFilename } from "./taskExcelExport";

describe("exportação Excel das tarefas", () => {
  it("gera uma folha Tarefas com cabeçalhos em português", () => {
    const data = buildTasksXlsx([{ title: "Conferir folha", description: "Descrição", priority: "Alta", state: "Pendente", origin: "Recursos Humanos", company: "Repair Lubatec", assigneeLabel: "Fausto", dueDate: "2026-08-20" }]);
    const workbook = XLSX.read(data, { type: "array" });
    expect(workbook.SheetNames).toEqual(["Tarefas"]);
    expect(XLSX.utils.sheet_to_json(workbook.Sheets.Tarefas)).toEqual([{ Tarefa: "Conferir folha", "Descrição": "Descrição", Prioridade: "Alta", Estado: "Pendente", Origem: "Recursos Humanos", Empresa: "Repair Lubatec", Responsável: "Fausto", Prazo: "20/08/2026" }]);
  });

  it("gera nome de ficheiro xlsx por empresa", () => {
    expect(taskExcelFilename(2)).toMatch(/^tarefas-filtradas-2-\d{4}-\d{2}-\d{2}\.xlsx$/);
  });
});
