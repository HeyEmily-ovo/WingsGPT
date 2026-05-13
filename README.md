# WingsGPT 1.2

基于 Web 的 AI 聊天助手，支持流式响应和文件上传。

## 使用方式

```bash
# 1. 安装依赖
npm install

# 2. 配置 API Key（将 your-api-key-here 替换为你的 Key）
cp .env.example .env
# 编辑 .env 填入 API_KEY=你的密钥

# 3. 启动
npm start
```

浏览器访问 `http://localhost:3000`。

## 技术栈

- 前端：HTML/CSS/JS（无框架）
- 后端代理：Express（Node.js），负责转发 API 请求并保护密钥
- 支持流式响应（SSE）、Markdown 渲染、图片和文本文件上传
