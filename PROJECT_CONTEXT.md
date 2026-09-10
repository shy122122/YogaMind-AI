# YogaMind AI 项目上下文

更新时间：2026-09-10

## 项目定位

YogaMind AI 是一个面向 C 端瑜伽小白的移动端 H5 体验版 Demo。核心价值是用手机摄像头完成本地姿态识别，用温和语音和视觉提示降低居家瑜伽盲练风险，并通过 LLM 生成结构化课表和课后总结。

产品边界：这是运动健身辅助工具，不做医疗诊断、康复处方或病理级体态评估。

## 当前架构

当前项目处于“展示版稳定 + 工程化迁移”的过渡阶段：

- `outputs/yogamind-ai.html`：原始完整 H5 展示版。
- `mobile-preview/yogamind-ai.html`：手机预览版 H5。
- `frontend/public/yogamind-ai.html`：当前 Vite 服务默认打开的完整 H5 展示页。
- `frontend/src/`：React + TypeScript 工程化主线，后续逐步接管旧 H5。
- `backend/`：FastAPI 后端，提供 LLM 排课和课后总结 API。

## 展示入口

电脑本地展示：

```text
http://localhost:5173/yogamind-ai.html?api=offline
```

手机局域网展示：

```text
http://10.51.19.73:5173/yogamind-ai.html?api=offline
```

临时公网隧道展示：

```text
https://{localtunnel-subdomain}.loca.lt/yogamind-ai.html?api=offline
```

React 工程版预览入口：

```text
http://localhost:5173/react.html?api=offline
```

## 后端接口

FastAPI 默认地址：

```text
http://localhost:8000
```

Swagger 文档：

```text
http://localhost:8000/docs
```

核心接口：

- `POST /api/v1/course/generate`：根据用户等级、目标、时长生成结构化瑜伽课表。
- `POST /api/v1/session/submit`：提交练习数据，生成温柔鼓励型课后总结。
- `GET /health`：后端健康检查。

后端已支持 CORS 本地、局域网、`loca.lt`、`trycloudflare.com` 场景；LLM 不可用时返回 fallback，前端不会卡死。

## 手机调试方式

启动前端：

```bash
cd frontend
npm run dev
```

启动 localtunnel：

```bash
npx --yes --registry=https://registry.npmmirror.com --cache ..\.npm-cache localtunnel --port 5173
```

Vite 需要保留 `allowedHosts`，否则 `loca.lt` 隧道会出现 `host is not allowed`。

## 已完成能力

- 移动端 H5 展示版。
- MediaPipe Pose 摄像头姿态识别。
- Canvas 骨骼关键点绘制。
- 1.5 秒姿态纠错防抖。
- 10 秒语音播报去重锁。
- 动作不匹配提示。
- 远距离大字模式。
- 真人示范图素材。
- AI 教练提示和动态语音波形。
- FastAPI + Pydantic v2 后端。
- DeepSeek/OpenAI 兼容 LLM 调用与 fallback。
- React + TypeScript 工程化基座。

## 已知问题

- 默认展示仍依赖旧 H5，React 工程还没有完全复刻旧版视觉和交互。
- 动作识别规则仍是 MVP 级模板判断，不是完整瑜伽动作知识库。
- 手机摄像头全身入镜时，用户距离屏幕较远，主要依赖大字模式和语音提示缓解。
- localtunnel 临时链接不稳定，断开后需要重新生成。

## 下一步计划

1. 保持旧 H5 作为当前展示版，不破坏可演示路径。
2. 将旧 H5 的准备页和新手引导迁移到 React。
3. 再迁移练习页，重点复刻手机视觉、远距离模式和 AI 教练提示。
4. 抽象动作知识库，沉淀每个体式的入门姿势、角度规则、常见错误、纠错话术和禁忌。
5. 最后让 `frontend/src` 成为主版本，旧 H5 退为备份。

## 基础验收清单

- `frontend` 执行 `npm run build` 通过。
- 后端执行 `python -m py_compile backend\main.py backend\schemas.py backend\llm_service.py` 通过。
- `http://localhost:5173/` 默认跳转到完整 H5 展示版。
- `http://localhost:5173/react.html?api=offline` 可打开 React 工程版。
- localtunnel 链接不再出现 Vite `host is not allowed`。
- 手机能访问 `https://{subdomain}.loca.lt/yogamind-ai.html?api=offline`。
