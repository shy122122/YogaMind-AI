# YogaMind AI Backend

轻量级 FastAPI 后端，为前端“AI 瑜伽训练师”提供两个 RESTful API：

- `POST /api/v1/course/generate`：LLM 智能结构化排课
- `POST /api/v1/session/submit`：课后个性化 AI 总结卡片生成

核心设计：

- 使用 OpenAI SDK 的 Pydantic Structured Outputs 强约束返回结构。
- 未配置 Key、超时、限流、欠费、结构解析失败时，自动返回静态兜底课表或评语。
- 课程体式包含 `cv_rule_key` 与 `correction_error_key`，方便前端 MediaPipe 规则直接映射。
- 课程体式包含 `demo_media_url` 与 `key_points_tip`，前端可直接渲染标准示范图和发力要领。

## 目录结构

```text
backend/
├── main.py
├── schemas.py
├── llm_service.py
├── requirements.txt
├── .env.example
└── README.md
```

## 启动方式

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8011
```

启动后访问：

- Swagger UI: `http://localhost:8011/docs`
- 健康检查: `http://localhost:8011/health`

## 手机联调

电脑和手机连接同一个 Wi-Fi 后，先查看电脑局域网 IP，例如 `10.51.19.73`。

后端需要监听局域网地址：

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8011
```

前端需要从 `outputs` 目录启动：

```bash
cd outputs
python -m http.server 8001 --bind 0.0.0.0
```

然后手机浏览器打开：

```text
http://你的电脑IP:8001/yogamind-ai.html
```

例如：

```text
http://10.51.19.73:8001/yogamind-ai.html
```

前端会自动把 API 地址识别为 `http://你的电脑IP:8011`。如果后端端口或地址不同，也可以手动指定：

```text
http://你的电脑IP:8001/yogamind-ai.html?api=http://你的电脑IP:8011
```

注意：大多数手机浏览器只有在 HTTPS 页面下才允许真实摄像头权限。本地 HTTP 局域网地址适合联调页面、接口和 Mock 模式；如果要在手机上测试真实摄像头识别，建议用 HTTPS 隧道或正式 H5 域名。

## 环境变量

```env
OPENAI_API_KEY=your_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
LLM_TIMEOUT_SECONDS=5
LOG_LEVEL=INFO
BACKEND_CORS_ORIGIN_REGEX=^https?://(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$
```

如果你使用 DeepSeek、Qwen 等兼容 OpenAI 格式的服务，只需要修改：

```env
OPENAI_BASE_URL=你的兼容接口地址
OPENAI_MODEL=你的模型名
```

## 接口示例

### 智能排课

```bash
curl -X POST http://localhost:8011/api/v1/course/generate ^
  -H "Content-Type: application/json" ^
  -d "{\"user_level\":\"beginner\",\"target_focus\":\"shoulder\",\"duration_minutes\":10}"
```

### 课后总结

```bash
curl -X POST http://localhost:8011/api/v1/session/submit ^
  -H "Content-Type: application/json" ^
  -d "{\"course_id\":\"course_12345\",\"actual_duration_sec\":580,\"accuracy_score\":85,\"error_counts\":{\"shoulder_high\":3,\"knee_inward\":1,\"spine_rounding\":0,\"hip_shift\":0}}"
```

## 容错逻辑

当未配置 `OPENAI_API_KEY`、LLM 超时、JSON 解析失败或 Schema 校验失败时，服务会自动返回本地静态兜底数据，确保前端页面不会崩溃。

## 前端 CV 字段约定

课程体式会返回：

- `cv_rule_key`：前端 MediaPipe 角度检测规则，如 `spine_extension`、`shoulder_relax`、`knee_alignment`、`hip_stability`
- `correction_error_key`：课后错误统计字段，如 `shoulder_high`、`knee_inward`、`spine_rounding`、`hip_shift`
- `demo_media_url`：当前动作标准示范图片或 GIF URL
- `key_points_tip`：1-2 句适合展示在示范卡片里的动作要领

课后提交的 `error_counts` 使用固定结构：

```json
{
  "shoulder_high": 3,
  "knee_inward": 1,
  "spine_rounding": 0,
  "hip_shift": 0
}
```
