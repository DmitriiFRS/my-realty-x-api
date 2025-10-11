## API CRM (estates, users, analytics)

Документ описывает HTTP API для интеграции фронтенда. Составлено по соответствующим контроллерам и DTO.

- Базовый префикс: `/api`

### Аутентификация

- Authorization: `Bearer <JWT>`

### Заголовки

- Accept: `application/json`
- Content-Type:
  - `application/json` — для GET/POST/PATCH/DELETE с JSON телом
  - `multipart/form-data` — для загрузки файлов

Примечание: все BigInt-числа в ответах сериализуются в строки.

## Эндпоинты

### 0) Мои объявления (CRM)

- Метод: GET
- URL: `/api/estates/crm/my-estates/{filter}?page=1&pageSize=4`
- Параметры пути:
  - `filter` (string, optional): `archived` | `exclusive` | `all`
- Query параметры:
  - `page` (number, optional, default: 1)
  - `pageSize` (number, optional, default: 4)
- Тело: нет
- Ответ: `200 OK`
  - Пример ответа:

```json
{
  "data": [
    {
      "id": 123,
      "slug": "e-xyz",
      "description": "Описание",
      "area": 45,
      "price": "300000",
      "primaryImageUrl": "/uploads/abc.jpg",
      "createdAt": "2025-10-06T10:00:00.000Z",
      "updatedAt": "2025-10-06T10:00:00.000Z",
      "status": { "id": 1, "status": "verified" },
      "currencyType": { "id": 1, "name": "KZT", "slug": "kzt" },
      "dealTerm": { "id": 1, "name": "Аренда", "slug": "rent" },
      "city": { "id": 1, "name": "Алматы", "slug": "almaty" },
      "district": { "id": 3, "name": "Бостандык", "slug": "bostandyk" }
    }
  ],
  "meta": { "total": 1, "page": 1, "pageSize": 4, "lastPage": 1 }
}
```

### 1) Список свободных объявлений (CRM)

- Метод: GET
- URL: `/api/estates/crm/estates/free`
- Тело: нет
- Ответ: `200 OK`
  - Пример ответа:

```json
{
  "data": [
    {
      "id": 123,
      "slug": "e-xyz",
      "description": "Описание",
      "area": 45,
      "price": "300000",
      "primaryImageUrl": "/uploads/abc.jpg",
      "createdAt": "2025-10-06T10:00:00.000Z",
      "updatedAt": "2025-10-06T10:00:00.000Z",
      "status": { "id": 1, "status": "verified" },
      "currencyType": { "id": 1, "name": "KZT", "slug": "kzt" },
      "dealTerm": { "id": 1, "name": "Аренда", "slug": "rent" },
      "city": { "id": 1, "name": "Алматы", "slug": "almaty" },
      "district": { "id": 3, "name": "Бостандык", "slug": "bostandyk" },
      "estateType": { "id": 1, "name": "Квартира", "slug": "apartment" },
      "room": { "id": 2, "name": "2-комн.", "slug": "2-room" },
      "media": [
        {
          "id": 1001,
          "order": 1,
          "url": "/uploads/img1.jpg",
          "size": 123456,
          "entityId": 123,
          "createdAt": "2025-10-06T10:00:00.000Z",
          "updatedAt": "2025-10-06T10:00:00.000Z"
        }
      ]
    }
  ],
  "meta": { "total": 1, "page": 1, "pageSize": 20, "lastPage": 1 }
}
```

### 2) Список проданных объявлений (CRM)

- Метод: GET
- URL: `/api/estates/crm/estates/sold`
- Тело: нет
- Ответ: `200 OK`
  - Пример ответа (аналогично п.1):

```json
{
  "data": [
    {
      "id": 124,
      "slug": "e-sold",
      "description": "Продано",
      "area": 50,
      "price": "350000",
      "primaryImageUrl": "/uploads/sold.jpg",
      "createdAt": "2025-10-05T10:00:00.000Z",
      "updatedAt": "2025-10-07T10:00:00.000Z",
      "status": { "id": 2, "status": "verified" },
      "currencyType": { "id": 1, "name": "KZT", "slug": "kzt" },
      "dealTerm": { "id": 1, "name": "Аренда", "slug": "rent" },
      "city": { "id": 1, "name": "Алматы", "slug": "almaty" },
      "district": { "id": 4, "name": "Медеу", "slug": "medeu" },
      "estateType": { "id": 1, "name": "Квартира", "slug": "apartment" },
      "room": { "id": 1, "name": "1-комн.", "slug": "1-room" },
      "media": []
    }
  ],
  "meta": { "total": 1, "page": 1, "pageSize": 20, "lastPage": 1 }
}
```

### 3) Детальная CRM-карточка по slug

- Метод: GET
- URL: `/api/estates/crm/estate/{slug}`
- Параметры пути:
  - `slug` (string)
- Тело: нет
- Ответ: `200 OK`
  - Пример ответа:

