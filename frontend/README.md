# YogaMind AI Frontend 工程版

这是从单文件 H5 Demo 拆出来的工程化前端基座，面向移动端 H5 体验版。

## 启动

```bash
cd frontend
npm install --registry=https://registry.npmmirror.com
npm run dev
```

打开：

```text
http://localhost:5173
```

手机调试时可以用局域网 IP 或隧道服务访问 Vite 地址。

## 常用参数

- `?api=offline`：强制离线演示，不依赖后端。
- `?apiBase=http://localhost:8000`：指定 FastAPI 后端地址。

## 当前结构

- `src/components`：页面和 UI 组件。
- `src/hooks/usePoseDetector.ts`：摄像头、MediaPipe、Canvas 骨骼绘制和 Mock 演示。
- `src/hooks/useTtsCoach.ts`：语音播报和 10 秒去重锁。
- `src/services/api.ts`：课程生成和课后总结 API，含 5 秒超时与 fallback。
- `src/utils/poseRules.ts`：动作识别、动作不匹配、角度纠错和远距离模式判断。
- `src/data/fallbackCourse.ts`：离线课表和兜底总结。

## 与旧版关系

旧版仍保留在：

- `outputs/yogamind-ai.html`
- `mobile-preview/yogamind-ai.html`

工程版用于后续长期迭代，旧版用于当前快速展示。
