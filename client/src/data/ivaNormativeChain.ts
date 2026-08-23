export const ivaNormativeChain = [
  {
    code: "IVA-LAW-7-19",
    shortTitle: "Lei n.º 7/19",
    title: "Lei n.º 7/19, de 24 de Abril",
    role: "Aprovação originária do Código do IVA",
    tags: ["Fundamento legal", "Histórico"],
    importance: "HISTÓRICA",
  },
  {
    code: "IVA-DP-180-19",
    shortTitle: "Decreto Presidencial n.º 180/19",
    title: "Decreto Presidencial n.º 180/19, de 24 de Maio",
    role: "Regulamento do Código do IVA e matéria contabilística",
    tags: ["Regulamentação", "Contabilidade IVA"],
    importance: "OPERACIONAL",
  },
  {
    code: "IVA-DE-134-19",
    shortTitle: "Decreto Executivo n.º 134/19",
    title: "Decreto Executivo n.º 134/19, de 10 de Junho",
    role: "Modelos e procedimentos declarativos",
    tags: ["Procedimentos", "Declarações"],
    importance: "OPERACIONAL",
  },
  {
    code: "IVA-LAW-17-19",
    shortTitle: "Lei n.º 17/19",
    title: "Lei n.º 17/19, de 13 de Agosto",
    role: "Alteração ao regime original do Código do IVA",
    tags: ["Alteração legislativa", "Histórico"],
    importance: "HISTÓRICA",
  },
  {
    code: "IVA-LAW-14-23",
    shortTitle: "Lei n.º 14/23",
    title: "Lei n.º 14/23, de 28 de Dezembro",
    role: "Alteração e republicação do Código do IVA",
    tags: ["Consolidação", "Código do IVA"],
    importance: "CENTRAL",
  },
] as const;

export type IvaNormativeChainCode = (typeof ivaNormativeChain)[number]["code"];

export const ivaConfirmedSourceStatuses = [
  "CONFIRMED",
  "VISUALLY_CONFIRMED",
  "HUMAN_APPROVED",
  "ACTIVE",
] as const;

export function isIvaSourceConfirmed(status: string | undefined) {
  return ivaConfirmedSourceStatuses.includes(
    status as (typeof ivaConfirmedSourceStatuses)[number]
  );
}
