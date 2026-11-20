/**
 * Returns today's date formatted as "YYYY-MM-DD" in the user's local timezone.
 * Do NOT use new Date().toISOString().slice(0, 10), because in India (UTC+5:30)
 * between midnight and 5:30 AM it will produce yesterday's UTC date.
 */
export function todayLocalISO(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
