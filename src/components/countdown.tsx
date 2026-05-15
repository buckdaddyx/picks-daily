"use client";

import { Clock } from "lucide-react";
import { useCountdown } from "@/lib/hooks";
import { formatCountdown } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  /** Optional label override. Defaults to "Next pick in". */
  label?: string;
};

export function Countdown({ className, label = "Next pick in" }: Props) {
  const ms = useCountdown();
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm",
        className,
      )}
    >
      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold tabular-nums text-foreground">
        {formatCountdown(ms)}
      </span>
    </div>
  );
}
