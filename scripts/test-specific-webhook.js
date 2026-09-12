#!/usr/bin/env node

/**
 * Test script for specific webhook processing
 */

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const TEST_WEBHOOK_URL = `${BACKEND_URL}/store/tap/test-webhook`
const STATUS_URL = `${BACKEND_URL}/store/tap/status`
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY || ""

// Updated test data from the new success URL
const testData = { 
  cart_id: "cart_01K276F3S4VP274WQXZ3TNMVTW", 
  charge_id: "chg_TS04A5520250838Ti541208655", 
  status: "CAPTURED", 
  amount: 5000, 
  currency: "USD" 
}

async function testSpecificWebhook() {
  console.log(`🚀 Testing specific webhook for cart: ${testData.cart_id}`)
  console.log(`📍 Test webhook URL: ${TEST_WEBHOOK_URL}`)
  console.log(`📍 Status URL: ${STATUS_URL}`)
  console.log(`💳 New Charge ID: ${testData.charge_id}`)
  
  try {
    console.log(`\n🧪 Step 1: Triggering test webhook...`)
    const webhookResponse = await fetch(TEST_WEBHOOK_URL, { 
      method: 'POST', 
      headers: { 
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY
      }, 
      body: JSON.stringify(testData) 
    })
    const webhookResult = await webhookResponse.json()
    
    if (webhookResponse.ok) { 
      console.log(`✅ Webhook triggered successfully:`)
      console.log(JSON.stringify(webhookResult, null, 2)) 
    } else { 
      console.log(`❌ Webhook failed:`)
      console.log(JSON.stringify(webhookResult, null, 2))
      return 
    }
    
    console.log(`\n⏳ Waiting for webhook processing...`)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log(`\n🔍 Step 2: Checking payment status...`)
    const statusResponse = await fetch(`${STATUS_URL}?cart_id=${testData.cart_id}`, { 
      method: 'GET', 
      headers: { 
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY
      } 
    })
    const statusResult = await statusResponse.json()
    
    if (statusResponse.ok) { 
      console.log(`✅ Payment status retrieved:`)
      console.log(JSON.stringify(statusResult, null, 2)) 
    } else { 
      console.log(`❌ Failed to get payment status:`)
      console.log(JSON.stringify(statusResult, null, 2)) 
    }
    
    console.log(`\n🔍 Step 3: Checking for order creation...`)
    const orderResponse = await fetch(`${BACKEND_URL}/store/orders?cart_id=${testData.cart_id}`, { 
      method: 'GET', 
      headers: { 
        'Content-Type': 'application/json',
        'x-publishable-api-key': PUBLISHABLE_KEY
      } 
    })
    
    if (orderResponse.ok) { 
      const orderResult = await orderResponse.json()
      if (orderResult.orders && orderResult.orders.length > 0) { 
        console.log(`✅ Order found:`)
        console.log(JSON.stringify(orderResult.orders[0], null, 2)) 
      } else { 
        console.log(`⚠️ No orders found for cart ${testData.cart_id}`) 
      } 
    } else { 
      console.log(`❌ Failed to check orders: ${orderResponse.status}`) 
    }
    
  } catch (error) { 
    console.error(`❌ Error during testing:`, error.message) 
  }
  console.log(`\n✨ Test completed!`)
}

testSpecificWebhook().catch(console.error) 