import { describe, expect, it } from "vitest";
import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

describe("credencial SMTP Gmail", () => {
  it("autentica no Gmail sem expor a palavra-passe", async () => {
    expect(ENV.smtpUser).toBeTruthy();
    expect(ENV.smtpPassword).toBeTruthy();
    const transporter = nodemailer.createTransport({ host: ENV.smtpHost, port: ENV.smtpPort, secure: ENV.smtpSecure, requireTLS: !ENV.smtpSecure, auth: { user: ENV.smtpUser, pass: ENV.smtpPassword }, connectionTimeout: 15000, greetingTimeout: 15000, socketTimeout: 15000 });
    await expect(transporter.verify()).resolves.toBeTruthy();
  }, 30000);
});
