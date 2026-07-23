export function formatDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(dateIso: string): string {
  return new Date(dateIso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
