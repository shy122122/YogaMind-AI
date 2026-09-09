import { useCallback, useEffect, useRef, useState } from "react";

export function useTtsCoach(enabled: boolean) {
  const [speaking, setSpeaking] = useState(false);
  const lastTextRef = useRef<Record<string, number>>({});

  const speak = useCallback((text: string, key = text) => {
    if (!enabled || !text || !("speechSynthesis" in window)) return;
    const now = Date.now();
    if (now - (lastTextRef.current[key] ?? 0) < 10_000) return;
    lastTextRef.current[key] = now;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.92;
    utterance.pitch = 1.02;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [enabled]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  return { speaking, speak };
}
