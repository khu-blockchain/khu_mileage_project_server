# NestJS 인증/인가 구현 가이드 (대화 내용)

이 문서는 Express.js의 미들웨어 기반 인증을 NestJS의 가드(Guard)와 데코레이터(Decorator)를 사용하여 구현하는 방법에 대한 대화 내용을 정리한 것입니다.

---

### **첫 번째 질문: Express의 `auth(ROLE.ADMIN)`를 NestJS로 구현하기**

> **사용자 질문:**
> 이 부분의 auth(ROLE.ADMIN)부분을 nestjs에서 구현한다면 어떻게 구혀할 수 있을까?

안녕하세요! legacy Express.js 프로젝트의 `auth(ROLE.ADMIN)`과 같은 역할을 하는 인증 및 인가 미들웨어를 NestJS에서 어떻게 구현할 수 있는지 설명해 드리겠습니다.

NestJS에서는 주로 **가드(Guards)** 와 **데코레이터(Decorators)** 를 사용하여 이 기능을 구현합니다.

요청하신 기능의 흐름은 다음과 같습니다.
1.  사용자가 특정 권한(예: `ADMIN`)을 요구하는 API를 요청합니다.
2.  API 핸들러에 적용된 `AuthGuard`가 먼저 실행되어, 사용자가 유효한 JWT 토큰을 가지고 있는지(인증되었는지) 확인합니다.
3.  인증이 통과되면, `RolesGuard`가 실행되어 사용자가 해당 API를 호출하는 데 필요한 권한(e.g., `ADMIN`)을 가지고 있는지 확인합니다.
4.  모든 검사를 통과하면, 컨트롤러의 로직이 실행됩니다.

아래에 단계별 구현 방법을 보여드리겠습니다.

#### 1. 역할(Role)을 지정하는 데코레이터 생성

먼저, 각 라우트 핸들러에 필요한 역할을 지정할 수 있는 커스텀 데코레이터를 만듭니다.

**`src/modules/auth/decorators/roles.decorator.ts`**
```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum'; // Role Enum의 경로에 맞게 수정해주세요.

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```
*(만약 `Role` enum이 없다면, `export enum Role { ADMIN = 'ADMIN', USER = 'USER' }` 와 같이 생성해주시면 됩니다.)*

#### 2. 역할 기반 접근을 제어하는 `RolesGuard` 생성

다음으로, 위에서 만든 `@Roles` 데코레이터로 지정된 역할과 현재 접속한 유저의 역할을 비교하는 가드를 만듭니다.

**`src/modules/auth/guards/roles.guard.ts`**
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // 역할이 지정되지 않은 API는 누구나 접근 가능
    }
    const { user } = context.switchToHttp().getRequest();
    // user 객체가 없거나 user.role이 없으면 false를 반환합니다.
    // 이는 AuthGuard가 RolesGuard보다 먼저 실행되어야 함을 의미합니다.
    return requiredRoles.some((role) => user?.role === role);
  }
}
```

#### 3. 인증을 확인하는 `AuthGuard` 설정

NestJS는 Passport.js 라이브러리와의 통합을 통해 인증을 쉽게 처리할 수 있습니다. 이미 `JwtStrategy`가 설정되어 있다고 가정하겠습니다. `JwtAuthGuard`는 `passport-jwt` 전략을 사용하여 요청 헤더의 JWT를 검증합니다.

**`src/modules/auth/guards/jwt-auth.guard.ts`**
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

#### 4. 컨트롤러에 적용하기

이제 위에서 만든 요소들을 컨트롤러에 적용할 차례입니다. `admin` 모듈의 컨트롤러를 예시로 보여드리겠습니다.

**`src/modules/admin/admin.controller.ts`**
```typescript
import { Controller, Put, Param, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // 경로 수정 필요
import { RolesGuard } from '../auth/guards/roles.guard'; // 경로 수정 필요
import { Roles } from '../auth/decorators/roles.decorator'; // 경로 수정 필요
import { Role } from '../auth/enums/role.enum'; // 경로 수정 필요

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ... 다른 메소드들

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard) // 1. 인증 가드, 2. 권한 가드 순으로 적용
  @Roles(Role.ADMIN) // ADMIN 역할이 필요함을 명시
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(+id, updateAdminDto);
  }

  // ...
}
```

---

### **두 번째 질문: JWT Payload의 `role_id`로 권한 확인하기**

> **사용자 질문:**
> jwt의 payload를 decode 해서 role_id를 얻고, 그 값을 바탕으로 role 권한 확인을 한다면

네, 알겠습니다. JWT payload에 포함된 `role_id`를 사용하여 역할 기반 권한을 확인하는 NestJS 코드를 더 구체적으로 설명해 드리겠습니다.

#### 1. 역할(Role) Enum 정의

`src/modules/auth/enums/role.enum.ts`
```typescript
export enum Role {
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}
```

#### 2. `JwtStrategy` 구현

`src/modules/auth/strategies/jwt.strategy.ts`
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// JWT payload의 타입을 정의합니다.
interface JwtPayload {
  sub: number; // 사용자 ID
  role_id: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'), // .env 파일 등에서 JWT 시크릿 키를 가져옵니다.
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !payload.role_id) {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
    
    // role_id를 포함한 사용자 정보를 반환합니다.
    return { userId: payload.sub, roleId: payload.role_id };
  }
}
```

#### 3. `RolesGuard`에서 `role_id` 사용하기

`src/modules/auth/guards/roles.guard.ts`
```typescript
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

const ROLE_ID_TO_NAME_MAP = {
  1: Role.ADMIN,
  2: Role.STUDENT,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    if (!user || !user.roleId) {
        return false;
    }
    
    const userRoleName = ROLE_ID_TO_NAME_MAP[user.roleId];
    
    return requiredRoles.some((role) => role === userRoleName);
  }
}
```

