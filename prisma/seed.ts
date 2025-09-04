/* eslint-disable @typescript-eslint/no-floating-promises */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начало сидинга...');
  await prisma.currencyType.createMany({
    data: [
      { id: 1, slug: 'uzs', name: 'UZS' },
      { id: 2, slug: 'usd', name: 'USD' },
    ],
    skipDuplicates: true,
  });

  await prisma.dealTerm.createMany({
    data: [
      { id: 1, slug: 'buy', name: 'Покупка' },
      { id: 2, slug: 'rent', name: 'Аренда' },
    ],
    skipDuplicates: true,
  });

  await prisma.room.createMany({
    data: [
      { id: 1, slug: 'one', name: 'Одна комната' },
      { id: 2, slug: 'two', name: 'Две комнаты' },
      { id: 3, slug: 'three', name: 'Три комнаты' },
      { id: 4, slug: 'four', name: 'Четыре комнаты' },
      { id: 5, slug: 'moreThanFive', name: 'Больше пяти' },
    ],
    skipDuplicates: true,
  });

  await prisma.city.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      slug: 'tashkent',
      name: 'Ташкент',
      districts: {
        create: [
          { id: 1, slug: 'mirzo-ulugbek', name: 'Мирзо-Улугбекский' },
          { id: 2, slug: 'yashnobod', name: 'Яшнабадский' },
          { id: 3, slug: 'chilonzor', name: 'Чиланзарский' },
        ],
      },
    },
  });
  await prisma.estateFeature.createMany({
    data: [
      { id: 1, slug: 'renovated', name: 'Ремонт' },
      { id: 2, slug: 'furnished', name: 'Мебель' },
      { id: 3, slug: 'owner', name: 'Собственник' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Сидинг успешно завершен.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    (async () => {
      await prisma.$disconnect();
    })();
  });
