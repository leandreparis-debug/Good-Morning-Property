import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface DisplayTitleProps {
  /** Full title text, e.g. « Qui commence ? ». */
  children: string;
  /** Word (or phrase) of the title set in italics, e.g. « commence ». Must appear in `children`. */
  italic?: string;
  /** Element. Defaults to h1 (one per page); `p` for specimens. */
  as?: "h1" | "h2" | "h3" | "p";
  /** `md`: 44 px on mobile, 56 px from 640 px · `projection`: 84 to 104 px. */
  size?: "md" | "projection";
  className?: string;
}

function renderWithItalic(text: string, italic: string | undefined): ReactNode {
  if (!italic) return text;
  const index = text.indexOf(italic);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <em className="italic">{italic}</em>
      {text.slice(index + italic.length)}
    </>
  );
}

/**
 * Screen title in Instrument Serif, with one word in italics.
 *
 * @example <DisplayTitle italic="commence">Qui commence ?</DisplayTitle>
 */
export function DisplayTitle({
  children,
  italic,
  as: Heading = "h1",
  size = "md",
  className,
}: DisplayTitleProps) {
  return (
    <Heading
      className={cn(
        "font-display font-normal text-balance text-ink",
        size === "projection" ? "text-screen-projection" : "text-screen sm:text-[56px]",
        className,
      )}
    >
      {renderWithItalic(children, italic)}
    </Heading>
  );
}
