const catchAsync = require("../utils/catchAsync");
const {
  authService,
  studentService,
  jwtService,
  cookieService,
  adminService,
  caverService,
} = require("../services");
const httpStatus = require("http-status");
const constants = require("../config/constants");
const ApiError = require("../utils/ApiError");

const adminLogin = catchAsync(async (req, res) => {
  const { loginType, id, password, keyRing } = {
    ...req.query,
    ...req.params,
    ...req.body,
  };

  const adminDTO = await adminService.getAdminById(id);
  if (!adminDTO) {
    throw new ApiError(httpStatus.NOT_FOUND, "admin not found");
  }

  const { password: hashPassword, salt } =
    await adminService.getAdminPasswordAndSaltById(id);
  const md5password = authService.hashPassword(password);
  const saltPassword = authService.getSaltPassword(salt, md5password);
  if (saltPassword !== hashPassword) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "wrong password");
  }

  // await caverService.addAdminKeyring(keyRing);

  const tokens = await jwtService.generateAdminAuthTokens(adminDTO);

  const refreshToken = tokens.filter(
    (token) => token.token_type === constants.TOKEN_TYPE.REFRESH
  );
  cookieService.setCookie(
    res,
    constants.COOKIE.ADMIN,
    refreshToken[0].token,
    refreshToken[0].expires
  );

  return res.status(httpStatus.OK).json({
    admin: adminDTO,
    tokens,
  });

  // return res.sendStatus(httpStatus.CONFLICT, "not supported login type");
});

const studentLogin = catchAsync(async (req, res) => {
  const { loginType, id, password, keyRing } = {
    ...req.query,
    ...req.params,
    ...req.body,
  };
  const studentDTO = await studentService.getStudentById(id);
  if (!studentDTO) {
    throw new ApiError(httpStatus.NOT_FOUND, "student not found");
  }

  const { password: hashPassword, salt } =
    await studentService.getStudentPasswordAndSaltById(id);
  const md5password = authService.hashPassword(password);
  const saltPassword = await authService.getSaltPassword(salt, md5password);
  if (saltPassword !== hashPassword) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "wrong password");
  }

  const tokens = await jwtService.generateStudentAuthTokens(studentDTO);

  const refreshToken = tokens.filter(
    (token) => token.token_type === constants.TOKEN_TYPE.REFRESH
  );
  cookieService.setCookie(
    res,
    constants.COOKIE.STUDENT,
    refreshToken[0].token,
    refreshToken[0].expires
  );

  return res.status(httpStatus.OK).json({
    student: studentDTO,
    tokens,
  });
  // return res.sendStatus(httpStatus.CONFLICT, "not supported login type");
});

const refreshStudentToken = catchAsync(async (req, res) => {
  //TODO: Expires at 검증 로직은 구현이 필요 없는지 확인이 필요할 것 같습니다.
  console.log(req.cookies)
  const refreshTokenFromCookie = req.cookies?.[constants.COOKIE.STUDENT];

  if (!refreshTokenFromCookie) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token not found in cookie");
  }

  const jwtPayload = jwtService.getJwtPayload(refreshTokenFromCookie);

  if (!jwtPayload) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Token");
  }
  if (jwtPayload.type !== constants.TOKEN_TYPE.REFRESH) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Token Type");
  }

  if (!jwtPayload?.sub?.studentId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Token for student refresh");
  }
  
  const studentDTO = await studentService.getStudentById(
    jwtPayload?.sub?.studentId
  );
  if (!studentDTO) {
    throw new ApiError(httpStatus.NOT_FOUND, "student not found");
  }
  const tokens = await jwtService.generateStudentAuthTokens(studentDTO);

  const newRefreshToken = tokens.filter(
    (token) => token.token_type === constants.TOKEN_TYPE.REFRESH
  );
  cookieService.setCookie(
    res,
    constants.COOKIE.STUDENT,
    newRefreshToken[0].token,
    newRefreshToken[0].expires
  );

  return res.status(httpStatus.OK).json({
    student: studentDTO,
    tokens,
  });
});

