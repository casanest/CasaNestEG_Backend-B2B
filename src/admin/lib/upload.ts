export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData()
  formData.append("files", file)

  const response = await fetch("/admin/uploads", {
    method: "POST",
    body: formData,
    credentials: "include",
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()

  let uploadedFiles: any[] = []

  if (result.uploads && Array.isArray(result.uploads)) {
    uploadedFiles = result.uploads
  } else if (result.files && Array.isArray(result.files)) {
    uploadedFiles = result.files
  } else if (Array.isArray(result)) {
    uploadedFiles = result
  }

  if (uploadedFiles.length === 0) {
    throw new Error("Upload returned no files")
  }

  const url = uploadedFiles[0].url

  if (!url) {
    throw new Error("Upload response missing url field")
  }

  return url
}
