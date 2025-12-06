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

// 健康检查
router.get('/health', () => new Response('OK'))

// 登录接口
router.post('/api/login', loginHandler)

// 普通上传接口
router.post('/upload', userAuthCheck, uploadHandler)

// 分块上传接口
router.post('/upload/chunked', userAuthCheck, chunkedUploadHandler)

// 文件管理接口
router.get('/api/manage/list', userAuthCheck, listHandler)
router.delete('/api/manage/delete', userAuthCheck, deleteHandler)

// 文件访问接口
router.get('/file/:filename', fileHandler)

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