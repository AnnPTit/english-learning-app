/**
 * App chỉ dùng cho người Việt Nam, nên mọi khái niệm "ngày" đều tính theo giờ
 * Việt Nam (UTC+7) bất kể server (Docker container) đang chạy múi giờ gì.
 */
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

const WEEKDAYS_VI = [
  "Chủ nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

/** Trả về ngày hôm nay theo giờ VN, dạng "YYYY-MM-DD". */
export function todayDateString(): string {
  return new Date(Date.now() + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** Cộng/trừ số ngày vào một chuỗi "YYYY-MM-DD" (thuần lịch, không liên quan múi giờ). */
export function addDays(dateStr: string, delta: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Hiển thị đẹp, ví dụ "Thứ Ba, 21/10/2026". */
export function formatDateVi(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const weekday = WEEKDAYS_VI[d.getUTCDay()];
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${weekday}, ${day}/${month}/${year}`;
}

/** Hiển thị ngắn, ví dụ "21/10". */
export function formatDateShortVi(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}
