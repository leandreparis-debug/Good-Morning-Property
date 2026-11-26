import { cn } from "@/lib/cn";
import { getTopicTagMeta, type TopicTag as TopicTagValue } from "@/lib/topicTags";

export type TopicTagSize = "sm" | "md" | "projection";

export interface TopicTagProps {
  tag: TopicTagValue;
  size?: TopicTagSize;
  className?: string;
}

const sizeClasses: Record<TopicTagSize, { root: string; icon: string }> = {
  sm: { root: "h-6 gap-1 px-2 text-xs", icon: "size-3.5" },
  md: { root: "h-8 gap-1.5 px-3 text-sm", icon: "size-4" },
  projection: { root: "h-11 gap-2 px-4 text-lg", icon: "size-5" },
};

/**
 * Topic tag: color AND icon AND French label — never the color alone,
 * so it stays readable in black and white. Mapping lives in `src/lib/topicTags.ts`.
 */
export function TopicTag({ tag, size = "md", className }: TopicTagProps) {
  const { label, icon: Icon, className: colorClass } = getTopicTagMeta(tag);
  const classes = sizeClasses[size];

  return (
    <span
      data-tag={tag}
      className={cn(
        "inline-flex items-center rounded-full font-semibold whitespace-nowrap",
        colorClass,
        classes.root,
        className,
      )}
    >
      <Icon aria-hidden className={classes.icon} strokeWidth={2.25} />
      {label}
    </span>
  );
}
