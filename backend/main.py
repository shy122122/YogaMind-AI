"""YogaMind AI 轻量后端服务入口。

启动后访问：
- Swagger UI: http://localhost:8000/docs
- 健康检查: http://localhost:8000/health
"""

from __future__ import annotations

import logging
import os

from dotenv import load_dotenv
from fastapi import Body, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from llm_service import YogaLLMService
from schemas import (
    CourseGenerateRequest,
    CourseGenerateResponse,
    HealthResponse,
    SessionSubmitRequest,
    SessionSubmitResponse,
)


load_dotenv()
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

app = FastAPI(
    title="YogaMind AI Backend",
    description="为 AI 瑜伽训练师提供智能结构化排课与课后个性化总结。",
    version="1.0.0",
)

# 默认允许本地与局域网前端开发地址跨域访问：
# - 电脑本机：http://localhost:任意端口、http://127.0.0.1:任意端口
# - 手机联调：http://10.x.x.x:任意端口、http://192.168.x.x:任意端口、
#   http://172.16-31.x.x:任意端口
# - HTTPS 临时隧道：https://*.trycloudflare.com、https://*.loca.lt、https://*.lhr.life
# - GitHub Pages 展示：https://shy122122.github.io
cors_origin_regex = os.getenv(
    "BACKEND_CORS_ORIGIN_REGEX",
    (
        r"^https?://("
        r"localhost|127\.0\.0\.1|"
        r"10\.\d{1,3}\.\d{1,3}\.\d{1,3}|"
        r"192\.168\.\d{1,3}\.\d{1,3}|"
        r"172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|"
        r"[\w-]+\.trycloudflare\.com|"
        r"[\w-]+\.loca\.lt|"
        r"[\w-]+\.lhr\.life|"
        r"shy122122\.github\.io"
        r")(:\d+)?$"
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://shy122122.github.io",
    ],
    allow_origin_regex=cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

llm_service = YogaLLMService()


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check() -> HealthResponse:
    """服务健康检查。"""

    return HealthResponse()


@app.post(
    "/api/v1/course/generate",
    response_model=CourseGenerateResponse,
    tags=["Course Generation"],
    summary="智能结构化排课",
)
async def generate_course(
    request: CourseGenerateRequest = Body(
        ...,
        examples=[
            {
                "user_level": "beginner",
                "target_focus": "shoulder",
                "duration_minutes": 10,
                "body_state": "stiff",
                "safety": "none",
            }
        ],
    ),
) -> CourseGenerateResponse:
    """根据用户等级、练习诉求、身体状态、安全边界和时长生成结构化瑜伽课表。

    LLM 超时、未配置 Key 或返回 JSON 不合法时，会自动返回静态兜底课程。
    """

    return await llm_service.generate_course(request)


@app.post(
    "/api/v1/session/submit",
    response_model=SessionSubmitResponse,
    tags=["Session Summary"],
    summary="课后个性化 AI 总结",
)
async def submit_session(
    request: SessionSubmitRequest = Body(
        ...,
        examples=[
            {
                "course_id": "course_12345",
                "actual_duration_sec": 580,
                "accuracy_score": 85,
                "error_counts": {
                    "shoulder_high": 3,
                    "knee_inward": 1,
                    "spine_rounding": 0,
                    "hip_shift": 0,
                    "posture_adjust": 0,
                },
            }
        ],
    ),
) -> SessionSubmitResponse:
    """提交练习结果，并生成温柔鼓励型课后总结卡片文案。

    LLM 不可用时，会自动返回本地生成的默认总结，保证前端流程不中断。
    """

    return await llm_service.generate_session_summary(request)



