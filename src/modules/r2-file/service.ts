import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import {
  AbstractFileProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import path from "path"
import sharp from "sharp"
import { ulid } from "ulid"

type InjectedDependencies = {
  logger: any
}

interface R2FileServiceOptions {
  file_url: string
  access_key_id?: string
  secret_access_key?: string
  region: string
  bucket: string
  prefix?: string
  endpoint?: string
  cache_control?: string
  download_file_duration?: number
  additional_client_config?: Record<string, any>
}

interface R2FileServiceConfig {
  fileUrl: string
  accessKeyId?: string
  secretAccessKey?: string
  region: string
  bucket: string
  prefix: string
  endpoint?: string
  cacheControl: string
  downloadFileDuration: number
  additionalClientConfig: Record<string, any>
}

const MAX_IMAGE_DIMENSION = 2000
const WEBP_QUALITY = 80

class R2FileService extends AbstractFileProviderService {
  static identifier = "r2"

  protected config_: R2FileServiceConfig
  protected logger_: any
  protected client_: S3Client

  constructor({ logger }: InjectedDependencies, options: R2FileServiceOptions) {
    super()

    if (!options.access_key_id || !options.secret_access_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Access key ID and secret access key are required`
      )
    }

    this.config_ = {
      fileUrl: options.file_url,
      accessKeyId: options.access_key_id,
      secretAccessKey: options.secret_access_key,
      region: options.region,
      bucket: options.bucket,
      prefix: options.prefix ?? "",
      endpoint: options.endpoint,
      cacheControl: options.cache_control ?? "public, max-age=31536000",
      downloadFileDuration: options.download_file_duration ?? 60 * 60,
      additionalClientConfig: options.additional_client_config ?? {},
    }

    this.logger_ = logger
    this.client_ = this.getClient()
  }

  protected getClient(): S3Client {
    const credentials = {
      accessKeyId: this.config_.accessKeyId!,
      secretAccessKey: this.config_.secretAccessKey!,
    }

    const config: Record<string, any> = {
      credentials,
      region: this.config_.region,
      endpoint: this.config_.endpoint,
      ...this.config_.additionalClientConfig,
    }

    return new S3Client(config)
  }

  protected isImage(mimeType: string): boolean {
    return mimeType?.toLowerCase().startsWith("image/")
  }

  protected async processImage(content: Buffer): Promise<Buffer> {
    const image = sharp(content, { failOn: "none" })

    const metadata = await image.metadata()

    let pipeline = image

    if (
      metadata.width &&
      metadata.height &&
      (metadata.width > MAX_IMAGE_DIMENSION ||
        metadata.height > MAX_IMAGE_DIMENSION)
    ) {
      pipeline = pipeline.resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
        fit: "inside",
        withoutEnlargement: true,
      })
    }

    const processed = await pipeline
      .webp({
        quality: WEBP_QUALITY,
        effort: 4,
        alphaQuality: 80,
      })
      .toBuffer()

    return processed
  }

  async upload(file: {
    filename: string
    mimeType: string
    content: string
    access?: "public" | "private"
  }): Promise<{ url: string; key: string }> {
    if (!file) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `No file provided`
      )
    }

    if (!file.filename) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `No filename provided`
      )
    }

    const parsedFilename = path.parse(file.filename)
    const isImage = this.isImage(file.mimeType)

    let fileKey: string
    let uploadContent: Buffer
    let contentType: string

    if (isImage) {
      fileKey = `${this.config_.prefix}${parsedFilename.name}-${ulid()}.webp`
      const rawContent = Buffer.from(file.content, "binary")

      try {
        uploadContent = await this.processImage(rawContent)
      } catch (err) {
        this.logger_.error(
          `Sharp processing failed for ${file.filename}, uploading original: ${err}`
        )
        fileKey = `${this.config_.prefix}${parsedFilename.name}-${ulid()}${parsedFilename.ext}`
        uploadContent = rawContent
        contentType = file.mimeType
        const command = new PutObjectCommand({
          ACL: file.access === "public" ? "public-read" : "private",
          Bucket: this.config_.bucket,
          Body: uploadContent,
          Key: fileKey,
          ContentType: contentType,
          CacheControl: this.config_.cacheControl,
          Metadata: {
            "x-amz-meta-original-filename": file.filename,
          },
        })

        try {
          await this.client_.send(command)
        } catch (e) {
          this.logger_.error(e)
          throw e
        }

        return {
          url: `${this.config_.fileUrl}/${fileKey}`,
          key: fileKey,
        }
      }

      contentType = "image/webp"
    } else {
      fileKey = `${this.config_.prefix}${parsedFilename.name}-${ulid()}${parsedFilename.ext}`
      uploadContent = Buffer.from(file.content, "binary")
      contentType = file.mimeType
    }

    const command = new PutObjectCommand({
      ACL: file.access === "public" ? "public-read" : "private",
      Bucket: this.config_.bucket,
      Body: uploadContent,
      Key: fileKey,
      ContentType: contentType,
      CacheControl: this.config_.cacheControl,
      Metadata: {
        "x-amz-meta-original-filename": file.filename,
      },
    })

    try {
      await this.client_.send(command)
    } catch (e) {
      this.logger_.error(e)
      throw e
    }

    return {
      url: `${this.config_.fileUrl}/${fileKey}`,
      key: fileKey,
    }
  }

  async delete(fileData: { fileKey: string; [x: string]: unknown }): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config_.bucket,
      Key: fileData.fileKey,
    })

    try {
      await this.client_.send(command)
    } catch (e) {
      this.logger_.error(e)
    }
  }

  async getPresignedDownloadUrl(fileData: {
    fileKey: string
    [x: string]: unknown
  }): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.config_.bucket,
      Key: `${fileData.fileKey}`,
    })

    return await getSignedUrl(this.client_, command, {
      expiresIn: this.config_.downloadFileDuration,
    })
  }
}

export default R2FileService
