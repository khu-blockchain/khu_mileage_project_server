const catchAsync = require("../utils/catchAsync");
const {
  authService,
  adminService,
  caverService,
  swMileageService,
  swMileageTokenService,
} = require("../services");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const config = require("../config/config");
const {
  GetStudentListDTO,
  CreateStudentDTO,
  UpdateStudentDTO,
} = require("../dtos/student.dto");
const constants = require("../config/constants");
const {
  GetAdminListDTO,
  UpdateAdminDTO,
  CreateAdminDTO,
} = require("../dtos/admin.dto");

const getAdminList = catchAsync(async (req, res) => {
  const getAdminListDTO = new GetAdminListDTO({
    ...req.query,
    ...req.params,
    ...req.body,
  });
  const adminList = await adminService.getAdminList(getAdminListDTO);

  return res.status(httpStatus.OK).json(adminList);
});

const createAdmin = catchAsync(async (req, res) => {
  // validation : password and passwordConfirm is equal
  const { password, passwordConfirm } = {
    ...req.query,
    ...req.params,
    ...req.body,
  };
  if (password !== passwordConfirm) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "password and passwordConfirm must be equal"
    );
  }

  const { adminId } = { ...req.query, ...req.params, ...req.body };
  if (await adminService.getAdminById(adminId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "adminId already used");
  }

  const md5password = authService.hashPassword(password);
  const salt = authService.generateSalt();
  const hashPassword = authService.getSaltPassword(salt, md5password);

  //createAdmin은 RootAdmin만 가능합니다. 따라서 트랜잭션 서명 및 전송을 서버에서 진행해야 합니다.
  try {
    const { walletAddress } = { ...req.body };
    const result = await caverService.addAdminByFeePayer(
      walletAddress,
      config.contract.studentManagerContractAddress
    );

    const createAdminDTO = new CreateAdminDTO({
      ...req.query,
      ...req.params,
      ...req.body,
      role: constants.ROLE.ADMIN,
      salt,
      password: hashPassword,
      transactionHash: result.transactionHash,
    });
    const admin = await adminService.createAdmin(createAdminDTO);

    return res.status(httpStatus.CREATED).json({
      ...admin,
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
});

const getAdminById = catchAsync(async (req, res) => {
  const { role, adminId: verifiedAdminId } = { ...req.verifiedPayload };
  const { adminId } = { ...req.query, ...req.params, ...req.body };

  if (role === constants.ROLE.ADMIN && verifiedAdminId !== adminId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client");
  }

  const admin = await adminService.getAdminById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "admin not found");
  }

  return res.status(httpStatus.OK).json(admin);
});

const updateAdmin = catchAsync(async (req, res) => {
  const { role, adminId: verifiedAdminId } = { ...req.verifiedPayload };
  const { adminId } = { ...req.query, ...req.params, ...req.body };
  if (role === constants.ROLE.ADMIN && verifiedAdminId !== adminId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client");
  }
  // wallet 주소 변경 시 admin 수정
  const admin = await adminService.getAdminById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "admin not found");
  }

  const updateAdminDTO = new UpdateAdminDTO({
    ...req.query,
    ...req.params,
    ...req.body,
  }); // TODO : body require 처리

  if (!await adminService.isValidAddress(adminId, updateAdminDTO.wallet_address)) {
    console.log('init');
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid wallet address");
  }

  try {
    const updatedAdmin = await adminService.updateAdmin(
      adminId,
      updateAdminDTO
    );
    if (admin.wallet_address != updateAdminDTO.wallet_address) {
      await caverService.removeAdminByFeePayer(
        admin.wallet_address,
        config.contract.studentManagerContractAddress
      );
      await caverService.addAdminByFeePayer(
        updateAdminDTO.wallet_address,
        config.contract.studentManagerContractAddress
      );
    }

    return res.status(httpStatus.OK).json(updatedAdmin);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
});

const deleteAdmin = catchAsync(async (req, res) => {
  const { role, adminId: verifiedAdminId } = { ...req.verifiedPayload };
  console.log(role, verifiedAdminId);
  const { adminId } = { ...req.query, ...req.params, ...req.body };
  if (role === constants.ROLE.ADMIN && verifiedAdminId !== adminId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized client");
  }

  const admin = await adminService.getAdminById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, "admin not found");
  }
  try {
    await adminService.deleteAdmin(adminId);
    const result = await caverService.removeAdminByFeePayer(
      admin.wallet_address,
      config.contract.studentManagerContractAddress
    );
    console.log("remove admin result", result);

    return res.sendStatus(httpStatus.NO_CONTENT);
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
});

module.exports = {
  getAdminList,
  createAdmin,
  getAdminById,
  updateAdmin,
  deleteAdmin,
};
