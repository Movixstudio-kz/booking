export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  } else if (digits.length === 10) {
    digits = `7${digits}`;
  }

  return digits ? `+${digits}` : "";
}
