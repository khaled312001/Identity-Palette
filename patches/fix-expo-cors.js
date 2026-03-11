const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'node_modules', 'expo', 'node_modules', '@expo', 'cli', 'build', 'src', 'start', 'server', 'middleware', 'CorsMiddleware.js');
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes('isReplitDev')) {
    content = content.replace(
      "const isAllowedHost = allowedHosts.includes(host) || isLocalhost;",
      "const isReplitDev = hostname.endsWith('.replit.dev') || hostname.endsWith('.replit.app');\n            const isAllowedHost = allowedHosts.includes(host) || isLocalhost || isReplitDev;"
    );
    fs.writeFileSync(file, content);
    console.log('Patched Expo CorsMiddleware for Replit domains');
  } else {
    console.log('Expo CorsMiddleware already patched');
  }
} else {
  console.log('CorsMiddleware.js not found, skipping patch');
}
