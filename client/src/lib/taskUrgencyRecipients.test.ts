import { describe, expect, it } from "vitest";
import { readTaskUrgencyRecipients, taskUrgencyRecipientsKey, writeTaskUrgencyRecipients } from "./taskUrgencyRecipients";

describe("destinatários de alertas de urgência", () => {
  it("isola a configuração por utilizador e empresa", () => {
    expect(taskUrgencyRecipientsKey(1, 2)).not.toBe(taskUrgencyRecipientsKey(1, 3));
  });

  it("guarda ids válidos sem duplicados", () => {
    const values = new Map<string, string>();
    const storage = { setItem: (key: string, value: string) => values.set(key, value), getItem: (key: string) => values.get(key) ?? null };
    const key = taskUrgencyRecipientsKey(1, 2);
    writeTaskUrgencyRecipients(storage, key, [3, 3, 0, -1, 4]);
    expect(readTaskUrgencyRecipients(storage, key)).toEqual([3, 4]);
  });
});
