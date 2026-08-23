const RESTORE_REQUIRED_KEYS = [
  "RESTORE_TARGET",
  "RESTORE_DATABASE_URL",
  "RESTORE_ALLOWED_HOSTS",
  "RESTORE_PRODUCTION_FINGERPRINT",
  "RESTORE_DATABASE_FINGERPRINT",
];

function present(value) {
  return Boolean(String(value ?? "").trim());
}

function missingKeys(env, keys) {
  return keys.filter(key => !present(env[key]));
}

function buildRestoreReadiness(env) {
  const missing = missingKeys(env, RESTORE_REQUIRED_KEYS);
  const invalid = [];
  if (String(env.RESTORE_APPROVED ?? "") !== "true") {
    invalid.push("RESTORE_APPROVED=true");
  }
  if (String(env.RESTORE_ISOLATION_ATTESTATION ?? "") !== "ISOLATED") {
    invalid.push("RESTORE_ISOLATION_ATTESTATION=ISOLATED");
  }

  return {
    status: missing.length || invalid.length ? "PENDENTE_EXTERNO" : "PRONTO_PARA_VALIDACAO_ISOLADA",
    safeToRun: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    networkContacted: false,
  };
}

function buildDesktopReadiness(env) {
  const missing = missingKeys(env, ["BALANCERTS_DESKTOP_URL"]);
  const signingMissing = missingKeys(env, ["CSC_LINK", "CSC_KEY_PASSWORD"]);
  return {
    status: missing.length ? "PENDENTE_CONFIGURACAO" : "PRONTO_PARA_EMPACOTAMENTO",
    packageReady: missing.length === 0,
    signingStatus: signingMissing.length ? "ASSINATURA_PENDENTE" : "ASSINATURA_CONFIGURADA_PARA_VALIDACAO",
    missing,
    signingMissing,
    networkContacted: false,
  };
}

export function buildExternalReadinessReport(env = process.env) {
  return {
    generatedAt: new Date().toISOString(),
    safeMode: true,
    note: "Relatório local de pré-requisitos; não prova homologação, assinatura, restauro ou aceitação externa.",
    restore: buildRestoreReadiness(env),
    desktop: buildDesktopReadiness(env),
    agt: {
      status: "PENDENTE_HOMOLOGACAO_EXTERNA",
      missing: ["Endpoint, credenciais e resultado oficiais de homologação AGT"],
      networkContacted: false,
    },
    banking: {
      status: "PENDENTE_AMBIENTE_EXTERNO",
      missing: ["Documentação, ambiente de testes e credenciais bancárias oficiais"],
      networkContacted: false,
    },
    acceptance: {
      status: "PENDENTE_SESSAO_REPAIR_LUBATEC",
      missing: ["Sessão de aceitação autorizada, utilizadores e dados controlados"],
      networkContacted: false,
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.stdout.write(`${JSON.stringify(buildExternalReadinessReport(), null, 2)}\n`);
}
