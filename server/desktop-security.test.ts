import { describe, expect, it } from "vitest";
import { assertAllowedDesktopUrl, canOpenExternalUrl } from "../electron/desktop-security.mjs";

describe("D5 — segurança de origem Electron", () => {
  it("permite localhost HTTP apenas em desenvolvimento", () => {
    expect(assertAllowedDesktopUrl("http://127.0.0.1:3000", { NODE_ENV: "development" })).toBeInstanceOf(URL);
    expect(() => assertAllowedDesktopUrl("http://127.0.0.1:3000", { NODE_ENV: "production", BALANCERTS_DESKTOP_ALLOWED_HOSTS: "127.0.0.1" })).toThrow("DESKTOP_URL_HTTPS_REQUIRED");
  });

  it("exige HTTPS e host explicitamente allowlisted fora de desenvolvimento", () => {
    const env = { NODE_ENV: "production", BALANCERTS_DESKTOP_ALLOWED_HOSTS: "erp.example.com" };
    expect(assertAllowedDesktopUrl("https://erp.example.com/app", env)).toBeInstanceOf(URL);
    expect(() => assertAllowedDesktopUrl("https://outro.example.com/app", env)).toThrow("DESKTOP_URL_HOST_NOT_ALLOWLISTED");
    expect(() => assertAllowedDesktopUrl("ftp://erp.example.com/app", env)).toThrow("DESKTOP_URL_HTTPS_REQUIRED");
  });

  it("abre apenas links HTTPS com host de links externos allowlisted", () => {
    const env = { BALANCERTS_EXTERNAL_LINK_ALLOWED_HOSTS: "docs.example.com" };
    expect(canOpenExternalUrl("https://docs.example.com/ajuda", env)).toBe(true);
    expect(canOpenExternalUrl("http://docs.example.com/ajuda", env)).toBe(false);
    expect(canOpenExternalUrl("https://evil.example.com/ajuda", env)).toBe(false);
  });
});
