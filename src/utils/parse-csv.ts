export function parseCsv(csvText: string): Record<string, string>[] {
  const rows: Record<string, string>[] = []
  const allRows: string[][] = parseRows(csvText)

  if (allRows.length < 2) {
    return []
  }

  const headers = allRows[0].map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "_")
  )

  for (let i = 1; i < allRows.length; i++) {
    const values = allRows[i]
    const row: Record<string, string> = {}

    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (values[j] ?? "").trim()
    }

    rows.push(row)
  }

  return rows
}

function parseRows(csvText: string): string[][] {
  const rows: string[][] = []
  let fields: string[] = []
  let current = ""
  let inQuotes = false
  let i = 0

  while (i < csvText.length) {
    const char = csvText[i]

    if (inQuotes) {
      if (char === '"') {
        if (csvText[i + 1] === '"') {
          current += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      current += char
      i++
      continue
    }

    if (char === '"') {
      inQuotes = true
      i++
      continue
    }

    if (char === ",") {
      fields.push(current)
      current = ""
      i++
      continue
    }

    if (char === "\r") {
      if (csvText[i + 1] === "\n") {
        i += 2
      } else {
        i++
      }
      fields.push(current)
      current = ""
      if (fields.some((f) => f.trim() !== "")) {
        rows.push(fields)
      }
      fields = []
      continue
    }

    if (char === "\n") {
      fields.push(current)
      current = ""
      if (fields.some((f) => f.trim() !== "")) {
        rows.push(fields)
      }
      fields = []
      i++
      continue
    }

    current += char
    i++
  }

  if (current !== "" || fields.length > 0) {
    fields.push(current)
    if (fields.some((f) => f.trim() !== "")) {
      rows.push(fields)
    }
  }

  return rows
}
