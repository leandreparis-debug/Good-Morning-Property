import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { getMeetingPhase } from "@/lib/meetingCalendar";
import { ROUTES } from "@/lib/routes";
import { getCurrentMember } from "@/server/auth/session";
import { now } from "@/server/clock";
import { MainNav } from "./MainNav";
import { MeetingStatusPill } from "./MeetingStatusPill";
import { MemberMenu } from "./MemberMenu";

/**
 * App header: logo and entry window pill on the left; for a signed-in member, the main
 * navigation (bottom bar on mobile) and their badge menu on the right.
 */
export async function SiteHeader() {
  const member = await getCurrentMember();
  const current = now();
  const roles = member
    ? [member.isFacilitator && "Animateur", member.isLead && "Responsable"].filter(
        (role): role is string => typeof role === "string",
      )
    : [];

  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 pt-4 group-has-[[data-projection]]/page:max-w-[1760px] sm:px-6 sm:pt-6">
      <Link
        href={ROUTES.home}
        className="order-1 inline-flex min-h-11 items-center rounded-2xl text-ink"
      >
        <Logo withWordmark />
      </Link>
      {member && (
        <div className="order-3 w-full sm:order-2 sm:mr-auto sm:w-auto">
          <MeetingStatusPill phase={getMeetingPhase(current)} now={current} />
        </div>
      )}
      {member && (
        <div className="order-2 flex items-center gap-3 sm:order-3">
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
