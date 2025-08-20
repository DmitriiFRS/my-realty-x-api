import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

type Translatable = {
  translations?: { locale: string; [key: string]: any }[];
  [key: string]: any;
};

@Injectable()
export class TranslationService {
  translate<T extends Translatable>(
    data: T | T[],
    locale: string,
    defaultLocale = 'ru',
  ): T | T[] {
    if (Array.isArray(data)) {
      return data.map((item) =>
        this.translateEntity(item, locale, defaultLocale),
      );
    }
    return this.translateEntity(data, locale, defaultLocale);
  }

  translateDeep<T>(
    data: T,
    locale: string,
    defaultLocale = 'ru',
    _depth = 0,
  ): T {
    // Базовый случай: если данные не являются объектом, возвращаем их как есть
    if (data === null || typeof data !== 'object') {
      return data;
    }
    if (data instanceof Date) {
      return data;
    }
    if (Prisma.Decimal.isDecimal(data)) {
      return data.toNumber() as T;
    }

    // Если это массив, применяем рекурсию к каждому элементу
    if (Array.isArray(data)) {
      return data.map((item) =>
        this.translateDeep(item, locale, defaultLocale, _depth + 1),
      ) as T;
    }

    // Создаем копию объекта, чтобы не изменять оригинал
    const translatedObject = { ...data };

    // Сначала переводим сам объект верхнего уровня, если он переводимый
    const resultAfterSelfTranslation = this.translateEntity(
      translatedObject as any,
      locale,
      defaultLocale,
    );

    // Рекурсивно обходим все ключи переведенного объекта
    for (const key in resultAfterSelfTranslation) {
      if (
        Object.prototype.hasOwnProperty.call(resultAfterSelfTranslation, key)
      ) {
        const value = resultAfterSelfTranslation[key];

        resultAfterSelfTranslation[key] = this.translateDeep(
          value,
          locale,
          defaultLocale,
          _depth + 1,
        );
      }
    }

    return resultAfterSelfTranslation;
  }

  private translateEntity<T extends Translatable>(
    entity: T,
    locale: string,
    defaultLocale: string,
  ): T {
    if (!entity || !entity.translations || entity.translations.length === 0) {
      return entity;
    }
    const translations = entity.translations;
    let translation = translations.find((t) => t.locale === locale);
    if (!translation) {
      translation = translations.find((t) => t.locale === defaultLocale);
    }
    if (!translation) {
      delete entity.translations;
      return entity;
    }

    const translatedEntity = { ...entity };
    if (translation) {
      for (const key in translation) {
        if (
          key === 'id' ||
          key === 'locale' ||
          key.endsWith('Id') ||
          !Object.prototype.hasOwnProperty.call(translatedEntity, key)
        ) {
          continue;
        }
        (translatedEntity as Record<string, any>)[key] = translation[key];
      }
    }

    delete translatedEntity.translations;
    return translatedEntity;
  }
}
