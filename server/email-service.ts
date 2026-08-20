import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

export type EmailAttachment = { filename: string; content: Buffer; contentType?: string };
export type OutgoingEmail = { from: string; to: string[]; cc?: string[]; bcc?: string[]; subject: string; text: string; attachments?: EmailAttachment[] };

const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function assertEmailAddresses(addresses: string[]) {
  if (!addresses.length || addresses.some((address) => !validEmail.test(address.trim()))) throw new Error("DESTINATARIO_EMAIL_INVALIDO");
}

export function assertSmtpConfigured() {
  if (!ENV.smtpUser || !ENV.smtpPassword) throw new Error("CONFIGURACAO_SMTP_PENDENTE");
}

export type EmailFailureCode = "CONFIGURACAO_SMTP_PENDENTE" | "DESTINATARIO_EMAIL_INVALIDO" | "AUTENTICACAO_SMTP_FALHOU" | "ENVIO_EMAIL_FALHOU";

export function classifyEmailFailure(error: unknown): EmailFailureCode {
  const rawMessage = error instanceof Error ? error.message : "";
  if (rawMessage === "CONFIGURACAO_SMTP_PENDENTE") return "CONFIGURACAO_SMTP_PENDENTE";
  if (rawMessage === "DESTINATARIO_EMAIL_INVALIDO") return "DESTINATARIO_EMAIL_INVALIDO";
  if (/535|authentication|auth/i.test(rawMessage)) return "AUTENTICACAO_SMTP_FALHOU";
  return "ENVIO_EMAIL_FALHOU";
}

export function emailFailureMessage(code: EmailFailureCode) {
  if (code === "CONFIGURACAO_SMTP_PENDENTE") return "O envio de email ainda não está configurado para esta conta.";
  if (code === "DESTINATARIO_EMAIL_INVALIDO") return "Existe um destinatário de email inválido.";
  if (code === "AUTENTICACAO_SMTP_FALHOU") return "A autenticação do servidor de email falhou. Verifique as credenciais SMTP.";
  return "Não foi possível enviar o documento por email.";
}

export async function sendEmail(message: OutgoingEmail) {
  assertSmtpConfigured();
  assertEmailAddresses([message.from, ...message.to, ...(message.cc ?? []), ...(message.bcc ?? [])]);
  const transporter = nodemailer.createTransport({ host: ENV.smtpHost, port: ENV.smtpPort, secure: ENV.smtpSecure, auth: { user: ENV.smtpUser, pass: ENV.smtpPassword }, requireTLS: !ENV.smtpSecure });
  return transporter.sendMail({ from: message.from, to: message.to, cc: message.cc, bcc: message.bcc, subject: message.subject, text: message.text, attachments: message.attachments?.map((attachment) => ({ filename: attachment.filename, content: attachment.content, contentType: attachment.contentType })) });
}
