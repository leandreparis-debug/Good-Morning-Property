"use client";

import { cn } from "@/lib/cn";
import { getTopicTagMeta, TOPIC_TAGS, type TopicTag } from "@/lib/topicTags";

/** The 4 tags as large radio pills: colour + icon + label, checked one outlined in ink. */
export function TagPicker({
  value,
  onChange,
  name,
}: {
  value: TopicTag;
  onChange: (tag: TopicTag) => void;
  name: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-semibold">Tag</legend>
      <div className="grid grid-cols-2 gap-2">
        {TOPIC_TAGS.map((tag) => {
          const { label, icon: Icon, className } = getTopicTagMeta(tag);
          const checked = value === tag;
          return (
            <label
              key={tag}
              className={cn(
                "flex min-h-13 cursor-pointer items-center gap-2 rounded-full border-2 px-4 font-semibold",
                "has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink",
                className,
                checked ? "border-ink" : "border-transparent",
              )}
            >
              <input
                type="radio"
                name={name}
                value={tag}
                checked={checked}
                onChange={() => {
                  onChange(tag);
                }}
                className="sr-only"
              />
              <Icon aria-hidden className="size-5 shrink-0" strokeWidth={2.25} />
              <span className="min-w-0">{label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
