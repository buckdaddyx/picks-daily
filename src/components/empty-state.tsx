import { CalendarOff } from "lucide-react";

export function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-muted/40 p-10 text-center">
      <CalendarOff className="h-8 w-8 text-muted-foreground" />
      <div className="font-display text-lg">{title}</div>
      <p className="max-w-xs text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
