import type { Metadata } from "next";
import { EntryTabs } from "@/components/entries/EntryTabs";
import { TopicBoard } from "@/components/entries/TopicBoard";
import { VisitBoard } from "@/components/entries/VisitBoard";
import { LinkButton } from "@/components/ui/Button";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { greetingFor } from "@/lib/greeting";
import { formatMeetingDateFr } from "@/lib/meetingCalendar";
import { ROUTES } from "@/lib/routes";
import { MAX_TOPICS } from "@/lib/topicInput";
import { now } from "@/server/clock";
import { getEntryContext } from "@/server/entries/entryWindow";
import { listMemberTopics } from "@/server/repositories/topics";
import { listMemberVisits } from "@/server/repositories/visits";

export const metadata: Metadata = { title: "Mes sujets" };

export default async function MyTopicsPage() {
  const { member, meeting, entryOpen } = await getEntryContext();
  const [topics, visits] = await Promise.all([
    listMemberTopics(meeting.id, member.id),
    listMemberVisits(meeting.id, member.id),
  ]);
  const greeting = greetingFor(now(), member.displayName);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Eyebrow tone="sky">Point du {formatMeetingDateFr(meeting.meetingDate)}</Eyebrow>
        <DisplayTitle italic={greeting.italic}>{greeting.text}</DisplayTitle>
      </div>

      <div className="max-w-2xl">
        <EntryTabs
          tabs={[
            {
              key: "sujets",
              label: `Sujets ${topics.length}/${MAX_TOPICS}`,
              panel: (
                <TopicBoard
                  entryOpen={entryOpen}
                  initialTopics={topics.map(({ id, title, details, priority, tag }) => ({
                    id,
                    title,
                    details,
                    priority,
                    tag,
                  }))}
                />
              ),
            },
            {
              key: "visites",
              label: `Visites ${visits.length}`,
              panel: (
                <VisitBoard
                  entryOpen={entryOpen}
                  meetingDate={meeting.meetingDate}
                  initialVisits={visits.map(({ id, visitDate, place, purpose }) => ({
                    id,
                    visitDate,
                    place,
                    purpose,
                  }))}
                />
              ),
            },
          ]}
        />
      </div>

      <div className="max-w-2xl">
        <LinkButton href={ROUTES.preparation}>Voir la préparation</LinkButton>
      </div>
    </div>
  );
}
