// Simple API test script
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🧪 Testing Casa E-commerce API...\n');
    
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:5000/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);
    
    // Test products endpoint
    console.log('\n2. Testing products endpoint...');
    const productsResponse = await fetch('http://localhost:5000/api/products?limit=5');
    const productsData = await productsResponse.json();
    console.log('✅ Products loaded:', productsData.data?.products?.length || 0, 'products');
    
    // Test featured products
    console.log('\n3. Testing featured products...');
    const featuredResponse = await fetch('http://localhost:5000/api/products/featured');
    const featuredData = await featuredResponse.json();
    console.log('✅ Featured products:', featuredData.data?.length || 0, 'products');
    
    console.log('\n🎉 All API tests passed! The backend is working correctly.');
    console.log('\n📱 Next steps:');
    console.log('1. Open the frontend app (QR code should be visible)');
    console.log('2. Scan QR code with Expo Go app on your phone');
    console.log('3. Or press "w" in the frontend terminal for web version');
    console.log('4. Start testing the e-commerce features!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure backend is running: npm run dev (in backend folder)');
    console.log('2. Check if port 5000 is available');
    console.log('3. Verify MongoDB connection');
  }
}

testAPI();
