// Script to start both backend and frontend
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Casa E-commerce App...\n');

// Start backend
console.log('1. Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'pipe',
  shell: true
});

backend.stdout.on('data', (data) => {
  const output = data.toString();
  if (output.includes('Casa E-commerce API running')) {
    console.log('✅ Backend started successfully on port 5000');
    console.log('2. Starting frontend...');
    
    // Start frontend after backend is ready
    const frontend = spawn('npm', ['start'], {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'pipe',
      shell: true
    });
    
    frontend.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Metro waiting')) {
        console.log('✅ Frontend started successfully');
        console.log('\n🎉 Both servers are running!');
        console.log('📱 Scan the QR code with Expo Go app');
        console.log('🌐 Or press "w" for web version');
        console.log('\n📋 Available URLs:');
        console.log('   - Backend API: http://localhost:5000');
        console.log('   - Frontend Web: http://localhost:8081');
        console.log('   - Health Check: http://localhost:5000/health');
      }
    });
    
    frontend.stderr.on('data', (data) => {
      console.error('Frontend error:', data.toString());
    });
  }
});

backend.stderr.on('data', (data) => {
  console.error('Backend error:', data.toString());
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down servers...');
  backend.kill();
  process.exit(0);
});
