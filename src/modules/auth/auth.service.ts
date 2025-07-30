import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';

import { AdminService } from '@/modules/admin/admin.service';
import {
  AdminJwtPayload,
  AuthUserContext,
  JwtPayload,
  StudentJwtPayload,
} from '@/modules/auth/auth.types';
import { Role } from '@/modules/auth/constants/role.constants';
import {
  AdminLoginRequest,
  AuthAdminDto,
  AuthStudentDto,
  StudentLoginRequest,
} from '@/modules/auth/dto';
import { comparePassword } from '@/modules/auth/utils/hash.utils';
import { StudentService } from '@/modules/student/student.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly studentService: StudentService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly adminService: AdminService,
  ) {}

  async studentLogin(request: StudentLoginRequest) {
    const student = await this.studentService.getStudentByStudentId(request.studentId);
    if (!student || !student.password) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다.');
    }
    const isPasswordMatched = await comparePassword(request.password, student.password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다.');
    }

    const jwtPayload: JwtPayload = {
      sub: {
        student_id: request.studentId,
        role: Role.STUDENT,
      },
    };
    return this.processLogin(student, AuthStudentDto, jwtPayload);
  }

  async adminLogin(request: AdminLoginRequest) {
    const admin = await this.adminService.findAdminByAdminId(request.adminId);

    if (!admin) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다.');
    }
    const isPasswordMatched = await comparePassword(request.password, admin.password);

    if (!isPasswordMatched) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 잘못되었습니다.');
    }

    const jwtPayload: JwtPayload = {
      sub: {
        admin_id: admin.admin_id,
        role: Role.ADMIN,
      },
    };

    return this.processLogin(admin, AuthAdminDto, jwtPayload);
  }

  async refreshToken(user: AuthUserContext): Promise<AuthStudentDto | AuthAdminDto> {
    if (user.role === Role.STUDENT) {
      return this.processStudentRefresh(user);
    }

    if (user.role === Role.ADMIN) {
      return this.processAdminRefresh(user);
    }

    throw new UnauthorizedException('Invalid user role for token refresh.');
  }

  private async processLogin<T, U>(
    user: T,
    outputDto: new () => U,
    jwtPayload: JwtPayload,
  ): Promise<U & { refreshToken: string }> {
    const authToken = this.generateAuthToken(jwtPayload);

    const response = {
      ...user,
      access_token: authToken.access_token,
      refresh_token: authToken.refresh_token,
    };

    return plainToInstance(outputDto, response, {
      excludeExtraneousValues: true,
    }) as U & { refreshToken: string };
  }

  private generateAuthToken(payload: JwtPayload) {
    const authToken = {
      access_token: this.jwtService.sign(payload, {
        expiresIn: this.configService.get('jwt.accessTokenExpiresInSec'),
      }),
      refresh_token: this.jwtService.sign(payload, {
        expiresIn: this.configService.get('jwt.refreshTokenExpiresInSec'),
      }),
    };

    return authToken;
  }

  private async processStudentRefresh(payload: StudentJwtPayload): Promise<AuthStudentDto> {
    const student = await this.studentService.getStudentByStudentId(payload.student_id);
    if (!student) {
      throw new UnauthorizedException('학생 정보를 찾을 수 없습니다.');
    }
    const tokens = this.generateAuthToken({
      sub: payload,
    });
    const result = {
      ...tokens,
      ...student,
    };
    return plainToInstance(AuthStudentDto, result, {
      excludeExtraneousValues: true,
    });
  }

  private async processAdminRefresh(payload: AdminJwtPayload): Promise<AuthAdminDto> {
    const admin = await this.adminService.findAdminByAdminId(payload.admin_id);
    if (!admin) {
      throw new UnauthorizedException('관리자 정보를 찾을 수 없습니다.');
    }
    const tokens = this.generateAuthToken({
      sub: payload,
    });
    const result = {
      ...tokens,
      ...admin,
    };
    return plainToInstance(AuthAdminDto, result, {
      excludeExtraneousValues: true,
    });
  }
}
