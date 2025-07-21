import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * @description 두 필드의 값이 일치하는지 검사하는 Constraint
 */
@ValidatorConstraint({ name: 'match', async: false })
export class MatchConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return value === relatedValue;
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `$property 필드는 ${relatedPropertyName} 필드와 일치해야 합니다.`;
  }
}

/**
 * @description 두 필드의 값이 일치하는지 검사하는 데코레이터
 * @param property - 비교할 대상 필드의 이름
 * @param validationOptions - 유효성 검사 옵션
 */
export function Match(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: MatchConstraint,
    });
  };
} 