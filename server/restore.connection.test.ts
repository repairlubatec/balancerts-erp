import { describe, expect, it } from "vitest";
import mysql from "mysql2/promise";

describe("RESTORE_DATABASE_URL", () => {
  it("liga ao destino isolado e responde a uma consulta mínima sem mutações", async () => {
    const url = process.env.RESTORE_DATABASE_URL;
    expect(url, "RESTORE_DATABASE_URL deve estar configurada no armazenamento seguro").toBeTruthy();

    const connection = await mysql.createConnection({
      uri: url,
      connectTimeout: 15_000,
      ssl: { rejectUnauthorized: true },
    });

    try {
      const [rows] = await connection.query("SELECT 1 AS restore_connection_ok");
      expect(rows).toEqual([{ restore_connection_ok: 1 }]);
    } finally {
      await connection.end();
    }
  }, 30_000);
});
