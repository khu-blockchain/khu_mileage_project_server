import { Expose } from 'class-transformer';

export class AuthTokensDto {
  @Expose()
  access_token: string;

  @Expose()
  refresh_token: string;
}
