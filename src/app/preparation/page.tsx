import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = { title: "Préparation" };

export default function PreparationPage() {
  return (
    <PagePlaceholder
      eyebrow="Avant la réunion"
      title="La préparation"
      italic="préparation"
      description="Vue d'ensemble des sujets saisis pour lundi. Chacun y voit ses propres saisies ; le responsable voit celles de toute l'équipe."
    />
  );
}
