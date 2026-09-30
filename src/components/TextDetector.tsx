"use client";

import { useMemo, useState } from "react";
import { analyzeText } from "@/lib/emotion/text-detector";
import { EMOTION_META } from "./emotion-meta";

const EXAMPLES = [
  "Had the best day, everything just clicked!",
  "Deadline tomorrow and I'm completely overwhelmed.",
  "Long day. I'm exhausted and ready for bed.",
  "Time to focus and get this report done.",
];

/** Free-text mood input with a live preview of what the classifier sees. */
export function TextDetector({ onSubmit }: { onSubmit: (text: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const preview = useMemo(() => (text.trim() ? analyzeText(text) : null), [text]);

  const submit = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await onSubmit(text);
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void submit();
        }}
        rows={3}
        placeholder="How are you feeling right now?"
        className="w-full resize-none rounded-xl border border-white/10 bg-black/30 p-3 text-sm outline-none focus:border-white/30"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-zinc-400">
          {preview ? (
            <>
              Reads as <span aria-hidden>{EMOTION_META[preview.emotion].emoji}</span>{" "}
              <span className="capitalize text-zinc-100">{preview.emotion}</span> ({Math.round(preview.confidence * 100)}%)
            </>
          ) : (
            "Lexicon-based, works offline."
          )}
        </div>
        <button className="btn btn-primary" onClick={submit} disabled={!text.trim() || sending}>
          {sending ? "Sending…" : "Set mood"}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((example) => (
          <button key={example} className="chip hover:bg-white/10" onClick={() => setText(example)}>
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
