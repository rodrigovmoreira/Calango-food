import fs from 'fs';

let content = fs.readFileSync('packages/backend/src/controllers/ProductController.js', 'utf8');

if (!content.includes('this.uploadImage = this.uploadImage.bind(this);')) {
  // Add constructor to bind the method
  content = content.replace(
    /class ProductController {/,
    `class ProductController {\n  constructor() {\n    this.uploadImage = this.uploadImage.bind(this);\n  }`
  );
  fs.writeFileSync('packages/backend/src/controllers/ProductController.js', content);
  console.log('Patched ProductController.js binding');
}
