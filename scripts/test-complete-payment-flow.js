#!/usr/bin/env node

/**
 * Comprehensive test script for the complete payment flow
 */

const fetch = require('node-fetch')

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8000'

// Test data from the new success URL
const testData = {
  cart_id: "cart_01K276F3S4VP274WQXZ3TNMVTW",
  charge_id: "chg_TS04A5520250838Ti541208655",
  status: "CAPTURED",
  amount: 5000,
  currency: "USD"
}

async function testCompletePaymentFlow() {
  console.log(`🚀 Testing Complete Payment Flow`)
  console.log(`📍 Backend URL: ${BACKEND_URL}`)
  console.log(`📍 Frontend URL: ${FRONTEND_URL}`)
  console.log(`📦 Test Cart: ${testData.cart_id}`)
  console.log(`💳 Test Charge: ${testData.charge_id}`)
  
  try {
    // Step 1: Test webhook processing
    console.log(`\n🧪 Step 1: Testing webhook processing...`)
    
    const webhookResponse = await fetch(`${BACKEND_URL}/store/tap/test-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    if (webhookResponse.ok) {
      const webhookResult = await webhookResponse.json()
      console.log(`✅ Webhook processed successfully:`)
      console.log(`   - Order ID: ${webhookResult.result?.order_id || 'Not created'}`)
      console.log(`   - Status: ${webhookResult.result?.status || 'Unknown'}`)
    } else {
      console.log(`❌ Webhook failed: ${webhookResponse.status}`)
      const errorText = await webhookResponse.text()
      console.log(`   Error: ${errorText}`)
    }
    
    // Wait for processing
    console.log(`\n⏳ Waiting for webhook processing...`)
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Step 2: Test payment status endpoint
    console.log(`\n🔍 Step 2: Testing payment status endpoint...`)
    
    const statusResponse = await fetch(`${BACKEND_URL}/store/tap/status?cart_id=${testData.cart_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (statusResponse.ok) {
      const statusResult = await statusResponse.json()
      console.log(`✅ Payment status retrieved:`)
      console.log(`   - Status: ${statusResult.payment_status}`)
      console.log(`   - Successful: ${statusResult.is_successful}`)
      console.log(`   - Order ID: ${statusResult.order_id || 'Not found'}`)
    } else {
      console.log(`❌ Status check failed: ${statusResponse.status}`)
      const errorText = await statusResponse.text()
      console.log(`   Error: ${errorText}`)
    }
    
    // Step 3: Test Tap verification
    console.log(`\n🔍 Step 3: Testing Tap verification...`)
    
    const verifyResponse = await fetch(`${BACKEND_URL}/store/tap/verify?charge_id=${testData.charge_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (verifyResponse.ok) {
      const verifyResult = await verifyResponse.json()
      console.log(`✅ Tap verification successful:`)
      console.log(`   - Status: ${verifyResult.status}`)
      console.log(`   - Amount: ${verifyResult.amount} ${verifyResult.currency}`)
      console.log(`   - Verified at: ${verifyResult.verified_at}`)
    } else {
      console.log(`❌ Tap verification failed: ${verifyResponse.status}`)
      const errorText = await verifyResponse.text()
      console.log(`   Error: ${errorText}`)
    }
    
    // Step 4: Test frontend status endpoint
    console.log(`\n🔍 Step 4: Testing frontend status endpoint...`)
    
    const frontendStatusResponse = await fetch(`${FRONTEND_URL}/api/store/tap/status?cart_id=${testData.cart_id}&charge_id=${testData.charge_id}`)
    
    if (frontendStatusResponse.ok) {
      const frontendStatusResult = await frontendStatusResponse.json()
      console.log(`✅ Frontend status retrieved:`)
      console.log(`   - Status: ${frontendStatusResult.payment_status}`)
      console.log(`   - Successful: ${frontendStatusResult.is_successful}`)
      console.log(`   - Verified with Tap: ${frontendStatusResult.verified_with_tap || false}`)
    } else {
      console.log(`❌ Frontend status failed: ${frontendStatusResponse.status}`)
      const errorText = await frontendStatusResponse.text()
      console.log(`   Error: ${errorText}`)
    }
    
    // Step 5: Check if order was created
    console.log(`\n🔍 Step 5: Checking order creation...`)
    
    const orderResponse = await fetch(`${BACKEND_URL}/store/orders?cart_id=${testData.cart_id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    if (orderResponse.ok) {
      const orderResult = await orderResponse.json()
      if (orderResult.orders && orderResult.orders.length > 0) {
        const order = orderResult.orders[0]
        console.log(`✅ Order found:`)
        console.log(`   - Order ID: ${order.id}`)
        console.log(`   - Display ID: ${order.display_id}`)
        console.log(`   - Status: ${order.status}`)
        console.log(`   - Total: ${order.total} ${order.currency_code}`)
      } else {
        console.log(`⚠️ No orders found for cart ${testData.cart_id}`)
      }
    } else {
      console.log(`❌ Order check failed: ${orderResponse.status}`)
    }
    
  } catch (error) {
    console.error(`❌ Error during testing:`, error.message)
  }
  
  console.log(`\n✨ Complete payment flow test finished!`)
}

// Run the test
testCompletePaymentFlow().catch(console.error) 