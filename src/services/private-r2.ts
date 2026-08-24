import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

export const getPrivateS3Client = () => {
    let endpoint = process.env.API || '';
    if (endpoint.includes('/')) {
        const parts = endpoint.split('/');
        if (parts.length >= 3) {
            endpoint = `${parts[0]}//${parts[2]}`;
        }
    }

    return new S3Client({
        region: "auto",
        endpoint: endpoint,
        credentials: {
            accessKeyId: process.env.Access_Key_ID as string,
            secretAccessKey: process.env.Secret_Access_Key as string
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
        Bucket: process.env.Private_Bucket_Name,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: mimeType,
    }))

    return objectKey
}

export const getPrivatePresignedUrl = async (objectKey: string) => {
    const s3 = getPrivateS3Client()
    const command = new GetObjectCommand({
        Bucket: process.env.Private_Bucket_Name,
        Key: objectKey,
    })

    return await getSignedUrl(s3, command, { expiresIn: 3600 })
}

export const deletePrivateFile = async (objectKey: string) => {
    const s3 = getPrivateS3Client()
    await s3.send(new DeleteObjectCommand({
        Bucket: process.env.Private_Bucket_Name,
        Key: objectKey,
    }))
}
