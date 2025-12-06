import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

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

// 上传处理程序
export default async function uploadHandler(request, env) {
  try {
    const s3Client = createS3Client(env)
    const formData = await request.formData()
    const file = formData.get('file')
    
    if (!file) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '未找到文件'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '只支持图片文件'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 验证文件大小（100MB限制）
    if (file.size > 100 * 1024 * 1024) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '文件大小超过100MB限制'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 生成唯一文件名
    const fileExtension = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`
    
    // 上传到R2
    const arrayBuffer = await file.arrayBuffer()
    const uploadParams = {
      Bucket: env.R2_BUCKET_NAME,
      Key: fileName,
      Body: new Uint8Array(arrayBuffer),
      ContentType: file.type,
      Metadata: {
        FileName: file.name,
        FileSize: Math.round(file.size / (1024 * 1024)).toString(), // MB
        TimeStamp: Date.now().toString(),
        UploadTime: new Date().toISOString()
      }
    }

    await s3Client.send(new PutObjectCommand(uploadParams))

    // 构建访问URL
    const fileUrl = `${new URL(request.url).origin}/file/${fileName}`

    return new Response(JSON.stringify([{
      src: fileUrl,
      alt: file.name,
      size: file.size,
      type: file.type
    }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '上传失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}