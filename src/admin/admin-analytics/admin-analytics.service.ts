import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategoriesChart(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    const categories = await this.prisma.estateType.findMany({
      select: {
        id: true,
        name: true,
        _count: true,
      },
    });

    return {
      data: categories.map((category) => ({
        id: category.id,
        name: category.name,
        value: category._count.estates,
      })),
    };
  }
  async getMonthlyEstateCounts() {
    const year = new Date().getFullYear();
    const promises = Array.from({ length: 12 }, (_, month) => {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 1);
      return this.prisma.estate.count({
        where: {
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      });
    });

    const counts = await Promise.all(promises);
    return counts;
  }

  async getDailyEstateCounts() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const promises = Array.from({ length: daysInMonth }, (_, day) => {
      const start = new Date(year, month, day + 1);
      const end = new Date(year, month, day + 2);
      return this.prisma.estate.count({
        where: {
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      });
    });

    const counts = await Promise.all(promises);
    return counts;
  }

  async getDailyUsersCount() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const promises = Array.from({ length: daysInMonth }, (_, day) => {
      const start = new Date(year, month, day + 1);
      const end = new Date(year, month, day + 2);
      return this.prisma.user.count({
        where: {
          createdAt: {
            gte: start,
            lt: end,
          },
        },
      });
    });

    const counts = await Promise.all(promises);
    return counts;
  }
}
