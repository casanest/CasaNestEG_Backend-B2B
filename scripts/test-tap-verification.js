#!/usr/bin/env node

/**
 * Test script for Tap verification endpoint
 */

const fetch = require('node-fetch')

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const VERIFY_URL = `${BACKEND_URL}/store/tap/verify`

// Test data from the success URL
const testChargeId = "chg_TS07A1020250811Zo4e1208969"

async function testTapVerification() {
  console.log(`🚀 Testing Tap verification for charge: ${testChargeId}`)
  console.log(`📍 Backend URL: ${BACKEND_URL}`)
  console.log(`📍 Verify URL: ${VERIFY_URL}`)
  
  try {
    // Test the verification endpoint
    console.log(`\n🧪 Testing Tap verification endpoint...`)
    
    const response = await fetch(`${VERIFY_URL}?charge_id=${testChargeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    })
    
    const result = await response.json()
    
    console.log(`📥 Response Status: ${response.status}`)
    console.log(`📥 Response Body:`, JSON.stringify(result, null, 2))
    
    if (response.ok) {
      if (result.success) {
        console.log(`✅ Tap verification successful!`)
        console.log(`📊 Payment Status: ${result.status}`)
        console.log(`💰 Amount: ${result.amount} ${result.currency}`)
        console.log(`✅ Is Successful: ${result.is_successful}`)
        console.log(`⏳ Is Pending: ${result.is_pending}`)
        console.log(`❌ Is Failed: ${result.is_failed}`)
      } else {
        console.log(`⚠️ Tap verification returned success: false`)
      }
    } else {
      console.log(`❌ Tap verification failed with status ${response.status}`)
      
      if (result.error === "Tap configuration missing") {
        console.log(`\n🔧 Configuration Issue: TAP_SECRET_KEY environment variable is not set`)
        console.log(`Please set TAP_SECRET_KEY in your environment variables`)
      }
    }
    
  } catch (error) {
    console.error(`❌ Error testing Tap verification:`, error.message)
  }
  
  console.log(`\n✨ Test completed!`)
}

// Run the test
testTapVerification().catch(console.error) 