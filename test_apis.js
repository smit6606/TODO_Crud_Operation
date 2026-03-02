const http = require('http');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function makeRequest(path, method, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: process.env.PORT || 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers
      }
    };

    const req = http.request(options, res => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(responseBody) });
        } catch (e) {
          resolve({ status: res.statusCode, body: responseBody });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log("Starting API Tests...\n");

  const testUser = {
    name: "Test User",
    user_name: `user${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    phone_no: Math.floor(1000000000 + Math.random() * 9000000000).toString(),
    password: "Password@123",
    gender: "male"
  };

  console.log(`[1] Registering user (${testUser.user_name})`);
  let res = await makeRequest('/api/auth/register', 'POST', testUser);
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.body, null, 2));
  if (res.status !== 201) return console.log("Failed to register. Aborting.");

  console.log(`\n[2] Login user`);
  res = await makeRequest('/api/auth/login', 'POST', {
    email: testUser.email,
    password: "Password@123"
  });
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.body, null, 2));
  if (res.status !== 200) return console.log("Failed to login. Aborting.");
  
  const authToken = res.body.data.token;

  console.log(`\n[3] Forgot Password - Send OTP via Email`);
  res = await makeRequest('/api/auth/forgot-password/send-otp', 'POST', {
    user_name: testUser.user_name,
    email: testUser.email,
    phone_no: testUser.phone_no,
    sendMethod: "email"
  });
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.body, null, 2));
  if (res.status !== 200) return console.log("Failed to send OTP. Aborting.");

  console.log(`\n[3.1] Fetching OTP directly from DB...`);
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  const [rows] = await connection.execute(`SELECT reset_password_otp FROM User WHERE email = ?`, [testUser.email]);
  
  if (rows.length === 0 || !rows[0].reset_password_otp) {
     console.log("Failed to find OTP in database. Aborting.");
     await connection.end();
     return;
  }
  
  const otp = rows[0].reset_password_otp;
  console.log(`Got OTP from DB: ${otp}`);

  console.log(`\n[4] Forgot Password - Verify OTP`);
  res = await makeRequest('/api/auth/forgot-password/verify-otp', 'POST', {
    user_name: testUser.user_name,
    otp: otp
  });
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.body, null, 2));
  if (res.status !== 200) {
      await connection.end();
      return console.log("Failed to verify OTP. Aborting.");
  }

  const resetToken = res.body.data?.resetToken;

  if (resetToken) {
    console.log(`\n[5] Forgot Password - Reset Password`);
    res = await makeRequest('/api/auth/forgot-password/reset-password', 'POST', {
      resetToken: resetToken,
      newPassword: "NewPassword@123"
    });
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(res.body, null, 2));
    if (res.status !== 200) {
      await connection.end();
      return console.log("Failed to reset password. Aborting.");
    }
  }

  console.log(`\n[6] Change Password (Requires Auth)`);
  res = await makeRequest('/api/auth/change-password', 'POST', {
    oldPassword: "NewPassword@123",
    newPassword: "ChangedPassword@123"
  }, { 'Authorization': `Bearer ${authToken}` });
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.body, null, 2));
  if (res.status !== 200) {
      await connection.end();
      return console.log("Failed to change password. Aborting.");
  }

  console.log(`\n[7] Confirm Login with Changed Password`);
  res = await makeRequest('/api/auth/login', 'POST', {
    email: testUser.email,
    password: "ChangedPassword@123"
  });
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(res.body, null, 2));

  await connection.end();
  console.log("\nAll tests completed successfully!");
}

runTests().catch(console.error);
