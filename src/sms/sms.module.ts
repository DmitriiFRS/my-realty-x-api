import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';

@Module({
  exports: [SmsService],
  providers: [SmsService],
})
export class SmsModule {}
