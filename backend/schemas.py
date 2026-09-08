"""AI 瑜伽训练师后端的数据模型。

本文件只放请求与响应 Schema，便于 FastAPI 自动生成 Swagger 文档，
也方便 LLM 返回结果用 Pydantic v2 做结构化校验。
"""

from __future__ import annotations

from enum import Enum
from typing import List

from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserLevel(str, Enum):
    """用户练习等级。"""

    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"


class TargetFocus(str, Enum):
    """用户本次练习诉求。"""

    SHOULDER = "shoulder"
    SPINE = "spine"
    FULL_BODY = "full_body"


class BodyState(str, Enum):
    """用户当前身体状态，用于调节课程强度与提示语。"""

    STIFF = "stiff"
    TIRED = "tired"
    NORMAL = "normal"


class SafetyConcern(str, Enum):
    """用户主动声明的安全边界，不用于医疗诊断，只用于动作规避。"""

    NONE = "none"
    KNEE = "knee"
    WAIST = "waist"
    NECK = "neck"


class CameraModeRequired(str, Enum):
    """当前体式对手机摆放和入镜范围的要求。"""

    HALF_BODY = "half_body"
    FULL_BODY = "full_body"
    MAT_VIEW = "mat_view"


class DemoVisualKey(str, Enum):
    """前端用于生成体式小人示范画像的稳定标识。"""

    STANDING_BREATH = "standing_breath"
    CAT_COW = "cat_cow"
    CHILD_POSE = "child_pose"
    MOUNTAIN = "mountain"
    SEATED_NECK = "seated_neck"
    SIDE_BEND = "side_bend"
    HALF_FORWARD_FOLD = "half_forward_fold"
    LOW_LUNGE = "low_lunge"
    BRIDGE = "bridge"
    SUPINE_TWIST = "supine_twist"


class CvRuleKey(str, Enum):
    """前端 MediaPipe 姿态检测规则标识。"""

    SHOULDER_RELAX = "shoulder_relax"
    SPINE_EXTENSION = "spine_extension"
    KNEE_ALIGNMENT = "knee_alignment"
    HIP_STABILITY = "hip_stability"


class CorrectionErrorKey(str, Enum):
    """前端与后端共同约定的纠错类型。"""

    SHOULDER_HIGH = "shoulder_high"
    KNEE_INWARD = "knee_inward"
    SPINE_ROUNDING = "spine_rounding"
    HIP_SHIFT = "hip_shift"


class CourseGenerateRequest(BaseModel):
    """智能排课请求体。"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "user_level": "beginner",
                "target_focus": "shoulder",
                "duration_minutes": 10,
                "body_state": "stiff",
                "safety": "none",
            }
        }
    )

    user_level: UserLevel = Field(..., description="用户等级：beginner / intermediate")
    target_focus: TargetFocus = Field(
        ..., description="练习诉求：shoulder / spine / full_body"
    )
    duration_minutes: int = Field(
        10, ge=5, le=60, description="期望课程时长，单位：分钟"
    )
    body_state: BodyState = Field(
        BodyState.STIFF,
        description="当前身体状态：stiff / tired / normal，用于调整强度与口令",
    )
    safety: SafetyConcern = Field(
        SafetyConcern.NONE,
        description="运动安全边界：none / knee / waist / neck，仅用于健身动作规避，不作医疗判断",
    )


class PoseItem(BaseModel):
    """单个体式配置。"""

    pose_id: str = Field(..., min_length=1, description="体式唯一标识")
    pose_name: str = Field(..., min_length=1, description="中文体式名称")
    duration_sec: int = Field(..., ge=15, le=600, description="单个体式持续时间")
    cv_rule_key: CvRuleKey = Field(
        CvRuleKey.SPINE_EXTENSION,
        description="前端 MediaPipe 姿态规则标识，如 spine_extension / shoulder_relax",
    )
    correction_error_key: CorrectionErrorKey = Field(
        CorrectionErrorKey.SHOULDER_HIGH,
        description="触发纠错时映射的错误类型，如 shoulder_high / knee_inward",
    )
    camera_mode_required: CameraModeRequired = Field(
        CameraModeRequired.HALF_BODY,
        description="推荐摄像头入镜方式：half_body / full_body / mat_view",
    )
    demo_visual_key: DemoVisualKey = Field(
        DemoVisualKey.STANDING_BREATH,
        description="前端真人示范素材的类型标识",
    )
    demo_media_url: str = Field(
        ...,
        min_length=1,
        description="动作标准示范图片或 GIF 的 URL 地址",
    )
    key_points_tip: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="1-2 句简洁的动作发力要领",
    )
    target_angle_min: int = Field(
        0, ge=0, le=180, description="关键关节标准角度下限"
    )
    target_angle_max: int = Field(
        180, ge=0, le=180, description="关键关节标准角度上限"
    )
    guidance_tip: str = Field(..., min_length=1, description="跟练提示语")

    @field_validator("target_angle_max")
    @classmethod
    def validate_angle_range(cls, value: int, info) -> int:
        """确保角度上限不小于下限。"""

        min_value = info.data.get("target_angle_min")
        if min_value is not None and value < min_value:
            raise ValueError("target_angle_max 必须大于或等于 target_angle_min")
        return value


class CourseGenerateResponse(BaseModel):
    """智能排课响应体。"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "course_id": "course_12345",
                "course_title": "10分钟肩颈舒缓放松跟练",
                "total_duration_sec": 600,
                "plan_reason": "根据你的肩颈舒缓目标和当前身体偏僵状态，今天先用低强度动作打开肩颈和脊柱。",
                "poses": [
                    {
                        "pose_id": "cat_cow",
                        "pose_name": "猫牛式",
                        "duration_sec": 60,
                        "cv_rule_key": "spine_extension",
                        "correction_error_key": "shoulder_high",
                        "camera_mode_required": "half_body",
                        "demo_visual_key": "cat_cow",
                        "demo_media_url": "assets/demo/cat_cow.png",
                        "key_points_tip": "保持沉肩，双手稳定推地，跟随呼吸缓慢卷动脊柱。",
                        "target_angle_min": 140,
                        "target_angle_max": 180,
                        "guidance_tip": "注意跟随呼吸，缓慢下沉脊柱并沉肩。",
                    }
                ],
            }
        }
    )

    course_id: str = Field(..., description="课程 ID")
    course_title: str = Field(..., description="课程标题")
    total_duration_sec: int = Field(..., ge=60, description="课程总时长，单位：秒")
    plan_reason: str = Field(
        "今天先从低强度动作开始，帮助身体慢慢进入练习状态。",
        min_length=1,
        max_length=180,
        description="面向用户展示的课程安排理由",
    )
    poses: List[PoseItem] = Field(..., min_length=1, description="体式列表")


