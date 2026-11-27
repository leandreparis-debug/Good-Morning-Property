import { Check, Play } from "lucide-react";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Field } from "@/components/ui/Field";
import { Logo } from "@/components/ui/Logo";
import { MemberAvatar, type MemberColor } from "@/components/ui/MemberAvatar";
import { TopicTag } from "@/components/ui/TopicTag";
import { TOPIC_TAGS } from "@/lib/topicTags";

export const metadata: Metadata = { title: "Design system" };

const PALETTE = [
  { token: "sky", hex: "#B9D6F2", usage: "Haut du fond", swatch: "bg-sky" },
  { token: "sky-mid", hex: "#D6E7F8", usage: "Milieu du fond", swatch: "bg-sky-mid" },
  { token: "mist", hex: "#EAF3FC", usage: "Bas du fond, boutons doux, pistes", swatch: "bg-mist" },
  { token: "ink", hex: "#0E1A24", usage: "Texte, bouton principal", swatch: "bg-ink" },
  { token: "ink-soft", hex: "#2F4A5E", usage: "Texte secondaire sur ciel", swatch: "bg-ink-soft" },
  { token: "muted", hex: "#5B6B78", usage: "Surtitres sur carte blanche", swatch: "bg-muted" },
  { token: "card", hex: "#FFFFFF", usage: "Cartes", swatch: "bg-card" },
  { token: "line", hex: "#C9D8E6", usage: "Bordures", swatch: "bg-line" },
  { token: "grass", hex: "#9CC46B", usage: "Colline claire, pastilles", swatch: "bg-grass" },
  { token: "meadow", hex: "#6E9E45", usage: "Colline médiane", swatch: "bg-meadow" },
  { token: "hill", hex: "#4F7F32", usage: "Colline foncée, progression", swatch: "bg-hill" },
  { token: "sun", hex: "#F7C948", usage: "Accent, une carte soleil par écran", swatch: "bg-sun" },
  { token: "ember", hex: "#E8553D", usage: "Réservé au dépassement du timer", swatch: "bg-ember" },
] as const;

