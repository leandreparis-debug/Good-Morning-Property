import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/layout/PagePlaceholder";

export const metadata: Metadata = { title: "Connexion" };

export default function SignInPage() {
  return (
    <PagePlaceholder
      eyebrow="Connexion"
      title="Bon retour"
      italic="retour"
      description="Vous recevrez un lien de connexion par mail, sans mot de passe."
    />
  );
}
