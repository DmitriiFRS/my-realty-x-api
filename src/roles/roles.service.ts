import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    //user
    if (!user) throw new UnauthorizedException('Access denied');

    const roles = await this.prisma.role.findMany();
    return {
      data: roles,
    };
  }
}
