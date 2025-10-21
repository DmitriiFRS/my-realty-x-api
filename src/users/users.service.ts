import { BadRequestException, ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { FindOrCreateTgDto } from './dto/findOrCreateTg.dto';
import { buildUserNameFromTg } from 'src/helpers/buildUserNameFromTg';
import { Prisma, User } from '@prisma/client';
import { nanoid } from 'nanoid';
import { UpdateReminderDto } from './dto/updateReminder.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EntityType } from 'src/uploads/enums/entity-type.enum';
import { UploadsService } from 'src/uploads/uploads.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  private async genUniqueSlug(attempts = 5): Promise<string> {
    for (let i = 0; i < attempts; i++) {
      const slug = `u-${Date.now()}-${nanoid(6)}`;
      const exists = await this.prisma.user.findUnique({ where: { slug } });
      if (!exists) return slug;
    }
    // fallback
    return `u-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }

  async findOne(phone: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        phone,
      },
    });
    return user;
  }

  async getMe(userId: number) {
    console.log('Getting me for userId:', userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        estates: {
          select: {
            id: true,
            views: true,
          },
        },
      },
    });
    console.log('Found user:', user);
    if (!user) throw new BadRequestException('User not found');
    const totalViewsAggregation = await this.prisma.estateView.aggregate({
      _sum: {
        count: true,
      },
      where: {
        estate: {
          userId: userId,
        },
      },
    });
    const totalEstates = await this.prisma.estate.count({
      where: { userId: userId },
    });
    const totalViews = totalViewsAggregation._sum.count || 0;
    return {
      ...user,
      totalViews: totalViews,
      totalEstates: totalEstates,
    };
  }

  async getAdmin(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) throw new BadRequestException('User not found');
    if (user.role.slug !== 'super-admin' && user.role.slug !== 'admin') throw new BadRequestException('User is not admin');
    return user;
  }

  async getReminders(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('User not found');

    const reminders = await this.prisma.estate.findMany({
      where: {
        userId: userId,
      },
    });
    return reminders;
  }

  async deleteReminder(userId: number, reminderId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('User not found');
    const reminder = await this.prisma.estate.findUnique({
      where: { id: reminderId },
    });
    if (!reminder) throw new BadRequestException('Reminder not found');
    if (reminder.userId !== userId) throw new BadRequestException('You can delete only your own reminders');
    await this.prisma.estate.delete({
      where: { id: reminderId },
    });
    return { success: true };
  }

  async updateReminder(userId: number, reminderId: number, dto: UpdateReminderDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('User not found');

    const reminder = await this.prisma.reminder.findFirst({
      where: {
        id: reminderId,
        userId: userId,
      },
    });
    if (!reminder) {
      throw new NotFoundException('Напоминание не найдено');
    }
    const updatedReminder = await this.prisma.reminder.update({
      where: {
        id: reminderId,
      },
      data: {
        text: dto.text,
        remindAt: dto.remindAt,
      },
    });
    return updatedReminder;
  }

  async findOrCreateByTelegramId(dto: FindOrCreateTgDto) {
    const { telegramId, phone, photoUrl } = dto;

    if (!telegramId) throw new BadRequestException('telegramId is required');
    if (!phone) throw new BadRequestException('phone is required');

    const [userByTg, userByPhone] = await Promise.all([
      this.prisma.user.findUnique({ where: { telegramId } }),
      this.prisma.user.findUnique({ where: { phone } }),
    ]);

    if (userByTg && userByPhone && userByTg.id !== userByPhone.id) {
      throw new ConflictException('Phone is already used by another account');
    }

    if (userByTg) {
      // If phone belongs to another user -> conflict
      if (userByPhone && userByPhone.id !== userByTg.id) {
        throw new ConflictException('Phone is already used by another account');
      }

      // Prepare updates (name/photo/phone)
      const updates: Record<string, any> = {};
      const newName = buildUserNameFromTg(dto);

      // Check name uniqueness if changing
      if (newName && newName !== userByTg.name) {
        const nameOwner = await this.prisma.user.findUnique({
          where: { name: newName },
        });
        if (nameOwner && nameOwner.id !== userByTg.id) {
          throw new ConflictException('Display name already in use');
        }
        updates.name = newName;
      }

      if (photoUrl && photoUrl !== userByTg.photo) updates.photo = photoUrl;

      if (phone && phone !== userByTg.phone) {
        // проверим, не занят ли этот номер другим
        const phoneOwner = await this.prisma.user.findUnique({
          where: { phone },
        });
        if (phoneOwner && phoneOwner.id !== userByTg.id) {
          throw new ConflictException('Phone is already used by another account');
        }
        updates.phone = phone;
      }

      if (Object.keys(updates).length === 0) return userByTg;

      try {
        return await this.prisma.user.update({
          where: { id: userByTg.id },
          data: updates,
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          throw new ConflictException('Unique constraint violation while updating user');
        }
        throw e;
      }
    }

    // Case 2: user not found by telegramId

    // If phone exists and already bound to another telegram -> conflict
    if (userByPhone) {
      if (userByPhone.telegramId && userByPhone.telegramId !== telegramId) {
        throw new ConflictException('Phone number is already used by another account');
      }

      // We're going to attach telegramId to an existing userByPhone (no conflict)
      const updates: Record<string, any> = {};
      const newName = buildUserNameFromTg(dto);

      if (newName && newName !== userByPhone.name) {
        const nameOwner = await this.prisma.user.findUnique({
          where: { name: newName },
        });
        if (nameOwner && nameOwner.id !== userByPhone.id) {
          throw new ConflictException('Display name already in use');
        }
        updates.name = newName;
      }

      if (photoUrl && photoUrl !== userByPhone.photo) updates.photo = photoUrl;
      updates.telegramId = telegramId;

      try {
        return await this.prisma.user.update({
          where: { id: userByPhone.id },
          data: updates,
        });
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
          throw new ConflictException('Unique constraint violation while linking telegram to phone');
        }
        throw e;
      }
    }

    // Case 3: neither phone nor telegram exist -> create new user
    const name = buildUserNameFromTg(dto);

    // Ensure name is free (name is unique in schema)
    const nameOwner = await this.prisma.user.findUnique({ where: { name } });
    if (nameOwner) {
      throw new ConflictException('Display name already in use');
    }

    const slug = await this.genUniqueSlug();

    try {
      const created = await this.prisma.user.create({
        data: {
          telegramId,
          name,
          slug,
          photo: photoUrl ?? '',
          phone,
        },
      });
      return created;
    } catch (e) {
      // Final safety: if a race produced a P2002, translate it into ConflictException
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Unique constraint violation on user creation (phone/name/telegramId/slug)');
      }
      throw e;
    }
  }

  async searchUsers(userId: number, dto: SearchUsersDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException('Пользователь не найден');
    // checkPermissions({ access: 'admin.panel.access', user: user });
    const query = (dto.searchText || '').trim();
    if (!query) return { users: [] };

    const phoneQuery = query.replace(/\D/g, '');

    const where = {
      roleId: { in: [4] },
      AND: [
        {
          OR: [{ name: { contains: query } }, ...(phoneQuery ? [{ phone: { contains: phoneQuery } }] : [])],
        },
      ],
    };

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        phone: true,
      },
      take: 20,
      orderBy: { name: 'asc' },
    });
    const formattedUsers = users.map((el) => {
      return {
        id: el.id,
        phoneName: `${el.name + ' ' + el.phone}`,
      };
    });
    return { users: formattedUsers };
  }

  async getUsersCount(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException('User not found');
    // checkPermissions({ access: 'admin.panel.access', user: user });
    const users = await this.prisma.user.findMany({
      include: {
        role: true,
      },
    });
    const count = users.filter((u) => u.role.slug === 'user').length;
    return { count };
  }

  async getUsersByRole(userId: number, roleSlug: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException('User not found');
    // checkPermissions({ access: 'admin.panel.access', user: user });
    const role = await this.prisma.role.findUnique({
      where: { slug: roleSlug },
    });
    if (!role) throw new NotFoundException('Role not found');
    const users = await this.prisma.user.findMany({
      where: { roleId: role.id },
      select: {
        id: true,
        name: true,
        phone: true,
        photo: true,
        rating: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });
    return {
      data: users,
    };
  }
  async updateUser(userId: number, targetUserId: number, dto: UpdateUserDto, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException('User not found');

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) throw new NotFoundException('Target user not found');
    if (user.id !== targetUser.id) {
      throw new UnauthorizedException('You can update only your own profile');
    }
    const { ...restOfDto } = dto;
    let oldAvatarUrl: string | null = null;
    let newFileUrl: string | null = null;

    // Запускаем транзакцию для атомарного обновления базы данных
    const { user: updatedUser, urlToDelete } = await this.prisma.$transaction(async (prisma) => {
      let newAvatarId: number | undefined = undefined;

      // --- 1. Логика обработки файла (если он есть) ---
      if (file) {
        // Если у юзера уже был аватар, находим его и готовим к удалению
        if (targetUser.avatarMediaId) {
          const oldAvatar = await prisma.media.findUnique({
            where: { id: targetUser.avatarMediaId },
          });
          if (oldAvatar) {
            oldAvatarUrl = oldAvatar.url; // Сохраняем URL для удаления файла с диска ПОСЛЕ транзакции
            await prisma.media.delete({ where: { id: oldAvatar.id } });
          }
        }

        // --- 2. Сохраняем новый файл на диск ---
        try {
          newFileUrl = await this.uploadsService.saveFile(file);
        } catch (error) {
          throw new BadRequestException(`Не удалось сохранить файл: ${error.message}`);
        }

        // --- 3. Создаем новую запись Media в БД ---
        const newAvatar = await prisma.media.create({
          data: {
            url: newFileUrl,
            size: file.size,
            entityId: targetUser.id,
            entityType: EntityType.AVATAR, // Используем твой Enum
          },
        });
        newAvatarId = newAvatar.id;
      }

      // --- 4. Обновляем самого пользователя ---

      // Подготавливаем данные для обновления
      const updateData: Prisma.UserUpdateInput = {
        ...restOfDto, // Обновляем все поля из DTO (name, и т.д.)
      };

      // Если был загружен новый аватар, привязываем его
      if (newAvatarId && newFileUrl) {
        updateData.avatarMedia = {
          connect: { id: newAvatarId },
        };
        updateData.avatarUrl = newFileUrl;
        updateData.photo = newFileUrl;
      }

      const updatedUser = await prisma.user.update({
        where: { id: targetUser.id },
        data: updateData,
      });

      // Возвращаем обновленного юзера и URL старого файла
      return { user: updatedUser, urlToDelete: oldAvatarUrl };
    });

    // --- 5. Очистка (ПОСЛЕ успешной транзакции) ---
    // Если транзакция прошла успешно и был URL старого файла, удаляем его с диска
    if (urlToDelete) {
      await this.uploadsService.deleteFile(urlToDelete); // Используем твой метод
    }

    // Возвращаем обновленного пользователя контроллеру
    return updatedUser;
  }
}
