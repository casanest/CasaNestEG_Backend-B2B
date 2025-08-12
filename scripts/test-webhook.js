#!/usr/bin/env node

/**
 * Test script for Tap webhook functionality
 * This script simulates webhook calls to test payment processing
 */

const fetch = require('node-fetch')

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const WEBHOOK_URL = `${BACKEND_URL}/webhooks/tap`

// Test data
const testPayloads = [
  {
    name: "Successful Payment - CAPTURED",
    payload: {
      id: "chg_test_123456789",
      status: "CAPTURED",
      amount: 5000, // $50.00
      currency: "USD",
      metadata: {
        cart_id: "cart_test_123",
        email: "test@example.com"
      },
      reference: {
        transaction: "cart_test_123",
        order: "cart_test_123"
      }
    }
  },
  {
    name: "Successful Payment - AUTHORIZED",
    payload: {
      id: "chg_test_987654321",
      status: "AUTHORIZED",
      amount: 2500, // $25.00
      currency: "USD",
      metadata: {
        cart_id: "cart_test_456",
        email: "test2@example.com"
      },
      reference: {
        transaction: "cart_test_456",
        order: "cart_test_456"
      }
    }
  },
  {
    name: "Failed Payment - DECLINED",
    payload: {
      id: "chg_test_failed_123",
      status: "DECLINED",
      amount: 1000, // $10.00
      currency: "USD",
      metadata: {
        cart_id: "cart_test_failed",
        email: "test3@example.com"
      },
      reference: {
        transaction: "cart_test_failed",
        order: "cart_test_failed"
      }
    }
  }
]

async function testWebhook(payload, testName) {
  console.log(`\n🧪 Testing: ${testName}`)
  console.log(`📤 Sending payload:`, JSON.stringify(payload, null, 2))
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    
    const responseText = await response.text()
    let responseData
    
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = { raw: responseText }
    }
    
    console.log(`📥 Response Status: ${response.status}`)
    console.log(`📥 Response Body:`, JSON.stringify(responseData, null, 2))
    
    if (response.ok) {
      console.log(`✅ Webhook processed successfully`)
    } else {
      console.log(`❌ Webhook failed with status ${response.status}`)
    }
    
  } catch (error) {
    console.error(`❌ Error testing webhook:`, error.message)
  }
}

async function testPaymentStatus(cartId) {
  console.log(`\n🔍 Testing payment status for cart: ${cartId}`)
  
  try {
    const response = await fetch(`${BACKEND_URL}/store/tap/status?cart_id=${cartId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    const responseText = await response.text()
    let responseData
    
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = { raw: responseText }
    }
    
    console.log(`📥 Status Response:`, JSON.stringify(responseData, null, 2))
    
  } catch (error) {
    console.error(`❌ Error checking payment status:`, error.message)
  }
}

async function runTests() {
  console.log(`🚀 Starting Tap webhook tests`)
  console.log(`📍 Backend URL: ${BACKEND_URL}`)
  console.log(`📍 Webhook URL: ${WEBHOOK_URL}`)
  
  // Test each webhook payload
  for (const test of testPayloads) {
    await testWebhook(test.payload, test.name)
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // Test payment status for successful payments
  console.log(`\n🔍 Testing payment status endpoints...`)
  await testPaymentStatus("cart_test_123")
  await testPaymentStatus("cart_test_456")
  
  console.log(`\n✨ All tests completed!`)
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { testWebhook, testPaymentStatus } 