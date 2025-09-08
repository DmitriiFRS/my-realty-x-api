import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async sendVerificationCode(phone: string, code: string): Promise<void> {
    this.logger.log(`--- SMS-ЗАГЛУШКА ---`);
    this.logger.log(`Отправка SMS на номер: ${phone}`);
    this.logger.log(`Код подтверждения: ${code}`);
    this.logger.log(`--------------------`);
    return Promise.resolve();
  }
}
