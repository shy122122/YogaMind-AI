"""LLM 服务层。

这里集中处理 OpenAI 官方 SDK 或兼容 OpenAI 格式服务的调用。
核心策略：
1. 优先使用 Pydantic Structured Outputs 强约束模型返回结构。
2. LLM 不可用、超时、限流、欠费或结构校验失败时，透明返回静态兜底数据。
3. 接口层不感知 LLM 细节，保证前端始终收到稳定 JSON。
"""

from __future__ import annotations

import json
import logging
import os
import uuid
from copy import deepcopy
from urllib.parse import quote
from typing import Any, TYPE_CHECKING

from dotenv import load_dotenv

from schemas import (
    CourseGenerateRequest,
    CourseGenerateResponse,
    PoseItem,
    SessionSubmitRequest,
    SessionSubmitResponse,
)

if TYPE_CHECKING:
    from openai import AsyncOpenAI


load_dotenv()

logger = logging.getLogger(__name__)


def _demo_svg_url(pose_name: str, tip: str) -> str:
    """生成保守的自绘体式示范图，避免外部图片错配误导用户。"""

    svg = f"""
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 1100">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="0.62" stop-color="#F6FAFF"/>
      <stop offset="1" stop-color="#EAF8F7"/>
    </linearGradient>
  </defs>
  <rect width="900" height="1100" fill="url(#bg)"/>
  <ellipse cx="450" cy="850" rx="250" ry="42" fill="#6AC4BE" opacity=".1"/>
  <circle cx="450" cy="245" r="62" fill="#6AC4BE" opacity=".24"/>
  <path d="M450 320 C398 430 390 540 338 680 M450 320 C515 420 565 535 628 682 M392 428 C318 500 278 570 238 654 M508 428 C598 492 652 570 690 654" fill="none" stroke="#6AC4BE" stroke-width="36" stroke-linecap="round" opacity=".58"/>
  <path d="M300 760 C384 714 516 714 600 760" fill="none" stroke="#F39A72" stroke-width="22" stroke-linecap="round" opacity=".34"/>
  <text x="450" y="950" text-anchor="middle" font-size="54" font-weight="700" font-family="Microsoft YaHei, PingFang SC, sans-serif" fill="#27324A">{pose_name[:16]}</text>
  <text x="450" y="1018" text-anchor="middle" font-size="30" font-family="Microsoft YaHei, PingFang SC, sans-serif" fill="#6AC4BE">{tip[:26]}</text>
</svg>
"""
    return "data:image/svg+xml;charset=UTF-8," + quote(svg)


def _demo_asset_url(demo_visual_key: str) -> str:
    """返回前端约定的本地真人示范素材路径。

    当前为统一风格示范素材，后续替换成实拍图时保持文件名不变即可。
    """

    return f"assets/demo/{demo_visual_key}.png"


