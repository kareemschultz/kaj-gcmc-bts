const bcrypt = require('bcryptjs');

async function createAdminUser() {
  console.log('🔧 Creating admin user for testing...');

  const adminEmail = 'admin@test.gcmc.com';
  const adminPassword = 'TestPassword123!';

  // Hash the password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  console.log(`📧 Admin email: ${adminEmail}`);
  console.log(`🔑 Admin password: ${adminPassword}`);
  console.log(`🔒 Hashed password: ${hashedPassword}`);

  // Try to connect to database using a simple fetch to the API
  try {
    const response = await fetch('http://localhost:3003/health');
    const health = await response.json();
    console.log('🏥 Server health:', health);

    // Test auth endpoint
    const authResponse = await fetch('http://localhost:3003/api/auth/get-session');
    console.log('🔐 Auth endpoint status:', authResponse.status);

  } catch (error) {
    console.error('❌ Server connection error:', error.message);
  }
}

createAdminUser();