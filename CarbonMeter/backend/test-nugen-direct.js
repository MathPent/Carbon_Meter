// Quick test to check Nugen API
const fetch = require('node-fetch');

const NUGEN_API_KEY = 'nugen-mRhGbSOhv2xizroIw0Zh9g';
const NUGEN_API_ENDPOINT = 'https://api.nugen.in/api/v3/agents/run-agents/carbox_ai/run/';

async function testNugenAPI() {
  console.log('🧪 Testing Nugen API...');
  console.log('Endpoint:', NUGEN_API_ENDPOINT);
  
  try {
    const response = await fetch(NUGEN_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NUGEN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'What is carbon footprint?'
      })
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', JSON.stringify([...response.headers.entries()]));

    const text = await response.text();
    console.log('Response Text:', text);

    try {
      const json = JSON.parse(text);
      console.log('Response JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Not valid JSON');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testNugenAPI();
