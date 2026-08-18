import { mkdir, writeFile } from "node:fs/promises";

const url = process.env.BALANCERTS_DESKTOP_URL?.trim();
if (!url || !/^https:\/\//i.test(url)) {
  throw new Error("BALANCERTS_DESKTOP_URL é obrigatória e deve usar HTTPS para criar um pacote desktop.");
}

await mkdir(new URL("../electron/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../electron/desktop-config.mjs", import.meta.url),
  `export const desktopUrl = ${JSON.stringify(url)};\n`,
  "utf8",
);
console.log(`Configuração desktop preparada para ${url}`);
