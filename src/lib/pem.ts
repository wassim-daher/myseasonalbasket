/**
 * Rebuilds the certificate in standard PEM form. Hosting dashboards often turn its
 * line breaks into spaces or literal "\\n" when it is pasted, and Node then finds no
 * certificate at all and rejects the database's.
 */
export function normalizePem(value: string) {
  const blocks = value.replace(/\\n/g, '\n').match(/-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g);
  if (!blocks) return value.trim();
  return blocks
    .map((block) => {
      const body = block.replace(/-----(BEGIN|END) CERTIFICATE-----/g, '').replace(/\s+/g, '');
      return `-----BEGIN CERTIFICATE-----\n${body.match(/.{1,64}/g)?.join('\n') ?? ''}\n-----END CERTIFICATE-----`;
    })
    .join('\n');
}
