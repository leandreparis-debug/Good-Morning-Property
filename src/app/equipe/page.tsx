import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = { title: "Équipe" };

export default function TeamPage() {
  return (
    <PagePlaceholder
      eyebrow="Membres"
      title="L'équipe"
      italic="équipe"
      description="Les membres de l'équipe et leurs rôles (responsable, animateur)."
    />
  );
}