DEFAULT_COURSE: dict[str, Any] = {
    "course_id": "course_fallback",
    "course_title": "10分钟肩颈舒缓放松跟练",
    "total_duration_sec": 600,
    "source": "fallback",
    "plan_reason": "根据你的练习目标和安全边界，今天先从低强度呼吸、肩颈放松和脊柱唤醒开始，帮助身体慢慢进入状态。",
    "poses": [
        {
            "pose_id": "breathing_center",
            "pose_name": "站姿呼吸",
            "duration_sec": 60,
            "cv_rule_key": "shoulder_relax",
            "correction_error_key": "shoulder_high",
            "camera_mode_required": "half_body",
            "demo_visual_key": "standing_breath",
            "demo_media_url": _demo_asset_url("standing_breath"),
            "key_points_tip": "双脚踩稳，锁骨轻轻展开，肩膀自然远离耳朵。",
            "target_angle_min": 150,
            "target_angle_max": 180,
            "guidance_tip": "双脚踩稳，肩膀自然下沉，先找到平稳呼吸。",
            "focus_tags": ["shoulder", "spine", "full_body"],
            "avoid_for": [],
        },
        {
            "pose_id": "cat_cow",
            "pose_name": "猫牛式",
            "duration_sec": 90,
            "cv_rule_key": "spine_extension",
            "correction_error_key": "spine_rounding",
            "camera_mode_required": "half_body",
            "demo_visual_key": "cat_cow",
            "demo_media_url": _demo_asset_url("cat_cow"),
            "key_points_tip": "双手稳定推地，吸气展开胸口，呼气时让脊柱一节一节卷起。",
            "target_angle_min": 140,
            "target_angle_max": 180,
            "guidance_tip": "跟随呼吸慢慢卷动脊柱，肩膀远离耳朵。",
            "focus_tags": ["shoulder", "spine", "full_body"],
            "avoid_for": ["knee"],
        },
        {
            "pose_id": "child_pose",
            "pose_name": "婴儿式",
            "duration_sec": 75,
            "cv_rule_key": "spine_extension",
            "correction_error_key": "shoulder_high",
            "camera_mode_required": "mat_view",
            "demo_visual_key": "child_pose",
            "demo_media_url": _demo_asset_url("child_pose"),
            "key_points_tip": "臀部向脚跟放松，手臂向前延展，后背保持柔和拉长。",
            "target_angle_min": 120,
            "target_angle_max": 175,
            "guidance_tip": "额头轻轻靠近垫面，让背部自然展开。",
            "focus_tags": ["shoulder", "spine", "full_body"],
            "avoid_for": ["knee"],
        },
        {
            "pose_id": "low_lunge",
            "pose_name": "低弓步",
            "duration_sec": 90,
            "cv_rule_key": "knee_alignment",
            "correction_error_key": "knee_inward",
            "camera_mode_required": "full_body",
            "demo_visual_key": "low_lunge",
            "demo_media_url": _demo_asset_url("low_lunge"),
            "key_points_tip": "前膝对准脚尖，后脚外缘踩稳，双肩下沉、手臂向两侧延展。",
            "target_angle_min": 140,
            "target_angle_max": 180,
            "guidance_tip": "前膝对准脚尖，胸口轻轻向前打开。",
            "focus_tags": ["full_body"],
            "avoid_for": ["knee", "waist"],
        },
        {
            "pose_id": "supine_twist",
            "pose_name": "仰卧扭转",
            "duration_sec": 75,
            "cv_rule_key": "hip_stability",
            "correction_error_key": "hip_shift",
            "camera_mode_required": "mat_view",
            "demo_visual_key": "supine_twist",
            "demo_media_url": _demo_asset_url("supine_twist"),
            "key_points_tip": "肩膀尽量贴近地面，骨盆保持稳定，扭转停在舒服的位置。",
            "target_angle_min": 130,
            "target_angle_max": 180,
            "guidance_tip": "让肩膀贴近地面，动作停在舒服的位置。",
            "focus_tags": ["spine", "full_body"],
            "avoid_for": ["waist"],
        },
        {
            "pose_id": "mountain_pose",
            "pose_name": "山式站立",
            "duration_sec": 60,
            "cv_rule_key": "shoulder_relax",
            "correction_error_key": "shoulder_high",
            "camera_mode_required": "full_body",
            "demo_visual_key": "mountain",
            "demo_media_url": _demo_asset_url("mountain"),
            "key_points_tip": "脚掌均匀踩地，头顶向上延展，肩膀自然下沉。",
            "target_angle_min": 150,
            "target_angle_max": 180,
            "guidance_tip": "站稳后把呼吸放慢，肩膀自然远离耳朵。",
            "focus_tags": ["shoulder", "spine", "full_body"],
            "avoid_for": [],
        },
        {
            "pose_id": "standing_side_bend",
            "pose_name": "站姿侧伸展",
            "duration_sec": 75,
            "cv_rule_key": "spine_extension",
            "correction_error_key": "spine_rounding",
            "camera_mode_required": "full_body",
            "demo_visual_key": "side_bend",
            "demo_media_url": _demo_asset_url("side_bend"),
            "key_points_tip": "骨盆保持稳定，侧腰向上拉长，身体不要向前塌。",
            "target_angle_min": 135,
            "target_angle_max": 180,
            "guidance_tip": "侧腰慢慢拉长，动作停在舒服的位置。",
            "focus_tags": ["spine", "full_body"],
            "avoid_for": ["waist"],
        },
        {
            "pose_id": "seated_neck_release",
            "pose_name": "坐姿颈侧放松",
            "duration_sec": 60,
            "cv_rule_key": "shoulder_relax",
            "correction_error_key": "shoulder_high",
            "camera_mode_required": "half_body",
            "demo_visual_key": "seated_neck",
            "demo_media_url": _demo_asset_url("seated_neck"),
            "key_points_tip": "坐骨稳定，肩膀下沉，颈部只做轻柔延展。",
            "target_angle_min": 150,
            "target_angle_max": 180,
            "guidance_tip": "先沉肩，再让颈侧轻轻拉长，不要用力压头。",
            "focus_tags": ["shoulder"],
            "avoid_for": ["neck"],
        },
        {
            "pose_id": "bridge_prep",
            "pose_name": "桥式预备",
            "duration_sec": 75,
            "cv_rule_key": "hip_stability",
            "correction_error_key": "hip_shift",
            "camera_mode_required": "mat_view",
            "demo_visual_key": "bridge",
            "demo_media_url": _demo_asset_url("bridge"),
            "key_points_tip": "双脚踩稳，骨盆缓慢抬起，保持左右髋部稳定。",
            "target_angle_min": 130,
            "target_angle_max": 180,
            "guidance_tip": "脚掌踩稳，骨盆慢慢抬起，腰背不要硬顶。",
            "focus_tags": ["spine", "full_body"],
            "avoid_for": ["waist", "neck"],
        },
        {
            "pose_id": "half_forward_fold",
            "pose_name": "半前屈伸展",
            "duration_sec": 60,
            "cv_rule_key": "spine_extension",
            "correction_error_key": "spine_rounding",
            "camera_mode_required": "full_body",
            "demo_visual_key": "half_forward_fold",
            "demo_media_url": _demo_asset_url("half_forward_fold"),
            "key_points_tip": "膝盖可以微屈，背部向前拉长，不追求手碰地。",
            "target_angle_min": 135,
            "target_angle_max": 180,
            "guidance_tip": "背部拉长一点就好，膝盖可以保持微弯。",
            "focus_tags": ["spine", "full_body"],
            "avoid_for": ["waist"],
        },
    ],
}

