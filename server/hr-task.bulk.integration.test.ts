import { and, eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { auditEvents, companies, humanResourcesTasks } from "../drizzle/schema";
import { getAuditEventsForUserCompany, getDb, getHumanResourcesTasksForUserCompany } from "./db";

const USER_ID = 1;
const ORGANIZATION_ID = 1;

const caller = appRouter.createCaller({
  user: { id: USER_ID, role: "admin", openId: "hr-bulk-disposable", name: "Validação RH", email: "validation@example.invalid", loginMethod: "test" },
  req: {} as never,
  res: {} as never,
});

describe("fluxo E2E descartável de tarefas RH", () => {
  it("confirma alteração em massa, desfaz, preserva isolamento e audita cada tarefa", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    let companyId: number | undefined;
    const suffix = Date.now();
    try {
      const created = await caller.companies.create({ name: `Validação RH ${suffix}`, nif: `999${String(suffix).slice(-7)}`, functionalCurrency: "AOA", ivaRegime: "EXCLUSAO", legalForm: "Sociedade por Quotas", address: "Ambiente temporário", municipality: "Lubango", province: "Huíla", phone: "+244900000000", email: `rh-${suffix}@example.invalid`, activity: "Prestação de Serviço", incorporationYear: 2026, legalRepresentatives: "Validação E2E" });
      companyId = created.company.id;
      const taskOne = await caller.humanResources.createTask({ organizationId: ORGANIZATION_ID, companyId, title: "Conferir mapa salarial", description: "Tarefa temporária E2E", priority: "NORMAL" });
      const taskTwo = await caller.humanResources.createTask({ organizationId: ORGANIZATION_ID, companyId, title: "Rever retenções IRT", description: "Tarefa temporária E2E", priority: "LOW" });
      const taskIds = [taskOne.task.id, taskTwo.task.id];

      const statusChange = await caller.humanResources.updateTasksStatusBulk({ companyId, taskIds, status: "IN_PROGRESS" });
      expect(statusChange.updatedCount).toBe(2);
      expect(statusChange.previousStates).toHaveLength(2);
      const statusUndo = await caller.humanResources.undoTasksStatusBulk({ companyId, changes: statusChange.previousStates });
      expect(statusUndo.revertedCount).toBe(2);

      const priorityChange = await caller.humanResources.updateTasksPriorityBulk({ companyId, taskIds, priority: "HIGH" });
      expect(priorityChange.updatedCount).toBe(2);
      const priorityUndo = await caller.humanResources.undoTasksPriorityBulk({ companyId, changes: priorityChange.previousStates });
      expect(priorityUndo.revertedCount).toBe(2);

      const finalTasks = await getHumanResourcesTasksForUserCompany(USER_ID, companyId);
      expect(finalTasks.map(({ task }) => [task.id, task.status, task.priority])).toEqual(expect.arrayContaining([[taskIds[0], "PENDING", "NORMAL"], [taskIds[1], "PENDING", "LOW"]]));
      const audit = await getAuditEventsForUserCompany(USER_ID, companyId);
      for (const taskId of taskIds) {
        const actions = audit.filter(({ event }) => event.entityType === "humanResourcesTask" && event.entityId === String(taskId)).map(({ event }) => event.action);
        expect(actions).toEqual(expect.arrayContaining(["HR_TASK_CREATED", "HR_TASK_UPDATED", "HR_TASK_BULK_UNDONE", "HR_TASK_PRIORITY_UPDATED", "HR_TASK_BULK_PRIORITY_UNDONE"]));
      }
      const otherCompanyTasks = await getHumanResourcesTasksForUserCompany(USER_ID, 1);
      expect(otherCompanyTasks.some(({ task }) => taskIds.includes(task.id))).toBe(false);
    } finally {
      if (companyId) {
        await db!.delete(auditEvents).where(eq(auditEvents.companyId, companyId));
        await db!.delete(humanResourcesTasks).where(eq(humanResourcesTasks.companyId, companyId));
        await db!.delete(companies).where(and(eq(companies.id, companyId), eq(companies.organizationId, ORGANIZATION_ID)));
      }
    }
  }, 30000);
});
