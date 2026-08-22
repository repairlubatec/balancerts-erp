import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

const certificate = process.env.CSC_LINK;
const password = process.env.CSC_KEY_PASSWORD;

if (!certificate) {
  console.error("Assinatura Windows não iniciada: defina CSC_LINK com o caminho ou URL do certificado de código (.p12/.pfx).");
  process.exit(2);
}

if (!password) {
  console.error("Assinatura Windows não iniciada: defina CSC_KEY_PASSWORD através do gestor seguro de segredos.");
  process.exit(2);
}

if (!/^https?:\/\//i.test(certificate) && !existsSync(certificate)) {
  console.error(`Assinatura Windows não iniciada: o certificado indicado em CSC_LINK não existe: ${certificate}`);
  process.exit(2);
}

const result = spawnSync("pnpm", ["run", "desktop:win"], {
  stdio: "inherit",
  env: { ...process.env, CSC_LINK: certificate, CSC_KEY_PASSWORD: password },
});

process.exit(result.status ?? 1);
