import PDFDocument from "pdfkit";
import { IVA_NORMATIVE_CHAIN_SOURCE_CODES } from "./normative";

const diplomaLabels: Record<string, string> = {
  "IVA-LAW-7-19": "Lei n.º 7/19",
  "IVA-DP-180-19": "Decreto Presidencial n.º 180/19",
  "IVA-DE-134-19": "Decreto Executivo n.º 134/19",
  "IVA-LAW-17-19": "Lei n.º 17/19",
  "IVA-LAW-14-23": "Lei n.º 14/23",
};

type IvaReadinessPdfData = {
  ready: boolean;
  activeRules: number;
  activeMappings: number;
  confirmedSources: number;
  missingChainSources: string[];
  activeByRegime: Record<string, number>;
  blockers: string[];
};

export function buildIvaReadinessPdf(input: {
  organizationName: string;
  asOf: Date;
  readiness: IvaReadinessPdfData;
}) {
  return new Promise<{ buffer: Buffer; mimeType: "application/pdf" }>(
    resolve => {
      const pdf = new PDFDocument({
        size: "A4",
        margin: 38,
        info: {
          Title: "Prontidão IVA",
          Author: "BALANCERTS.ERP",
          Subject: "Estado das validações normativas IVA",
        },
      });
      const chunks: Buffer[] = [];
      pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdf.on("end", () =>
        resolve({ buffer: Buffer.concat(chunks), mimeType: "application/pdf" })
      );

      const { readiness } = input;
      const missing = new Set(readiness.missingChainSources);
      const confirmedCount = IVA_NORMATIVE_CHAIN_SOURCE_CODES.filter(
        code => !missing.has(code)
      ).length;
      const percentage = Math.round(
        (confirmedCount / IVA_NORMATIVE_CHAIN_SOURCE_CODES.length) * 100
      );

      pdf
        .fillColor("#102a43")
        .font("Helvetica-Bold")
        .fontSize(17)
        .text("BALANCERTS.ERP");
      pdf.fontSize(14).text("Relatório de prontidão IVA");
      pdf
        .moveDown(0.25)
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#5f6d7b")
        .text(input.organizationName);
      pdf.text(
        `Data de vigência consultada: ${input.asOf.toLocaleDateString("pt-PT")}`
      );
      pdf.text(`Emitido em: ${new Date().toLocaleString("pt-PT")}`);
      pdf
        .moveDown(0.6)
        .strokeColor("#bfc9d4")
        .moveTo(38, pdf.y)
        .lineTo(557, pdf.y)
        .stroke();
      pdf.moveDown(0.5);

      pdf
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor(readiness.ready ? "#177245" : "#a33a25")
        .text(`Prontidão IVA: ${readiness.ready ? "PRONTA" : "BLOQUEADA"}`);
      pdf
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#333333")
        .text(
          `Conclusão da cadeia normativa: ${confirmedCount}/${IVA_NORMATIVE_CHAIN_SOURCE_CODES.length} diplomas (${percentage}%)`
        )
        .text(
          `Regras activas: ${readiness.activeRules} · Mapeamentos 34.5-IVA activos: ${readiness.activeMappings} · Fontes confirmadas: ${readiness.confirmedSources}`
        );

      pdf
        .moveDown(0.65)
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#102a43")
        .text("Cadeia normativa IVA exigida");
      pdf.moveDown(0.25);
      for (const code of IVA_NORMATIVE_CHAIN_SOURCE_CODES) {
        const confirmed = !missing.has(code);
        pdf
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(confirmed ? "#177245" : "#a33a25")
          .text(
            `${confirmed ? "CONFIRMADO" : "EM FALTA"} · ${diplomaLabels[code] ?? code}`
          );
        pdf
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor("#333333")
          .text(
            confirmed
              ? "Existe uma fonte confirmada com este código."
              : "Não existe confirmação identificada para este diploma."
          );
        pdf.moveDown(0.25);
      }

      pdf
        .moveDown(0.4)
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#102a43")
        .text("Validações impeditivas");
      pdf.font("Helvetica").fontSize(8.5).fillColor("#333333");
      if (!readiness.blockers.length) {
        pdf.text("Sem bloqueios registados para a data consultada.");
      } else {
        for (const blocker of readiness.blockers) pdf.text(`• ${blocker}`);
      }

      pdf
        .moveDown(0.4)
        .font("Helvetica-Bold")
        .fontSize(11)
        .fillColor("#102a43")
        .text("Regras activas por regime");
      pdf.font("Helvetica").fontSize(8.5).fillColor("#333333");
      for (const [regime, count] of Object.entries(readiness.activeByRegime)) {
        pdf.text(`${regime}: ${count} regra(s)`);
      }

      pdf
        .fontSize(8)
        .fillColor("#5f6d7b")
        .text(
          "Documento de consulta. A exportação não confirma diplomas, não activa regras e não substitui a revisão humana da evidência primária.",
          38,
          760,
          { width: 519, align: "center" }
        );
      pdf.end();
    }
  );
}
