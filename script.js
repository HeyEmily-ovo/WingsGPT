// --- 配置信息 ---
const API_KEY = 'sk-wd7cf05da44ee1733e8711835b456ae27c1cbb3b0f8Fakb9'; 
const BASE_URL = 'https://api.gptsapi.net/v1/chat/completions';

// --- 状态变量 ---
let allChats = JSON.parse(localStorage.getItem('wings_vision_v25')) || [];
let currentChatId = null;
let loadingChats = new Set();
let pendingFileContent = ""; 
let pendingFileName = "";
let isImageFile = false;
let tempActionId = null;

// --- 初始化 ---
window.onload = () => {
    if (allChats.length > 0) {
        loadChat(allChats[0].id);
    } else {
        createNewChat();
    }
    document.getElementById('file-input').addEventListener('change', handleFileSelect);
};

// --- 侧边栏与导航 ---
function toggleSidebar() { 
    const sidebar = document.getElementById('sidebar');
    const body = document.getElementById('app-body');
    const overlay = document.getElementById('mobile-overlay');
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('active');
        body.classList.toggle('sidebar-collapsed', !sidebar.classList.contains('mobile-open'));
    } else {
        sidebar.classList.toggle('collapsed');
        body.classList.toggle('sidebar-collapsed');
    }
}

// --- 文件处理 ---
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    pendingFileName = file.name;
    isImageFile = file.type.startsWith('image/');
    const reader = new FileReader();
    
    reader.onload = (event) => {
        pendingFileContent = event.target.result;
        const previewArea = document.getElementById('preview-media');
        
        if (isImageFile) {
            previewArea.innerHTML = `<img src="${pendingFileContent}" style="width:100%;height:100%;object-fit:cover;">`;
        } else {
            previewArea.innerHTML = `<span style="font-size: 1.5rem;">📄</span>`;
        }
        
        document.getElementById('file-name-display').innerText = file.name;
        document.getElementById('file-status').style.display = 'flex';
    };

    if (isImageFile) {
        reader.readAsDataURL(file);
    } else {
        reader.readAsText(file);
    }
}

function clearPendingFile() {
    pendingFileContent = ""; 
    pendingFileName = "";
    document.getElementById('file-status').style.display = 'none';
    document.getElementById('file-input').value = "";
}

