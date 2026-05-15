"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Type, Trophy } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HowToPlayDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How to Play</DialogTitle>
          <DialogDescription>
            One famous NFL play. Every day. Spot the silhouette.
          </DialogDescription>
        </DialogHeader>

        <ul className="mt-2 space-y-3 text-sm">
          <li className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
              <Eye className="h-4 w-4" />
            </span>
            <div>
              <div className="font-semibold">Watch the clip</div>
              <div className="text-muted-foreground">
                The whole play is silhouetted. The key player is glowing red.
              </div>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
              <Type className="h-4 w-4" />
            </span>
            <div>
              <div className="font-semibold">Type the player&apos;s name</div>
              <div className="text-muted-foreground">
                Last name is enough. Minor typos are forgiven.
              </div>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
              <Trophy className="h-4 w-4" />
            </span>
            <div>
              <div className="font-semibold">Build your streak</div>
              <div className="text-muted-foreground">
                Come back every day. Miss one and the streak resets.
              </div>
            </div>
          </li>
        </ul>

        <p className="mt-4 text-center text-[11px] uppercase tracking-widest text-muted-foreground">
          Tap the field anywhere to play / pause
        </p>
      </DialogContent>
    </Dialog>
  );
}
