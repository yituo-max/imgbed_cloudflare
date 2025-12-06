import {
  initChunkedUpload,
  uploadChunk,
  completeChunkedUpload,
  abortChunkedUpload,
  getUploadProgress,
  calculateChunks,
  validateChunkData,
  CHUNK_SIZE
} from './chunked-upload.js'

// 分块上传处理程序
export default async function chunkedUploadHandler(request, env) {
  const url = new URL(request.url)
  const action = url.searchParams.get('action')

  try {
    switch (action) {
      case 'init':
        return await handleInitUpload(request, env)
      case 'upload':
        return await handleUploadChunk(request, env)
      case 'complete':
        return await handleCompleteUpload(request, env)
      case 'abort':
        return await handleAbortUpload(request, env)
      case 'progress':
        return await handleGetProgress(request)
      default:
        return new Response(JSON.stringify({
          error: 'Bad Request',
          message: '无效的操作类型'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    console.error('Chunked upload handler error:', error)
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error.message || '分块上传处理失败'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// 初始化分块上传
async function handleInitUpload(request, env) {
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

  // 验证文件大小（500MB限制）
  if (file.size > 500 * 1024 * 1024) {
    return new Response(JSON.stringify({
      error: 'Bad Request',
      message: '文件大小超过500MB限制'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // 生成唯一文件名
  const fileExtension = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExtension}`

  // 初始化分块上传
  const result = await initChunkedUpload(fileName, file.type, env)

  return new Response(JSON.stringify({
    success: true,
    uploadId: result.uploadId,
    fileName: fileName,
    chunkSize: result.chunkSize,
    totalChunks: calculateChunks(file.size),
    fileSize: file.size
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

// 上传分块
async function handleUploadChunk(request, env) {
  const url = new URL(request.url)
  const uploadId = url.searchParams.get('uploadId')
  const chunkIndex = parseInt(url.searchParams.get('chunkIndex'))

  if (!uploadId || isNaN(chunkIndex)) {
    return new Response(JSON.stringify({
      error: 'Bad Request',
      message: '缺少必要的参数'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const formData = await request.formData()
  const chunkData = formData.get('chunk')

  if (!chunkData) {
    return new Response(JSON.stringify({
      error: 'Bad Request',
      message: '未找到分块数据'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // 验证分块数据
  try {
    validateChunkData(chunkData, CHUNK_SIZE)
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Bad Request',
      message: error.message
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const arrayBuffer = await chunkData.arrayBuffer()
  const result = await uploadChunk(uploadId, chunkIndex, new Uint8Array(arrayBuffer), env)

  return new Response(JSON.stringify({
    success: true,
    partNumber: result.partNumber,
    etag: result.etag
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

// 完成分块上传
async function handleCompleteUpload(request, env) {
  const url = new URL(request.url)
  const uploadId = url.searchParams.get('uploadId')

  if (!uploadId) {
    return new Response(JSON.stringify({
      error: 'Bad Request',
      message: '缺少uploadId参数'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const result = await completeChunkedUpload(uploadId, env)
  
  // 构建访问URL
  const fileUrl = `${new URL(request.url).origin}/file/${result.fileName}`

  return new Response(JSON.stringify({
    success: true,
    fileName: result.fileName,
    fileUrl: fileUrl,
    totalParts: result.totalParts,
    uploadTime: result.uploadTime
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

// 中止上传
async function handleAbortUpload(request, env) {
  const url = new URL(request.url)
  const uploadId = url.searchParams.get('uploadId')

  if (!uploadId) {
    return new Response(JSON.stringify({
      error: 'Bad Request',
      message: '缺少uploadId参数'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const result = await abortChunkedUpload(uploadId, env)

  return new Response(JSON.stringify({
    success: true,
    message: result.message
  }), {
    status: 200,
      headers: { 'Content-Type': 'application/json' }
  })
}

// 获取上传进度
async function handleGetProgress(request) {
  const url = new URL(request.url)
  const uploadId = url.searchParams.get('uploadId')

  if (!uploadId) {
    return new Response(JSON.stringify({
      error: 'Bad Request',
      message: '缺少uploadId参数'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const progress = getUploadProgress(uploadId)

  if (!progress) {
    return new Response(JSON.stringify({
      error: 'Not Found',
      message: '上传会话不存在'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({
    success: true,
    progress: progress
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}