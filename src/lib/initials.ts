/**
 * Up to three uppercase initials from a display name, one per word (spaces and hyphens split).
 * « Camille Dupont » → « CD », « Jean-Christophe Martin » → « JCM », « Inès » → « I ».
 */
export function getInitials(name: string): string {
  const letters = name
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0));
  if (letters.length === 0) return "?";
  return letters.slice(0, 3).join("").toLocaleUpperCase("fr-FR");
}
