import { BaseAdminDto } from '@/modules/admin/dto/response/base-admin.dto';
import { IntersectionType } from '@nestjs/mapped-types';
import { AuthTokensDto } from './auth-tokens.dto';

export class AuthAdminDto extends IntersectionType(BaseAdminDto, AuthTokensDto) {}
