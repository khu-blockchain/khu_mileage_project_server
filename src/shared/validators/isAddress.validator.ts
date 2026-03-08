import { isAddress } from '@kaiachain/viem-ext';
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * @description 주소 형식이 올바른지 검사하는 Constraint
 */
@ValidatorConstraint({ name: 'isAddress', async: false })
export class IsAddressConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    return isAddress(value);
  }

  defaultMessage() {
    return `올바른 주소 형식이 아닙니다.`;
  }
}

/**
 * @description 주소 형식이 올바른지 검사하는 데코레이터
 * @param property - 비교할 대상 필드의 이름
 * @param validationOptions - 유효성 검사 옵션
 */
export function IsAddress(validationOptions?: ValidationOptions, property?: string) {
  return function (object: object, propertyName?: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName!,
      options: validationOptions,
      validator: IsAddressConstraint,
      constraints: [property],
    });
  };
}
