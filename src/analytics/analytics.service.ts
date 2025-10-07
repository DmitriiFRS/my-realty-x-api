import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalyticsSummary(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const aggregation = await this.prisma.transaction.aggregate({
      where: {
        userId: userId,
        dealDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });
    const currentMonthIncome = aggregation._sum.amount || BigInt(0);
    return {
      currentMonthIncome: currentMonthIncome.toString(),
    };
  }

  async getTransactionAnalytics(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const transactions = await this.prisma.transaction.findMany({
      where: {
        userId: userId,
        dealDate: {
          gte: threeMonthsAgo,
        },
      },
      orderBy: {
        dealDate: 'desc',
      },
      include: {
        estate: {
          select: {
            slug: true,
          },
        },
      },
    });
    const result: {
      currentMonth: typeof transactions;
      lastMonth: typeof transactions;
      twoMonthsAgo: typeof transactions;
    } = {
      currentMonth: [],
      lastMonth: [],
      twoMonthsAgo: [],
    };
    const now = new Date();
    const currentMonthIndex = now.getMonth();
    const currentYear = now.getFullYear();

    transactions.forEach((transaction) => {
      const transactionMonthIndex = transaction.dealDate.getMonth();
      const transactionYear = transaction.dealDate.getFullYear();

      if (transactionYear === currentYear && transactionMonthIndex === currentMonthIndex) {
        result.currentMonth.push(transaction);
        return;
      }
      const lastMonthDate = new Date(now);
      lastMonthDate.setMonth(currentMonthIndex - 1);
      if (transactionYear === lastMonthDate.getFullYear() && transactionMonthIndex === lastMonthDate.getMonth()) {
        result.lastMonth.push(transaction);
        return;
      }
      const twoMonthsAgoDate = new Date(now);
      twoMonthsAgoDate.setMonth(currentMonthIndex - 2);
      if (transactionYear === twoMonthsAgoDate.getFullYear() && transactionMonthIndex === twoMonthsAgoDate.getMonth()) {
        result.twoMonthsAgo.push(transaction);
      }
    });
    return result;
  }

  async getChartData(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');

    const today = new Date();
    const last7Days = new Date(new Date().setDate(today.getDate() - 7));
    const last30Days = new Date(new Date().setDate(today.getDate() - 30));

    const [last30DaysData, recentTransactions] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: { userId, dealDate: { gte: last30Days } },
        _sum: { amount: true },
      }),
      this.prisma.transaction.findMany({
        where: { userId, dealDate: { gte: last7Days } },
      }),
    ]);

    const totalLast30Days = last30DaysData._sum.amount || BigInt(0);
    const dailyIncomeMap = new Map<string, bigint>();
    recentTransactions.forEach((t) => {
      const day = t.dealDate.toISOString().split('T')[0];
      const currentTotal = dailyIncomeMap.get(day) || BigInt(0);
      dailyIncomeMap.set(day, currentTotal + t.amount);
    });
    const chartData: { day: string; total: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dayKey = date.toISOString().split('T')[0];
      const dayLabel = new Intl.DateTimeFormat('ru-RU', { day: '2-digit' }).format(date);
      chartData.push({
        day: dayLabel,
        total: (dailyIncomeMap.get(dayKey) || BigInt(0)).toString(),
      });
    }
    return {
      totalLast30Days: totalLast30Days.toString(),
      chartData,
    };
  }

  async getExclusiveAnalytics(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');

    const totalEstates = await this.prisma.estate.findMany({
      where: { userId: userId },
      select: { id: true, isExclusive: true },
    });
    let exclusiveCount = 0;
    let regularCount = 0;
    for (const estate of totalEstates) {
      if (estate.isExclusive) {
        exclusiveCount++;
      } else {
        regularCount++;
      }
    }
    const exclusivePercentage = totalEstates.length > 0 ? (exclusiveCount / totalEstates.length) * 100 : 0;
    const regularPercentage = totalEstates.length > 0 ? (regularCount / totalEstates.length) * 100 : 0;
    return {
      exclusive: {
        count: exclusiveCount,
        percentage: parseFloat(exclusivePercentage.toFixed(1)),
      },
      regular: {
        count: regularCount,
        percentage: parseFloat(regularPercentage.toFixed(1)),
      },
      total: totalEstates.length,
    };
  }

  async getEstateTypesAnalytics(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('Пользователь не найден');

    const totalEstates = await this.prisma.estate.findMany({
      where: { userId: userId },
      select: { id: true, isExclusive: true, estateType: true },
    });
    let apartmentCount = 0;
    let houseCount = 0;
    let commercialCount = 0;
    let dachaCount = 0;
    for (const estate of totalEstates) {
      switch (estate.estateType.slug) {
        case 'apartment':
          apartmentCount++;
          break;
        case 'house':
          houseCount++;
          break;
        case 'commercial':
          commercialCount++;
          break;
        case 'dacha':
          dachaCount++;
          break;
      }
    }
    return {
      apartmentEstates: apartmentCount,
      houseEstates: houseCount,
      commercialEstates: commercialCount,
      dachaEstates: dachaCount,
      totalEstates: totalEstates.length,
    };
  }
}
