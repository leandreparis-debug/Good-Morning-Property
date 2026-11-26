import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = { title: "Mes sujets" };

export default function MyTopicsPage() {
  return (
    <PagePlaceholder
      eyebrow="Pour lundi"
      title="Mes sujets"
      italic="sujets"
      description="Du mardi au lundi 10 h, vous préparerez ici jusqu'à 5 sujets, avec une priorité et un tag, ainsi que vos visites et déplacements de la semaine."
    />
  );
}
