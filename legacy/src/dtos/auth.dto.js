class VerifiedPayloadDTO {
    constructor({ role, studentId, adminId }) {
        this.role = role
        this.studentId = studentId
        this.adminId = adminId
    }
}

module.exports = {
    VerifiedPayloadDTO,
};