DEFAULT_FEEDBACK: dict[str, str] = {
    "session_id": "sess_fallback",
    "summary_title": "很棒，你完成了一次温柔而稳定的练习",
    "ai_feedback": "今天你完成了完整练习，整体节奏很稳定。下次继续保持沉肩呼吸，把动作幅度放小一点，让身体慢慢进入节奏。",
    "badge_awarded": "稳定呼吸练习者",
    "next_practice_suggestion": "下次可以继续做 8 分钟肩颈舒缓，保持今天这种不着急的节奏。",
    "source": "fallback",
}


def _new_id(prefix: str) -> str:
    """生成短 ID，方便前端展示和日志排查。"""

    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def _get_client() -> "AsyncOpenAI | None":
    """按环境变量创建 OpenAI 兼容客户端。

    未配置 API Key 时返回 None，让业务走静态兜底，方便本地无 Key 开发。
    """

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        logger.warning("未配置 OPENAI_API_KEY，已启用本地兜底数据。")
        return None

    try:
        from openai import AsyncOpenAI
    except ImportError:
        logger.exception("未安装 openai SDK，已启用本地兜底数据。")
        return None

    return AsyncOpenAI(
        api_key=api_key,
        base_url=os.getenv("OPENAI_BASE_URL") or None,
        timeout=float(os.getenv("LLM_TIMEOUT_SECONDS", "5")),
    )


def _is_deepseek_compatible_mode() -> bool:
    """DeepSeek 兼容 OpenAI 接口，但不支持 SDK 的 parse 结构化输出。"""

    base_url = (os.getenv("OPENAI_BASE_URL") or "").lower()
    return "deepseek" in base_url


def _extract_json_object(content: str) -> dict[str, Any]:
    """从模型文本中提取 JSON 对象，并交给 Pydantic 做最终强校验。"""

    text = content.strip()
    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.lower().startswith("json"):
            text = text[4:].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start < 0 or end <= start:
            raise
        return json.loads(text[start : end + 1])


