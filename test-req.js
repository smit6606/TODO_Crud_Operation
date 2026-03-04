const a = require('axios');
const FormData = require('form-data');
const form = new FormData();
form.append('name', 'Test User');
form.append('user_name', 'testuser123');
form.append('email', 'test@example.com');
form.append('phone_no', '1234567890');
form.append('password', 'Password@123');
form.append('confirmPassword', 'Password@123');
form.append('gender', 'male');

a.post('http://localhost:3000/api/auth/register', form, {
  headers: form.getHeaders(),
}).then(res => console.log(res.data)).catch(err => console.error(err.response?.data || err.message));