/** Fictitious members, for display only. */
const DEMO_MEMBERS: { name: string; color: MemberColor }[] = [
  { name: "Alice Martin", color: "sun" },
  { name: "Bruno Petit", color: "grass" },
  { name: "Chloé Bernard", color: "sky" },
  { name: "David Roux", color: "card" },
  { name: "Emma Leroy", color: "ink" },
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="font-display text-4xl text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignPage() {
  return (
    <div className="flex flex-col gap-14">
      <header className="flex flex-col gap-2">
        <Eyebrow tone="sky">Direction artistique · Prairie du matin</Eyebrow>
        <DisplayTitle italic="system">Design system</DisplayTitle>
        <p className="max-w-2xl text-ink-soft">
          Référence des jetons et composants. Les noms et sujets affichés ici sont des données
          fictives.
        </p>
      </header>

      <Section id="logo" title="Logo">
        <Card className="flex flex-wrap items-center gap-10">
          <Logo size={64} />
          <Logo withWordmark size={64} />
        </Card>
      </Section>

      <Section id="palette" title="Couleurs">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PALETTE.map(({ token, hex, usage, swatch }) => (
            <li key={token}>
              <Card className="flex items-center gap-4 p-4 sm:p-4">
                <span
                  aria-hidden
                  className={`size-14 shrink-0 rounded-2xl border border-line ${swatch}`}
                />
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold">{token}</span>
                  <span className="font-mono text-sm text-muted">{hex}</span>
                  <span className="text-sm text-ink-soft">{usage}</span>
                </span>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="tags" title="Tags">
        <Card className="flex flex-col gap-5">
          {(["sm", "md", "projection"] as const).map((size) => (
            <div key={size} className="flex flex-col gap-2">
              <Eyebrow>Taille {size}</Eyebrow>
              <div className="flex flex-wrap gap-2">
                {TOPIC_TAGS.map((tag) => (
                  <TopicTag key={tag} tag={tag} size={size} />
                ))}
              </div>
            </div>
          ))}
        </Card>
      </Section>

      <Section id="typographie" title="Typographie">
        <Card className="flex flex-col gap-6">
          <div>
            <Eyebrow>Titre d&apos;écran · Instrument Serif 44 px (mobile)</Eyebrow>
            <DisplayTitle as="p" italic="commence">
              Qui commence ?
            </DisplayTitle>
          </div>
          <div className="overflow-hidden">
            <Eyebrow>Titre d&apos;écran · projection 84 à 104 px</Eyebrow>
            <DisplayTitle as="p" size="projection" italic="commence">
              Qui commence ?
            </DisplayTitle>
          </div>
          <div>
            <Eyebrow>Timer · 168 px, chiffres tabulaires</Eyebrow>
            <p className="font-display text-[96px] leading-none tabular-nums sm:text-timer">
              09:42
            </p>
          </div>
          <div>
            <Eyebrow>Titre de carte · Inter Tight 22 px (26 en projection)</Eyebrow>
            <p className="text-card-title font-semibold">Renouvellement du bail rue des Lilas</p>
          </div>
          <div>
            <Eyebrow>Texte · Inter Tight 16 px</Eyebrow>
            <p>
              Toute l&apos;interface est en Inter Tight, graisses 400, 500, 600 et 700. Les prénoms,
              numéros de priorité et chiffres clés sont en Instrument Serif.
            </p>
          </div>
          <div>
            <Eyebrow>Surtitre · 12 px, capitales, 0,14em, graisse 600, muted</Eyebrow>
            <Eyebrow>Semaine du 30 novembre</Eyebrow>
          </div>
        </Card>
      </Section>

      <Section id="boutons" title="Boutons">
        <Card className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Continuer</Button>
            <Button icon={Play}>Lancer la roue</Button>
            <Button loading>Enregistrement</Button>
            <Button disabled>Désactivé</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary">Annuler</Button>
            <Button variant="secondary" loading>
              Chargement
            </Button>
            <Button variant="secondary" disabled>
              Désactivé
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="soft">+1 min</Button>
            <Button variant="soft">+2 min</Button>
            <Button variant="soft">+4 min</Button>
            <Button variant="soft" disabled>
              Désactivé
            </Button>
          </div>
          <div className="flex flex-col gap-3">
            <Eyebrow>Taille projection</Eyebrow>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="projection" icon={Check}>
                Au suivant
              </Button>
              <Button size="projection" variant="secondary">
                Pause
              </Button>
              <Button size="projection" variant="soft">
                +2 min
              </Button>
            </div>
          </div>
        </Card>
      </Section>

      <Section id="cartes" title="Cartes">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <Eyebrow>Carte</Eyebrow>
            <p className="mt-2 text-card-title font-semibold">Contenu principal</p>
            <p className="mt-1 text-ink-soft">Fond blanc, rayon 28 px, ombre douce.</p>
          </Card>
          <Card variant="veiled">
            <Eyebrow>Carte voilée</Eyebrow>
            <p className="mt-2 text-card-title font-semibold">Info secondaire</p>
            <p className="mt-1 text-ink-soft">Blanc à 62 % et bordure blanche.</p>
          </Card>
          <Card variant="sun">
            <p className="text-eyebrow font-semibold uppercase">Carte soleil</p>
            <p className="mt-1 font-display text-7xl leading-none">12</p>
            <p className="mt-1 font-medium">sujets pour lundi</p>
          </Card>
        </div>
      </Section>

      <Section id="membres" title="Membres">
        <Card className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-4">
            {DEMO_MEMBERS.map((member) => (
              <MemberAvatar key={member.name} {...member} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <MemberAvatar name="Alice Martin" color="sun" size="lg" status="current" />
            <MemberAvatar name="Bruno Petit" color="grass" size="lg" status="done" />
            <MemberAvatar name="Chloé Bernard" color="sky" size="projection" />
            <MemberAvatar name="Emma Leroy" color="ink" size="sm" />
          </div>
          <p className="text-sm text-ink-soft">
            États : en cours (anneau blanc puis anneau encre), déjà passé (fond brume, initiales
            encre douce et coche).
          </p>
        </Card>
      </Section>

      <Section id="champs" title="Champs">
        <Card className="grid gap-6 md:grid-cols-2">
          <Field
            label="Lieu"
            placeholder="Ex. Lyon, résidence Les Tilleuls"
            hint="Ville ou adresse"
          />
          <Field label="Titre du sujet" defaultValue="" error="Le titre est obligatoire." />
        </Card>
      </Section>

      <Section id="exemple" title="Exemple : carte sujet">
        <Card as="article" className="flex max-w-xl gap-5" aria-labelledby="exemple-sujet">
          <span className="font-display text-6xl leading-none text-ink" aria-label="Priorité 1">
            1
          </span>
          <div className="flex min-w-0 flex-col gap-3">
            <Eyebrow>Sujet fictif · Alice Martin</Eyebrow>
            <h3 id="exemple-sujet" className="text-card-title font-semibold">
              Choisir le prestataire pour la toiture de l&apos;immeuble Pasteur
            </h3>
            <p className="text-ink-soft">
              Deux devis reçus, écart de 18 %. Il faut trancher avant le 15 décembre.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <TopicTag tag="DECISION" />
              <MemberAvatar name="Alice Martin" color="sun" size="sm" />
            </div>
            <div>
              <Button variant="secondary">Modifier</Button>
            </div>
          </div>
        </Card>
      </Section>
    </div>
  );
}
