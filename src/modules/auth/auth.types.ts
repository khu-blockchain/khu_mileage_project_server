import { Role } from './constants/role.constants';

export type JwtPayload = {
  sub: AdminJwtPayload | StudentJwtPayload;
};

export type AdminJwtPayload = {
  admin_id: string;
  role: Role.ADMIN;
};

export type StudentJwtPayload = {
  student_id: string;
  role: Role.STUDENT;
};

export type AuthUserContext = AdminJwtPayload | StudentJwtPayload;
