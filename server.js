require('dotenv').config();

const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// 代理 API 请求，注入服务端 Key
app.post('/api/chat', async (req, res) => {
    try {
        const response = await fetch('https://api.gptsapi.net/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.API_KEY}`
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            return res.status(response.status).json(errData);
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(decoder.decode(value, { stream: true }));
        }
        res.end();
    } catch (e) {
        res.status(500).json({ error: 'Proxy error' });
    }
});

// 托管前端静态文件
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`WingsGPT server running at http://localhost:${PORT}`);
});
