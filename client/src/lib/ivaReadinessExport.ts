import { ivaNormativeChain } from "@/data/ivaNormativeChain";

type IvaReadinessExportData = {
  ready: boolean;
  activeRules: number;
  activeMappings: number;
  confirmedSources: number;
  missingChainSources?: string[];
  activeByRegime: Record<string, number>;
  blockers: string[];
};

function csvEscape(value: string | number) {
  const text = String(value);
  return /[;"\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildIvaReadinessCsv(data: IvaReadinessExportData, asOf: Date) {
  const missing = new Set(data.missingChainSources ?? []);
  const confirmedCount = ivaNormativeChain.filter(
    diploma => !missing.has(diploma.code)
  ).length;
  const percentage = Math.round(
    (confirmedCount / ivaNormativeChain.length) * 100
  );
  const rows: Array<Array<string | number>> = [
    ["Relatório de prontidão IVA"],
    ["Data de vigência", asOf.toLocaleDateString("pt-PT")],
    ["Prontidão", data.ready ? "Pronta" : "Bloqueada"],
    ["Diplomas confirmados", confirmedCount],
    ["Diplomas exigidos", ivaNormativeChain.length],
    ["Percentagem de conclusão", `${percentage}%`],
    ["Regras activas", data.activeRules],
    ["Mapeamentos 34.5-IVA activos", data.activeMappings],
    ["Fontes confirmadas", data.confirmedSources],
    [],
    ["Código", "Diploma", "Estado", "Função normativa"],
    ...ivaNormativeChain.map(diploma => [
      diploma.code,
      diploma.title,
      missing.has(diploma.code) ? "Em falta" : "Confirmado",
      diploma.role,
    ]),
    [],
    ["Validações impeditivas"],
    ...data.blockers.map(blocker => [blocker]),
    [],
    ["Regras activas por regime", "Quantidade"],
    ...Object.entries(data.activeByRegime).map(([regime, count]) => [
      regime,
      count,
    ]),
  ];
  return `\uFEFF${rows.map(row => row.map(csvEscape).join(";")).join("\n")}\n`;
}

export function downloadBlob(
  data: BlobPart,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadBase64File(
  dataBase64: string,
  filename: string,
  mimeType: string
) {
  const binary = window.atob(dataBase64);
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  downloadBlob(bytes, filename, mimeType);
}
