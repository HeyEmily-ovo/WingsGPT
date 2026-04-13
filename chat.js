// api/chat.js
export default async function handler(req, res) {
    // 1. 从环境变量获取 KEY (外界无法看到)
    const apiKey = process.env.MY_SECRET_API_KEY; 
    const baseUrl = "https://api.gptsapi.net/v1/chat/completions";

    if (req.method !== 'POST') {
        return res.status(405).json({ error: '只允许 POST 请求' });
    }

    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(req.body) // 将前端传来的消息原样转发
        });

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: '服务器内部错误' });
    }
}