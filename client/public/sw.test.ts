import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const serviceWorker = readFileSync(new URL("./sw.js", import.meta.url), "utf8");

describe("PWA service worker API safety", () => {
  it("bypasses API requests instead of returning the HTML app shell", () => {
    expect(serviceWorker).toContain('if (requestUrl.pathname.startsWith("/api/")) return;');
    expect(serviceWorker).not.toContain('.catch(() => caches.match("/"))');
  });

  it("rotates the shell cache and removes previous BALANCERTS shell versions", () => {
    expect(serviceWorker).toContain('const CACHE_NAME = "balancerts-erp-shell-v2";');
    expect(serviceWorker).toContain("caches.delete(key)");
  });
});
