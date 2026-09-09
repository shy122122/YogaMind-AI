import type { PoseItem } from "../types/domain";

export function DemoPoseCard({ pose, compact = false }: { pose: PoseItem; compact?: boolean }) {
  return (
    <section className={["rounded-[26px] bg-white/95 p-2.5 shadow-card", compact ? "flex items-center gap-3" : ""].join(" ")}>
      <div className={["overflow-hidden rounded-[22px] bg-cream", compact ? "h-16 w-16 shrink-0" : "h-56"].join(" ")}>
        <img
          src={pose.demo_media_url || "/assets/demo/standing_breath.png"}
          alt={`${pose.pose_name}示范图`}
          className="h-full w-full object-cover"
          onError={(event) => { event.currentTarget.src = "/assets/demo/standing_breath.png"; }}
        />
      </div>
      <div className={compact ? "min-w-0" : "mt-3"}>
        <p className="text-xs font-semibold text-sage">真人示范</p>
        <h3 className="mt-0.5 truncate text-lg font-semibold text-forest">{pose.pose_name}</h3>
        {!compact && <p className="mt-2 text-sm leading-6 text-forest/62">{pose.key_points_tip || pose.guidance_tip}</p>}
      </div>
    </section>
  );
}
