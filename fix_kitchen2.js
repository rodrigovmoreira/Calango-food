const fs = require('fs');
const file = 'packages/frontend/src/pages/Kitchen.jsx';
let content = fs.readFileSync(file, 'utf8');

// The kitchen layout uses Stack for header and SimpleGrid for the orders list which responds base 1, md 2, lg 3
// Card header might overflow if flex direction row
content = content.replace(
  '<Card.Header display="flex" justifyContent="space-between" flexDirection="row" alignItems="center">',
  '<Card.Header display="flex" justifyContent="space-between" flexDirection={{ base: "column", sm: "row" }} alignItems={{ base: "flex-start", sm: "center" }} gap={2}>'
);

fs.writeFileSync(file, content);
