"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/actionResult";
import { ROUTES } from "@/lib/routes";
import { requireFacilitator } from "@/server/auth/session";
import { runAction } from "@/server/runAction";
import type { AddMemberInput, UpdateMemberInput } from "@/server/team/schemas";
import * as team from "@/server/team/teamService";

// Every action re-checks the role on the server (the UI hiding a button is not a guard).

/** Adds a member and returns their first personal link (shown once). */
export async function addMemberAction(
  input: AddMemberInput,
): Promise<ActionResult<{ displayName: string; link: string }>> {
  return runAction(async () => {
    await requireFacilitator();
    const { member, link } = await team.addMember(input);
    revalidatePath(ROUTES.team);
    return { displayName: member.displayName, link };
  });
}

/** Replaces a member's link; the previous one stops working immediately. */
export async function regenerateLinkAction(memberId: string): Promise<ActionResult<string>> {
  return runAction(async () => {
    await requireFacilitator();
    const link = await team.regenerateLink(memberId);
    revalidatePath(ROUTES.team);
    return link;
  });
}

/** Saves name, initials and colour. */
export async function updateMemberAction(input: UpdateMemberInput): Promise<ActionResult> {
  return runAction(async () => {
    await requireFacilitator();
    await team.updateMember(input);
    revalidatePath(ROUTES.team);
    return null;
  });
}

/** Grants or removes the animateur role. */
export async function setFacilitatorAction(
  memberId: string,
  value: boolean,
): Promise<ActionResult> {
  return runAction(async () => {
    await requireFacilitator();
    await team.setFacilitator({ memberId, value });
    revalidatePath("/", "layout");
    return null;
  });
}

/** Makes a member the responsable (null: nobody). */
export async function setLeadAction(memberId: string | null): Promise<ActionResult> {
  return runAction(async () => {
    await requireFacilitator();
    await team.setLead({ memberId });
    revalidatePath(ROUTES.team);
    return null;
  });
}

/** Deactivates (revokes the link, closes sessions) or reactivates a member. */
export async function setActiveAction(memberId: string, value: boolean): Promise<ActionResult> {
  return runAction(async () => {
    const me = await requireFacilitator();
    await team.setActive(me.id, { memberId, value });
    revalidatePath(ROUTES.team);
    return null;
  });
}
