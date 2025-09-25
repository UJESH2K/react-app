// Environment setup script for frontend
const fs = require('fs');
const path = require('path');

// Create .env file for frontend
const envContent = `# Frontend Environment Variables
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_APP_NAME=Casa E-commerce
EXPO_PUBLIC_APP_VERSION=1.0.0
`;

const envPath = path.join(__dirname, '.env');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Frontend .env file created successfully!');
  console.log('📝 Environment variables:');
  console.log('   - EXPO_PUBLIC_API_URL: http://localhost:5000/api');
  console.log('   - EXPO_PUBLIC_APP_NAME: Casa E-commerce');
  console.log('   - EXPO_PUBLIC_APP_VERSION: 1.0.0');
  console.log('\n🚀 You can now start the frontend with: npm start');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
}
