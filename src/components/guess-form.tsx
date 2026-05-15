"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  onSubmit: (guess: string) => void;
  attempts: number;
  disabled?: boolean;
  shake?: number;
};

export function GuessForm({ onSubmit, attempts, disabled, shake }: Props) {
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const handle = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim();
    if (!v || disabled) return;
    setSubmitting(true);
    onSubmit(v);
    setValue("");
    setTimeout(() => setSubmitting(false), 300);
  };

  return (
    <motion.form
      onSubmit={handle}
      className="flex w-full flex-col gap-3"
      animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      key={shake}
    >
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-muted-foreground">
          Your guess
        </span>
        <span className="text-muted-foreground">
          Attempts: <span className="font-semibold text-foreground">{attempts}</span>
        </span>
      </div>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type a player name…"
          disabled={disabled || submitting}
          className={cn("flex-1", disabled && "opacity-60")}
          inputMode="text"
          enterKeyHint="send"
        />
        <Button
          type="submit"
          size="default"
          disabled={!value.trim() || disabled || submitting}
          className="px-4"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span className="hidden xs:inline">Submit</span>
            </>
          )}
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Last name works too. Spelling within reason is fine.
      </p>
    </motion.form>
  );
}
