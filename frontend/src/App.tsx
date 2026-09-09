import { useEffect, useState } from "react";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { OnboardingModal } from "./components/OnboardingModal";
import { PracticeView } from "./components/PracticeView";
import { PrepareView } from "./components/PrepareView";
import { SummaryView } from "./components/SummaryView";
import { Toast } from "./components/Toast";
import { buildFallbackCourse, fallbackSummary } from "./data/fallbackCourse";
import { generateCourse, submitSession } from "./services/api";
import type { CourseResponse, FocusTarget, SessionStats, SessionSummary, ViewState } from "./types/domain";

const onboardingKey = "yogamind-engineering-onboarding-v1";

export default function App() {
  const [view, setView] = useState<ViewState>("prepare");
  const [focus, setFocus] = useState<FocusTarget>("shoulder");
  const [course, setCourse] = useState<CourseResponse>(() => buildFallbackCourse("shoulder"));
  const [summary, setSummary] = useState<SessionSummary>(fallbackSummary);
  const [stats, setStats] = useState<SessionStats>({ durationSec: 0, accuracyScore: 88, errorCounts: {} });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [demoMode, setDemoMode] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(() => localStorage.getItem(onboardingKey) !== "done");

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function closeOnboarding() {
    localStorage.setItem(onboardingKey, "done");
    setOnboardingOpen(false);
  }

  async function startPractice() {
    setLoading(true);
    setDemoMode(false);
    const result = await generateCourse(focus);
    setCourse(result.course);
    setLoading(false);
    if (result.offline) setToast("网络连接较弱，已为你开启离线跟练模式");
    setView("practice");
  }

  function startDemo() {
    setDemoMode(true);
    setCourse(buildFallbackCourse(focus));
    setToast("已进入演示模式，不依赖摄像头和后端");
    setView("practice");
  }

  async function completePractice(nextStats: SessionStats) {
    setLoading(true);
    setStats(nextStats);
    const result = await submitSession(course.course_id, nextStats);
    setSummary(result.summary);
    setLoading(false);
    if (result.offline) setToast("已使用离线总结，演示流程不受影响");
    setView("summary");
  }

  return (
    <>
      {view === "prepare" && (
        <PrepareView
          focus={focus}
          loading={loading}
          onFocusChange={setFocus}
          onStart={startPractice}
          onDemo={startDemo}
          onGuide={() => setOnboardingOpen(true)}
        />
      )}
      {view === "practice" && <PracticeView course={course} demoMode={demoMode} onExit={() => setView("prepare")} onComplete={completePractice} />}
      {view === "summary" && <SummaryView summary={summary} stats={stats} onBackHome={() => setView("prepare")} />}
      {onboardingOpen && <OnboardingModal onClose={closeOnboarding} />}
      {loading && <LoadingOverlay text={view === "practice" ? "AI 正在生成课后总结..." : "AI 正在为你生成专属课表..."} />}
      {toast && <Toast message={toast} />}
    </>
  );
}
