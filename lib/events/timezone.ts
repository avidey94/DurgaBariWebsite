const pacificParts = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export const toPacificLocal = (value: string) => {
  const parts = pacificParts.formatToParts(new Date(value));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? "00";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
};

export const pacificLocalToIso = (value: string): string | null => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const target = Date.parse(`${value}:00Z`);
  if (Number.isNaN(target)) return null;
  let estimate = target;
  for (let index = 0; index < 3; index += 1) {
    const actual = Date.parse(`${toPacificLocal(new Date(estimate).toISOString())}:00Z`);
    const difference = target - actual;
    if (difference === 0) break;
    estimate += difference;
  }
  const result = new Date(estimate).toISOString();
  return toPacificLocal(result) === value ? result : null;
};
