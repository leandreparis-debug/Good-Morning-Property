/**
 * Up to two uppercase initials from a display name.
 * « Camille Dupont » → « CD », « Jean-Marc » → « JM », « Inès » → « I ».
 */
export function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean);
  const first = parts[0];
  if (!first) return "?";
  const last = parts.length > 1 ? parts[parts.length - 1] : undefined;
  return (first.charAt(0) + (last?.charAt(0) ?? "")).toLocaleUpperCase("fr-FR");
}
