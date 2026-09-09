import { Camera, CheckCircle2, Home, SkipForward, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePoseDetector } from "../hooks/usePoseDetector";
import { useTtsCoach } from "../hooks/useTtsCoach";
import type { CourseResponse, PoseAnalysisResult, SessionStats, TrackingQuality } from "../types/domain";
import { DemoPoseCard } from "./DemoPoseCard";
import { QualityBadge } from "./QualityBadge";
import { VoiceWaveform } from "./VoiceWaveform";

interface PracticeViewProps {
  course: CourseResponse;
  demoMode: boolean;
  onExit: () => void;
  onComplete: (stats: SessionStats) => void;
}

const initialAnalysis: PoseAnalysisResult = {
  formError: false,
  pendingCorrection: false,
  correctionTip: "先看示范，再慢慢进入动作。",
  angleLabel: "准备识别",
  highlightJoints: [],
  trackingQuality: "no_pose",
  readingMode: "normal",
};

export function PracticeView({ course, demoMode, onExit, onComplete }: PracticeViewProps) {
  const [poseIndex, setPoseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(course.poses[0]?.duration_sec ?? 60);
  const [useMock, setUseMock] = useState(demoMode);
  const [simulateMismatch, setSimulateMismatch] = useState(false);
  const [muted, setMuted] = useState(false);
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [errorCounts, setErrorCounts] = useState<Record<string, number>>({});
  const pose = course.poses[poseIndex] ?? course.poses[0];
  const { speaking, speak } = useTtsCoach(!muted);
  const { videoRef, canvasRef, cameraIssue, ready } = usePoseDetector({
    pose,
    useMock,
    enabled: true,
    simulateMismatch,
    onAnalysis: setAnalysis,
  });

  const isFar = analysis.readingMode === "far";
  const timeLabel = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const seconds = (secondsLeft % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [secondsLeft]);

  useEffect(() => {
    setSecondsLeft(pose.duration_sec);
    setAnalysis(initialAnalysis);
  }, [pose.pose_id, pose.duration_sec]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (secondsLeft > 0) return;
    if (poseIndex < course.poses.length - 1) {
      setPoseIndex((value) => value + 1);
      return;
    }
    const total = course.poses.slice(0, poseIndex + 1).reduce((sum, item) => sum + item.duration_sec, 0);
    const errors = Object.values(errorCounts).reduce((sum, value) => sum + value, 0);
    onComplete({ durationSec: total, accuracyScore: Math.max(72, 96 - errors * 4), errorCounts });
  }, [course.poses, errorCounts, onComplete, poseIndex, secondsLeft]);

  useEffect(() => {
    if (!analysis.formError) return;
    const key = analysis.errorKey || "posture_adjust";
    setErrorCounts((counts) => ({ ...counts, [key]: (counts[key] ?? 0) + 1 }));
    speak(analysis.correctionTip, key);
  }, [analysis.correctionTip, analysis.errorKey, analysis.formError, speak]);

  const quality = (cameraIssue ? "no_pose" : analysis.trackingQuality) as TrackingQuality;

  return (
    <main className="training-shell min-h-dvh px-4 py-4 text-white safe-bottom">
      <section className="mx-auto max-w-md">
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-lime/80">第 {poseIndex + 1} / {course.poses.length} 个动作</p>
            <h1 className="truncate text-2xl font-semibold">{pose.pose_name}</h1>
          </div>
          <div className="rounded-full bg-lime px-4 py-2 text-xl font-semibold tabular-nums text-night">{timeLabel}</div>
        </header>

        {isFar && (
          <section className="mt-4 rounded-[28px] border border-white/10 bg-white/10 p-4 backdrop-blur-md">
            <p className="text-xs font-semibold text-lime/80">远距离大字模式</p>
            <h2 className="mt-1 text-4xl font-semibold leading-none">{pose.pose_name}</h2>
            <p className="mt-4 text-2xl font-semibold leading-snug">{analysis.correctionTip}</p>
            <div className="mt-3 flex items-center justify-between rounded-[20px] bg-night/35 px-3 py-2">
              <span className="text-xs font-semibold text-white/70">{speaking ? "正在轻声提醒" : "可主要听语音"}</span>
              <VoiceWaveform active={speaking} />
            </div>
          </section>
        )}

        <div className="mt-4">
          <DemoPoseCard pose={pose} compact={isFar} />
        </div>

        <section className="mt-3 overflow-hidden rounded-[32px] bg-night p-3 shadow-soft">
          <div className="relative h-[54dvh] min-h-[390px] overflow-hidden rounded-[26px] bg-black/30">
            {useMock ? (
              <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
            ) : (
              <>
                <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover opacity-90" playsInline muted autoPlay />
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
              </>
            )}
            {!ready && !useMock && <div className="absolute inset-0 grid place-items-center bg-cream/80 text-center text-forest"><div><p className="font-semibold">正在准备姿态识别</p><p className="mt-2 text-sm opacity-65">请允许摄像头权限</p></div></div>}
            <div className="absolute left-3 top-3"><QualityBadge quality={quality} /></div>
            <div className="absolute left-3 top-16 rounded-full bg-night/60 px-3 py-1.5 text-xs font-semibold text-white/70 backdrop-blur">{analysis.angleLabel}</div>
            <div className="absolute bottom-3 left-3 right-3 rounded-[24px] bg-white/92 p-3 text-forest shadow-card">
              <p className="text-xs font-semibold text-sage">AI 教练提醒</p>
              <p className="mt-1 text-base font-semibold leading-6">{analysis.correctionTip}</p>
            </div>
          </div>
        </section>

        {cameraIssue && (
          <div className="mt-3 rounded-[22px] bg-[#FFF3EB] p-3 text-sm leading-6 text-clay">
            {cameraIssue}
          </div>
        )}

        <div className="mt-3 grid grid-cols-4 gap-2">
          <button onClick={() => setMuted((value) => !value)} className="rounded-[20px] bg-white/10 px-2 py-3 text-xs font-semibold"><Volume2 className="mx-auto mb-1" size={18} />{muted ? "开语音" : "静音"}</button>
          <button onClick={() => setUseMock((value) => !value)} className="rounded-[20px] bg-white/10 px-2 py-3 text-xs font-semibold"><Camera className="mx-auto mb-1" size={18} />{useMock ? "摄像头" : "演示"}</button>
          <button onClick={() => setSimulateMismatch((value) => !value)} className="rounded-[20px] bg-white/10 px-2 py-3 text-xs font-semibold"><SkipForward className="mx-auto mb-1" size={18} />错姿</button>
          <button onClick={onExit} className="rounded-[20px] bg-white/10 px-2 py-3 text-xs font-semibold"><Home className="mx-auto mb-1" size={18} />退出</button>
        </div>
        <button onClick={() => onComplete({ durationSec: course.total_duration_sec, accuracyScore: 88, errorCounts })} className="mt-3 flex w-full items-center justify-center gap-2 rounded-[24px] bg-lime px-5 py-4 font-semibold text-night">
          <CheckCircle2 size={18} /> 完成跟练
        </button>
      </section>
    </main>
  );
}
