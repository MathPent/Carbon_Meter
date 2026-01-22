/**
 * CarBox AI Chatbot - Quick Test Script
 * 
 * Test the backend API endpoint directly
 */

const testCarBoxAI = async () => {
  const testQueries = [
    "What is carbon footprint?",
    "How to calculate CO2 emissions from transport?",
    "What are emission factors?",
    "Give me tips to reduce carbon footprint",
    "What's the weather today?" // Should be declined
  ];

  console.log('🧪 Testing CarBox AI Backend API\n');

  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"`);
    
    try {
      const response = await fetch('http://localhost:5000/api/carbox/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: query })
      });

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Response: ${data.response.substring(0, 150)}...`);
      } else {
        console.log(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
    }

    // Wait 2 seconds between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n\n✨ Test completed!');
};

// Run test (make sure backend is running first!)
testCarBoxAI();
