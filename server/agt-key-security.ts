const SECRET_REFERENCE_PATTERN = /^(?:secret|vault|kms):\/\/[A-Za-z0-9._:/-]{1,240}$/;

export function validateAgtPrivateKeyReference(reference: string | undefined): string | undefined {
  if (reference === undefined) return undefined;
  const value = reference.trim();
  if (!value) return undefined;
  if (/BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/i.test(value)) {
    throw new Error("AGT_PRIVATE_KEY_MATERIAL_FORBIDDEN");
  }
  if (value.includes("\n") || value.includes("\r") || /(?:password|token|secret)=/i.test(value)) {
    throw new Error("AGT_PRIVATE_KEY_CREDENTIAL_FORBIDDEN");
  }
  if (/^(?:[A-Za-z]:[\\/]|\\\\|\/|\.\.?[\\/])/.test(value)) {
    throw new Error("AGT_PRIVATE_KEY_LOCAL_PATH_FORBIDDEN");
  }
  if (!SECRET_REFERENCE_PATTERN.test(value)) {
    throw new Error("AGT_PRIVATE_KEY_REFERENCE_INVALID");
  }
  return value;
}