#### 4. 컨트롤러에 최종 적용

`src/modules/admin/admin.controller.ts`
```typescript
import { Controller, Put, Param, Body, UseGuards, Get } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll() {
    return this.adminService.findAll();
  }

  @Put(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateAdminDto: UpdateAdminDto) {
    return this.adminService.update(+id, updateAdminDto);
  }
}
```

---

### **세 번째 질문: Guard 간 데이터 전달 방법**

> **사용자 질문:**
> @UseGuards(JwtAuthGuard, RolesGuard) 이 과정에서 jwtAuthGuard의 리턴객체가 RolesGuard에게 값을 전달하는 방법에 대해 설명해줘

`JwtAuthGuard`는 `RolesGuard`에게 직접 값을 `return`하여 전달하지 않습니다. 대신 **실행 컨텍스트(Execution Context)의 `request` 객체를 수정**함으로써 정보를 공유합니다.

#### **1단계: `JwtAuthGuard` 실행**

1.  `JwtAuthGuard`가 실행됩니다.
2.  내부적으로 `JwtStrategy`를 호출합니다.
3.  `JwtStrategy`의 `validate` 메소드가 `return { userId: payload.sub, roleId: payload.role_id };` 와 같이 객체를 반환합니다.
4.  Passport.js는 이 반환된 객체를 **`request.user`에 자동으로 할당합니다.**
5.  `JwtAuthGuard`는 다음 가드(`RolesGuard`)로 제어권을 넘깁니다.

#### **2단계: `RolesGuard` 실행**

1.  `RolesGuard`의 `canActivate` 메소드가 **동일한 실행 컨텍스트**를 인자로 받아 실행됩니다.
2.  `RolesGuard`는 `context.switchToHttp().getRequest()`를 통해 `request` 객체에 접근합니다.
3.  `const { user } = request;` 와 같이 코드를 작성하여 `JwtAuthGuard`가 저장해 둔 사용자 정보(`{ userId: 1, roleId: 1 }`)를 가져와 사용할 수 있습니다.

---

### **네 번째 질문: `request.user` 키 커스터마이징**

> **사용자 질문:**
> user라는 키에 user 객체를 저장하는건 passport에서 지정한 것인지, 어떤 key에 jwtauthguard에서 리턴한 객체를 저장할지 지정할 수 있는지?

#### **1. `user`는 Passport.js에서 지정한 키인가요?**

**네, 맞습니다.** `request.user`는 Passport.js의 오랜 관례(convention)이자 기본 동작 방식입니다.

#### **2. 저장할 키를 지정할 수 있나요?**

**네, 가능합니다.** `AuthGuard`를 상속받는 커스텀 가드를 만들고 `handleRequest` 메소드를 오버라이딩하면 됩니다.

**`src/modules/auth/guards/custom-jwt-auth.guard.ts`**
```typescript
import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class CustomJwtAuthGuard extends AuthGuard('jwt') {
  
  handleRequest(err, user, info, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException('인증 정보가 유효하지 않습니다.');
    }

    const request = context.switchToHttp().getRequest();
    
    // 'user' 대신 'authInfo'라는 키에 사용자 정보를 저장합니다.
    request.authInfo = user;

    // 반드시 user 객체를 반환해야 합니다.
    return user;
  }
}
```
이후 `RolesGuard`에서는 `request.authInfo`를 사용하고, 컨트롤러에서는 `@UseGuards(CustomJwtAuthGuard, RolesGuard)`를 사용해야 합니다.

**권장사항**: 특별한 이유가 없다면 호환성과 예측 가능성을 위해 Passport.js의 기본 관례인 `user` 키를 그대로 사용하는 것을 권장합니다.

---

### **다섯 번째 질문: 인증/인가 에러 발생시키기**

> **사용자 질문:**
> 인증과 관련된 에러를 발생시키고 싶다묜?

#### **1. 사용자 정보가 유효하지 않을 때 (`JwtStrategy`)**

JWT는 유효하나 payload의 사용자가 DB에 없거나 비활성화된 경우, `JwtStrategy`의 `validate` 메소드에서 `UnauthorizedException`을 발생시킵니다.

`src/modules/auth/strategies/jwt.strategy.ts`
```typescript
// ...
import { AdminService } from 'src/modules/admin/admin.service'; // 사용자 조회를 위한 서비스 주입

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly adminService: AdminService,
  ) { /* ... */ }

  async validate(payload: { sub: number, roleId: number }) {
    const user = await this.adminService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }
    
    return { userId: user.id, roleId: user.roleId };
  }
}
```

#### **2. 권한이 부족할 때 (`RolesGuard`)**

인증은 통과했으나 역할(Role)이 맞지 않는 경우, `RolesGuard`에서 `ForbiddenException`을 발생시킵니다.

`src/modules/auth/guards/roles.guard.ts`
```typescript
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
// ...

@Injectable()
export class RolesGuard implements CanActivate {
  // ... constructor ...

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = /* ... */;
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    const userRoleName = ROLE_ID_TO_NAME_MAP[user?.roleId];
    const hasRole = () => requiredRoles.some((role) => role === userRoleName);

    if (user && hasRole()) {
      return true;
    }

    throw new ForbiddenException('이 작업을 수행할 권한이 없습니다.');
  }
}
```

#### **3. 토큰 자체가 문제일 때 (자동 처리)**

토큰이 없거나, 만료되었거나, 서명이 잘못된 경우 등은 `AuthGuard('jwt')`가 자동으로 `401 Unauthorized` 에러를 발생시킵니다. 