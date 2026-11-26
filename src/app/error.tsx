"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ROUTES } from "@/lib/routes";

/** Error boundary of the app, in French. Technical details stay in the server logs. */
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Eyebrow tone="sky">Erreur</Eyebrow>
        <DisplayTitle italic="souci">Petit souci</DisplayTitle>
      </div>
      <Card className="flex max-w-xl flex-col items-start gap-4">
        <p className="text-ink-soft">
          Quelque chose s&apos;est mal passé. Réessaie ; si le problème continue, préviens ton
          animateur.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button icon={RotateCcw} onClick={reset}>
            Réessayer
          </Button>
          <Link
            href={ROUTES.myTopics}
            className="inline-flex min-h-12 items-center rounded-full border-[1.5px] border-line bg-card px-6 font-semibold hover:bg-mist"
          >
            Retour à mes sujets
          </Link>
        </div>
      </Card>
    </div>
  );
}
