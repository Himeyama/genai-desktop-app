const fs = require('fs');
let c = fs.readFileSync('packages/web/.env.local', 'utf-8');

// replace the DEFAULT_MODEL
c = c.replace('DEFAULT_MODEL=ollama:', 'DEFAULT_MODEL=ollama/');

// replace VITE_APP_MODEL_IDS array entries
c = c.replace(/ollama:/g, 'ollama/');
c = c.replace(/anthropic:/g, 'anthropic/');
c = c.replace(/openai:/g, 'openai/');
c = c.replace(/xai:/g, 'xai/');
c = c.replace(/openrouter:/g, 'openrouter/');

fs.writeFileSync('packages/web/.env.local', c, 'utf-8');
