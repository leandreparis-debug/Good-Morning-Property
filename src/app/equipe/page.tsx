import type { Metadata } from "next";
import { TeamBoard } from "@/components/team/TeamBoard";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { requireFacilitator } from "@/server/auth/session";
import { listTeam } from "@/server/team/teamService";

export const metadata: Metadata = { title: "Équipe" };

export default async function TeamPage() {
  const me = await requireFacilitator();
  const team = await listTeam();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Eyebrow tone="sky">Animateurs · Membres et liens personnels</Eyebrow>
        <DisplayTitle italic="équipe">{"L'équipe"}</DisplayTitle>
        <p className="max-w-2xl text-ink-soft">
          Chaque membre entre avec son lien personnel, sans mot de passe. Transmets-le toi-même
          (Teams…) : l&apos;application n&apos;envoie aucun mail.
        </p>
      </div>
      <TeamBoard
        currentMemberId={me.id}
        members={team.map((member) => ({
          id: member.id,
          displayName: member.displayName,
          initials: member.initials,
          avatarColor: member.avatarColor,
          isFacilitator: member.isFacilitator,
          isLead: member.isLead,
          isActive: member.isActive,
          linkCreatedAt: member.linkCreatedAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
