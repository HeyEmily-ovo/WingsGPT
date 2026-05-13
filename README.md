# WingsGPT 1.2

基于 Web 的 AI 聊天助手，支持流式响应和文件上传。

## 在线访问

**[heyemily-ovo.github.io/WingsGPT](https://heyemily-ovo.github.io/WingsGPT)**

## 本地运行

直接浏览器打开 `index.html`，无需安装任何东西。

也可用 Node.js 运行（保护 API Key）：

```bash
npm install
cp .env.example .env   # 编辑 .env 填入你的 Key
npm start              # → http://localhost:3000
```

## 技术栈

- 前端：HTML/CSS/JS（无框架），支持 SSE 流式响应、Markdown 渲染、图片和文本文件上传
