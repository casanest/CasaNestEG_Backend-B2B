import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const getBucketName = () => {
    return process.env.Private_Bucket_Name || process.env.R2_BUCKET || ""
}

export const getPrivateS3Client = () => {
    const endpoint = process.env.R2_ENDPOINT || process.env.API || ""
    const accessKeyId = process.env.R2_ACCESS_KEY_ID || process.env.Access_Key_ID as string
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || process.env.Secret_Access_Key as string
    const bucket = getBucketName()

    if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
        const missing = [
            !endpoint && 'R2_ENDPOINT (or API)',
            !accessKeyId && 'R2_ACCESS_KEY_ID (or Access_Key_ID)',
            !secretAccessKey && 'R2_SECRET_ACCESS_KEY (or Secret_Access_Key)',
            !bucket && 'Private_Bucket_Name (or R2_BUCKET)'
        ].filter(Boolean).join(', ')
        throw new Error(`[RFQ] Missing S3 env vars: ${missing}. File uploads will fail until these are set in .env`)
    }

    return new S3Client({
        region: "auto",
        endpoint: endpoint,
        credentials: {
            accessKeyId,
            secretAccessKey
        },
        forcePathStyle: true,
    })
}

export const uploadPrivateFile = async (
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    rfqId: string
) => {
    const s3 = getPrivateS3Client()
    const uniqueHash = Math.random().toString(36).substring(2, 10)
    const objectKey = `rfq/${rfqId}/${uniqueHash}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`

    await s3.send(new PutObjectCommand({
        Bucket: getBucketName(),
        Key: objectKey,
        Body: fileBuffer,
        ContentType: mimeType,
    }))

    return objectKey
}

export const getPrivatePresignedUrl = async (objectKey: string) => {
    const s3 = getPrivateS3Client()
    const command = new GetObjectCommand({
        Bucket: getBucketName(),
        Key: objectKey,
    })

    return await getSignedUrl(s3, command, { expiresIn: 3600 })
}

export const deletePrivateFile = async (objectKey: string) => {
    const s3 = getPrivateS3Client()
    await s3.send(new DeleteObjectCommand({
        Bucket: getBucketName(),
        Key: objectKey,
    }))
}
