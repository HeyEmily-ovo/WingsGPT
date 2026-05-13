# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

WingsGPT 1.2 is a single-page web chat app — a ChatGPT-style interface built with vanilla HTML/CSS/JS (no framework, no build step). Chat history is persisted in `localStorage` under the key `wings_vision_v25`.

## Running the app

```bash
npm install
npm start        # → http://localhost:3000
```

The Node.js backend (`server.js`) serves the frontend statically and proxies `/api/chat` to the upstream AI API, keeping the API key on the server side in `.env`.

## Architecture

Three files form the entire application:
- `index.html` — structure: sidebar (chat history, new-chat button), main chat area (message list, input bar), and modals (lightbox for images, text viewer for files, rename/delete confirmations)
- `script.js` — all logic: chat CRUD, API calls, file handling, UI rendering, localStorage persistence
- `style.css` — green-themed design with sidebar collapse animation and mobile responsive breakpoint at 768px

**Data flow:** User input → `sendMsg()` builds an OpenAI-compatible messages array → POST to `BASE_URL` → response rendered as Markdown via `marked.js`. Messages are stored per-chat in `allChats` and serialized to `localStorage`.

**Chat state:** `allChats` is an array of chat objects: `{ id, title, messages[] }`. Each message has `{ role, content }` for the API plus an optional `uiData` field for rendering attachments. `currentChatId` tracks the active chat.

**File handling:** `FileReader` reads uploaded files. Images are base64-encoded and sent as `image_url` content blocks. Text files are inlined into the message content string.

**API:** The frontend posts to `/api/chat`, which `server.js` proxies to `https://api.gptsapi.net/v1/chat/completions` (OpenAI-compatible proxy). The model is `gemini-2.5-flash`. The API key lives only in `.env` on the server.

**Sidebar:** Collapses via CSS `margin-left` on desktop, uses `position: fixed` with overlay on mobile (≤768px). The `sidebar-collapsed` class on `<body>` toggles the leaf icon direction.

**Modals:** Activated by toggling the `.active` class on overlay divs. Close with `closeModal(id)` or by clicking the backdrop overlay.
