import { readFileSync } from 'node:fs';
import { X509Certificate } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { normalizePem } from '@/lib/pem';

const pem = readFileSync(new URL('./fixtures/supabase-ca.crt', import.meta.url), 'utf8');

describe('database certificate', () => {
  it('reads the certificate however its line breaks were pasted', () => {
    const subject = new X509Certificate(pem).subject;
    for (const pasted of [pem, pem.replace(/\n/g, ' '), pem.replace(/\n/g, '\\n'), pem.replace(/\n/g, '\r\n'), `  ${pem.replace(/\n/g, '')}  `]) {
      expect(new X509Certificate(normalizePem(pasted)).subject).toBe(subject);
    }
  });
});
