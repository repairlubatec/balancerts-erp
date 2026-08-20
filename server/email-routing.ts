export type EmailSenderContext = {
  companyEmail?: string | null;
  accountantEmail?: string | null;
  accountEmail?: string | null;
};

export type ResolvedEmailSender = { address: string; source: "EMPRESA" | "CONTABILISTA" | "CONTA_AUTORIZADA" };

const normalise = (value?: string | null) => value?.trim().toLowerCase() || undefined;

export function resolveEmailSender(context: EmailSenderContext): ResolvedEmailSender | null {
  const companyEmail = normalise(context.companyEmail);
  if (companyEmail) return { address: companyEmail, source: "EMPRESA" };
  const accountantEmail = normalise(context.accountantEmail);
  if (accountantEmail) return { address: accountantEmail, source: "CONTABILISTA" };
  const accountEmail = normalise(context.accountEmail);
  if (accountEmail) return { address: accountEmail, source: "CONTA_AUTORIZADA" };
  return null;
}
