import { Router } from 'itty-router'
import { userAuthCheck } from './middleware/auth'
import uploadHandler from './upload/upload'
import chunkedUploadHandler from './upload/chunked-handler'
import listHandler from './api/manage/list'
import deleteHandler from './api/manage/delete'
import loginHandler from './api/admin-login'
import fileHandler from './file/file'

// 创建路由器
const router = Router()

// 根路径 - 服务前端页面
router.get('/', () => {
  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudFlare 图床</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
            color: #e0e0e0;
            min-height: 100vh;
            overflow-x: hidden;
        }

        .login-page {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
        }

        .login-container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px;
            width: 400px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
        }

        .login-title {
            text-align: center;
            font-size: 28px;
            font-weight: 300;
            margin-bottom: 30px;
            color: #fff;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }

        .login-form {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .form-group label {
            font-size: 14px;
            color: #b0b0b0;
        }

        .form-group input {
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            color: #fff;
            font-size: 16px;
            transition: all 0.3s ease;
        }

        .form-group input:focus {
            outline: none;
            border-color: #4cc9f0;
            box-shadow: 0 0 0 2px rgba(76, 201, 240, 0.2);
        }

        .login-btn {
            padding: 12px 24px;
            background: linear-gradient(135deg, #4cc9f0 0%, #4361ee 100%);
            border: none;
            border-radius: 10px;
            color: white;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
        }

        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(76, 201, 240, 0.3);
        }

        .main-page {
            display: none;
            min-height: 100vh;
        }

        .header {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 20px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-size: 24px;
            font-weight: 600;
            color: #fff;
        }

        .nav-buttons {
            display: flex;
            gap: 15px;
        }

        .nav-btn {
            padding: 10px 20px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #fff;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .nav-btn.active {
            background: linear-gradient(135deg, #4cc9f0 0%, #4361ee 100%);
            border-color: #4cc9f0;
        }

        .nav-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .content {
            padding: 40px;
            max-width: 1200px;
            margin: 0 auto;
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .upload-area {
            background: rgba(255, 255, 255, 0.05);
            border: 2px dashed rgba(255, 255, 255, 0.2);
            border-radius: 15px;
            padding: 60px 40px;
            text-align: center;
            margin-bottom: 40px;
            transition: all 0.3s ease;
        }

        .upload-area.drag-over {
            border-color: #4cc9f0;
            background: rgba(76, 201, 240, 0.1);
        }

        .upload-icon {
            font-size: 48px;
            color: #4cc9f0;
            margin-bottom: 20px;
        }

        .upload-text {
            font-size: 18px;
            margin-bottom: 10px;
            color: #fff;
        }

        .upload-subtext {
            font-size: 14px;
            color: #b0b0b0;
            margin-bottom: 20px;
        }

        .file-input {
            display: none;
        }

        .upload-btn {
            padding: 12px 24px;
            background: linear-gradient(135deg, #4cc9f0 0%, #4361ee 100%);
            border: none;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .upload-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(76, 201, 240, 0.3);
        }

        .progress-container {
            margin-top: 20px;
            display: none;
        }

        .progress-bar {
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
            overflow: hidden;
        }

        .progress {
            height: 100%;
            background: linear-gradient(90deg, #4cc9f0 0%, #4361ee 100%);
            transition: width 0.3s ease;
        }

        .preview-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 40px;
        }

        .preview-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 15px;
            text-align: center;
        }

        .preview-img {
            width: 100%;
            height: 120px;
            object-fit: cover;
            border-radius: 8px;
            margin-bottom: 10px;
        }

        .preview-info {
            font-size: 12px;
            color: #b0b0b0;
        }

        .gallery-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
        }

        .gallery-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            overflow: hidden;
            transition: transform 0.3s ease;
        }

        .gallery-item:hover {
            transform: translateY(-5px);
        }

        .gallery-img {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }

        .gallery-info {
            padding: 15px;
        }

        .gallery-actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }

        .action-btn {
            padding: 6px 12px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            border-radius: 5px;
            color: #fff;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s ease;
        }

        .action-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            padding: 15px 20px;
            color: #fff;
            display: none;
            z-index: 1000;
            transition: all 0.3s ease;
        }

        .notification.show {
            display: block;
            animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        .search-container {
            margin-bottom: 30px;
        }

        .search-input {
            width: 100%;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            color: #fff;
            font-size: 16px;
        }

        .search-input:focus {
            outline: none;
            border-color: #4cc9f0;
        }

        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #b0b0b0;
        }

        @media (max-width: 768px) {
            .content {
                padding: 20px;
            }
            
            .header {
                padding: 15px 20px;
            }
            
            .upload-area {
                padding: 40px 20px;
            }
            
            .gallery-grid {
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            }
        }
    </style>
