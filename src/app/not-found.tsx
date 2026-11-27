import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = { title: "Page introuvable" };

export default function NotFound() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Eyebrow tone="sky">Erreur 404</Eyebrow>
        <DisplayTitle italic="introuvable">Page introuvable</DisplayTitle>
      </div>
      <Card className="flex max-w-xl flex-col items-start gap-4">
        <p className="text-ink-soft">
          Cette page n&apos;existe pas ou a été déplacée. Revenez à vos sujets pour lundi.
        </p>
        <Link
          href={ROUTES.myTopics}
          className="inline-flex min-h-12 items-center rounded-full bg-ink px-6 font-semibold text-white hover:bg-ink-soft"
        >
          Retour à mes sujets
        </Link>
      </Card>
    </div>
  );
}
