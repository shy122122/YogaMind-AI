import type { TrackingQuality } from "../types/domain";

const meta: Record<TrackingQuality, { label: string; helper: string; className: string }> = {
  stable: { label: "识别稳定", helper: "可以继续保持。", className: "bg-lime text-night" },
  partial_body: { label: "关键点不足", helper: "让头肩和髋部入镜。", className: "bg-white/90 text-forest" },
  low_light: { label: "光线偏暗", helper: "打开一盏灯会更稳。", className: "bg-[#FFF3EB] text-clay" },
  no_pose: { label: "等待入镜", helper: "后退一点，抬高手机。", className: "bg-white/90 text-forest" },
};

export function QualityBadge({ quality }: { quality: TrackingQuality }) {
  const item = meta[quality];
  return <div className={["rounded-[18px] px-3 py-1.5 text-xs font-semibold shadow-card", item.className].join(" ")}>{item.label}<span className="ml-2 font-medium opacity-70">{item.helper}</span></div>;
}
