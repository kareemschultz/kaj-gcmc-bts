#!/usr/bin/env node
import { execSync } from 'child_process';

console.log('🔍 GCMC-KAJ Platform Status Test\n');

// Test backend connectivity
console.log('1. Testing backend connectivity...');
try {
    const backendResponse = execSync('curl -s http://localhost:3003/health', { encoding: 'utf-8' });
    console.log('✅ Backend health:', backendResponse.trim());
} catch (error) {
    console.log('❌ Backend health check failed:', error.message);
}

// Test frontend connectivity
console.log('\n2. Testing frontend connectivity...');
try {
    const frontendResponse = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001', { encoding: 'utf-8' });
    console.log('✅ Frontend status code:', frontendResponse.trim());
} catch (error) {
    console.log('❌ Frontend connectivity failed:', error.message);
}

// Test login page
console.log('\n3. Testing login page...');
try {
    const loginResponse = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/login', { encoding: 'utf-8' });
    console.log('✅ Login page status code:', loginResponse.trim());
} catch (error) {
    console.log('❌ Login page test failed:', error.message);
}

// Test auth API
console.log('\n4. Testing auth API...');
try {
    const authResponse = execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/api/auth/session', { encoding: 'utf-8' });
    console.log('✅ Auth API status code:', authResponse.trim());
} catch (error) {
    console.log('❌ Auth API test failed:', error.message);
}

// Test database connectivity
console.log('\n5. Testing database connectivity...');
try {
    const dbResponse = execSync('docker exec gcmc-kaj-postgres pg_isready -U postgres', { encoding: 'utf-8' });
    console.log('✅ Database status:', dbResponse.trim());
} catch (error) {
    console.log('❌ Database connectivity failed:', error.message);
}

// Test Redis connectivity
console.log('\n6. Testing cache connectivity...');
try {
    const redisResponse = execSync('docker exec gcmc-kaj-redis redis-cli ping', { encoding: 'utf-8' });
    console.log('✅ Cache status:', redisResponse.trim());
} catch (error) {
    console.log('❌ Cache connectivity failed:', error.message);
}

console.log('\n🎉 Platform status check completed!');