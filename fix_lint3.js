const fs = require('fs');
const file = 'packages/frontend/src/pages/MenuPages.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '  const orderedCategories = useMemo(() => {\n    const allCategoryNames = [...new Set(filteredProducts.map(p => p.category).filter(Boolean))];\n    return [\n      ...categoryOrder.filter(c => allCategoryNames.includes(c)), // Categorias com ordem definida\n      ...allCategoryNames.filter(c => !categoryOrder.includes(c)), // Sem ordem: no final\n    ];\n  }, [products, categoryOrder]);',
  '  const orderedCategories = useMemo(() => {\n    const allCategoryNames = [...new Set(filteredProducts.map(p => p.category).filter(Boolean))];\n    return [\n      ...categoryOrder.filter(c => allCategoryNames.includes(c)), // Categorias com ordem definida\n      ...allCategoryNames.filter(c => !categoryOrder.includes(c)), // Sem ordem: no final\n    ];\n  }, [filteredProducts, categoryOrder]);'
);

fs.writeFileSync(file, content);
