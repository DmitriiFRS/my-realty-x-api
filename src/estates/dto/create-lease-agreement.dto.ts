import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsNumberString, IsOptional, IsString, Min } from 'class-validator';

export class CreateLeaseAgreementDto {
  @IsString()
  @IsNotEmpty()
  tenantName: string;

  @IsString()
  @IsNotEmpty()
  tenantPhone: string;

  @IsNumberString()
  rentAmount: string;

  @IsNumberString()
  depositAmount: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  currencyTypeId: string;

  @IsDateString()
  endDate: string;

  @IsNumberString()
  estateId: string;
}
