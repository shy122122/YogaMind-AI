import { useCallback, useEffect, useRef, useState } from "react";
import type { Landmark, PoseAnalysisResult, PoseItem } from "../types/domain";
import { drawSkeleton } from "../utils/poseMath";
import { analyzePose, mockLandmarks } from "../utils/poseRules";

declare global {
  interface Window {
    Pose?: any;
    Camera?: any;
  }
}

interface UsePoseDetectorOptions {
  pose: PoseItem | null;
  useMock: boolean;
  enabled: boolean;
  simulateMismatch: boolean;
  onAnalysis: (analysis: PoseAnalysisResult) => void;
}

const debounceMs = 1500;

export function usePoseDetector({ pose, useMock, enabled, simulateMismatch, onAnalysis }: UsePoseDetectorOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraIssue, setCameraIssue] = useState("");
  const [ready, setReady] = useState(false);
  const errorSinceRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const frameRef = useRef(0);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const nextWidth = Math.round(box.width * ratio);
    const nextHeight = Math.round(box.height * ratio);
    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
    }
  }, []);

  const commitAnalysis = useCallback((landmarks: Landmark[]) => {
    if (!pose || !canvasRef.current) return;
    resizeCanvas();
    const raw = analyzePose(pose, landmarks);
    const now = performance.now();
    let formError = raw.formError;
    let pendingCorrection = false;

    if (raw.formError) {
      if (!errorSinceRef.current) errorSinceRef.current = now;
      pendingCorrection = now - errorSinceRef.current < debounceMs;
      formError = !pendingCorrection;
    } else {
      errorSinceRef.current = null;
    }

    const analysis = { ...raw, formError, pendingCorrection };
    drawSkeleton(canvasRef.current, landmarks, {
      highlightJoints: formError ? raw.highlightJoints : [],
      formError,
    });
    onAnalysis(analysis);
  }, [onAnalysis, pose, resizeCanvas]);

  useEffect(() => {
    if (!enabled || !pose) return;
    if (!useMock) return;

    setReady(true);
    setCameraIssue("");
    const tick = () => {
      frameRef.current += 1;
      commitAnalysis(mockLandmarks(frameRef.current, simulateMismatch));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [commitAnalysis, enabled, pose, simulateMismatch, useMock]);

  useEffect(() => {
    if (!enabled || !pose || useMock) return;
    let cancelled = false;
    let camera: any;
    let detector: any;

    async function start() {
      if (!window.Pose || !window.Camera) {
        setCameraIssue("姿态识别脚本加载较慢，已建议先使用演示模式。");
        return;
      }
      const video = videoRef.current;
      if (!video) return;
      try {
        detector = new window.Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
        });
        detector.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
        detector.onResults((result: any) => {
          if (cancelled) return;
          setReady(true);
          commitAnalysis(result.poseLandmarks || []);
        });
        camera = new window.Camera(video, {
          onFrame: async () => detector.send({ image: video }),
          width: 720,
          height: 1280,
        });
        await camera.start();
      } catch {
        setCameraIssue("需要摄像头权限以开启实时指导。也可以先用演示模式完整体验。");
      }
    }

    start();
    return () => {
      cancelled = true;
      camera?.stop?.();
      detector?.close?.();
    };
  }, [commitAnalysis, enabled, pose, useMock]);

  return { videoRef, canvasRef, cameraIssue, ready, setCameraIssue };
}