const refreshAdminToken = catchAsync(async (req, res) => {
  //TODO: Expires at 검증 로직은 구현이 필요 없는지 확인이 필요할 것 같습니다.
  const refreshTokenFromCookie = req.cookies?.[constants.COOKIE.ADMIN];

  if (!refreshTokenFromCookie) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token not found in cookie");
  }

  const jwtPayload = jwtService.getJwtPayload(refreshTokenFromCookie);

  if (!jwtPayload) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Token");
  }
  if (jwtPayload.type !== constants.TOKEN_TYPE.REFRESH) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Token Type");
  }

  if (!jwtPayload?.sub?.adminId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Token for admin refresh");
  }
  
  const adminDTO = await adminService.getAdminByPK(jwtPayload?.sub?.adminId);
  if (!adminDTO) {
    throw new ApiError(httpStatus.NOT_FOUND, "admin not found");
  }

  const tokens = await jwtService.generateAdminAuthTokens(adminDTO);
  const newRefreshToken = tokens.filter(
    (token) => token.token_type === constants.TOKEN_TYPE.REFRESH
  );
  cookieService.setCookie(
    res,
    constants.COOKIE.ADMIN,
    newRefreshToken[0].token,
    newRefreshToken[0].expires
  );

  return res.status(httpStatus.OK).json({
    admin: adminDTO,
    tokens,
  });
});

// const refreshToken = catchAsync(async (req, res) => {

//   //TODO: Expires at 검증 로직은 구현이 필요 없는지 확인이 필요할 것 같습니다.
//   //TODO: 또한, refresh도 라우터 분리가 필요할 지 고민해봐야할 것 같습니다.
  
//   const refreshToken = req.cookies?.[constants.COOKIE.STUDENT]; // 수정된 부분: req.body -> req.cookies
//   if (!refreshToken) { // 추가된 부분: 쿠키에 토큰이 없는 경우 오류 처리
//     throw new ApiError(httpStatus.UNAUTHORIZED, "Refresh token not found in cookie");
//   }
//   const jwtPayload = jwtService.getJwtPayload(refreshToken);

//   if (!jwtPayload) {
//     throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Token");
//   }
//   if (jwtPayload.type !== constants.TOKEN_TYPE.REFRESH) {
//     throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Token Type");
//   }

//   if (jwtPayload?.sub?.studentId) {
//     const studentDTO = await studentService.getStudentById(
//       jwtPayload?.sub?.studentId
//     );
//     if (!studentDTO) {
//       throw new ApiError(httpStatus.NOT_FOUND, "student not found");
//     }
//     const tokens = await jwtService.generateStudentAuthTokens(studentDTO);

//     const newRefreshTokenArray = tokens.filter( // 변수명 변경: refreshToken -> newRefreshTokenArray
//       (token) => token.token_type === constants.TOKEN_TYPE.REFRESH
//     );
//     cookieService.setCookie(
//       res,
//       constants.COOKIE.NAME,
//       newRefreshTokenArray[0].token, // 변수명 변경
//       newRefreshTokenArray[0].expires // 변수명 변경
//     );

//     return res.status(httpStatus.OK).json({
//       student: studentDTO,
//       tokens,
//     });
//   } else if (jwtPayload?.sub?.adminId) {
//     const adminDTO = await adminService.getAdminByPK(jwtPayload?.sub?.adminId);
//     if (!adminDTO) {
//       throw new ApiError(httpStatus.NOT_FOUND, "admin not found");
//     }

//     const tokens = await jwtService.generateAdminAuthTokens(adminDTO);
//     const newRefreshTokenArray = tokens.filter( // 변수명 변경: refreshToken -> newRefreshTokenArray
//       (token) => token.token_type === constants.TOKEN_TYPE.REFRESH
//     );
//     cookieService.setCookie(
//       res,
//       constants.COOKIE.NAME,
//       newRefreshTokenArray[0].token, // 변수명 변경
//       newRefreshTokenArray[0].expires // 변수명 변경
//     );

//     return res.status(httpStatus.OK).json({
//       admin: adminDTO,
//       tokens,
//     });
//   } else {
//     throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid Token");
//   }
// });

module.exports = {
  // login,
  studentLogin,
  adminLogin,
  // refreshToken, // 기존 refreshToken 주석 처리 또는 삭제
  refreshStudentToken, // 새로 추가
  refreshAdminToken, // 새로 추가
};
