import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

// 创建S3客户端（用于Cloudflare R2）
function createS3Client(env) {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  })
}

// 文件访问处理程序
export default async function fileHandler(request, env) {
  try {
    const url = new URL(request.url)
    const filename = url.pathname.split('/').pop()
    
    if (!filename) {
      return new Response('File not found', { status: 404 })
    }

    // 创建S3客户端
    const s3Client = createS3Client(env)

    // 检查文件是否存在
    try {
      const headParams = {
        Bucket: env.R2_BUCKET_NAME,
        Key: filename
      }
      await s3Client.send(new HeadObjectCommand(headParams))
    } catch (error) {
      if (error.name === 'NotFound') {
        return new Response('File not found', { status: 404 })
      }
      throw error
    }

    // 获取文件
    const getParams = {
      Bucket: env.R2_BUCKET_NAME,
      Key: filename
    }

    const response = await s3Client.send(new GetObjectCommand(getParams))
    
    // 构建响应头
    const headers = new Headers()
    
    // 设置内容类型
    if (response.ContentType) {
      headers.set('Content-Type', response.ContentType)
    } else {
      // 根据文件扩展名推断类型
      const ext = filename.split('.').pop().toLowerCase()
      const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml'
      }
      headers.set('Content-Type', mimeTypes[ext] || 'application/octet-stream')
    }
    
    // 设置缓存头
    headers.set('Cache-Control', 'public, max-age=31536000') // 1年缓存
    
    // 设置其他头信息
    if (response.ContentLength) {
      headers.set('Content-Length', response.ContentLength.toString())
    }
    
    if (response.LastModified) {
      headers.set('Last-Modified', response.LastModified.toUTCString())
    }
    
    if (response.ETag) {
      headers.set('ETag', response.ETag)
    }

    // 返回文件内容
    return new Response(response.Body, {
      status: 200,
      headers: headers
    })

  } catch (error) {
    console.error('File access error:', error)
    
    if (error.name === 'NotFound') {
      return new Response('File not found', { status: 404 })
    }
    
    return new Response('Internal Server Error', { status: 500 })
  }
}