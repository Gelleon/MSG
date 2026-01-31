const axios = require('axios');

const API_URL = 'http://localhost:4000';
const TEST_EMAIL = `test_${Date.now()}@example.com`;

async function testRegistration() {
  console.log('--- Starting Registration Integration Test ---');

  // 1. Valid Registration
  try {
    console.log(`\n1. Testing Valid Registration for ${TEST_EMAIL}...`);
    const response = await axios.post(`${API_URL}/auth/register`, {
      username: 'ignored_user',
      email: TEST_EMAIL,
      password: 'password123',
      name: 'Integration Test User'
    });
    console.log('✅ Success! User registered:', response.data);
  } catch (error) {
    console.error('❌ Failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }

  // 2. Duplicate Registration
  try {
    console.log(`\n2. Testing Duplicate Registration for ${TEST_EMAIL}...`);
    await axios.post(`${API_URL}/auth/register`, {
      username: 'ignored_user_2',
      email: TEST_EMAIL,
      password: 'password123',
      name: 'Duplicate User'
    });
    console.error('❌ Failed: Should have thrown an error for duplicate email');
    process.exit(1);
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.log('✅ Success! server returned 400 Bad Request as expected.');
      console.log('Error Message:', error.response.data.message);
    } else {
      console.error('❌ Failed: Unexpected error:', error.response ? error.response.data : error.message);
      process.exit(1);
    }
  }

  // 3. Extra Fields
  try {
    console.log(`\n3. Testing Registration with Extra Fields...`);
    const extraEmail = `extra_${Date.now()}@example.com`;
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: extraEmail,
      password: 'password123',
      name: 'Extra Fields User',
      unknownField: 'should_be_ignored',
      role: 'ADMIN' // Should be ignored/overwritten
    });
    console.log('✅ Success! User registered with extra fields ignored:', response.data);
    if (response.data.role !== 'CLIENT') {
        console.error('❌ Failed: Role injection was not prevented!');
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Failed:', error.response ? error.response.data : error.message);
    process.exit(1);
  }

  console.log('\n--- All Integration Tests Passed ---');
}

testRegistration();
