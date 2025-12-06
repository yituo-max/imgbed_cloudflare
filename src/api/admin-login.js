// 管理员登录处理
/**
 * 管理员登录处理函数
 * @param {Request} request - HTTP请求对象
 * @returns {Promise<Response>} - 登录响应
 */
export default async function loginHandler(request) {
  try {
    const { username, password } = await request.json()
    
    // 简单的用户名密码验证（生产环境应使用更安全的方案）
    if (username === 'admin' && password === 'admin123') {
      return new Response(JSON.stringify({
        success: true,
        token: 'admin123', // 生产环境应生成JWT令牌
        message: '登录成功'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } else {
      return new Response(JSON.stringify({
        success: false,
        message: '用户名或密码错误'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: '请求格式错误'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}