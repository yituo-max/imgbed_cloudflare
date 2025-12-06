// 用户认证检查中间件
/**
 * 用户认证检查中间件
 * @param {Request} request - HTTP请求对象
 * @returns {Response|undefined} - 认证失败时返回响应，通过时返回undefined
 */
export function userAuthCheck(request) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ 
      error: 'Unauthorized',
      message: '缺少认证令牌'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const token = authHeader.slice(7)
  
  // 简单的令牌验证（生产环境应使用JWT或其他安全方案）
  if (!isValidToken(token)) {
    return new Response(JSON.stringify({ 
      error: 'Unauthorized',
      message: '认证令牌无效'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // 认证通过，继续处理请求
  return
}

// 验证令牌（简化版，生产环境需要更安全的方案）
function isValidToken(token) {
  // 这里应该从KV存储或环境变量中验证令牌
  // 暂时使用简单的字符串匹配
  const validTokens = ['admin123', 'admin456'] // 应该从环境变量获取
  return validTokens.includes(token)
}