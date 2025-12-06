import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

// 创建S3客户端（用于Cloudflare R2）
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

// 文件列表处理程序
export default async function listHandler(request) {
  try {
    const url = new URL(request.url)
    const count = parseInt(url.searchParams.get('count')) || 50
    const search = url.searchParams.get('search') || ''
    const page = parseInt(url.searchParams.get('page')) || 1
    
    // 获取R2存储桶中的文件列表
    const listParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      MaxKeys: count
    }

    const response = await s3Client.send(new ListObjectsV2Command(listParams))
    
    if (!response.Contents) {
      return new Response(JSON.stringify({
        files: [],
        total: 0,
        page: page,
        pageSize: count
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 处理文件列表
    let files = response.Contents.map(item => ({
      name: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
      etag: item.ETag,
      url: `${new URL(request.url).origin}/file/${item.Key}`
    }))

    // 搜索过滤
    if (search) {
      files = files.filter(file => 
        file.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    // 分页
    const startIndex = (page - 1) * count
    const endIndex = startIndex + count
    const paginatedFiles = files.slice(startIndex, endIndex)

    // 获取文件元数据（需要单独获取每个文件的头部信息）
    const filesWithMetadata = await Promise.all(
      paginatedFiles.map(async (file) => {
        try {
          // 这里可以添加获取文件元数据的逻辑
          // 由于R2的限制，可能需要使用HeadObjectCommand来获取元数据
          return {
            ...file,
            metadata: {
              FileName: file.name,
              FileSize: Math.round(file.size / (1024 * 1024)), // MB
              TimeStamp: file.lastModified ? file.lastModified.getTime() : Date.now()
            }
          }
        } catch (error) {
          console.error(`Error getting metadata for ${file.name}:`, error)
          return {
            ...file,
            metadata: {
              FileName: file.name,
              FileSize: Math.round(file.size / (1024 * 1024)),
              TimeStamp: Date.now()
            }
          }
        }
      })
    )

    return new Response(JSON.stringify({
      files: filesWithMetadata,
      total: files.length,
      page: page,
      pageSize: count,
      totalPages: Math.ceil(files.length / count)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('List files error:', error)
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: '获取文件列表失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}