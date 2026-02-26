// ========================================
// 🔧 GitHub Gist 同步诊断和修复脚本
// ========================================

console.log('\n========================================');
console.log('🔍 开始诊断 GitHub Gist 同步配置');
console.log('========================================\n');

// 1. 检查当前配置
console.log('📋 第1步：检查当前配置');
console.log('----------------------------------------');
const currentToken = localStorage.getItem('github_token');
const currentProvider = localStorage.getItem('sync_provider');
const currentGistId = localStorage.getItem('gist_id');
const jsonbinKey = localStorage.getItem('jsonbin_api_key');
const jsonbinId = localStorage.getItem('jsonbin_id');

console.log('GitHub Token:', currentToken ? '✅ 已设置 (前5位: ' + currentToken.substring(0, 5) + '...)' : '❌ 未设置');
console.log('同步提供商:', currentProvider || '❌ 未设置');
console.log('Gist ID:', currentGistId || '未设置（首次使用正常）');
console.log('JSONBin API Key:', jsonbinKey ? '⚠️ 还在（需要清除）' : '✅ 已清除');
console.log('JSONBin ID:', jsonbinId ? '⚠️ 还在（需要清除）' : '✅ 已清除');

// 2. 清理旧配置
console.log('\n📋 第2步：清理旧的 JSONBin 配置');
console.log('----------------------------------------');
if (jsonbinKey || jsonbinId) {
    localStorage.removeItem('jsonbin_api_key');
    localStorage.removeItem('jsonbin_id');
    console.log('✅ 已清除 JSONBin 配置');
} else {
    console.log('✅ 无需清理');
}

// 3. 设置 GitHub 配置
console.log('\n📋 第3步：配置 GitHub Gist');
console.log('----------------------------------------');

if (!currentToken) {
    console.log('❌ 缺少 GitHub Token！');
    console.log('\n请执行以下命令设置 Token：');
    console.log('----------------------------------------');
    console.log("localStorage.setItem('github_token', 'ghp_你的Token这里');");
    console.log("localStorage.setItem('sync_provider', 'gist');");
    console.log('location.reload();');
    console.log('----------------------------------------');
} else {
    if (currentProvider !== 'gist') {
        localStorage.setItem('sync_provider', 'gist');
        console.log('✅ 同步提供商已设置为 gist');
    } else {
        console.log('✅ 同步提供商已正确设置');
    }
}

// 4. 验证 GitHub Token
console.log('\n📋 第4步：验证 GitHub Token');
console.log('----------------------------------------');

if (currentToken) {
    fetch('https://api.github.com/user', {
        headers: {
            'Authorization': `token ${currentToken}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error(`Token 验证失败: ${response.status}`);
        }
    })
    .then(user => {
        console.log('✅ Token 验证成功！');
        console.log('GitHub 用户:', user.login);
        console.log('用户名:', user.name || '未设置');
        
        console.log('\n========================================');
        console.log('✅ 配置验证完成！');
        console.log('========================================');
        console.log('\n💡 下一步：');
        console.log('1. 刷新页面: location.reload()');
        console.log('2. 添加一个任务测试同步');
        console.log('3. 观察控制台输出');
        console.log('========================================\n');
    })
    .catch(error => {
        console.error('❌ Token 验证失败:', error.message);
        console.log('\n可能原因：');
        console.log('1. Token 无效或已过期');
        console.log('2. Token 权限不足（需要 gist 权限）');
        console.log('3. 网络连接问题');
        console.log('\n解决方法：');
        console.log('1. 重新创建 GitHub Token');
        console.log('2. 确保勾选 gist 权限');
        console.log('3. 重新配置');
        console.log('========================================\n');
    });
} else {
    console.log('⚠️ 无法验证（未设置 Token）');
}

// 5. 最终总结
setTimeout(() => {
    console.log('\n========================================');
    console.log('📊 诊断总结');
    console.log('========================================');
    const finalToken = localStorage.getItem('github_token');
    const finalProvider = localStorage.getItem('sync_provider');
    
    if (finalToken && finalProvider === 'gist') {
        console.log('✅ 配置正确！');
        console.log('\n如果仍然报错，请：');
        console.log('1. 执行 location.reload() 刷新页面');
        console.log('2. 清除浏览器缓存（Ctrl+Shift+Delete）');
        console.log('3. 重启开发服务器');
    } else {
        console.log('❌ 配置不完整');
        console.log('\n请按照上面的提示完成配置');
    }
    console.log('========================================\n');
}, 2000);
