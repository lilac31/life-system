import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// 抑制 Chrome 扩展相关的错误
const originalConsoleError = console.error;
console.error = (...args) => {
  const errorMessage = args[0]?.toString() || '';
  
  // 过滤掉浏览器扩展相关的错误
  if (
    errorMessage.includes('runtime.lastError') ||
    errorMessage.includes('message port closed') ||
    errorMessage.includes('native messaging host') ||
    errorMessage.includes('Extension context invalidated')
  ) {
    return; // 忽略这些错误
  }
  
  // 其他错误正常输出
  originalConsoleError.apply(console, args);
};

// 错误处理
window.addEventListener('error', function(e) {
  // 忽略扩展相关的错误
  const errorMessage = e.error?.toString() || e.message || '';
  if (
    errorMessage.includes('runtime.lastError') ||
    errorMessage.includes('message port closed') ||
    errorMessage.includes('native messaging host')
  ) {
    return;
  }
  
  console.error('Global error:', e.error);
  // 显示用户友好的错误信息
  const errorElement = document.createElement('div');
  errorElement.style.position = 'fixed';
  errorElement.style.top = '0';
  errorElement.style.left = '0';
  errorElement.style.width = '100%';
  errorElement.style.height = '100%';
  errorElement.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  errorElement.style.zIndex = '9999';
  errorElement.style.display = 'flex';
  errorElement.style.flexDirection = 'column';
  errorElement.style.justifyContent = 'center';
  errorElement.style.alignItems = 'center';
  errorElement.style.padding = '20px';
  errorElement.style.fontSize = '16px';
  errorElement.style.color = '#333';
  errorElement.style.fontFamily = 'Arial, sans-serif';
  errorElement.innerHTML = `
    <div style="max-width: 500px; text-align: center;">
      <h2 style="color: #e53e3e; margin-bottom: 16px;">应用遇到了问题</h2>
      <p>抱歉，应用启动时遇到了错误。请尝试刷新页面。</p>
      <button onclick="window.location.reload()" style="
        margin-top: 16px;
        padding: 8px 16px;
        background-color: #4299e1;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      ">刷新页面</button>
      <details style="margin-top: 16px; text-align: left;">
        <summary style="cursor: pointer; padding: 8px 0;">错误详情</summary>
        <pre style="background-color: #f7fafc; padding: 12px; border-radius: 4px; overflow: auto; font-size: 12px;">
          ${e.error ? e.error.toString() : '未知错误'}
        </pre>
      </details>
    </div>
  `;
  document.body.appendChild(errorElement);
});

window.addEventListener('unhandledrejection', function(e) {
  // 忽略扩展相关的错误
  const errorMessage = e.reason?.toString() || '';
  if (
    errorMessage.includes('runtime.lastError') ||
    errorMessage.includes('message port closed') ||
    errorMessage.includes('native messaging host')
  ) {
    e.preventDefault(); // 阻止默认的错误处理
    return;
  }
  
  console.error('Unhandled promise rejection:', e.reason);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)