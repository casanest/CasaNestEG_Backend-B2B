#!/usr/bin/env node

/**
 * Test script to debug Tap API endpoints
 */

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY || ""

// Test data from the success URL
const testData = {
  cart_id: "cart_01K276F3S4VP274WQXZ3TNMVTW",
  charge_id: "chg_TS04A5520250838Ti541208655",
  status: "CAPTURED",
  amount: 5000,
  currency: "USD"
}

async function testTapApiEndpoints() {
  console.log(`🚀 Testing Tap API Endpoints`)
  console.log(`📍 Backend URL: ${BACKEND_URL}`)
  console.log(`💳 Test Charge ID: ${testData.charge_id}`)
  
  try {
    // Test the improved verify endpoint
    console.log(`\n🧪 Testing improved Tap verify endpoint...`)
    
    const verifyResponse = await fetch(`${BACKEND_URL}/store/tap/verify?charge_id=${testData.charge_id}`, {
      method: 'GET',
      headers: {
        'x-publishable-api-key': PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
      }
    })
    
    const verifyResult = await verifyResponse.json()
    
    console.log(`📥 Response Status: ${verifyResponse.status}`)
    console.log(`📥 Response Body:`, JSON.stringify(verifyResult, null, 2))
    
    if (verifyResponse.ok) {
      if (verifyResult.success) {
        console.log(`✅ Tap verification successful!`)
        console.log(`📊 Payment Status: ${verifyResult.status}`)
        console.log(`💰 Amount: ${verifyResult.amount} ${verifyResult.currency}`)
        console.log(`✅ Is Successful: ${verifyResult.is_successful}`)
        console.log(`🔍 Verified via: ${verifyResult.verified_via}`)
      } else {
        console.log(`⚠️ Tap verification returned success: false`)
      }
    } else {
      console.log(`❌ Tap verification failed with status ${verifyResponse.status}`)
      
      if (verifyResult.details) {
        console.log(`\n🔍 Debug Details:`)
        console.log(`   - Attempted endpoints: ${verifyResult.details.attempted_endpoints?.length || 0}`)
        console.log(`   - Last error:`, verifyResult.details.last_error)
        console.log(`   - Suggestions:`, verifyResult.details.suggestions)
      }
    }
    
  } catch (error) {
    console.error(`❌ Error testing Tap verification:`, error.message)
  }
  
  console.log(`\n✨ Test completed!`)
}

// Run the test
testTapApiEndpoints().catch(console.error) 