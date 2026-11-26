import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { ROUTES } from "@/lib/routes";
import { getCurrentMember } from "@/server/auth/session";
import { MainNav } from "./MainNav";
import { MemberMenu } from "./MemberMenu";

/**
 * App header: logo on the left; for a signed-in member, the main navigation
 * (bottom bar on mobile) and their badge menu on the right.
 */
export async function SiteHeader() {
  const member = await getCurrentMember();
  const roles = member
    ? [member.isFacilitator && "Animateur", member.isLead && "Responsable"].filter(
        (role): role is string => typeof role === "string",
      )
    : [];

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-6">
      <Link href={ROUTES.home} className="inline-flex min-h-11 items-center rounded-2xl text-ink">
        <Logo withWordmark />
      </Link>
      {member && (
        <div className="flex items-center gap-3">
          <MainNav showTeam={member.isFacilitator} />
          <MemberMenu
            displayName={member.displayName}
            initials={member.initials}
            avatarColor={member.avatarColor}
            roles={roles}
          />
        </div>
      )}
    </header>
  );
}
