import fs from 'fs';
fs.writeFileSync('/tmp/dump.js', fs.readFileSync('services/supabaseService.ts', 'utf8'));
