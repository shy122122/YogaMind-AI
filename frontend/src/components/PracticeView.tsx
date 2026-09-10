import { Camera, CheckCircle2, Home, Mic, MicOff, Pause, Play, RotateCcw, ScanLine, SkipForward, Sparkles, Volume2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePoseDetector } from "../hooks/usePoseDetector";
import { useTtsCoach } from "../hooks/useTtsCoach";
import type { CourseResponse, PoseAnalysisResult, PoseItem, SessionStats, TrackingQuality } from "../types/domain";
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

type DemoSignal = "normal" | "mismatch";

export function PracticeView({ course, demoMode, onExit, onComplete }: PracticeViewProps) {
  const [poseIndex, setPoseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(course.poses[0]?.duration_sec ?? 60);
  const [useMock, setUseMock] = useState(demoMode);
  const [demoSignal, setDemoSignal] = useState<DemoSignal>("normal");
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [demoExpanded, setDemoExpanded] = useState(false);
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [errorCounts, setErrorCounts] = useState<Record<string, number>>({});
  const lastErrorCountRef = useRef<{ key: string; at: number }>({ key: "", at: 0 });
  const pose = course.poses[poseIndex] ?? course.poses[0];
  const poseCount = course.poses.length;
  const { speaking, speak } = useTtsCoach(!muted);
  const { videoRef, canvasRef, cameraIssue, ready } = usePoseDetector({
    pose,
    useMock,
    enabled: true,
    simulateMismatch: demoSignal === "mismatch",
    onAnalysis: setAnalysis,
  });

  const isFar = analysis.readingMode === "far";
  const isMismatch = Boolean(analysis.mismatch?.mismatched);
  const totalErrors = Object.values(errorCounts).reduce((sum, value) => sum + value, 0);
  const progress = Math.max(0, Math.min(100, ((pose.duration_sec - secondsLeft) / pose.duration_sec) * 100));
  const timeLabel = useMemo(() => formatTime(secondsLeft), [secondsLeft]);
  const quality = (cameraIssue ? "no_pose" : analysis.trackingQuality) as TrackingQuality;
  const coachTone = isMismatch ? "动作先对齐" : analysis.formError ? "身体微调" : analysis.pendingCorrection ? "我再观察一下" : "节奏很好";
  const hasNextPose = poseIndex < poseCount - 1;

  useEffect(() => {
    setSecondsLeft(pose.duration_sec);
    setAnalysis(initialAnalysis);
    setDemoExpanded(false);
  }, [pose.pose_id, pose.duration_sec]);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [paused]);

  useEffect(() => {
    if (secondsLeft > 0) return;
    if (hasNextPose) {
      setPoseIndex((value) => value + 1);
      return;
    }
    completePractice();
  }, [hasNextPose, secondsLeft]);

  useEffect(() => {
    if (!analysis.formError) return;
    const key = analysis.errorKey || "posture_adjust";
    const now = Date.now();
    const shouldCountError = lastErrorCountRef.current.key !== key || now - lastErrorCountRef.current.at > 3000;

    if (shouldCountError) {
      lastErrorCountRef.current = { key, at: now };
      setErrorCounts((counts) => ({ ...counts, [key]: (counts[key] ?? 0) + 1 }));
    }

    speak(analysis.correctionTip, key);
  }, [analysis.correctionTip, analysis.errorKey, analysis.formError, speak]);

  function completePractice() {
    const completedPoseTime = course.poses.slice(0, poseIndex).reduce((sum, item) => sum + item.duration_sec, 0);
    const currentPoseTime = Math.max(0, pose.duration_sec - secondsLeft);
    const durationSec = Math.min(course.total_duration_sec, completedPoseTime + currentPoseTime || course.total_duration_sec);
    const accuracyScore = Math.max(72, 96 - totalErrors * 4);
    onComplete({ durationSec, accuracyScore, errorCounts });
  }

  function goNextPose() {
    if (hasNextPose) {
      setPoseIndex((value) => value + 1);
      return;
    }
    completePractice();
  }

  function resetDemoSignal() {
    setDemoSignal("normal");
    setAnalysis(initialAnalysis);
  }

  return (
    <main className="training-shell min-h-dvh px-3 py-3 text-white safe-bottom sm:px-5 sm:py-5">
      <section className="mx-auto flex min-h-[calc(100dvh-24px)] max-w-md flex-col gap-3 lg:max-w-6xl">
        <PracticeHeader
          pose={pose}
          poseIndex={poseIndex}
          poseCount={poseCount}
          timeLabel={timeLabel}
          progress={progress}
          paused={paused}
          onPause={() => setPaused((value) => !value)}
          onExit={onExit}
        />

        {isFar && (
          <FarReadingPanel pose={pose} timeLabel={timeLabel} message={analysis.correctionTip} speaking={speaking && !muted} />
        )}

        <div className="lg:grid lg:flex-1 lg:grid-cols-[minmax(280px,0.42fr)_minmax(0,0.58fr)] lg:gap-4">
          <div className="lg:order-1">
            <DemoDock pose={pose} expanded={demoExpanded && !isFar} compact={isFar} onToggle={() => setDemoExpanded((value) => !value)} />
          </div>

          <section className="relative mt-3 overflow-hidden rounded-[32px] border border-white/10 bg-night p-3 shadow-soft lg:order-2 lg:mt-0 lg:flex lg:flex-col">
            <div className="camera-surface relative h-[55dvh] min-h-[390px] flex-1 overflow-hidden rounded-[26px] bg-black/30 lg:min-h-[650px]">
              <div className="absolute bottom-10 left-1/2 h-[300px] w-[260px] -translate-x-1/2 rounded-[36px] bg-sage/10" />
              {useMock ? (
                <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="演示模式骨骼关键点" />
              ) : (
                <>
                  <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover opacity-90" playsInline muted autoPlay />
                  <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="MediaPipe Pose 实时骨骼关键点" />
                </>
              )}

              {!ready && !useMock && (
                <div className="absolute inset-0 grid place-items-center bg-cream/82 text-center text-forest backdrop-blur-[2px]">
                  <div className="rounded-[24px] bg-white/88 px-5 py-4 shadow-card">
                    <p className="font-semibold">正在准备实时姿态识别</p>
                    <p className="mt-2 text-sm opacity-65">请允许浏览器使用摄像头。</p>
                  </div>
                </div>
              )}

              <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <div className="inline-flex rounded-full border border-white/16 bg-night/58 px-3 py-1.5 text-xs font-semibold text-white/78 shadow-card backdrop-blur-md">
                    {useMock ? "演示模式" : ready ? "实时识别中" : "等待摄像头"}
                  </div>
                  <QualityBadge quality={quality} />
                  <div className="inline-flex rounded-full border border-white/16 bg-night/50 px-3 py-1.5 text-xs font-semibold text-white/64 shadow-card backdrop-blur-md">
                    {analysis.angleLabel}
                  </div>
                </div>
                <button
                  onClick={() => setUseMock((value) => !value)}
                  className="shrink-0 rounded-[18px] bg-white/90 px-3 py-2 text-xs font-semibold text-forest shadow-card transition active:translate-y-[1px]"
                >
                  {useMock ? "重试摄像头" : "离线体验"}
                </button>
              </div>

              {(analysis.pendingCorrection || analysis.formError) && (
                <div className="absolute right-3 top-[132px] overflow-hidden rounded-full border border-white/16 bg-night/64 px-3 py-1.5 text-xs font-semibold text-white/78 shadow-card backdrop-blur-md">
                  <span className="relative z-[1]">{analysis.formError ? "可以再放松一点" : "我再观察一下"}</span>
                  <span className="absolute inset-y-0 left-0 bg-lime/22 transition-all duration-300" style={{ width: analysis.formError ? "100%" : "48%" }} />
                </div>
              )}

              <CoachTipCard tone={coachTone} message={analysis.correctionTip} formError={analysis.formError} pendingCorrection={analysis.pendingCorrection} totalErrors={totalErrors} />
            </div>

            <CoachCompanion speaking={speaking && !muted} muted={muted} formError={analysis.formError} pendingCorrection={analysis.pendingCorrection} message={analysis.correctionTip} />

            {cameraIssue && (
              <div className="mt-3 rounded-[22px] border border-clay/20 bg-[#FFF3EB] p-3 text-sm leading-6 text-clay">
                {cameraIssue}
              </div>
            )}

            <DemoControlStrip
              useMock={useMock}
              muted={muted}
              demoSignal={demoSignal}
              hasNextPose={hasNextPose}
              onToggleMute={() => setMuted((value) => !value)}
              onToggleMock={() => setUseMock((value) => !value)}
              onSetSignal={setDemoSignal}
              onResetSignal={resetDemoSignal}
              onNext={goNextPose}
            />
          </section>
        </div>

        <button onClick={completePractice} className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-lime px-5 py-4 font-semibold text-night shadow-soft transition active:translate-y-[1px] lg:hidden">
          <CheckCircle2 size={18} /> 完成跟练
        </button>
      </section>
    </main>
  );
}

