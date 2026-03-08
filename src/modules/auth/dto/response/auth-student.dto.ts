import { IntersectionType } from '@nestjs/mapped-types';

import { BaseStudentDto } from '@/modules/student/dto/response/base-student.dto';

import { AuthTokensDto } from './auth-tokens.dto';

export class AuthStudentDto extends IntersectionType(BaseStudentDto, AuthTokensDto) {}
