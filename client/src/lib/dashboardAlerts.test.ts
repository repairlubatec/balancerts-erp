import { describe, expect, it } from "vitest";
import { filterDashboardAlerts } from "./dashboardAlerts";

const events = [
  { id: 1, action: "PGC_VERSION_ACTIVATED", entityType: "pgcVersion", reviewStatus: "OPEN" },
  { id: 2, action: "PGC_ACCOUNT_REVIEWED", entityType: "pgcAccount", reviewStatus: "REVIEWED" },
  { id: 3, action: "PGC_SOURCE_REVIEWED", entityType: "pgcSource", reviewStatus: "RESOLVED" },
  { id: 4, action: "INFORMATION_VIEWED", entityType: "report", reviewStatus: "OPEN" },
];

describe("filtro de alertas do dashboard", () => {
  it("mostra apenas alertas de alto risco em Todos", () => {
    expect(filterDashboardAlerts(events, "ALL").map(({ id }) => id)).toEqual([1, 2, 3]);
  });

  it("selecciona apenas alertas em aberto, revistos ou resolvidos", () => {
    expect(filterDashboardAlerts(events, "OPEN").map(({ id }) => id)).toEqual([1]);
    expect(filterDashboardAlerts(events, "REVIEWED").map(({ id }) => id)).toEqual([2]);
    expect(filterDashboardAlerts(events, "RESOLVED").map(({ id }) => id)).toEqual([3]);
  });

  it("reflecte uma alteração de estado na filtragem seguinte", () => {
    const resolved = events.map((event) => event.id === 1 ? { ...event, reviewStatus: "RESOLVED" } : event);
    expect(filterDashboardAlerts(resolved, "OPEN").map(({ id }) => id)).toEqual([]);
    expect(filterDashboardAlerts(resolved, "RESOLVED").map(({ id }) => id)).toEqual([1, 3]);
  });
});
