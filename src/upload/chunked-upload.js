import { S3Client, PutObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3'

// 创建S3客户端
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

// 分块大小（5MB）
const CHUNK_SIZE = 5 * 1024 * 1024

// 存储上传状态（在生产环境中应使用KV存储）
const uploadSessions = new Map()

// 初始化分块上传
async function initChunkedUpload(fileName, fileType) {
  const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const createMultipartUploadParams = {
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName,
    ContentType: fileType,
    Metadata: {
      FileName: fileName,
      UploadTime: new Date().toISOString(),
      UploadId: uploadId
    }
  }

  try {
    const result = await s3Client.send(new CreateMultipartUploadCommand(createMultipartUploadParams))
    
    uploadSessions.set(uploadId, {
      uploadId: result.UploadId,
      fileName: fileName,
      fileType: fileType,
      parts: [],
      startTime: Date.now()
    })

    return {
      uploadId: uploadId,
      s3UploadId: result.UploadId,
      chunkSize: CHUNK_SIZE
    }
  } catch (error) {
    console.error('Init chunked upload error:', error)
    throw new Error('初始化分块上传失败')
  }
}

// 上传分块
async function uploadChunk(uploadId, chunkIndex, chunkData) {
  const session = uploadSessions.get(uploadId)
  if (!session) {
    throw new Error('上传会话不存在')
  }

  try {
    const uploadPartParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: session.fileName,
      PartNumber: chunkIndex + 1,
      UploadId: session.s3UploadId,
      Body: chunkData
    }

    const result = await s3Client.send(new UploadPartCommand(uploadPartParams))
    
    session.parts.push({
      PartNumber: chunkIndex + 1,
      ETag: result.ETag
    })

    return {
      success: true,
      partNumber: chunkIndex + 1,
      etag: result.ETag
    }
  } catch (error) {
    console.error('Upload chunk error:', error)
    throw new Error(`上传分块 ${chunkIndex} 失败`)
  }
}

// 完成分块上传
async function completeChunkedUpload(uploadId) {
  const session = uploadSessions.get(uploadId)
  if (!session) {
    throw new Error('上传会话不存在')
  }

  try {
    const completeParams = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: session.fileName,
      UploadId: session.s3UploadId,
      MultipartUpload: {
        Parts: session.parts.sort((a, b) => a.PartNumber - b.PartNumber)
      }
    }

    await s3Client.send(new CompleteMultipartUploadCommand(completeParams))
    
    // 清理会话
    uploadSessions.delete(uploadId)

    return {
      success: true,
      fileName: session.fileName,
      totalParts: session.parts.length,
      uploadTime: Date.now() - session.startTime
    }
  } catch (error) {
    console.error('Complete chunked upload error:', error)
    
    // 尝试中止上传
    try {
      await s3Client.send(new AbortMultipartUploadCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: session.fileName,
        UploadId: session.s3UploadId
      }))
    } catch (abortError) {
      console.error('Abort upload error:', abortError)
    }
    
    uploadSessions.delete(uploadId)
    throw new Error('完成分块上传失败')
  }
}

// 中止分块上传
async function abortChunkedUpload(uploadId) {
  const session = uploadSessions.get(uploadId)
  if (!session) {
    return { success: true, message: '上传会话不存在或已清理' }
  }

  try {
    await s3Client.send(new AbortMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: session.fileName,
      UploadId: session.s3UploadId
    }))

    uploadSessions.delete(uploadId)
    return { success: true, message: '上传已中止' }
  } catch (error) {
    console.error('Abort upload error:', error)
    uploadSessions.delete(uploadId)
    throw new Error('中止上传失败')
  }
}

// 获取上传进度
function getUploadProgress(uploadId) {
  const session = uploadSessions.get(uploadId)
  if (!session) {
    return null
  }

  return {
    uploadId: uploadId,
    fileName: session.fileName,
    uploadedParts: session.parts.length,
    totalParts: session.totalParts || 'unknown',
    progress: session.totalParts ? Math.round((session.parts.length / session.totalParts) * 100) : 0
  }
}

// 计算文件需要分块的数量
function calculateChunks(fileSize) {
  return Math.ceil(fileSize / CHUNK_SIZE)
}

// 验证分块数据
function validateChunkData(chunkData, expectedSize) {
  if (!chunkData || chunkData.byteLength === 0) {
    throw new Error('分块数据为空')
  }
  
  if (expectedSize && chunkData.byteLength > expectedSize) {
    throw new Error('分块数据超过预期大小')
  }
  
  return true
}

export {
  CHUNK_SIZE,
  initChunkedUpload,
  uploadChunk,
  completeChunkedUpload,
  abortChunkedUpload,
  getUploadProgress,
  calculateChunks,
  validateChunkData
}