```json
{
  "data": {
    "id": 123,
    "slug": "e-xyz",
    "description": "Описание",
    "area": 45,
    "price": "300000",
    "deposit": null,
    "leaseTermUnit": null,
    "primaryImageUrl": "/uploads/abc.jpg",
    "createdAt": "2025-10-06T10:00:00.000Z",
    "updatedAt": "2025-10-06T10:00:00.000Z",
    "user": { "id": 5, "name": "Риэлтор", "phone": "+7700..." },
    "status": { "id": 1, "status": "verified" },
    "currencyType": { "id": 1, "name": "KZT", "slug": "kzt" },
    "dealTerm": { "id": 1, "name": "Аренда", "slug": "rent" },
    "city": { "id": 1, "name": "Алматы", "slug": "almaty" },
    "district": { "id": 3, "name": "Бостандык", "slug": "bostandyk" },
    "estateType": { "id": 1, "name": "Квартира", "slug": "apartment" },
    "room": { "id": 2, "name": "2-комн.", "slug": "2-room" },
    "features": [{ "id": 10, "name": "Балкон", "slug": "balcony" }],
    "EstatePrimaryMedia": { "id": 2001 },
    "leaseAgreement": { "id": 501 },
    "media": [
      {
        "id": 1002,
        "order": 2,
        "url": "/uploads/img2.jpg",
        "size": 123456,
        "entityId": 123,
        "createdAt": "2025-10-06T10:00:00.000Z",
        "updatedAt": "2025-10-06T10:00:00.000Z"
      }
    ],
    "document": [
      {
        "id": 3001,
        "order": 0,
        "url": "/uploads/lease.pdf",
        "size": 55555,
        "entityId": 501,
        "createdAt": "2025-10-06T10:00:00.000Z",
        "updatedAt": "2025-10-06T10:00:00.000Z"
      }
    ]
  }
}
```

### 4) Создать договор аренды (фото/документ)

- Метод: POST
- URL: `/api/estates/lease/create`
- Content-Type: `multipart/form-data`
- Тело запроса (пример):

```json
{
  "tenantName": "Иван Иванов",
  "tenantPhone": "+77001234567",
  "rentAmount": "250000",
  "depositAmount": "500000",
  "currencyTypeId": 1,
  "endDate": "2025-12-31T00:00:00.000Z",
  "estateId": 123
}
```

Примечание: передавайте файлы как поля `photos[]` (до 10 шт.) и `document` (1 файл) в multipart-форме.

- Ответ: `200 OK`
  - Пример ответа:

```json
{
  "id": 501,
  "estateId": 123,
  "currencyTypeId": 1,
  "tenantName": "Иван Иванов",
  "tenantPhone": "+77001234567",
  "rentAmount": "250000",
  "depositAmount": "500000",
  "startDate": "2025-10-06T10:00:00.000Z",
  "endDate": "2025-12-31T00:00:00.000Z",
  "createdAt": "2025-10-06T10:00:00.000Z",
  "updatedAt": "2025-10-06T10:00:00.000Z"
}
```

- Пример (curl):

```bash
curl -X POST "$BASE_URL/api/estates/lease/create" \
  -H "Authorization: Bearer $TOKEN" \
  -F "tenantName=Иван" \
  -F "tenantPhone=+77001234567" \
  -F "rentAmount=250000" \
  -F "depositAmount=500000" \
  -F "currencyTypeId=1" \
  -F "endDate=2025-12-31T00:00:00.000Z" \
  -F "estateId=123" \
  -F "photos=@/path/photo1.jpg" \
  -F "document=@/path/contract.pdf"
```

### 5) Обновить объявление (CRM)

- Метод: PUT
- URL: `/api/estates/crm/update/{id}`
- Параметры пути:
  - `id` (number)
- Content-Type: `multipart/form-data`
- Тело запроса (пример):

```json
{
  "description": "Обновлённое описание",
  "area": 50,
  "price": 320000,
  "estateTypeId": 1,
  "dealTermId": 2,
  "roomId": 2,
  "districtId": 3,
  "cityId": 1,
  "currencyTypeId": 1,
  "features": [1, 2, 3],
  "existingImageIds": [1001, 1002]
}
```

Примечание: дополнительно можете передать файлы `primaryImage` (1) и `images[]` (до 10) в multipart-форме. Поле `status` для пользовательского апдейта игнорируется (будет `PENDING`).

- Ответ: `200 OK`
  - Пример ответа:

```json
{
  "id": 123,
  "slug": "e-xyz",
  "description": "Обновлённое описание",
  "area": 50,
  "price": "320000",
  "userId": 5,
  "dealTermId": 2,
  "estateTypeId": 1,
  "roomId": 2,
  "cityId": 1,
  "districtId": 3,
  "currencyTypeId": 1,
  "primaryMediaId": 2002,
  "primaryImageUrl": "/uploads/new-primary.jpg",
  "availability": "available",
  "deposit": null,
  "leaseTermUnit": null,
  "isExclusive": false,
  "leaseEndDate": null,
  "createdAt": "2025-10-01T10:00:00.000Z",
  "updatedAt": "2025-10-06T12:00:00.000Z"
}
```

### 6) Удалить объявление (CRM)

