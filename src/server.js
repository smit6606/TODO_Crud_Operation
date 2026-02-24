require("dotenv").config();
const express = require("express");
const app = express();

const connectDB = require("./config/database");
const PORT = process.env.PORT;

async function startServer() {
  await connectDB();
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', require('./routes/index.js'))

app.listen(PORT, (error) => {
  if (error) {
    console.log("The Server is not started");
    return;
  }
  console.log(`The Server is started on port: ${PORT}`);
});

startServer();
