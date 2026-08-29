import { CompactEncrypt, importJWK, type JWK } from 'jose';

export class HumanAuthorityBindingSealer {
  private readonly key: ReturnType<typeof importJWK>;

  constructor(publicJwkJson: string) {
    const jwk = JSON.parse(publicJwkJson) as JWK;
    this.key = importJWK(jwk, 'RSA-OAEP-256');
  }

  async seal(payload: Record<string, unknown>): Promise<string> {
    const plaintext = new TextEncoder().encode(JSON.stringify(payload));
    return new CompactEncrypt(plaintext)
      .setProtectedHeader({
        alg: 'RSA-OAEP-256',
        enc: 'A256GCM',
        typ: 'mcf-human-authority-binding+jwe',
      })
      .encrypt(await this.key);
  }
}
