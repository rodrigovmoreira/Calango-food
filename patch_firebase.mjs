import fs from 'fs';

let content = fs.readFileSync('packages/backend/src/config/firebase.js', 'utf8');

// The `storageBucket` needs to be provided.
// As a fallback if the env var isn't loaded correctly when imported, let's inject a safe fallback or allow the env var to be loaded properly in index.js BEFORE importing config/firebase.js

content = content.replace(
  /storageBucket: process.env.FIREBASE_BUCKET_URL/,
  `storageBucket: process.env.FIREBASE_BUCKET_URL || 'calango-food.appspot.com'`
);

fs.writeFileSync('packages/backend/src/config/firebase.js', content);
console.log('Patched firebase.js');