</head>
<body>
    <!-- 登录页面 -->
    <div class="login-page" id="loginPage">
        <div class="login-container">
            <h1 class="login-title">CloudFlare 图床</h1>
            <form class="login-form" id="loginForm">
                <div class="form-group">
                    <label for="username">用户名</label>
                    <input type="text" id="username" name="username" required>
                </div>
                <div class="form-group">
                    <label for="password">密码</label>
                    <input type="password" id="password" name="password" required>
                </div>
                <button type="submit" class="login-btn">登录</button>
            </form>
        </div>
    </div>

    <!-- 主页面 -->
    <div class="main-page" id="mainPage">
        <header class="header">
            <div class="logo">CloudFlare 图床</div>
            <div class="nav-buttons">
                <button class="nav-btn active" data-tab="upload">上传图片</button>
                <button class="nav-btn" data-tab="gallery">图片库</button>
                <button class="nav-btn" onclick="logout()">退出登录</button>
            </div>
        </header>

        <div class="content">
            <!-- 上传标签页 -->
            <div class="tab-content active" id="uploadTab">
                <div class="upload-area" id="uploadArea">
                    <div class="upload-icon">📁</div>
                    <div class="upload-text">拖拽文件到此处或点击上传</div>
                    <div class="upload-subtext">支持 JPG, PNG, GIF, WebP 格式，单文件最大 500MB（大于20MB自动启用分块上传）</div>
                    <input type="file" id="fileInput" class="file-input" multiple accept="image/*">
                    <button class="upload-btn" onclick="document.getElementById('fileInput').click()">选择文件</button>
                    <div class="progress-container" id="progressContainer">
                        <div class="progress-bar">
                            <div class="progress" id="progressBar"></div>
                        </div>
                        <div id="progressText">0%</div>
                    </div>
                </div>
                
                <div class="preview-container" id="previewContainer"></div>
            </div>

            <!-- 图片库标签页 -->
            <div class="tab-content" id="galleryTab">
                <div class="search-container">
                    <input type="text" class="search-input" id="searchInput" placeholder="搜索图片...">
                </div>
                <div class="gallery-grid" id="galleryGrid">
                    <div class="empty-state">
                        暂无图片，请先上传图片
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- 通知 -->
    <div class="notification" id="notification"></div>

    <script>
        // 全局变量
        let adminToken = localStorage.getItem('adminToken');
        let imageGallery = JSON.parse(localStorage.getItem('imageGallery') || '[]');

        // 页面加载完成后初始化
        document.addEventListener('DOMContentLoaded', function() {
            checkAuthStatus();
            setupEventListeners();
        });

        // 检查认证状态
        function checkAuthStatus() {
            if (adminToken) {
                showMainPage();
            } else {
                showLoginPage();
            }
        }

        // 显示登录页面
        function showLoginPage() {
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('mainPage').style.display = 'none';
        }

        // 显示主页面
        function showMainPage() {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('mainPage').style.display = 'block';
            initApp();
        }

        // 设置事件监听器
        function setupEventListeners() {
            // 登录表单提交
            document.getElementById('loginForm').addEventListener('submit', handleLogin);
            
            // 文件选择事件
            document.getElementById('fileInput').addEventListener('change', handleFileSelect);
            
            // 拖拽事件
            const uploadArea = document.getElementById('uploadArea');
            uploadArea.addEventListener('dragover', handleDragOver);
            uploadArea.addEventListener('dragleave', handleDragLeave);
            uploadArea.addEventListener('drop', handleDrop);
            
            // 标签页切换
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    if (this.getAttribute('data-tab')) {
                        switchTab(this.getAttribute('data-tab'));
                    }
                });
            });
            
            // 搜索事件
            document.getElementById('searchInput').addEventListener('input', renderGallery);
        }

        // 处理登录
        async function handleLogin(event) {
            event.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    adminToken = data.token;
                    localStorage.setItem('adminToken', adminToken);
                    showMainPage();
                    showNotification('登录成功', 'success');
                } else {
                    throw new Error('登录失败');
                }
            } catch (error) {
                showNotification('登录失败: ' + error.message, 'error');
            }
        }

        // 退出登录
        function logout() {
            adminToken = null;
            localStorage.removeItem('adminToken');
            showLoginPage();
            showNotification('已退出登录', 'info');
        }

        // 切换标签页
        function switchTab(tabName) {
            // 更新按钮状态
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector('[data-tab="' + tabName + '"]').classList.add('active');
            
            // 更新内容显示
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabName + 'Tab').classList.add('active');
            
            // 如果是图片库标签页，刷新图片
            if (tabName === 'gallery') {
                renderGallery();
            }
        }

        // 初始化应用
        function initApp() {
            loadImagesFromServer();
        }

        // 从服务器加载图片
        async function loadImagesFromServer() {
            try {
                const response = await fetch('/api/manage/list?count=100', {
                    headers: {
                         'Authorization': 'Bearer ' + adminToken
                     }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    // 转换服务器数据格式
                     const serverImages = data.files.map(file => ({
                         id: file.name,
                         url: '/file/' + file.name,
                         name: file.metadata?.FileName || file.name,
                         size: file.metadata?.FileSize || 0,
                         timestamp: file.metadata?.TimeStamp || Date.now(),
                         metadata: file.metadata
                     }));
                    
                    // 合并本地和服务器数据
                    mergeImageData(serverImages);
                    renderGallery();
                }
            } catch (error) {
                console.error('加载图片失败:', error);
                showNotification('加载图片失败', 'error');
            }
        }

        // 合并图片数据
        function mergeImageData(serverImages) {
            const localImages = imageGallery.filter(img => !serverImages.some(sImg => sImg.id === img.id));
            imageGallery = [...serverImages, ...localImages];
            localStorage.setItem('imageGallery', JSON.stringify(imageGallery));
        }

        // 渲染图片库
        function renderGallery() {
            const galleryGrid = document.getElementById('galleryGrid');
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            
            let filteredImages = imageGallery;
            if (searchTerm) {
                filteredImages = imageGallery.filter(image => 
                    image.name.toLowerCase().includes(searchTerm)
                );
            }
            
            if (filteredImages.length === 0) {
                galleryGrid.innerHTML = '<div class="empty-state">没有找到匹配的图片</div>';
                return;
            }
            
            galleryGrid.innerHTML = filteredImages.map(image => 
                 '<div class="gallery-item">' +
                 '<img src="' + image.url + '" alt="' + image.name + '" class="gallery-img" ' +
                 'onerror="this.src=\'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDI1MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI1MCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiMzMzMiLz48cGF0aCBkPSJNMTI1IDEwMEMxMTEuMTkyOSAxMDAgMTAwIDExMS4xOTMgMTAwIDEyNUMxMDAgMTM4LjgwNyAxMTEuMTkyOSAxNTAgMTI1IDE1MEMxMzguODA3IDE1MCAxNTAgMTM4LjgwNyAxNTAgMTI1QzE1MAxMTEuMTkzIDEzOC44MDcgMTAwIDEyNSAxMDBaIiBmaWxsPSIjNjY2Ii8+PC9zdmc+\'" />' +
                 '<div class="gallery-info">' +
                 '<div style="font-weight: bold; margin-bottom: 5px;">' + image.name + '</div>' +
                 '<div style="font-size: 12px; color: #b0b0b0;">' + formatBytes(image.size) + '</div>' +
                 '<div style="font-size: 12px; color: #b0b0b0;">' + formatDate(image.timestamp) + '</div>' +
                 '<div class="gallery-actions">' +
                 '<button class="action-btn" onclick="copyUrl(\'' + image.url + '\')">复制链接</button>' +
                 '<button class="action-btn" onclick="deleteImage(\'' + image.id + '\')">删除</button>' +
                 '</div>' +
                 '</div>' +
                 '</div>'
             ).join('');
        }

        // 格式化文件大小
        function formatBytes(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        // 格式化日期
        function formatDate(timestamp) {
            return new Date(timestamp).toLocaleString('zh-CN');
        }

        // 复制URL
        function copyUrl(url) {
            navigator.clipboard.writeText(url).then(() => {
                showNotification('链接已复制到剪贴板', 'success');
            }).catch(() => {
                showNotification('复制失败', 'error');
            });
        }

        // 删除图片
        async function deleteImage(id) {
            if (!confirm('确定要删除这张图片吗？')) return;
            
            try {
                const response = await fetch('/api/manage/delete?filename=' + id, {
                    method: 'DELETE',
                    headers: {
                         'Authorization': 'Bearer ' + adminToken
                     }
                });
                
                if (response.ok) {
                    imageGallery = imageGallery.filter(img => img.id !== id);
                    localStorage.setItem('imageGallery', JSON.stringify(imageGallery));
                    renderGallery();
                    showNotification('图片删除成功', 'success');
                } else {
                    throw new Error('删除失败');
                }
            } catch (error) {
                showNotification('删除失败: ' + error.message, 'error');
            }
        }

        // 处理文件选择
        function handleFileSelect(event) {
            const files = Array.from(event.target.files);
            uploadFiles(files);
        }

        // 处理拖拽事件
        function handleDragOver(event) {
            event.preventDefault();
            document.getElementById('uploadArea').classList.add('drag-over');
        }

        function handleDragLeave(event) {
            event.preventDefault();
            document.getElementById('uploadArea').classList.remove('drag-over');
        }

        function handleDrop(event) {
            event.preventDefault();
            document.getElementById('uploadArea').classList.remove('drag-over');
            const files = Array.from(event.dataTransfer.files);
            uploadFiles(files);
        }

        // 上传文件
        async function uploadFiles(files) {
            for (const file of files) {
                await uploadFile(file);
            }
        }

        // 上传单个文件
        async function uploadFile(file) {
            if (!file.type.startsWith('image/')) {
                showNotification('请选择图片文件', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    headers: {
                         'Authorization': 'Bearer ' + adminToken
                     },
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    showNotification('上传成功: ' + data.filename, 'success');
                    
                    // 添加新图片到本地图库
                    const newImage = {
                        id: data.filename,
                        url: '/file/' + data.filename,
                        name: file.name,
                        size: file.size,
                        timestamp: Date.now(),
                        metadata: data.metadata
                    };
                    
                    imageGallery.unshift(newImage);
                    localStorage.setItem('imageGallery', JSON.stringify(imageGallery));
                    
                    // 如果当前在图片库标签页，刷新显示
                    if (document.getElementById('galleryTab').classList.contains('active')) {
                        renderGallery();
                    }
                } else {
                    throw new Error('上传失败');
                }
            } catch (error) {
                showNotification('上传失败: ' + error.message, 'error');
            }
        }

        // 显示通知
        function showNotification(message, type = 'info') {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.className = 'notification';
            notification.classList.add('show', type);
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    </script>
</body>
</html>`;
  
  return new Response(htmlContent, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8'
    }
  });
})

// 健康检查
router.get('/health', () => new Response('OK'))

// 登录接口
router.post('/api/login', loginHandler)

// 普通上传接口
router.post('/upload', userAuthCheck, (request) => uploadHandler(request, request.env))

// 分块上传接口
router.post('/upload/chunked', userAuthCheck, (request) => chunkedUploadHandler(request, request.env))

// 文件管理接口
router.get('/api/manage/list', userAuthCheck, (request) => listHandler(request, request.env))
router.delete('/api/manage/delete', userAuthCheck, (request) => deleteHandler(request, request.env))

// 文件访问接口
router.get('/file/:filename', (request) => fileHandler(request, request.env))

// 404处理
router.all('*', () => new Response('Not Found', { status: 404 }))

// Worker入口
export default {
  async fetch(request, env, ctx) {
    try {
      // 设置环境变量
      request.env = env
      request.ctx = ctx
      
      // 处理CORS
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        })
      }
      
      // 处理请求
      const response = await router.handle(request)
      
      // 添加CORS头
      response.headers.set('Access-Control-Allow-Origin', '*')
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      
      return response
    } catch (error) {
      console.error('Worker error:', error)
      return new Response('Internal Server Error', { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      })
    }
  }
}