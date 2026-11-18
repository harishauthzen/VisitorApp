import { Injectable } from '@nestjs/common';
import { createHash, createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config'

@Injectable()
export class RequestSigningService {
  constructor(
    private readonly configService: ConfigService,
  ) { }
  signedHeaders(
    method: string,
    path: string,
    body?: unknown,
  ) {
    const apiKey = this.configService.getOrThrow<string>('OVSE_API_KEY');
    const signingSecret = this.configService.getOrThrow<string>('OVSE_SIGNING_SECRET');

    const timestamp = String(Date.now());

    const raw =
      body == null
        ? ''
        : typeof body === 'string'
          ? body
          : JSON.stringify(body);

    const bodyHash = createHash('sha256')
      .update(raw)
      .digest('hex');

    const payload = [
      timestamp,
      method.toUpperCase(),
      path,
      bodyHash,
    ].join('\n');

    const signature = createHmac(
      'sha256',
      signingSecret,
    )
      .update(payload)
      .digest('hex');

    console.log('========== OVSE SIGN ==========');
    console.log('TIMESTAMP:', timestamp);
    console.log('METHOD:', method.toUpperCase());
    console.log('PATH:', JSON.stringify(path));
    console.log('RAW BODY:', JSON.stringify(raw));
    console.log('BODY HASH:', bodyHash);
    console.log('PAYLOAD:', JSON.stringify(payload));
    console.log('SIGNATURE:', signature);
    console.log('===============================');

    return {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'x-ovse-timestamp': timestamp,
      'x-ovse-signature': signature,
    };
  }
}
