# YogaMind AI 灵瑜 AI

面向瑜伽零基础用户的移动端 H5 AI 瑜伽私教 Demo。项目通过手机摄像头在浏览器本地识别人体骨骼关键点，结合姿势角度算法、温和语音提醒和大模型结构化排课，帮助用户在家练习时获得比普通跟练视频更及时、更安全的反馈。

> 项目定位：运动健身辅助工具，不做医疗诊断、康复处方或病理级体态评估。

## 在线体验

当前主展示版：

```text
https://shy122122.github.io/YogaMind-AI/yogamind-ai.html?api=offline
```

React 工程化预览版：

```text
https://shy122122.github.io/YogaMind-AI/react.html?api=offline
```

说明：当前对外展示建议优先使用 `yogamind-ai.html`。`react.html` 是工程化迁移版本，用于展示后续正式产品架构。

## 项目背景

线下瑜伽私教价格较高，普通视频跟练又缺少实时反馈。新手用户常见问题是：不知道自己动作是否正确、害怕受伤、独自练习缺少陪伴，最终难以坚持。

YogaMind AI 的目标是提供一个低门槛、隐私友好、移动端可体验的 AI 瑜伽陪练 Demo：用户打开手机网页即可进入练习，通过本地姿态识别获得实时提醒，并在练习后得到鼓励式总结。

## 核心能力

- 端侧姿态识别：基于 MediaPipe Pose 在浏览器本地提取 33 个骨骼关键点，摄像头数据不上传。
- 姿势角度判断：通过三点向量夹角计算核心关节角度，判断动作是否偏离目标范围。
- 误报防抖机制：偏差持续 1.5 秒后才触发纠错，降低新手练习时的焦虑感。
- 语音去重提醒：同类提醒 10 秒内不重复播报，避免打断瑜伽呼吸节奏。
- 动作不匹配提示：当用户动作类型与当前体式不一致时，优先提示回到正确起始姿势。
- 远距离大字模式：考虑手机全身入镜时用户离屏幕较远，放大动作名、倒计时和核心提示。
- LLM 智能排课：后端可调用 OpenAI 兼容模型生成结构化 JSON 课表。
- 课后 AI 总结：根据练习时长、标准率和错误次数生成鼓励型总结卡片。
- 离线 fallback：后端或网络不可用时，前端使用本地课表和总结，保证演示流程不中断。

## 技术架构

```text
移动端 H5 / React 工程版
        |
        | fetch
        v
FastAPI 后端
        |
        | OpenAI 兼容 SDK / JSON 结构化输出
        v
LLM 课表生成与课后总结
```

前端侧：

```text
摄像头 Video
  -> MediaPipe Pose
  -> 33 个 Keypoints
  -> 角度计算 / 姿势规则 / 防抖状态机
  -> Canvas 骨骼绘制 + UI 提示 + TTS 语音
```

## 工程结构

```text
backend/                  FastAPI 后端服务
frontend/                 React + TypeScript 工程化前端
frontend/public/          当前完整 H5 展示版及静态素材
outputs/                  原始单文件展示产物
mobile-preview/           手机预览备份版本
docs/                     作品集与产品说明文档
PROJECT_CONTEXT.md        项目上下文与演进记录
```

## 本地运行

前端：

```bash
cd frontend
npm install
npm run dev
```

访问：

```text
http://localhost:5173/yogamind-ai.html?api=offline
http://localhost:5173/react.html?api=offline
```

后端：

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Swagger 文档：

```text
http://localhost:8000/docs
```

## 作品集亮点

这个项目不是单纯页面 Demo，而是一个完整的 AI 应用闭环：

1. 产品层：从瑜伽小白的焦虑、受伤风险、坚持困难出发设计体验。
2. 前端层：移动端 H5、摄像头权限、Canvas 覆盖层、响应式跟练界面。
3. 算法层：MediaPipe 关键点、角度计算、防抖状态机、动作不匹配判断。
4. AI 层：LLM 结构化排课、课后总结、接口失败 fallback。
5. 工程层：FastAPI 后端、React 工程化迁移、GitHub Pages 自动部署。

## 当前状态

- 主展示版 H5 已具备完整演示链路。
- React 工程版已完成准备页、练习页、总结页第一版迁移。
- GitHub Pages 部署配置已添加，但若仓库为私有，需要改 Public 或使用其他部署平台。
- React 工程版仍需继续修复语音触发、远距离模式和 Canvas 坐标对齐等体验问题。

## 下一步计划

- 将仓库或展示产物部署到稳定公网环境，保证面试官可直接访问。
- 补充手机截图和 3 分钟演示视频。
- 继续把旧 H5 的成熟体验迁移到 React 工程版。
- 抽象基础瑜伽动作知识库：动作入口、角度阈值、常见错误、禁忌与替代动作。
- 增加单元测试和关键流程验收脚本，提高工程可信度。
