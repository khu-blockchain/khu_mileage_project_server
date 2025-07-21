import { Controller, Get, Post, Body, UseGuards, Query, Param } from '@nestjs/common';
import { StudentService } from './student.service';
import { BaseApiResponse } from '@/shared/dtos/base-api-response.dto';
import { plainToInstance } from 'class-transformer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/constants/role.constants';
import {
  BaseStudentDto,
  ConfirmWalletChangeRequest,
  CreateStudentRequest,
  CreateWalletChangeRequest,
  GetStudentsRequest,
} from './dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { StudentJwtPayload } from '../auth/auth.types';
import { SuccessResponse } from '@/shared/dtos/success-response.dto';

@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  async createStudent(
    @Body() request: CreateStudentRequest,
  ): Promise<BaseApiResponse<BaseStudentDto>> {
    const newStudentEntity = await this.studentService.createStudent(request);

    const result = plainToInstance(BaseStudentDto, newStudentEntity, {
      excludeExtraneousValues: true,
    });

    return {
      data: result,
      meta: {},
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async getMyStudent(
    @CurrentUser() user: StudentJwtPayload,
  ): Promise<BaseApiResponse<BaseStudentDto>> {
    const student = await this.studentService.getStudentByStudentId(user.student_id);

    const result = plainToInstance(BaseStudentDto, student, {
      excludeExtraneousValues: true,
    });

    return {
      data: result,
      meta: {},
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getStudents(
    @Query() query: GetStudentsRequest,
  ): Promise<BaseApiResponse<BaseStudentDto[]>> {
    const { students, total } = await this.studentService.getStudents(query);
    const result = plainToInstance(BaseStudentDto, students, {
      excludeExtraneousValues: true,
    });

    return {
      data: result,
      meta: {
        total,
        lastPage: Math.ceil(total / query.limit),
      },
    };
  }

  @Get(':studentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getStudentByStudentId(
    @Param('studentId') studentId: string,
  ): Promise<BaseApiResponse<BaseStudentDto>> {
    const student = await this.studentService.getStudentByStudentId(studentId);

    const result = plainToInstance(BaseStudentDto, student, {
      excludeExtraneousValues: true,
    });

    return {
      data: result,
      meta: {},
    };
  }

  @Post('wallet-change/create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async createWalletChange(
    @CurrentUser() user: StudentJwtPayload,
    @Body() request: CreateWalletChangeRequest,
  ): Promise<BaseApiResponse<SuccessResponse>> {
    const result = await this.studentService.createWalletChange(user.student_id, request);

    return {
      data: plainToInstance(SuccessResponse, result, {
        excludeExtraneousValues: true,
      }),
      meta: {},
    };
  }

  @Post('wallet-change/confirm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.STUDENT)
  async confirmWalletChange(
    @CurrentUser() user: StudentJwtPayload,
    @Body() request: ConfirmWalletChangeRequest,
  ): Promise<BaseApiResponse<SuccessResponse>> {
    const result = await this.studentService.confirmWalletChange(user.student_id, request);

    return {
      data: plainToInstance(SuccessResponse, result, {
        excludeExtraneousValues: true,
      }),
      meta: {},
    };
  }
}
