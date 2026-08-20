import { appRouter } from "../server/routers.ts";
import { getAuditEventsForUserCompany, getHumanResourcesTasksForUserCompany, getPayrollJournalForUserRun, getPayrollRunsForUserCompany } from "../server/db.ts";

const USER_ID = 1;
const COMPANY_ID = 1;
const ORGANIZATION_ID = 1;

function context() {
  const now = new Date();
  return { user: { id: USER_ID, openId: "real-operational-validation", name: "Repair Lubatec", email: "repairlubatec@gmail.com", loginMethod: "validation", role: "admin", createdAt: now, updatedAt: now, lastSignedIn: now }, req: { protocol: "https", headers: {} }, res: { clearCookie: () => undefined } };
}

const caller = appRouter.createCaller(context());
const report = { companyId: COMPANY_ID, organizationId: ORGANIZATION_ID, selectedTaskIds: [], bulkStatus: null, bulkPriority: null, statusUndo: null, priorityUndo: null, payrollRuns: [], payrollJournals: [], auditEvents: [] };

const beforeTasks = await getHumanResourcesTasksForUserCompany(USER_ID, COMPANY_ID);
const eligibleTasks = beforeTasks.filter(({ task }) => task.status !== "CANCELLED").slice(0, 2);
report.selectedTaskIds = eligibleTasks.map(({ task }) => task.id);
if (eligibleTasks.length >= 1) {
  report.bulkStatus = await caller.humanResources.updateTasksStatusBulk({ companyId: COMPANY_ID, taskIds: report.selectedTaskIds, status: "IN_PROGRESS" });
  report.statusUndo = await caller.humanResources.undoTasksStatusBulk({ companyId: COMPANY_ID, changes: report.bulkStatus.previousStates });
  report.bulkPriority = await caller.humanResources.updateTasksPriorityBulk({ companyId: COMPANY_ID, taskIds: report.selectedTaskIds, priority: "HIGH" });
  report.priorityUndo = await caller.humanResources.undoTasksPriorityBulk({ companyId: COMPANY_ID, changes: report.bulkPriority.previousStates });
}

report.payrollRuns = await getPayrollRunsForUserCompany(USER_ID, COMPANY_ID);
for (const { run } of report.payrollRuns) {
  const journal = await getPayrollJournalForUserRun({ userId: USER_ID, companyId: COMPANY_ID, runId: run.id });
  report.payrollJournals.push({ runId: run.id, state: run.status, journalRows: journal.length ?? journal.rows?.length ?? 0 });
}
report.auditEvents = await getAuditEventsForUserCompany(USER_ID, COMPANY_ID);
const taskAuditEvents = report.auditEvents.filter(({ event }) => report.selectedTaskIds.includes(Number(event.entityId)) && ["HR_TASK_STATUS_UPDATED", "HR_TASK_STATUS_UNDONE", "HR_TASK_PRIORITY_UPDATED", "HR_TASK_BULK_PRIORITY_UNDONE"].includes(event.action));

console.log(JSON.stringify({
  beforeTaskCount: beforeTasks.length,
  selectedTaskIds: report.selectedTaskIds,
  bulkStatus: report.bulkStatus ? { updatedCount: report.bulkStatus.updatedCount, previousStates: report.bulkStatus.previousStates } : null,
  statusUndo: report.statusUndo ? { revertedCount: report.statusUndo.revertedCount } : null,
  bulkPriority: report.bulkPriority ? { updatedCount: report.bulkPriority.updatedCount, previousStates: report.bulkPriority.previousStates } : null,
  priorityUndo: report.priorityUndo ? { revertedCount: report.priorityUndo.revertedCount } : null,
  payrollRuns: report.payrollJournals,
  audit: { totalEvents: report.auditEvents.length, taskMutationEvents: taskAuditEvents.length },
  notes: eligibleTasks.length ? ["Alterações reais aplicadas e imediatamente desfeitas através dos procedimentos tenant-aware.", "A confirmação foi representada pela execução explícita após a selecção; a janela de confirmação é validada nos testes de interface.", "O posting contabilístico não foi executado para respeitar aprovação financeira manual."] : ["Não existem tarefas RH reais elegíveis para executar uma alteração transitória."]
}, null, 2));
