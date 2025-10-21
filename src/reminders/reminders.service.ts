import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CreateReminderDto } from 'src/users/dto/createReminder.dto';
import { Recurrence } from '@prisma/client';
import { CronJob } from 'cron';
import { computeNextOccurrenceSendAt } from 'src/helpers/dates';
import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class RemindersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly notificationService: NotificationsService,
  ) {}

  async onModuleInit() {
    const reminders = await this.prisma.reminder.findMany({
      where: {
        isActive: true,
        remindAt: { not: null },
      },
    });
    for (const remind of reminders) {
      if (remind.remindAt && new Date(remind.remindAt) > new Date()) {
        this.scheduleJob(remind.id, new Date(remind.remindAt));
      } else {
        const computed = computeNextOccurrenceSendAt(
          new Date(remind.dueDate),
          remind.originalDay ?? new Date(remind.dueDate).getDate(),
          remind.advanceDays,
        );
        await this.prisma.reminder.update({
          where: { id: remind.id },
          data: { remindAt: computed.sendAt },
        });
        this.scheduleJob(remind.id, computed.sendAt);
      }
    }
  }
  async createReminder(userId: number, dto: CreateReminderDto) {
    const dueDate = new Date(dto.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new Error('Invalid dueDate');
    }

    const estate = await this.prisma.estate.findUnique({
      where: { id: dto.estateId },
    });
    if (!estate) {
      throw new BadRequestException('Estate not found');
    }

    const originalDay = dto.originalDay ?? dueDate.getDate();

    let sendAt: Date | null = null;
    if (dto.advanceDays) {
      const computed = computeNextOccurrenceSendAt(dueDate, originalDay, dto.advanceDays);
      sendAt = computed.sendAt;
    }

    const reminder = await this.prisma.reminder.create({
      data: {
        userId,
        text: dto.text || null,
        amount: dto.amount, // Prisma Decimal field: string acceptable
        dueDate: dueDate,
        originalDay: originalDay,
        recurrence: dto.recurrence || Recurrence.MONTHLY,
        advanceDays: dto.advanceDays ?? 999,
        remindAt: sendAt,
        isActive: dto.isActive || true,
        estateId: dto.estateId,
      },
    });

    if (reminder.remindAt) {
      this.scheduleJob(reminder.id, new Date(reminder.remindAt));
    }
    return reminder;
  }

  async getRemindersByUserId(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('User not found');
    const reminders = await this.prisma.reminder.findMany({
      where: { userId },
      orderBy: { dueDate: 'asc' },
      include: { estate: { select: { id: true, slug: true } } },
    });
    return reminders;
  }

  private scheduleJob(reminderId: number, runAt: Date) {
    const jobName = `reminder-${reminderId}`;

    try {
      if (this.schedulerRegistry.doesExist('cron', jobName)) {
        const existing = this.schedulerRegistry.getCronJob(jobName);
        existing.stop();
        this.schedulerRegistry.deleteCronJob(jobName);
      }
    } catch {
      //
    }
    const job = new CronJob(runAt, async () => {
      try {
        await this.handleSend(reminderId);
      } catch (err) {
        console.log(`Error handling reminder ${reminderId}:`, err);
      }
    });
    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();
  }

  private async handleSend(reminderId: number) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id: reminderId },
    });
    if (!reminder) {
      console.log(`Reminder ${reminderId} not found`);
      return;
    }
    if (!reminder.isActive) {
      const jobName = `reminder-${reminderId}`;
      if (this.schedulerRegistry.doesExist('cron', jobName)) {
        const job = this.schedulerRegistry.getCronJob(jobName);
        await job.stop();
        this.schedulerRegistry.deleteCronJob(jobName);
      }
      return;
    }
    try {
      await this.notificationService.sendReminder(reminder.userId, {
        reminderId: reminder.id,
        text: reminder.text,
        amount: reminder.amount,
        dueDate: reminder.dueDate,
      });
    } catch (err) {
      console.log(`Error sending reminder ${reminderId}:`, err);
    }

    const originalDay = reminder.originalDay ?? new Date(reminder.dueDate).getDate();

    if (reminder.recurrence === Recurrence.MONTHLY) {
      const currentDue = new Date(reminder.dueDate);
      const { nextDue, sendAt } = computeNextOccurrenceSendAt(currentDue, originalDay, reminder.advanceDays, 1);

      await this.prisma.reminder.update({
        where: { id: reminderId },
        data: {
          lastRemindedAt: new Date(),
          dueDate: nextDue,
          remindAt: sendAt,
        },
      });
      this.scheduleJob(reminderId, sendAt);
    } else {
      await this.prisma.reminder.update({
        where: { id: reminderId },
        data: {
          lastRemindedAt: new Date(),
          isActive: false,
          remindAt: null,
        },
      });
      const jobName = `reminder-${reminderId}`;
      if (this.schedulerRegistry.doesExist('cron', jobName)) {
        const job = this.schedulerRegistry.getCronJob(jobName);
        await job.stop();
        this.schedulerRegistry.deleteCronJob(jobName);
      }
    }
  }
}