async def _deepseek_json_completion(
    client: "AsyncOpenAI",
    model: str,
    system_prompt: str,
    user_payload: dict[str, Any],
) -> dict[str, Any]:
    """使用 DeepSeek 支持的 JSON Object 模式生成并解析 JSON。"""

    messages = [
        {
            "role": "system",
            "content": (
                f"{system_prompt}\n"
                "你必须只返回一个合法 JSON object，不要使用 Markdown，不要添加解释文字。"
            ),
        },
        {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
    ]

    try:
        completion = await client.chat.completions.create(
            model=model,
            response_format={"type": "json_object"},
            messages=messages,
        )
    except Exception:
        # 部分 OpenAI 兼容服务会临时关闭 response_format，兜底为纯 Prompt JSON。
        completion = await client.chat.completions.create(
            model=model,
            messages=messages,
        )

    content = completion.choices[0].message.content or ""
    return _extract_json_object(content)


def fallback_course(request: CourseGenerateRequest) -> CourseGenerateResponse:
    """LLM 不可用时的默认课程，保证前端永远有可用数据。"""

    duration_sec = request.duration_minutes * 60
    focus_title = {
        "shoulder": "肩颈舒缓放松",
        "spine": "脊柱灵活唤醒",
        "full_body": "全身轻柔流动",
    }[request.target_focus.value]
    body_state_title = {
        "stiff": "舒展",
        "tired": "轻量",
        "normal": "稳定",
    }[request.body_state.value]
    safety_tip = {
        "none": "",
        "knee": "已避开深屈膝、跪压和强弓步动作。",
        "waist": "已避开深度扭转、强后弯和大幅弓步动作。",
        "neck": "会优先提醒沉肩放松，减少肩颈压力。",
    }[request.safety.value]

    selected: list[PoseItem] = []
    remaining = duration_sec
    index = 0
    base_poses = [
        pose
        for pose in DEFAULT_COURSE["poses"]
        if request.target_focus.value in pose.get("focus_tags", [])
        and request.safety.value not in pose.get("avoid_for", [])
    ]
    if not base_poses:
        base_poses = [
            pose
            for pose in DEFAULT_COURSE["poses"]
            if request.safety.value not in pose.get("avoid_for", [])
        ]
    if not base_poses:
        base_poses = [DEFAULT_COURSE["poses"][0]]

    while remaining > 0:
        pose_payload = deepcopy(base_poses[index % len(base_poses)])
        if request.body_state.value == "tired":
            pose_payload["duration_sec"] = min(60, pose_payload["duration_sec"])
            pose_payload["guidance_tip"] = (
                f"{pose_payload['guidance_tip']} 今天强度放轻，动作停在舒服的位置。"
            )
        if safety_tip:
            pose_payload["guidance_tip"] = f"{pose_payload['guidance_tip']} {safety_tip}"
        pose_payload["duration_sec"] = min(pose_payload["duration_sec"], remaining)
        selected.append(PoseItem.model_validate(pose_payload))
        remaining -= pose_payload["duration_sec"]
        index += 1

    return CourseGenerateResponse(
        course_id=_new_id("course"),
        course_title=f"{request.duration_minutes}分钟{body_state_title}{focus_title}跟练",
        total_duration_sec=duration_sec,
        plan_reason=(
            f"根据你的{focus_title}目标、“{body_state_title}”状态和 {request.duration_minutes} 分钟时长，"
            f"今天优先安排低强度基础动作。{safety_tip}我会让节奏更慢，帮助你先建立安全、稳定的练习感觉。"
        ),
        poses=selected,
    )


def fallback_session_summary(request: SessionSubmitRequest) -> SessionSubmitResponse:
    """LLM 不可用时的默认课后总结。"""

    errors = request.error_counts
    duration_min = max(1, round(request.actual_duration_sec / 60))

    detail = []
    if errors.shoulder_high:
        detail.append(f"练习中有 {errors.shoulder_high} 次轻微耸肩")
    if errors.knee_inward:
        detail.append(f"有 {errors.knee_inward} 次膝盖内扣趋势")
    if errors.spine_rounding:
        detail.append(f"有 {errors.spine_rounding} 次脊柱线条不够舒展")
    if errors.hip_shift:
        detail.append(f"有 {errors.hip_shift} 次骨盆轻微偏移")
    if errors.posture_adjust:
        detail.append(f"收到 {errors.posture_adjust} 次姿势微调提醒")
    detail_text = "，".join(detail) if detail else "动作整体很平稳"

    payload = deepcopy(DEFAULT_FEEDBACK)
    payload.update(
        {
            "session_id": _new_id("sess"),
            "ai_feedback": (
                f"今天你坚持完成了约 {duration_min} 分钟练习，整体标准率达到 "
                f"{request.accuracy_score}%。{detail_text}。下次可以继续保持沉肩呼吸，"
                "把动作幅度放小一点，让身体慢慢进入节奏。"
            ),
            "next_practice_suggestion": _build_next_practice_suggestion(request),
        }
    )
    return SessionSubmitResponse.model_validate(payload)


def _build_next_practice_suggestion(request: SessionSubmitRequest) -> str:
    """根据主要偏差生成下一次练习建议。"""

    errors = request.error_counts
    candidates = [
        (errors.shoulder_high, "下次建议继续做 8 分钟肩颈舒缓，把注意力放在沉肩和呼气上。"),
        (errors.knee_inward, "下次建议做 8 分钟下肢稳定练习，先练脚掌踩稳和膝盖朝向脚尖。"),
        (errors.spine_rounding, "下次建议做 8 分钟脊柱唤醒，让背部一节一节慢慢活动开。"),
        (errors.hip_shift, "下次建议做 7 分钟骨盆稳定练习，动作小一点，先找左右平衡。"),
        (errors.posture_adjust, "下次建议从 6 分钟基础动作开始，先把身体方向和入镜位置调舒服。"),
    ]
    count, text = max(candidates, key=lambda item: item[0])
    if count > 0:
        return text
    return "下次可以继续做 8 分钟轻柔瑜伽，保持今天这种不着急的节奏。"


def _ensure_course_matches_request(
    course: CourseGenerateResponse, requested_duration_sec: int
) -> CourseGenerateResponse:
    """校验课程时长契约，防止 LLM 结构正确但业务数值跑偏。"""

    pose_duration_total = sum(pose.duration_sec for pose in course.poses)
    if course.total_duration_sec != requested_duration_sec:
        raise ValueError("课程总时长与用户请求不一致。")
    if pose_duration_total != course.total_duration_sec:
        raise ValueError("体式时长之和与课程总时长不一致。")
    return course


class YogaLLMService:
    """瑜伽课程与总结生成服务。"""

    def __init__(self) -> None:
        self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    async def generate_course(
        self, request: CourseGenerateRequest
    ) -> CourseGenerateResponse:
        """调用 LLM 生成结构化课程；失败时返回默认课表。"""

        client = _get_client()
        fallback = fallback_course(request)
        if client is None:
            return fallback

        system_prompt = """
你是 YogaMind AI 的资深瑜伽课程编排教练。
目标用户是零经验或低经验练习者，课程必须温和、安全、鼓励、不制造焦虑。
你必须严格返回 CourseGenerateResponse 结构。
plan_reason 必须解释今天为什么这样排课，控制在 80 字以内，给用户建立信任。
系统不能输出医疗诊断、病理康复结论，所有内容只能作为运动健身建议。
必须遵守 safety 字段：
- knee：避开深屈膝、跪压、强弓步、需要膝盖承重过大的动作。
- waist：避开深度扭转、强后弯、爆发式核心动作和大幅度弓步。
- neck：避免肩颈挤压，优先安排沉肩、胸椎舒展、低强度肩颈放松动作。
必须参考 body_state 字段调整强度：
- stiff：动作更慢，强调舒展。
- tired：动作更轻，减少停留时间和大幅度动作。
- normal：维持标准新手强度。
poses 中的 cv_rule_key 必须从以下值选择：
shoulder_relax, spine_extension, knee_alignment, hip_stability。
poses 中的 correction_error_key 必须从以下值选择：
shoulder_high, knee_inward, spine_rounding, hip_shift, posture_adjust。
poses 中的 camera_mode_required 必须从以下值选择：
half_body, full_body, mat_view。
poses 中的 demo_visual_key 必须从以下值选择：
standing_breath, cat_cow, child_pose, mountain, seated_neck, side_bend, half_forward_fold, low_lunge, bridge, supine_twist。
demo_visual_key 决定前端真人示范素材，必须与 pose_name 的动作类型一致，不要省略。
肩颈、坐姿和呼吸类动作优先 half_body；站姿、平衡、下肢稳定动作使用 full_body；
仰卧、跪姿、垫面动作使用 mat_view。不要强迫所有动作都全身入镜。
每个 pose 必须返回 demo_media_url 和 key_points_tip。
demo_media_url 优先使用前端约定素材路径：assets/demo/{demo_visual_key}.png。
不要临时编造不稳定的外部图片链接。
key_points_tip 必须是 1-2 句简洁动作要领，适合直接显示在跟练示范卡片中。
target_angle_min / target_angle_max 必须与前端 MediaPipe 角度判定对齐；
新手默认建议使用 140-180 度，肩颈放松可使用 150-180 度。
课程总时长 total_duration_sec 必须等于 duration_minutes * 60。
source 字段必须返回 llm。
语言风格要像温柔私教，不要像医疗诊断或考试评分。
"""
        user_payload = {
            "user_level": request.user_level.value,
            "target_focus": request.target_focus.value,
            "duration_minutes": request.duration_minutes,
            "body_state": request.body_state.value,
            "safety": request.safety.value,
            "required_total_duration_sec": request.duration_minutes * 60,
            "fallback_example": fallback.model_dump(),
        }

        try:
            if _is_deepseek_compatible_mode():
                payload = await _deepseek_json_completion(
                    client=client,
                    model=self.model,
                    system_prompt=system_prompt,
                    user_payload=user_payload,
                )
                parsed = CourseGenerateResponse.model_validate(payload)
            else:
                completion = await client.beta.chat.completions.parse(
                    model=self.model,
                    response_format=CourseGenerateResponse,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {
                            "role": "user",
                            "content": json.dumps(user_payload, ensure_ascii=False),
                        },
                    ],
                )
                parsed = completion.choices[0].message.parsed
                if parsed is None:
                    raise ValueError("LLM 未返回可解析的 CourseGenerateResponse。")

            parsed = parsed.model_copy(update={"source": "llm"})
            logger.info("智能排课 LLM 调用成功，course_id=%s", parsed.course_id)
            return _ensure_course_matches_request(
                parsed, request.duration_minutes * 60
            )
        except Exception as exc:
            logger.exception("智能排课 LLM 调用失败，已返回兜底课表：%s", exc)
            return fallback

    async def generate_session_summary(
        self, request: SessionSubmitRequest
    ) -> SessionSubmitResponse:
        """调用 LLM 生成课后总结；失败时返回默认评语。"""

        client = _get_client()
        fallback = fallback_session_summary(request)
        if client is None:
            return fallback

        system_prompt = """
你是 YogaMind AI 的温柔型瑜伽私教。
请根据用户练习数据生成鼓励、具体、专业但不严厉的中文课后总结。
你必须严格返回 SessionSubmitResponse 结构。
next_practice_suggestion 必须给出下一次练习建议，控制在 60 字以内。
error_counts 中的 key 与前端 MediaPipe 纠错规则一一对应：
shoulder_high 表示耸肩，knee_inward 表示膝盖内扣，
spine_rounding 表示脊柱线条不够舒展，hip_shift 表示骨盆偏移，
posture_adjust 表示通用姿势微调提醒。
总结要明确点出最主要的 1-2 个微调建议，但语气必须陪伴式。
source 字段必须返回 llm。
避免羞辱、命令、过度医疗化表达。
"""
        user_payload = {
            "course_id": request.course_id,
            "actual_duration_sec": request.actual_duration_sec,
            "accuracy_score": request.accuracy_score,
            "error_counts": request.error_counts.model_dump(),
            "fallback_example": fallback.model_dump(),
        }

        try:
            if _is_deepseek_compatible_mode():
                payload = await _deepseek_json_completion(
                    client=client,
                    model=self.model,
                    system_prompt=system_prompt,
                    user_payload=user_payload,
                )
                parsed = SessionSubmitResponse.model_validate(payload)
                parsed = parsed.model_copy(update={"source": "llm"})
                logger.info("课后总结 LLM 调用成功，session_id=%s", parsed.session_id)
                return parsed

            completion = await client.beta.chat.completions.parse(
                model=self.model,
                response_format=SessionSubmitResponse,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
                ],
            )
            parsed = completion.choices[0].message.parsed
            if parsed is None:
                raise ValueError("LLM 未返回可解析的 SessionSubmitResponse。")
            parsed = parsed.model_copy(update={"source": "llm"})
            logger.info("课后总结 LLM 调用成功，session_id=%s", parsed.session_id)
            return parsed
        except Exception as exc:
            logger.exception("课后总结 LLM 调用失败，已返回兜底评语：%s", exc)
            return fallback