function PracticeHeader({ pose, poseIndex, poseCount, timeLabel, progress, paused, onPause, onExit }: {
  pose: PoseItem;
  poseIndex: number;
  poseCount: number;
  timeLabel: string;
  progress: number;
  paused: boolean;
  onPause: () => void;
  onExit: () => void;
}) {
  return (
    <section className="relative overflow-hidden rounded-[30px] bg-white/10 p-4 shadow-soft backdrop-blur-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-lime/90">正在训练 · 第 {poseIndex + 1} / {poseCount} 个动作</p>
          <h1 className="mt-1 truncate text-3xl font-semibold leading-tight text-white">{pose.pose_name}</h1>
          <p className="mt-1 line-clamp-1 text-xs leading-5 text-white/58">{pose.key_points_tip || "今天先求舒服和稳定，不追求动作幅度。"}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="rounded-full bg-lime px-4 py-2 text-xl font-semibold tabular-nums text-night">{timeLabel}</span>
          <div className="flex gap-2">
            <button onClick={onPause} className="grid h-10 w-10 place-items-center rounded-[16px] bg-white/10 text-white transition active:scale-95" aria-label={paused ? "继续" : "暂停"}>
              {paused ? <Play size={17} /> : <Pause size={17} />}
            </button>
            <button onClick={onExit} className="grid h-10 w-10 place-items-center rounded-[16px] bg-white/10 text-white transition active:scale-95" aria-label="退出练习">
              <Home size={17} />
            </button>
          </div>
        </div>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/12">
        <div className="h-full rounded-full bg-lime transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
}

function FarReadingPanel({ pose, timeLabel, message, speaking }: { pose: PoseItem; timeLabel: string; message: string; speaking: boolean }) {
  return (
    <section className="rounded-[30px] border border-white/12 bg-white/10 p-4 text-white shadow-soft backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-lime/80">远距离大字模式</p>
          <h2 className="mt-1 truncate text-4xl font-semibold leading-none">{pose.pose_name}</h2>
        </div>
        <span className="rounded-full bg-lime px-4 py-2 text-2xl font-semibold tabular-nums text-night">{timeLabel}</span>
      </div>
      <p className="mt-4 text-2xl font-semibold leading-snug">{message}</p>
      <div className="mt-4 flex items-center justify-between rounded-[22px] bg-night/35 px-3 py-2">
        <span className="text-xs font-semibold text-white/66">{speaking ? "正在轻声提醒" : "可以主要听语音"}</span>
        <VoiceWaveform active={speaking} />
      </div>
    </section>
  );
}

function DemoDock({ pose, expanded, compact, onToggle }: { pose: PoseItem; expanded: boolean; compact: boolean; onToggle: () => void }) {
  return (
    <div className={compact ? "" : "lg:sticky lg:top-4"}>
      <DemoPoseCard pose={pose} compact={compact} />
      {!compact && (
        <button onClick={onToggle} className="mt-2 w-full rounded-[20px] bg-white/12 px-4 py-3 text-sm font-semibold text-white shadow-card transition active:translate-y-[1px] lg:hidden">
          {expanded ? "收起标准示范" : "展开标准示范"}
        </button>
      )}
      {expanded && (
        <div className="mt-2 rounded-[24px] bg-white/95 p-3 text-forest shadow-card lg:hidden">
          <p className="text-xs font-semibold text-sage">动作要领</p>
          <p className="mt-1 text-sm leading-6 text-forest/68">{pose.key_points_tip || pose.guidance_tip}</p>
          <p className="mt-2 text-xs font-semibold text-forest/42">目标角度 {pose.target_angle_min}° - {pose.target_angle_max}°</p>
        </div>
      )}
    </div>
  );
}

function CoachTipCard({ tone, message, formError, pendingCorrection, totalErrors }: { tone: string; message: string; formError: boolean; pendingCorrection: boolean; totalErrors: number }) {
  return (
    <div className={["absolute bottom-3 left-3 right-3 rounded-[26px] border bg-white/94 p-3 text-forest shadow-soft backdrop-blur-md transition", formError ? "border-clay/35" : pendingCorrection ? "border-lime/35" : "border-white/80"].join(" ")}>
      <div className="flex items-start gap-3">
        <span className={["mt-1 h-2.5 w-2.5 shrink-0 rounded-full", formError ? "bg-clay" : pendingCorrection ? "bg-[#E7B76A]" : "bg-sage"].join(" ")} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className={["text-sm font-semibold", formError ? "text-clay" : "text-sage"].join(" ")}>{tone}</p>
            <span className="rounded-full bg-cream px-2 py-0.5 text-[11px] font-semibold text-forest/48">温柔提醒 {totalErrors} 次</span>
          </div>
          <p className="mt-1 line-clamp-2 text-base font-semibold leading-6 text-forest/78">{message}</p>
        </div>
      </div>
    </div>
  );
}

function CoachCompanion({ speaking, muted, formError, pendingCorrection, message }: { speaking: boolean; muted: boolean; formError: boolean; pendingCorrection: boolean; message: string }) {
  const shortMessage = formError ? "慢一点，先把姿势摆对。" : pendingCorrection ? "我再观察一小会儿。" : "很好，保持呼吸。";
  return (
    <div className={["mt-3 flex items-center gap-3 rounded-[24px] border bg-cream p-3 text-forest shadow-card", formError ? "border-clay/28" : "border-white/80"].join(" ")} title={message}>
      <div className={["relative grid h-12 w-12 shrink-0 place-items-center rounded-[20px] bg-night text-lime shadow-card", speaking ? "animate-breathe" : ""].join(" ")} aria-label="灵瑜教练">
        {muted ? <MicOff size={20} /> : speaking ? <Volume2 size={20} /> : <Sparkles size={20} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-sage">灵瑜教练</p>
          <VoiceWaveform active={speaking} />
        </div>
        <p className="mt-1 text-sm leading-5 text-forest/68">{muted ? "语音已关闭，可看屏幕提示。" : shortMessage}</p>
      </div>
    </div>
  );
}

function DemoControlStrip({ useMock, muted, demoSignal, hasNextPose, onToggleMute, onToggleMock, onSetSignal, onResetSignal, onNext }: {
  useMock: boolean;
  muted: boolean;
  demoSignal: DemoSignal;
  hasNextPose: boolean;
  onToggleMute: () => void;
  onToggleMock: () => void;
  onSetSignal: (signal: DemoSignal) => void;
  onResetSignal: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-4 gap-2">
      <ControlButton icon={muted ? <MicOff size={18} /> : <Mic size={18} />} label={muted ? "开语音" : "静音"} onClick={onToggleMute} />
      <ControlButton icon={<Camera size={18} />} label={useMock ? "摄像头" : "演示"} onClick={onToggleMock} />
      <ControlButton icon={demoSignal === "mismatch" ? <RotateCcw size={18} /> : <ScanLine size={18} />} label={demoSignal === "mismatch" ? "恢复" : "错姿"} onClick={() => demoSignal === "mismatch" ? onResetSignal() : onSetSignal("mismatch")} active={demoSignal === "mismatch"} />
      <ControlButton icon={<SkipForward size={18} />} label={hasNextPose ? "下一式" : "完成"} onClick={onNext} />
    </div>
  );
}

function ControlButton({ icon, label, onClick, active = false }: { icon: ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className={["rounded-[20px] px-2 py-3 text-xs font-semibold shadow-card transition active:translate-y-[1px]", active ? "bg-clay text-white" : "bg-white/10 text-white"].join(" ")}>
      <span className="mx-auto mb-1 grid place-items-center">{icon}</span>
      {label}
    </button>
  );
}

function formatTime(value: number) {
  const minutes = Math.floor(value / 60).toString().padStart(2, "0");
  const seconds = (value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}



