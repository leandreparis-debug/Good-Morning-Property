import { MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { TopicTag } from "@/components/ui/TopicTag";
import {
  fillOverview,
  formatDuration,
  formatFillSummary,
  hasFilled,
  type FillCounts,
} from "@/lib/fillSummary";
import { formatMeetingDateFr } from "@/lib/meetingCalendar";
import { ROUTES } from "@/lib/routes";
import { getEntryContext } from "@/server/entries/entryWindow";
import { getFillStatus } from "@/server/preparation/fillStatus";
import { listMembers } from "@/server/repositories/members";
import { listTopicsForMeeting, type Topic } from "@/server/repositories/topics";
import { listVisitsForMeeting, type Visit } from "@/server/repositories/visits";

export const metadata: Metadata = { title: "Préparation" };

const EMPTY: FillCounts = { topicsCount: 0, visitsCount: 0, alertsCount: 0 };

/**
 * Preparation of the coming meeting. Everyone sees who filled in what (counts only);
 * animateurs get a reminder for members with nothing; the responsable also sees the content.
 */
export default async function PreparationPage() {
  const { member: me, meeting } = await getEntryContext();
  const [members, fill] = await Promise.all([listMembers(), getFillStatus(meeting.id)]);

  // Content only for the lead (the RLS would return only their own rows to anyone else).
  const [topics, visits]: [Topic[], Visit[]] = me.isLead
    ? await Promise.all([listTopicsForMeeting(meeting.id), listVisitsForMeeting(meeting.id)])
    : [[], []];

  const counts = new Map(fill.map((row) => [row.memberId, row]));
  const active = members.filter((member) => member.isActive);
  const overview = fillOverview(active.map((member) => counts.get(member.id) ?? EMPTY));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Eyebrow tone="sky">Point du {formatMeetingDateFr(meeting.meetingDate)}</Eyebrow>
        <DisplayTitle italic="préparation">La préparation</DisplayTitle>
      </div>

      <Card
        variant="sun"
        className="flex max-w-xl flex-col gap-3 sm:flex-row sm:items-end sm:gap-8"
      >
        <p className="flex flex-col">
          <span className="font-display text-7xl leading-none tabular-nums">
            {overview.filled}/{overview.members}
          </span>
          <span className="font-semibold">ont rempli</span>
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-medium">
          <dt>Sujets</dt>
          <dd className="font-bold tabular-nums">{overview.topics}</dd>
          <dt>Durée prévue</dt>
          <dd className="font-bold">{formatDuration(overview.durationMinutes)}</dd>
        </dl>
      </Card>

      <section aria-labelledby="who-filled" className="flex flex-col gap-4">
        <h2 id="who-filled" className="font-display text-4xl">
          Qui a rempli
        </h2>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {active.map((member) => {
            const memberCounts = counts.get(member.id) ?? EMPTY;
            const memberTopics = topics.filter((topic) => topic.memberId === member.id);
            const memberVisits = visits.filter((visit) => visit.memberId === member.id);
            return (
              <Card as="li" key={member.id} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <MemberAvatar
                    name={member.displayName}
                    initials={member.initials}
                    color={member.avatarColor}
                  />
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-2xl leading-tight">
                      {member.displayName}
                    </h3>
                    <p className="text-sm text-ink-soft" data-testid="fill-summary">
                      {formatFillSummary(memberCounts)}
                    </p>
                  </div>
                </div>

                {me.isFacilitator && !hasFilled(memberCounts) && member.id !== me.id && (
                  <Link
                    href={ROUTES.team}
                    className="inline-flex min-h-11 items-center self-start text-sm font-semibold underline underline-offset-4"
                  >
                    Relance-le avec son lien
                  </Link>
                )}

                {me.isLead && hasFilled(memberCounts) && (
                  <details className="group rounded-soft bg-mist px-4 py-2">
                    <summary className="min-h-11 cursor-pointer content-center font-semibold">
                      Voir le détail<span className="sr-only"> de {member.displayName}</span>
                    </summary>
                    <div className="flex flex-col gap-3 pt-2 pb-2">
                      {memberTopics.length > 0 && (
                        <ol className="flex flex-col gap-2">
                          {memberTopics.map((topic) => (
                            <li key={topic.id} className="flex gap-3">
                              <span className="w-5 shrink-0 font-display text-2xl leading-none">
                                <span className="sr-only">Priorité </span>
                                {topic.priority}
                              </span>
                              <div className="flex min-w-0 flex-col gap-1">
                                <p className="font-semibold break-words">{topic.title}</p>
                                {topic.details && (
                                  <p className="text-sm break-words text-ink-soft">
                                    {topic.details}
                                  </p>
                                )}
                                <TopicTag tag={topic.tag} size="sm" />
                              </div>
                            </li>
                          ))}
                        </ol>
                      )}
                      {memberVisits.length > 0 && (
                        <ul className="flex flex-col gap-1 border-t border-line pt-3 text-sm">
                          {memberVisits.map((visit) => (
                            <li key={visit.id} className="flex gap-2">
                              <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-meadow" />
                              <span>
                                {formatMeetingDateFr(visit.visitDate)} · {visit.place} ·{" "}
                                {visit.purpose}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </details>
                )}
              </Card>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
