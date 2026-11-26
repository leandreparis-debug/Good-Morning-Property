import { CalendarClock } from "lucide-react";
import type { Metadata } from "next";
import { MeetingRoom } from "@/components/meeting/MeetingRoom";
import { Card } from "@/components/ui/Card";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { formatMeetingDateFr } from "@/lib/meetingCalendar";
import { requireFacilitator } from "@/server/auth/session";
import { now } from "@/server/clock";
import { isEntryOpenAt } from "@/server/entries/rules";
import { getOrCreateCurrentMeeting } from "@/server/meetings/currentMeeting";
import { listMembers } from "@/server/repositories/members";
import { listTopicsForMeeting } from "@/server/repositories/topics";
import { listVisitsForMeeting } from "@/server/repositories/visits";

export const metadata: Metadata = { title: "Réunion" };

/**
 * The projected meeting (animateurs only). Before the deadline, everyone's content is not
 * readable yet (RLS): the screen only says when the meeting opens.
 */
export default async function MeetingPage() {
  const me = await requireFacilitator();
  const meeting = await getOrCreateCurrentMeeting();
  const label = `Point du ${formatMeetingDateFr(meeting.meetingDate)}`;

  if (isEntryOpenAt(meeting.entryDeadline, now())) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Eyebrow tone="sky">{label}</Eyebrow>
          <DisplayTitle italic="bientôt">Réunion bientôt</DisplayTitle>
        </div>
        <Card variant="veiled" className="flex max-w-xl items-center gap-4">
          <CalendarClock aria-hidden className="size-7 shrink-0" />
          <p className="text-card-title font-semibold">La réunion s&apos;ouvre lundi à 10:00.</p>
        </Card>
      </div>
    );
  }

  const [members, topics, visits] = await Promise.all([
    listMembers(),
    listTopicsForMeeting(meeting.id),
    listVisitsForMeeting(meeting.id),
  ]);

  return (
    <MeetingRoom
      meetingDate={meeting.meetingDate}
      meetingLabel={label}
      facilitatorId={me.id}
      members={members
        .filter((member) => member.isActive)
        .map(({ id, displayName, initials, avatarColor }) => ({
          id,
          displayName,
          initials,
          avatarColor,
        }))}
      topics={topics}
      visits={visits}
    />
  );
}
