import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { ROUTES } from "@/lib/routes";
import { getCurrentMember as readCurrentMember, type Member } from "@/server/repositories/members";
import { hasRole } from "./roles";

/**
 * The active member signed in on this request, or null. Cached for the request
 * (layout, page and actions share one lookup).
 */
export const getCurrentMember = cache(async (): Promise<Member | null> => readCurrentMember());

/** The signed-in active member; otherwise redirects to /connexion. */
export async function requireMember(): Promise<Member> {
  const member = await getCurrentMember();
  if (!member) redirect(ROUTES.signIn);
  return member;
}

/** A signed-in animateur; plain members are sent back to /mes-sujets. */
export async function requireFacilitator(): Promise<Member> {
  const member = await requireMember();
  if (!hasRole(member, "facilitator")) redirect(ROUTES.myTopics);
  return member;
}

/** The signed-in responsable; other members are sent back to /mes-sujets. */
export async function requireLead(): Promise<Member> {
  const member = await requireMember();
  if (!hasRole(member, "lead")) redirect(ROUTES.myTopics);
  return member;
}
