import { Controller, Get, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get('all')
  @UseGuards(JwtAuthGuard)
  async getAllRoles(@GetUser('id') userId: number) {
    return this.rolesService.findAll(userId);
  }
}
