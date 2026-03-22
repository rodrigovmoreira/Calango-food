const fs = require('fs');
const file = 'packages/frontend/src/pages/MenuPages.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add search input
if (!content.includes('const [searchTerm, setSearchTerm]')) {
  content = content.replace(
    'const [products, setProducts] = useState([]);',
    'const [products, setProducts] = useState([]);\n  const [searchTerm, setSearchTerm] = useState("");'
  );

  content = content.replace(
    'import { \n  Box, Flex, Heading, Text, VStack, SimpleGrid, Container, \n  Badge, Button, Image, Icon, HStack, Spinner, Center\n} from \'@chakra-ui/react\';',
    'import { \n  Box, Flex, Heading, Text, VStack, SimpleGrid, Container, \n  Badge, Button, Image, Icon, HStack, Spinner, Center, Input\n} from \'@chakra-ui/react\';'
  );

  // Filter products by search term before grouping
  content = content.replace(
    'const orderedCategories = useMemo(() => {\n    const allCategoryNames = [...new Set(products.map(p => p.category).filter(Boolean))];',
    'const filteredProducts = useMemo(() => {\n    if (!searchTerm) return products;\n    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));\n  }, [products, searchTerm]);\n\n  const orderedCategories = useMemo(() => {\n    const allCategoryNames = [...new Set(filteredProducts.map(p => p.category).filter(Boolean))];'
  );

  content = content.replace(
    'orderedCategories.map((cat, index) =>',
    'orderedCategories.map((cat, index) =>' // Just a marker
  );

  // replace products.filter(p => p.category === cat) with filteredProducts
  content = content.replace(
    'products.filter(p => p.category === cat).map(product => (',
    'filteredProducts.filter(p => p.category === cat).map(product => ('
  );

  // Add the input UI
  content = content.replace(
    '<VStack gap={10} align="stretch">',
    '<VStack gap={10} align="stretch">\n            {/* BARRA DE BUSCA */}\n            <Input\n              size="lg"\n              placeholder="Buscar produtos..."\n              value={searchTerm}\n              onChange={(e) => setSearchTerm(e.target.value)}\n              bg="gray.50"\n              borderRadius="xl"\n              boxShadow="sm"\n            />'
  );
}

// 2. Ensure product images don't cause horizontal overflow
content = content.replace(
  'boxSize={{ base: "90px", md: "110px" }} \n                            objectFit="cover"',
  'boxSize={{ base: "90px", md: "110px" }} \n                            maxW="100%"\n                            objectFit="cover"'
);

fs.writeFileSync(file, content);
