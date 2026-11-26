import type { Member } from "@/server/repositories/members";

/** App roles. `member` = any active member. */
export type Role = "member" | "facilitator" | "lead";

/** True if `member` is active and holds `role` (roles are cumulative). */
export function hasRole(member: Member | null, role: Role): member is Member {
  if (!member?.isActive) return false;
  switch (role) {
    case "member":
      return true;
    case "facilitator":
      return member.isFacilitator;
    case "lead":
      return member.isLead;
  }
}
