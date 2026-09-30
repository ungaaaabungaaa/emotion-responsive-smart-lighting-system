"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Emotion } from "@/lib/client-types";

/**
 * Webcam facial-expression detector.
 *
 * Loads face-api (TensorFlow.js) lazily from a CDN so the app has no ML dependency at
 * build time, runs entirely in the browser (no frames ever leave the device), and maps
 * the seven FER expressions to the system's emotion set.
 */

const FACE_API_SCRIPT = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/dist/face-api.js";
const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model/";
const SAMPLE_MS = 1500;

type Expression = "neutral" | "happy" | "sad" | "angry" | "fearful" | "disgusted" | "surprised";

const EXPRESSION_TO_EMOTION: Record<Expression, Emotion> = {
  neutral: "neutral",
  happy: "happy",
  sad: "sad",
  angry: "angry",
  fearful: "anxious",
  disgusted: "angry",
  surprised: "surprised",
};

interface FaceApi {
  nets: {
    tinyFaceDetector: { loadFromUri(url: string): Promise<void> };
    faceExpressionNet: { loadFromUri(url: string): Promise<void> };
  };
  TinyFaceDetectorOptions: new (options?: { inputSize?: number; scoreThreshold?: number }) => unknown;
  detectSingleFace(
    input: HTMLVideoElement,
    options: unknown,
  ): { withFaceExpressions(): Promise<{ expressions: Record<Expression, number> } | undefined> };
}

declare global {
  interface Window {
    faceapi?: FaceApi;
  }
}

let scriptPromise: Promise<FaceApi> | null = null;

function loadFaceApi(): Promise<FaceApi> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.faceapi) return Promise.resolve(window.faceapi);
  if (!scriptPromise) {
    scriptPromise = new Promise<FaceApi>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = FACE_API_SCRIPT;
      script.async = true;
      script.onload = () => (window.faceapi ? resolve(window.faceapi) : reject(new Error("face-api failed to initialise")));
      script.onerror = () => reject(new Error("Could not load the face detection library (offline?)"));
      document.head.appendChild(script);
    }).then(async (api) => {
      await Promise.all([api.nets.tinyFaceDetector.loadFromUri(MODEL_URL), api.nets.faceExpressionNet.loadFromUri(MODEL_URL)]);
      return api;
    });
    scriptPromise.catch(() => {
      scriptPromise = null;
    });
  }
  return scriptPromise;
}

type Status = "idle" | "loading" | "running" | "error";

export function CameraDetector({
  onReading,
}: {
  onReading: (emotion: Emotion, confidence: number) => Promise<void>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("Runs locally in your browser. No video is uploaded.");
  const [last, setLast] = useState<{ emotion: Emotion; confidence: number } | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus("idle");
    setMessage("Camera stopped.");
  }, []);

  const start = useCallback(async () => {
    setStatus("loading");
    setMessage("Loading face model…");
    try {
      const api = await loadFaceApi();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 320, height: 240 } });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Video element missing");
      video.srcObject = stream;
      await video.play();
      setStatus("running");
      setMessage("Watching for expressions…");

      const options = new api.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 });
      timerRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const result = await api.detectSingleFace(videoRef.current, options).withFaceExpressions();
          if (!result) {
            setMessage("No face in view.");
            return;
          }
          const [expression, probability] = (Object.entries(result.expressions) as Array<[Expression, number]>).sort(
            (a, b) => b[1] - a[1],
          )[0];
          const emotion = EXPRESSION_TO_EMOTION[expression];
          const confidence = Number(probability.toFixed(2));
          setLast({ emotion, confidence });
          setMessage(`Sees ${expression} (${Math.round(probability * 100)}%)`);
          await onReading(emotion, confidence);
        } catch (e) {
          setMessage(e instanceof Error ? e.message : String(e));
        }
      }, SAMPLE_MS);
    } catch (e) {
      stop();
      setStatus("error");
      setMessage(e instanceof Error ? e.message : String(e));
    }
  }, [onReading, stop]);

  useEffect(() => stop, [stop]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
        <video ref={videoRef} muted playsInline className="aspect-[4/3] w-full object-cover" style={{ transform: "scaleX(-1)" }} />
        {status !== "running" && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-400">
            {status === "loading" ? "Starting…" : "Camera off"}
          </div>
        )}
        {last && status === "running" && (
          <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs">
            {last.emotion} · {Math.round(last.confidence * 100)}%
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {status === "running" ? (
          <button className="btn" onClick={stop}>Stop camera</button>
        ) : (
          <button className="btn btn-primary" onClick={start} disabled={status === "loading"}>
            {status === "loading" ? "Loading…" : "Start camera"}
          </button>
        )}
        <span className={`text-xs ${status === "error" ? "text-red-300" : "text-zinc-400"}`}>{message}</span>
      </div>
    </div>
  );
}
