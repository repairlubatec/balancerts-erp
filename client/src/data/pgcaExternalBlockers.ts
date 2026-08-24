export const pgcaExternalBlockers = [
  { label: "Restauro isolado", count: 9, reason: "A RESTORE_DATABASE_URL e o destino MySQL/TiDB isolado ainda não foram disponibilizados." },
  { label: "Windows e instaladores", count: 4, reason: "É necessária uma máquina Windows limpa para validar EXE/MSI e actualizações." },
  { label: "Assinatura Windows", count: 3, reason: "O certificado e a validação da assinatura de código devem ocorrer fora do ambiente actual." },
  { label: "Homologação AGT", count: 3, reason: "Faltam credenciais e endpoint oficiais para homologação controlada." },
  { label: "Integração bancária", count: 3, reason: "Faltam documentação e credenciais dos bancos para integração real." },
  { label: "Aceitação Repair Lubatec", count: 5, reason: "Falta uma sessão de aceitação com utilizadores e dados anonimizados/controlados." },
] as const;
