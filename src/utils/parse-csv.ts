export function parseCsv(csvText: string): Record<string, string>[] {
  const lines = csvText.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim() !== "")

  if (lines.length < 2) {
    return []
  }

  const headers = parseLine(lines[0]).map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "_")
  )

  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])
    const row: Record<string, string> = {}

    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] ?? "").trim()
    }

    rows.push(row)
  }

  return rows
}

function parseLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current)
      current = ""
    } else {
      current += char
    }
  }

  fields.push(current)

  return fields
}
