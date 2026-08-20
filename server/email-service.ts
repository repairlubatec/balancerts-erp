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

export async function sendEmail(message: OutgoingEmail) {
  assertSmtpConfigured();
  assertEmailAddresses([message.from, ...message.to, ...(message.cc ?? []), ...(message.bcc ?? [])]);
  const transporter = nodemailer.createTransport({ host: ENV.smtpHost, port: ENV.smtpPort, secure: ENV.smtpSecure, auth: { user: ENV.smtpUser, pass: ENV.smtpPassword }, requireTLS: !ENV.smtpSecure });
  return transporter.sendMail({ from: message.from, to: message.to, cc: message.cc, bcc: message.bcc, subject: message.subject, text: message.text, attachments: message.attachments?.map((attachment) => ({ filename: attachment.filename, content: attachment.content, contentType: attachment.contentType })) });
}