class ErrorCounts(BaseModel):
    """前端端侧 CV 可直接上报的标准错误计数字段。

    这些字段与前端 MediaPipe 规则保持同名，避免后端总结时猜测 key。
    """

    model_config = ConfigDict(extra="forbid")

    shoulder_high: int = Field(0, ge=0, description="高耸肩次数")
    knee_inward: int = Field(0, ge=0, description="膝盖内扣次数")
    spine_rounding: int = Field(0, ge=0, description="脊柱塌腰或过度含胸次数")
    hip_shift: int = Field(0, ge=0, description="骨盆左右偏移次数")


class SessionSubmitRequest(BaseModel):
    """课后总结请求体。"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "course_id": "course_12345",
                "actual_duration_sec": 580,
                "accuracy_score": 85,
                "error_counts": {
                    "shoulder_high": 3,
                    "knee_inward": 1,
                    "spine_rounding": 0,
                    "hip_shift": 0,
                },
            }
        }
    )

    course_id: str = Field(..., min_length=1, description="课程 ID")
    actual_duration_sec: int = Field(..., ge=0, description="实际练习时长，单位：秒")
    accuracy_score: int = Field(..., ge=0, le=100, description="综合姿势标准率")
    error_counts: ErrorCounts = Field(
        default_factory=ErrorCounts,
        description="动作偏差统计，字段与前端 CV 规则保持一致",
    )


class SessionSubmitResponse(BaseModel):
    """课后总结响应体。"""

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "session_id": "sess_98765",
                "summary_title": "太棒了！你的肩颈得到了彻底释放",
                "ai_feedback": "今天你坚持完成了近 10 分钟的练习！整体标准率达到了 85%。练习过程中你偶尔有 3 次耸肩，下次记得保持沉肩呼吸哦！",
                "badge_awarded": "肩颈舒缓小能手",
                "next_practice_suggestion": "下次建议继续做 8 分钟肩颈舒缓，把注意力放在沉肩和呼气上。",
            }
        }
    )

    session_id: str = Field(..., description="本次练习 ID")
    summary_title: str = Field(..., description="总结标题")
    ai_feedback: str = Field(..., description="AI 个性化反馈")
    badge_awarded: str = Field(..., description="获得徽章")
    next_practice_suggestion: str = Field(
        "下次可以继续做 8 分钟肩颈舒缓，保持今天这种不着急的节奏。",
        min_length=1,
        max_length=180,
        description="下一次练习建议",
    )


class HealthResponse(BaseModel):
    """健康检查响应。"""

    status: str = "ok"
    service: str = "YogaMind AI Backend"
