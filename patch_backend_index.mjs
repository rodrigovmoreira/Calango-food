import fs from 'fs';

let content = fs.readFileSync('packages/backend/src/index.js', 'utf8');

if (!content.includes('/api/products/upload')) {
  content = content.replace(
    /app.post\('\/api\/products',\s*protect,\s*productController.createProduct\);/,
    `app.post('/api/products', protect, productController.createProduct);
app.post('/api/products/upload', protect, productController.uploadImage);`
  );
  fs.writeFileSync('packages/backend/src/index.js', content);
  console.log('Patched index.js to include upload route');
}
