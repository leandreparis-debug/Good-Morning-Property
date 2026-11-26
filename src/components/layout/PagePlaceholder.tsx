import { Card } from "@/components/ui/Card";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { Eyebrow } from "@/components/ui/Eyebrow";

export interface PagePlaceholderProps {
  eyebrow: string;
  title: string;
  italic?: string;
  description: string;
}

/** Empty page shell used until the feature is built. */
export function PagePlaceholder({ eyebrow, title, italic, description }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Eyebrow tone="sky">{eyebrow}</Eyebrow>
        <DisplayTitle italic={italic}>{title}</DisplayTitle>
      </div>
      <Card variant="veiled" className="max-w-xl">
        <p className="text-card-title font-semibold">Bientôt disponible</p>
        <p className="mt-2 text-ink-soft">{description}</p>
      </Card>
    </div>
  );
}
