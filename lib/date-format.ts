/** Format dates consistently during server rendering and browser hydration. */
export function formatSwedishDate(
  value: string | number | Date,
  options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
) {
  // Date-only values represent a calendar date, not midnight in a visitor's zone.
  const normalized = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T12:00:00Z`
    : value;
  return new Intl.DateTimeFormat("sv-SE", {
    ...options,
    timeZone: "Europe/Stockholm",
  }).format(new Date(normalized));
}
