/**
 * Live TV - Time & Date Utilities
 * Architecture: Utils / TimeUtils
 */

export function formatToBST(dateInput) {
  if (!dateInput) return null;
  let d = null;
  if (typeof dateInput === "string") {
    const s = dateInput.trim();
    // FanCode format: "05:30:00 AM 28-10-2026" or "07:10:00 AM 31-10-2026" (IST, UTC+5:30)
    const fcMatch = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\s*(\d{1,2})-(\d{1,2})-(\d{4})$/i);
    if (fcMatch) {
      let [_, h, m, sec, meridiem, day, month, year] = fcMatch;
      let hour = parseInt(h, 10);
      if (meridiem.toUpperCase() === "PM" && hour < 12) hour += 12;
      if (meridiem.toUpperCase() === "AM" && hour === 12) hour = 0;
      const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${String(hour).padStart(2, "0")}:${m}:${sec || "00"}+05:30`;
      d = new Date(iso);
    } else {
      d = new Date(s);
    }
  } else if (dateInput instanceof Date) {
    d = dateInput;
  }
  if (!d || isNaN(d.getTime())) return null;

  try {
    const now = new Date();
    const bstOptions = { timeZone: "Asia/Dhaka", year: "numeric", month: "numeric", day: "numeric" };
    const dParts = new Intl.DateTimeFormat("en-US", bstOptions).formatToParts(d);
    const nowParts = new Intl.DateTimeFormat("en-US", bstOptions).formatToParts(now);
    const getPart = (parts, type) => parts.find(p => p.type === type)?.value;
    const isSameDay = getPart(dParts, "year") === getPart(nowParts, "year") &&
                      getPart(dParts, "month") === getPart(nowParts, "month") &&
                      getPart(dParts, "day") === getPart(nowParts, "day");

    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
    const timeStr = timeFormatter.format(d);
    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      month: "short",
      day: "numeric"
    });
    const dateStr = dateFormatter.format(d);

    return isSameDay ? `Today, ${timeStr} BST` : `${dateStr}, ${timeStr} BST`;
  } catch (e) {
    return null;
  }
}

export function formatSeconds(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
