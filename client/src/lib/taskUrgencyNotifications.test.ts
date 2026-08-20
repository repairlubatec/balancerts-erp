import { describe, expect, it } from "vitest";
import { collectNewTaskUrgencyNotifications, readTaskUrgencyNotificationLedger, taskUrgencyNotificationsKey, writeTaskUrgencyNotificationLedger } from "./taskUrgencyNotifications";

const reference = new Date("2026-08-20T10:00:00");

describe("notificações internas de urgência", () => {
  it("cria uma notificação para hoje e outra para amanhã", () => {
    const result = collectNewTaskUrgencyNotifications([
      { id: "t1", title: "Conferir folha", dueDate: "2026-08-20T18:00:00", priority: "Alta", state: "Pendente" },
      { id: "t2", title: "Rever IRT", dueDate: "2026-08-21T18:00:00", priority: "Normal", state: "Em curso" },
    ], [], reference);
    expect(result.notifications.map(({ bucket }) => bucket)).toEqual(["HOJE", "AMANHA"]);
    expect(result.ledger).toHaveLength(2);
  });

  it("não repete notificações já registadas e exclui estados encerrados", () => {
    const task = { id: "t1", title: "Conferir folha", dueDate: "2026-08-20T18:00:00", priority: "Alta", state: "Pendente" };
    const first = collectNewTaskUrgencyNotifications([task], [], reference);
    const second = collectNewTaskUrgencyNotifications([task, { ...task, id: "t2", state: "Concluída" }], first.ledger, reference);
    expect(second.notifications).toEqual([]);
  });

  it("guarda o livro por utilizador e empresa", () => {
    const values = new Map<string, string>();
    const storage = { setItem: (key: string, value: string) => values.set(key, value), getItem: (key: string) => values.get(key) ?? null };
    const key = taskUrgencyNotificationsKey(1, 2);
    writeTaskUrgencyNotificationLedger(storage, key, ["t1:HOJE:2026-08-20"]);
    expect(readTaskUrgencyNotificationLedger(storage, key)).toEqual(["t1:HOJE:2026-08-20"]);
    expect(taskUrgencyNotificationsKey(1, 3)).not.toBe(key);
  });
});
