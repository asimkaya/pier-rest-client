import { type JSX, splitProps, For } from "solid-js";
import { cn } from "~/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  options: SelectOption[];
  onChange?: (value: string) => void;
}

export function Select(props: SelectProps) {
  const [local, others] = splitProps(props, ["class", "options", "onChange"]);
  return (
    <select
      class={cn(
        "flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none",
        local.class
      )}
      onChange={(e) => local.onChange?.(e.currentTarget.value)}
      {...others}
    >
      <For each={local.options}>
        {(option) => <option value={option.value}>{option.label}</option>}
      </For>
    </select>
  );
}
