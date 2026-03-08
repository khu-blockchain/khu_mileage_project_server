import { MILEAGE_STATUS } from '../constants/mileage-status.enum'; // enum 정의된 곳

export function getMileageEmailTemplate(type: MILEAGE_STATUS, content: any): string {
  switch (type) {
    case MILEAGE_STATUS.REVIEWING:
      return `
        <html>
        <body style="font-family: Arial, sans-serif; background:#f5f7fb; padding:20px;">
          <h2 style="color:#1f3aec;">마일리지 신청 접수 안내</h2>
          <p>안녕하세요, ${content.student.name}학생의 신청이 접수되었습니다.</p>
          <p>현재 상태는 <b style="color:#eab308;">심사중(REVIEWING)</b> 상태입니다.</p>
          <table style="border:1px solid #ddd; border-collapse:collapse; margin-top:15px;">
            <tr><td style="padding:8px; border:1px solid #ddd;">카테고리</td><td style="padding:8px; border:1px solid #ddd;">${content.mileage_category_name}</td></tr>
            <tr><td style="padding:8px; border:1px solid #ddd;">활동명</td><td style="padding:8px; border:1px solid #ddd;">${content.mileage_activity_name}</td></tr>
            <tr><td style="padding:8px; border:1px solid #ddd;">설명</td><td style="padding:8px; border:1px solid #ddd;">${content.mileage_description}</td></tr>
          </table>
          <p style="margin-top:20px; color:#6b7280; font-size:12px;">자세한 내용은 관리자 페이지를 확인해주세요.</p>
        </body>
        </html>
      `;

    case MILEAGE_STATUS.APPROVED:
      return `
        <html>
        <body style="font-family: Arial, sans-serif; background:#f5f7fb; padding:20px;">
          <h2 style="color:#16a34a;">마일리지 승인 완료</h2>
          <p>안녕하세요, ${content.mileage.student?.name || ''}님.</p>
          <p>귀하의 마일리지 신청이 <b style="color:#16a34a;">승인(APPROVED)</b>되었습니다.</p>
          <table style="border:1px solid #ddd; border-collapse:collapse; margin-top:15px;">
            <tr><td style="padding:8px; border:1px solid #ddd;">활동명</td><td style="padding:8px; border:1px solid #ddd;">${content.mileage_activity_name}</td></tr>
            <tr><td style="padding:8px; border:1px solid #ddd;">카테고리</td><td style="padding:8px; border:1px solid #ddd;">${content.mileage_category_name}</td></tr>
            <tr><td style="padding:8px; border:1px solid #ddd;">포인트</td><td style="padding:8px; border:1px solid #ddd; font-weight:bold; color:#1f3aec;">${content.mileage_point}점</td></tr>
          </table>
          <p style="margin-top:20px; color:#6b7280; font-size:12px;">승인 내역은 마이페이지에서 확인 가능합니다.</p>
        </body>
        </html>
      `;

    case MILEAGE_STATUS.REJECTED:
      return `
        <html>
        <body style="font-family: Arial, sans-serif; background:#f5f7fb; padding:20px;">
          <h2 style="color:#dc2626;">마일리지 신청 반려 안내</h2>
          <p>안녕하세요, ${content.student?.name || ''}님.</p>
          <p>귀하의 마일리지 신청이 <b style="color:#dc2626;">반려(REJECTED)</b>되었습니다.</p>
          <p><b></p>
          <table style="border:1px solid #ddd; border-collapse:collapse; margin-top:15px;">
            <tr><td style="padding:8px; border:1px solid #ddd;">활동명</td><td style="padding:8px; border:1px solid #ddd;">${content.mileage_activity_name}</td></tr>
            <tr><td style="padding:8px; border:1px solid #ddd;">카테고리</td><td style="padding:8px; border:1px solid #ddd;">${content.mileage_category_name}</td></tr>
            <tr><td style="padding:8px; border:1px solid #ddd;">사유</td><td style="padding:8px; border:1px solid #ddd; font-weight:bold; color:#dc2626;">${content.admin_comment || '관리자 검토 결과 반려되었습니다.'}</td></tr>
          </table>
          <p style="margin-top:20px; color:#6b7280; font-size:12px;">자세한 내용은 관리자에게 문의 바랍니다.</p>
        </body>
        </html>
      `;

    default:
      return `<p>알 수 없는 상태입니다.</p>`;
  }
}