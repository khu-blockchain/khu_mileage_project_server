import { Expose, Type } from 'class-transformer';

class TokenDetails {
  @Expose()
  token: string;

  @Expose()
  expires_in: number;
}

export class AuthTokensDto {
  @Expose()
  @Type(() => TokenDetails)
  access_token: TokenDetails;

  @Expose()
  @Type(() => TokenDetails)
  refresh_token: TokenDetails;
}
