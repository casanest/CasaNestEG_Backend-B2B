import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

interface TestRecord {
  id: string
  message: string
  created_at: string
}

const TestPage = () => {
  const [tests, setTests] = useState<TestRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await fetch("/custom/test")
        const data = await response.json()
        setTests(data)
      } catch (error) {
        console.error("Failed to fetch tests:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTests()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <Container>
      <Heading level="h1">Test Page</Heading>
      
      {loading ? (
        <Text>Loading...</Text>
      ) : tests.length === 0 ? (
        <Text>No records found</Text>
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          {tests.map((test) => (
            <div
              key={test.id}
              className="border border-dashed rounded-lg p-4"
            >
              <Text className="font-medium">{test.message}</Text>
              <Text className="text-xs text-ui-fg-subtle mt-2">
                Created: {formatDate(test.created_at)}
              </Text>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Test Page",
})

export default TestPage
