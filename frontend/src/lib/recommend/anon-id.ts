const STORAGE_KEY = "downbeat.anonId";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let inMemoryAnonId: string | null = null;

function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Lấy anonId của trình duyệt (plan §6.1).
 * Đọc localStorage["downbeat.anonId"]; không có hoặc không đúng UUID thì sinh mới và lưu.
 * Mọi thao tác đọc / ghi bọc try/catch; lỗi → dùng mã tạm trong bộ nhớ (TC-34).
 */
export function getAnonId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && UUID_REGEX.test(stored)) {
      return stored;
    }
    const newId = generateUuid();
    localStorage.setItem(STORAGE_KEY, newId);
    return newId;
  } catch {
    if (!inMemoryAnonId) {
      inMemoryAnonId = generateUuid();
    }
    return inMemoryAnonId;
  }
}
