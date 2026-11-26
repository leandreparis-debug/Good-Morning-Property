import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = { title: "Réunion" };

export default function MeetingPage() {
  return (
    <PagePlaceholder
      eyebrow="Lundi, 11 h"
      title="Qui commence ?"
      italic="commence"
      description="L'écran projeté de la réunion : la roue tire l'ordre de passage, puis chacun présente ses sujets avec un timer de 10 minutes."
    />
  );
}
