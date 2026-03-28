export const normalizeUsPhoneNumber = (raw: string): string | null => {
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+1${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+${digits}`;
  }

  return null;
};

export const formatUsPhoneNumber = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  const normalized = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;

  if (normalized.length <= 3) return normalized;
  if (normalized.length <= 6) return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
  return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6, 10)}`;
};
