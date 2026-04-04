import { type JSX, splitProps } from "solid-js";
import { cn } from "~/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/15 text-destructive",
        outline: "border text-foreground",
        success: "bg-success/15 text-success",
        warning: "bg-warning/15 text-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type BadgeProps = JSX.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>;

export function Badge(props: BadgeProps) {
  const [local, others] = splitProps(props, ["variant", "class", "children"]);
  return (
    <span class={cn(badgeVariants({ variant: local.variant }), local.class)} {...others}>
      {local.children}
    </span>
  );
}
