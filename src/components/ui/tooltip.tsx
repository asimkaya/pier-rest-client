import { Tooltip as KTooltip } from "@kobalte/core/tooltip";
import type { ParentProps } from "solid-js";
import { splitProps } from "solid-js";
import { cn } from "~/lib/utils";

export type TooltipProps = ParentProps<{
  /** Tooltip text (no native `title` — use this for accessible descriptions). */
  label: string;
  placement?: "top" | "bottom" | "left" | "right";
  /** Kobalte default is 700ms — too slow for dense UIs. */
  openDelay?: number;
  closeDelay?: number;
  /** Wrapper around the trigger (avoids nested <button> issues). */
  triggerClass?: string;
  contentClass?: string;
}>;

const DEFAULT_OPEN = 160;
const DEFAULT_CLOSE = 80;

export function Tooltip(props: TooltipProps) {
  const [local, rootRest] = splitProps(props, [
    "label",
    "children",
    "placement",
    "openDelay",
    "closeDelay",
    "triggerClass",
    "contentClass",
  ]);

  return (
    <KTooltip
      openDelay={local.openDelay ?? DEFAULT_OPEN}
      closeDelay={local.closeDelay ?? DEFAULT_CLOSE}
      skipDelayDuration={120}
      placement={local.placement ?? "top"}
      gutter={6}
      {...rootRest}
    >
      <KTooltip.Trigger
        as="div"
        class={cn("inline-flex max-w-full", local.triggerClass)}
      >
        {local.children}
      </KTooltip.Trigger>
      <KTooltip.Portal>
        <KTooltip.Content
          class={cn(
            "z-[10050] max-w-[min(280px,calc(100vw-16px))] rounded-md border border-border bg-popover px-2 py-1.5 text-[11px] leading-snug text-popover-foreground shadow-lg",
            "animate-fade-in duration-150 ease-out",
            local.contentClass
          )}
        >
          {local.label}
        </KTooltip.Content>
      </KTooltip.Portal>
    </KTooltip>
  );
}
