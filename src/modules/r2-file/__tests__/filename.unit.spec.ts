import R2FileService from "../service"

const PNG_1X1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

const createService = () => {
  const service = new R2FileService(
    { logger: { error: () => {}, info: () => {}, warn: () => {} } as any },
    {
      file_url: "https://files.example.com",
      access_key_id: "test-key",
      secret_access_key: "test-secret",
      region: "auto",
      bucket: "test-bucket",
    }
  )
  ;(service as any).client_ = { send: jest.fn(async () => ({})) }
  return service
}

const mojibake = (name: string) => Buffer.from(name, "utf8").toString("latin1")

const isAsciiOnly = (value: string) => /^[\x20-\x7E]*$/.test(value)

describe("R2FileService filename handling", () => {
  it("reverses latin1 mojibake introduced by multipart parsing", () => {
    const service = createService() as any

    expect(service.normalizeFilename(mojibake("✅️(16).png"))).toEqual(
      "✅️(16).png"
    )
    expect(service.normalizeFilename("hero-banner.png")).toEqual(
      "hero-banner.png"
    )
  })

  it("sanitizes object key segments and extensions to ascii", () => {
    const service = createService() as any

    expect(service.sanitizeKeySegment("✅️(16)")).toEqual("16")
    expect(service.sanitizeKeySegment("Banner Photo")).toEqual("Banner-Photo")
    expect(service.sanitizeKeySegment("✅️")).toEqual("file")
    expect(service.sanitizeExtension(".PNG")).toEqual(".png")
  })

  it("uploads a mojibaked emoji filename with ascii-only signature inputs", async () => {
    const service = createService()
    const content = Buffer.from(PNG_1X1_BASE64, "base64").toString("binary")

    const result = await service.upload({
      filename: mojibake("✅️(16).png"),
      mimeType: "image/png",
      content,
      access: "public",
    })

    const send = (service as any).client_.send as jest.Mock
    expect(send).toHaveBeenCalledTimes(1)

    const command = send.mock.calls[0][0]
    expect(isAsciiOnly(command.input.Key)).toBe(true)
    expect(command.input.Key).toMatch(/^16-[0-9A-Z]+\.webp$/)
    expect(Object.keys(command.input.Metadata)).toEqual(["original-filename"])
    expect(command.input.Metadata["original-filename"]).toEqual(
      encodeURIComponent("✅️(16).png")
    )
    expect(isAsciiOnly(command.input.Metadata["original-filename"])).toBe(true)
    expect(result.key).toEqual(command.input.Key)
  })

  it("uploads a non-image mojibaked filename with ascii-only key and metadata", async () => {
    const service = createService()

    await service.upload({
      filename: mojibake("عقد-2026.pdf"),
      mimeType: "application/pdf",
      content: Buffer.from("dummy").toString("binary"),
      access: "public",
    })

    const send = (service as any).client_.send as jest.Mock
    const command = send.mock.calls[0][0]
    expect(isAsciiOnly(command.input.Key)).toBe(true)
    expect(isAsciiOnly(Object.values(command.input.Metadata)[0] as string)).toBe(true)
  })
})
