"use client";

import { useState } from "react";
import type { Emotion } from "@/lib/client-types";
import { CameraDetector } from "./CameraDetector";
import { ManualPicker } from "./ManualPicker";
import { TextDetector } from "./TextDetector";

type Mode = "camera" | "text" | "manual";

export function InputPanel({
  current,
  onCamera,
  onText,
  onManual,
}: {
  current: Emotion;
  onCamera: (emotion: Emotion, confidence: number) => Promise<void>;
  onText: (text: string) => Promise<void>;
  onManual: (emotion: Emotion) => Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>("manual");
  const tabs: Array<{ id: Mode; label: string }> = [
    { id: "camera", label: "Camera" },
    { id: "text", label: "Text" },
    { id: "manual", label: "Manual" },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="label">Emotion input</div>
        <div className="flex gap-1 rounded-lg border border-white/10 bg-black/30 p-0.5" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={mode === tab.id}
              onClick={() => setMode(tab.id)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                mode === tab.id ? "bg-white/15 text-white" : "text-zinc-400 hover:text-zinc-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4">
        {mode === "camera" && <CameraDetector onReading={onCamera} />}
        {mode === "text" && <TextDetector onSubmit={onText} />}
        {mode === "manual" && <ManualPicker current={current} onPick={onManual} />}
      </div>
    </div>
  );
}
