import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RequestSigningService } from './signing.services.js';

@Injectable()
export class OvseService {
  private readonly baseUrl = process.env.OVSE_BASE_URL;

  constructor(
    private readonly httpService: HttpService,
    private readonly requestSigningService: RequestSigningService,
  ) { }

  async createVerification(data: {
    email: string;
    phone: string;
  }) {
    const path = '/api/v1/verifications';

    const body = {
      purpose: 'IDENTITY_VERIFY',
      fields: [
        'name',
        'dob',
        'address',
      ],
      metadata: {
        email: data.email,
        phone: data.phone,
      },
      ttlSeconds: 300,
    };

    const headers = this.requestSigningService.signedHeaders(
      'POST',
      path,
      body,
    );

    console.log('headers :>> ', headers);

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}${path}`,
          body,
          { headers },
        ),
      );

      console.log('response :>> ', response.data);

      return response.data;

    } catch (error: any) {
      // return {
      //   success: false,
      //   message: "ovse create verification error",
      // }
      console.error(
        'OVSE CREATE ERROR:',
        error?.response?.data || error?.message || error,
      );

      throw new InternalServerErrorException(
        error?.response?.data || 'OVSE create verification failed',
      );
    }
  }


  async getVerificationQr(
    sessionId: string,
  ) {
    const path = `/api/v1/verifications/${sessionId}/qr`;

    const { 'Content-Type': _omit, ...headers } = this.requestSigningService.signedHeaders(
      'GET',
      path,
      null,
    );
    

    console.log('QR URL:', `${this.baseUrl}${path}`);
    console.log('QR PATH:', path);
    console.log('QR HEADERS:', headers);

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}${path}`,
          { headers },
        ),
      );

      console.log('response :>> ', response.data);
      return response.data;

    } catch (error: any) {
      // console.error('OVSE QR error:', error);

      // throw new InternalServerErrorException(
      //   'Unable to get OVSE QR',
      // );

      console.error(
        'OVSE QR ERROR STATUS:',
        error?.response?.status,
      );

      console.error(
        'OVSE QR ERROR DATA:',
        error?.response?.data,
      );

      console.error(
        'OVSE QR ERROR MESSAGE:',
        error?.message,
      );

      throw new InternalServerErrorException(
        error?.response?.data || 'Unable to get OVSE QR',
      );
    }
  }

  async getVerification(
    sessionId: string,
  ) {
    const path = `/api/v1/verifications/${sessionId}`;

    const { 'Content-Type': _omit, ...headers } = this.requestSigningService.signedHeaders(
      'GET',
      path,
      null,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}${path}`,
          {
            headers,
          },
        ),
      );

      console.log('STATUS RESPONSE:', response.data);
      return response.data;

    } catch (error: any) {

      // console.error('OVSE verification status error:', error);

      // throw new InternalServerErrorException(
      //   'Unable to get verification status',
      // );

      console.error(
        'STATUS ERROR:',
        error?.response?.status,
      );

      console.error(
        'STATUS DATA:',
        error?.response?.data,
      );

      throw new InternalServerErrorException(
        error?.response?.data || 'Unable to get verification status',
      );
    }
  }

  async cancelVerification(
    sessionId: string,
  ) {
    const path = `/api/v1/verifications/${sessionId}/cancel`;

    const { 'Content-Type': _omit, ...headers } = this.requestSigningService.signedHeaders(
      'GET',
      path,
      null,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}${path}`,
          undefined,
          { headers },
        ),
      );

      console.log('CANCEL RESPONSE:', response.data);
      return response.data;

    } catch (error: any) {
      console.error(
        'CANCEL ERROR:',
        error?.response?.status,
      );

      console.error(
        'CANCEL DATA:',
        error?.response?.data,
      );

      throw new InternalServerErrorException(
        error?.response?.data || 'Unable to cancel verification',
      );
    }
  }

  // async cancelVerification(sessionId: string) {
  //   const path = `/api/v1/verifications/${sessionId}/cancel`;

  //   const headers = this.requestSigningService.signedHeaders(
  //     'POST',
  //     path,
  //     null,
  //   );

  //   // Cancel has no HTTP body.
  //   // We still sign it using SHA256("").
  //   const { ['Content-Type']: _, ...cancelHeaders } = headers;

  //   try {
  //     console.log('========== OVSE CANCEL REQUEST ==========');
  //     console.log('URL:', `${this.baseUrl}${path}`);
  //     console.log('METHOD:', 'POST');
  //     console.log('BODY:', JSON.stringify(''));
  //     console.log('HEADERS:', cancelHeaders);
  //     console.log('=========================================');

  //     const response = await firstValueFrom(
  //       this.httpService.post(
  //         `${this.baseUrl}${path}`,
  //         undefined,
  //         { headers : cancelHeaders },
  //       ),
  //     );

  //     console.log('CANCEL RESPONSE STATUS:', response.status);
  //     console.log('CANCEL RESPONSE DATA:', response.data);

  //     return response.data;

  //   } catch (error: any) {
  //     console.error('========== CANCEL FAILED ==========');

  //     console.error('ERROR MESSAGE:', error?.message);
  //     console.error('ERROR CODE:', error?.code);
  //     console.error('ERROR NAME:', error?.name);
  //     console.error('ERROR STACK:', error?.stack);

  //     console.error(
  //       'RESPONSE STATUS:',
  //       error?.response?.status,
  //     );

  //     console.error(
  //       'RESPONSE DATA:',
  //       error?.response?.data,
  //     );

  //     console.error(
  //       'RESPONSE HEADERS:',
  //       error?.response?.headers,
  //     );

  //     console.error(
  //       'REQUEST URL:',
  //       error?.config?.url,
  //     );

  //     console.error(
  //       'REQUEST METHOD:',
  //       error?.config?.method,
  //     );

  //     console.error(
  //       'REQUEST DATA:',
  //       error?.config?.data,
  //     );

  //     console.error('==================================');

  //     throw new InternalServerErrorException(
  //       error?.response?.data ||
  //       error?.message ||
  //       'Unable to cancel verification',
  //     );
  //   }
  // }


  async listenVerificationEvents(sessionId: string) {
    const path = `/api/v1/verifications/${sessionId}/events`;

    const { 'Content-Type': _omit, ...headers } = {
      ...this.requestSigningService.signedHeaders(
        'GET',
        path,
        null,
      ),
      Accept: 'text/event-stream',
    };

    console.log('========== OVSE SSE ==========');
    console.log('URL:', `${this.baseUrl}${path}`);
    console.log('METHOD:', 'GET');
    console.log('HEADERS:', headers);
    console.log('==============================');

    const response = await fetch(
      `${this.baseUrl}${path}`,
      {
        method: 'GET',
        headers,
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      console.error('OVSE SSE ERROR STATUS:', response.status);
      console.error('OVSE SSE ERROR:', errorText);

      throw new Error(
        `OVSE SSE failed: ${response.status} ${errorText}`,
      );
    }

    if (!response.body) {
      throw new Error('OVSE SSE response has no body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();

        if (done) {
          console.log('OVSE SSE connection closed');
          break;
        }

        buffer += decoder.decode(value, {
          stream: true,
        });

        // SSE events are separated by blank lines
        const events = buffer.split('\n\n');

        buffer = events.pop() ?? '';

        for (const eventBlock of events) {
          await this.processSseEvent(eventBlock, sessionId);
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private async processSseEvent(
    eventBlock: string,
    sessionId: string,
  ) {
    const lines = eventBlock.split('\n');

    let eventName: string | undefined;
    let data = '';

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventName = line.slice(6).trim();
      }

      if (line.startsWith('data:')) {
        data += line.slice(5).trim();
      }
    }

    if (!data) {
      return;
    }

    let event: any;

    try {
      event = JSON.parse(data);
    } catch {
      console.error(
        'Invalid OVSE SSE JSON:',
        data,
      );

      return;
    }

    console.log('========== OVSE SSE EVENT ==========');
    console.log('EVENT NAME:', eventName);
    console.log('SESSION ID:', sessionId);
    console.log('EVENT:', event);
    console.log('====================================');

    if (event.status === 'VERIFIED') {
      console.log('IDENTITY VERIFIED');

      console.log('PROFILE:', event.profile);
      console.log('DATA STORED ID:', event.dataStoredAtId);

      // TODO:
      // Save verification result into your database
    }
  }
}