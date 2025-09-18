import * as crypto from 'crypto';

interface GenerateInitDataOptions {
  botToken: string;
  user: Record<string, any>;
}

export function generateInitData({ botToken, user }: GenerateInitDataOptions): string {
  // 1. Превращаем объект пользователя в JSON-строку
  const userDataString = JSON.stringify(user);

  // 2. Собираем все данные, которые войдут в строку для проверки
  const data: Record<string, string> = {
    user: userDataString,
    auth_date: Math.floor(Date.now() / 1000).toString(),
    // Можно добавить другие поля, если они нужны
  };

  // 3. Формируем data-check-string: сортируем по ключу и объединяем
  const dataCheckString = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // 4. Генерируем hash точно так же, как мы его проверяем в auth.service
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  // 5. Собираем финальную строку initData
  const params = new URLSearchParams(data);
  params.append('hash', hmac);

  return params.toString();
}