// --- 消息发送与 API ---
async function sendMsg() {
    const input = document.getElementById('user-input');
    const textInput = input.value.trim();
    const text = textInput || (isImageFile ? "分析图片" : "分析文件");
    
    if (!textInput && !pendingFileContent) return;

    const chat = allChats.find(c => c.id === currentChatId);
    if (chat.title === "新对话") {
        chat.title = text.substring(0, 15);
    }

    // 构造 UI 显示用的消息对象
    const uiMsg = { 
        text, 
        attachment: pendingFileContent ? { 
            name: pendingFileName, 
            type: isImageFile ? 'image' : 'text', 
            content: pendingFileContent 
        } : null 
    };

    // 构造发送给 API 的消息内容
    let apiMessage;
    if (isImageFile) {
        apiMessage = { 
            role: "user", 
            content: [
                { type: "text", text }, 
                { type: "image_url", image_url: { url: pendingFileContent } }
            ] 
        };
    } else {
        apiMessage = { 
            role: "user", 
            content: pendingFileContent ? `${text}\n[File: ${pendingFileName}]\n${pendingFileContent}` : text 
        };
    }

    appendToUI('user', uiMsg);
    chat.messages.push({ ...apiMessage, uiData: uiMsg });
    
    const senderChatId = currentChatId;
    input.value = ''; 
    clearPendingFile();
    loadingChats.add(senderChatId); 
    updateTypingIndicator();

    try {
        const resp = await fetch(BASE_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${API_KEY.trim()}` 
            },
            body: JSON.stringify({ 
                model: "gpt-4o-mini", 
                messages: chat.messages.map(m => ({ role: m.role, content: m.content })) 
            })
        });
        
        const data = await resp.json();
        const aiMsg = data.choices[0].message.content;
        
        chat.messages.push({ role: "assistant", content: aiMsg });
        
        if (currentChatId === senderChatId) {
            appendToUI('assistant', { text: aiMsg });
        }
        saveToLocal(); 
        renderHistory();
    } catch (e) {
        if (currentChatId === senderChatId) {
            appendToUI('assistant', { text: "❌ 请求失败。请检查 API Key 或网络连接。" });
        }
    } finally { 
        loadingChats.delete(senderChatId); 
        updateTypingIndicator(); 
    }
}

// --- UI 渲染 ---
function appendToUI(role, msgObj) {
    const box = document.getElementById('chat-box');
    const div = document.createElement('div');
    div.className = `message ${role === 'user' ? 'user' : 'ai'}`;

    // 处理附件显示
    if (msgObj.attachment) {
        if (msgObj.attachment.type === 'image') {
            const img = document.createElement('img');
            img.src = msgObj.attachment.content;
            img.style = "max-width: 240px; border-radius: 12px; cursor: zoom-in; margin-top: 5px; border: 2px solid rgba(255,255,255,0.5); box-shadow: 0 4px 10px rgba(0,0,0,0.1);";
            img.onclick = () => { 
                document.getElementById('lightbox-img').src = img.src; 
                document.getElementById('lightbox').classList.add('active'); 
            };
            div.appendChild(img);
        } else {
            const attBtn = document.createElement('div');
            attBtn.style = "background: rgba(255,255,255,0.6); border-radius: 12px; padding: 12px; display: flex; align-items: center; gap: 12px; cursor: pointer; border: 1px solid rgba(82, 196, 26, 0.2); color: var(--deep-green);";
            attBtn.innerHTML = `<span>📄</span> <span style="font-size:0.85rem; font-weight:600;">${msgObj.attachment.name}</span>`;
            attBtn.onclick = () => { 
                document.getElementById('text-viewer-title').innerText = msgObj.attachment.name; 
                document.getElementById('text-viewer-body').innerText = msgObj.attachment.content; 
                document.getElementById('text-viewer').classList.add('active'); 
            };
            div.appendChild(attBtn);
        }
    }

    // 处理文本内容 (Markdown)
    const textDiv = document.createElement('div'); 
    textDiv.innerHTML = marked.parse(msgObj.text || "");
    div.appendChild(textDiv); 
    
    box.appendChild(div); 
    box.scrollTop = box.scrollHeight;
}

// --- 对话管理 ---
function loadChat(id) {
    currentChatId = id; 
    const chat = allChats.find(c => c.id === id);
    const box = document.getElementById('chat-box'); 
    box.innerHTML = '';
    
    chat.messages.forEach(m => {
        appendToUI(m.role, m.uiData || { text: typeof m.content === 'string' ? m.content : "多模态内容" });
    });
    
    renderHistory(); 
    updateTypingIndicator();
    
    // 移动端加载后自动收起侧边栏
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('mobile-open')) toggleSidebar();
    }
}

function createNewChat() {
    const id = Date.now();
    allChats.unshift({ 
        id, 
        title: "新对话", 
        messages: [{ role: "assistant", content: "你好！我是 **WingsGPT**。请问今天有什么可以帮你的吗？🍃" }] 
    });
    saveToLocal(); 
    loadChat(id);
}

function renderHistory() {
    const list = document.getElementById('history-list'); 
    list.innerHTML = '';
    
    allChats.forEach(chat => {
        const item = document.createElement('div');
        item.className = `history-item ${chat.id === currentChatId ? 'active' : ''}`;
        item.innerHTML = `
            <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${chat.title}</span>
            <div class="item-actions">
                <button class="action-btn" onclick="openRenameModal(event, ${chat.id})">✏️</button>
                <button class="action-btn" onclick="openDeleteModal(event, ${chat.id})">🗑️</button>
            </div>`;
        item.onclick = () => loadChat(chat.id); 
        list.appendChild(item);
    });
}

// --- 模态框逻辑 ---
function openRenameModal(e, id) { 
    e.stopPropagation(); 
    tempActionId = id; 
    document.getElementById('rename-input').value = allChats.find(c => c.id === id).title; 
    document.getElementById('rename-modal').classList.add('active'); 
}

function confirmRename() { 
    const val = document.getElementById('rename-input').value.trim(); 
    if(val) { 
        allChats.find(c => c.id === tempActionId).title = val; 
        saveToLocal(); 
        renderHistory(); 
    } 
    closeModal('rename-modal'); 
}

function openDeleteModal(e, id) { 
    e.stopPropagation(); 
    tempActionId = id; 
    document.getElementById('delete-modal').classList.add('active'); 
}

function confirmDelete() {
    allChats = allChats.filter(c => c.id !== tempActionId);
    saveToLocal();
    if (currentChatId === tempActionId) { 
        if (allChats.length > 0) loadChat(allChats[0].id); 
        else createNewChat(); 
    } else {
        renderHistory();
    }
    closeModal('delete-modal');
}

function closeModal(id) { 
    document.getElementById(id).classList.remove('active'); 
}

// --- 辅助工具 ---
function updateTypingIndicator() { 
    document.getElementById('typing-indicator').style.display = loadingChats.has(currentChatId) ? 'block' : 'none'; 
}

function saveToLocal() { 
    localStorage.setItem('wings_vision_v25', JSON.stringify(allChats)); 
}