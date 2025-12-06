import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

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

// 文件删除处理程序
export default async function deleteHandler(request, env) {
  try {
    const url = new URL(request.url)
    const fileId = url.searchParams.get('id')
    
    if (!fileId) {
      return new Response(JSON.stringify({
        error: 'Bad Request',
        message: '缺少文件ID参数'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 创建S3客户端
    const s3Client = createS3Client(env)
    
    // 删除R2中的文件
    const deleteParams = {
      Bucket: env.R2_BUCKET_NAME,
      Key: fileId
    }

    await s3Client.send(new DeleteObjectCommand(deleteParams))

    return new Response(JSON.stringify({
      success: true,
      message: '文件删除成功'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Delete file error:', error)
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '删除文件失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}