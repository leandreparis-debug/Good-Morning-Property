import { KeyRound } from "lucide-react";
import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = { title: "Connexion" };

const NOTICES: Record<string, { tone: "alert" | "info"; text: string }> = {
  "lien-invalide": {
    tone: "alert",
    text: "Ce lien n'est plus valide, demande un nouveau lien à ton animateur.",
  },
  inactif: {
    tone: "alert",
    text: "Ton accès n'est plus actif. Demande un nouveau lien à ton animateur.",
  },
  "trop-de-tentatives": {
    tone: "alert",
    text: "Trop de tentatives. Réessaie dans une minute.",
  },
  deconnecte: { tone: "info", text: "Tu es déconnecté. Ton lien personnel te reconnectera." },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ raison?: string | string[] }>;
}) {
  const { raison } = await searchParams;
  const notice = typeof raison === "string" ? NOTICES[raison] : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Eyebrow tone="sky">Connexion</Eyebrow>
        <DisplayTitle italic="morning">Good morning</DisplayTitle>
      </div>

      {notice && (
        <p
          role={notice.tone === "alert" ? "alert" : "status"}
          className={
            notice.tone === "alert"
              ? "max-w-xl rounded-card-sm bg-tag-alert-bg px-5 py-4 font-semibold text-tag-alert-fg"
              : "max-w-xl rounded-card-sm bg-tag-info-bg px-5 py-4 font-semibold text-tag-info-fg"
          }
        >
          {notice.text}
        </p>
      )}

      <Card className="flex max-w-xl items-start gap-4">
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-full bg-sun text-ink"
        >
          <KeyRound className="size-6" />
        </span>
        <div className="flex flex-col gap-2">
          <p className="text-card-title font-semibold">
            Pour accéder à Good Morning Property, utilise ton lien personnel.
          </p>
          <p className="text-ink-soft">Tu ne l&apos;as plus ? Demande-le à ton animateur.</p>
        </div>
      </Card>
    </div>
  );
}
