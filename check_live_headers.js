const axios = require('axios');
const FormData = require('form-data');

async function checkLiveEndpoint() {
  try {
    const form = new FormData();
    form.append('name', 'Test User ' + Date.now());
    form.append('user_name', 'testuser_' + Date.now());
    form.append('email', `test${Date.now()}@test.com`);
    form.append('phone_no', '9999999999');
    form.append('password', 'Pass@1234');
    form.append('confirmPassword', 'Pass@1234');
    form.append('gender', 'male');

    console.log("Sending POST to https://todo-crud-operation.onrender.com/api/auth/register");
    const response = await axios.post('https://todo-crud-operation.onrender.com/api/auth/register', form, {
      headers: {
        ...form.getHeaders()
      }
    });
    
    console.log(`STATUS: ${response.status}`);
    console.log(`HEADERS: ${JSON.stringify(response.headers, null, 2)}`);
    console.log(`DATA: ${JSON.stringify(response.data, null, 2)}`);
  } catch (error) {
    console.log(`ERROR STATUS: ${error.response?.status}`);
    console.log(`ERROR HEADERS: ${JSON.stringify(error.response?.headers, null, 2)}`);
    console.log(`ERROR DATA: ${JSON.stringify(error.response?.data, null, 2)}`);
    console.log(`ERROR MESSAGE: ${error.message}`);
  }
}

checkLiveEndpoint();
