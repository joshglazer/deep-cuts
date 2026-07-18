export function formatDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
