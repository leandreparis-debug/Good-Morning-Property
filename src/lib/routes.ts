import { ClipboardList, NotebookPen, Presentation, Users, type LucideIcon } from "lucide-react";

/** App routes (French, kebab-case). */
export const ROUTES = {
  home: "/",
  myTopics: "/mes-sujets",
  preparation: "/preparation",
  meeting: "/reunion",
  team: "/equipe",
  signIn: "/connexion",
  design: "/design",
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Main navigation, in order. */
export const MAIN_NAV: readonly NavItem[] = [
  { href: ROUTES.myTopics, label: "Mes sujets", icon: NotebookPen },
  { href: ROUTES.preparation, label: "Préparation", icon: ClipboardList },
  { href: ROUTES.meeting, label: "Réunion", icon: Presentation },
];

/** Team management, shown to animateurs only. */
export const TEAM_NAV_ITEM: NavItem = { href: ROUTES.team, label: "Équipe", icon: Users };

/** True when `pathname` is `href` or one of its sub-pages. */
export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The meeting screen is projected: no photo credit, larger sizes. */
export function isProjectionPath(pathname: string): boolean {
  return isActivePath(pathname, ROUTES.meeting);
}