- Метод: DELETE
- URL: `/api/estates/crm/delete/{id}`
- Параметры пути:
  - `id` (number)
- Тело: нет
- Ответ: `200 OK`
  - Пример ответа:

```json
{ "message": "Объявление и связанные файлы успешно удалены" }
```

### 6.1) Архивировать объявление (CRM)

- Метод: PATCH
- URL: `/api/estates/crm/estates/archive/{id}`
- Параметры пути:
  - `id` (number)
- Тело: нет
- Ответ: `200 OK`
  - Пример ответа:

```json
{
  "message": "Объявление успешно заархивировано",
  "data": {
    "id": 123,
    "isArchived": true,
    "status": { "id": 1, "status": "verified" },
    "city": { "id": 1, "name": "Алматы", "slug": "almaty" },
    "district": { "id": 3, "name": "Бостандык", "slug": "bostandyk" }
  }
}
```

### 7) Список напоминаний пользователя

- Метод: GET
- URL: `/api/users/crm/reminders`
- Тело: нет
- Ответ: `200 OK`
  - Пример ответа:

```json
[
  {
    "id": 11,
    "text": "Позвонить клиенту",
    "remindAt": "2025-10-10T09:00:00.000Z",
    "userId": 5,
    "createdAt": "2025-10-06T10:00:00.000Z",
    "updatedAt": "2025-10-06T10:00:00.000Z"
  },
  {
    "id": 12,
    "text": "Подготовить договор",
    "remindAt": "2025-10-11T10:00:00.000Z",
    "userId": 5,
    "createdAt": "2025-10-06T11:00:00.000Z",
    "updatedAt": "2025-10-06T11:00:00.000Z"
  }
]
```

### 8) Удалить напоминание

- Метод: DELETE
- URL: `/api/users/crm/reminders/{id}`
- Параметры пути:
  - `id` (number)
- Тело: нет
- Ответ: `200 OK`
  - Пример ответа:

```json
{ "success": true }
```

### 9) Создать напоминание

- Метод: POST
- URL: `/api/users/crm/reminders`
- Тело запроса (пример):

```json
{
  "text": "Позвонить клиенту",
  "remindAt": "2025-10-10T09:00:00.000Z"
}
```

- Ответ: `200 OK`
  - Пример ответа:

```json
{
  "id": 13,
  "text": "Позвонить клиенту",
  "remindAt": "2025-10-10T09:00:00.000Z",
  "userId": 5,
  "createdAt": "2025-10-06T12:00:00.000Z",
  "updatedAt": "2025-10-06T12:00:00.000Z"
}
```

### 10) Обновить напоминание

- Метод: PATCH
- URL: `/api/users/crm/reminders/{id}`
- Параметры пути:
  - `id` (number)
- Тело запроса (пример):

```json
{
  "text": "Перезвонить позже",
  "remindAt": "2025-10-11T10:00:00.000Z"
}
```

- Ответ: `200 OK`
  - Пример ответа:

```json
{
  "id": 11,
  "text": "Перезвонить позже",
  "remindAt": "2025-10-11T10:00:00.000Z",
  "userId": 5,
  "createdAt": "2025-10-06T10:00:00.000Z",
  "updatedAt": "2025-10-06T12:30:00.000Z"
}
```

### 11) Сводка аналитики

- Метод: GET
- URL: `/api/analytics/summary`
- Тело: нет
- Ответ: `200 OK`

```json
{ "currentMonthIncome": "2500000" }
```

### 12) Транзакции по месяцам

- Метод: GET
- URL: `/api/analytics/transactions`
- Тело: нет
- Ответ: `200 OK`

```json
{
  "октябрь": [
    {
      "id": 1,
      "userId": 5,
      "estateId": 10,
      "amount": "300000",
      "dealDate": "2025-10-01T12:00:00.000Z",
      "clientName": "Иван",
      "createdAt": "2025-10-01T12:00:00.000Z",
      "updatedAt": "2025-10-01T12:00:00.000Z",
      "estate": { "slug": "e-abc" }
    }
  ],
  "сентябрь": [],
  "август": []
}
```

### 13) Данные для графика (7 дней, сумма за 30)

- Метод: GET
- URL: `/api/analytics/chart`
- Тело: нет
- Ответ: `200 OK`

```json
{
  "totalLast30Days": "1200000",
  "chartData": [
    { "day": "02", "total": "0" },
    { "day": "03", "total": "150000" },
    { "day": "04", "total": "95000" }
  ]
}
```

### 14) Доли эксклюзивных/обычных объявлений

- Метод: GET
- URL: `/api/analytics/exclusives`
- Тело: нет
- Ответ: `200 OK`

```json
{
  "exclusive": { "count": 3, "percentage": 37.5 },
  "regular": { "count": 5, "percentage": 62.5 },
  "total": 8
}
```

## Формат ошибок

Типовые статусы: 400 (валидация/формат), 401/403 (аутентификация/доступ), 404 (не найдено), 500 (внутренняя ошибка).

Пример (NestJS стандарт):

```json
{ "statusCode": 400, "message": ["Validation error message"], "error": "Bad Request" }
```
