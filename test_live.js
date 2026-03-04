const axios = require('axios');
const FormData = require('form-data');

async function testLive() {
  try {
    const form = new FormData();
    form.append('name', 'Test Live API');
    form.append('user_name', `liveuser_${Date.now()}`);
    form.append('email', `live_${Date.now()}@example.com`);
    form.append('phone_no', Math.floor(1000000000 + Math.random() * 9000000000).toString());
    form.append('password', 'Password@123');
    form.append('confirmPassword', 'Password@123');
    form.append('gender', 'male');

    console.log("Testing live API...");
    const res = await axios.post('https://todo-crud-operation.onrender.com/api/auth/register', form, {
      headers: form.getHeaders(),
    });
    console.log("SUCCESS:", res.data);
  } catch (err) {
    console.error("FAILED:", err.response?.data || err.message);
  }
}
testLive();
