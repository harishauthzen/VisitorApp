
import {
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

export function NoEmoji(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'noEmoji',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return true;

          const emojiRegex =
            /[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u20E3]/u;

          return !emojiRegex.test(value);
        },
        defaultMessage(): string {
          return `${propertyName} must not contain emojis or icons`;
        },
      },
    });
  };
}
