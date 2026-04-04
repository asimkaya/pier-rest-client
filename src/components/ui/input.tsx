import { type JSX, splitProps } from "solid-js";
import { cn } from "~/lib/utils";

type InputProps = JSX.InputHTMLAttributes<HTMLInputElement>;

export function Input(props: InputProps) {
  const [local, others] = splitProps(props, ["class"]);
  return (
    <input
      class={cn(
        "flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        local.class
      )}
      {...others}
    />
  );
}
