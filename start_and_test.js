const { spawn, execSync } = require('child_process');

console.log("Starting server...");
const server = spawn('node', ['src/server.js']);

server.stdout.on('data', (data) => console.log(`[Server] ${data}`));
server.stderr.on('data', (data) => console.error(`[Server Error] ${data}`));

setTimeout(() => {
  console.log("Running tests...");
  try {
    execSync('node test_apis.js', { stdio: 'inherit' });
  } catch (err) {
    console.error("Test failed", err);
  }
  server.kill();
  process.exit(0);
}, 6000);
