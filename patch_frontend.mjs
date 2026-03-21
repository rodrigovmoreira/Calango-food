import fs from 'fs';

// Patch api.js
let apiContent = fs.readFileSync('packages/frontend/src/services/api.js', 'utf8');
if (!apiContent.includes('uploadImage')) {
  apiContent = apiContent.replace(
    /createProduct:\s*\(data\)\s*=>\s*api\.post\('\/api\/products',\s*data\),/,
    `createProduct: (data) => api.post('/api/products', data),
  uploadImage: (formData) => api.post('/api/products/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),`
  );
  fs.writeFileSync('packages/frontend/src/services/api.js', apiContent);
  console.log('Patched api.js');
}

// Patch Products.jsx
let productsContent = fs.readFileSync('packages/frontend/src/pages/Products.jsx', 'utf8');
if (!productsContent.includes('handleImageUpload')) {
  // Add UploadCloud icon import
  productsContent = productsContent.replace(
    /import \{ Edit2, Trash2, Plus, GripVertical \} from 'lucide-react';/,
    "import { Edit2, Trash2, Plus, GripVertical, UploadCloud } from 'lucide-react';"
  );

  // Add loading state and handler
  productsContent = productsContent.replace(
    /const \[isAvailable, setIsAvailable\] = useState\(true\);/,
    `const [isAvailable, setIsAvailable] = useState(true);
  const [uploading, setUploading] = useState(false);`
  );

  productsContent = productsContent.replace(
    /const handleSave = async \(\) => \{/,
    `const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    try {
      const { data } = await foodAPI.uploadImage(formData);
      setImageUrl(data.imageUrl);
      toaster.create({ title: "Imagem carregada com sucesso", type: "success" });
    } catch (err) {
      toaster.create({ title: "Erro ao carregar imagem", description: err.message, type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {`
  );

  // Replace input with upload UI
  productsContent = productsContent.replace(
    /<Field label="URL da Imagem de Capa \(Opcional\)">\s*<Input placeholder="https:\/\/..." value=\{imageUrl\} onChange=\{\(e\) => setImageUrl\(e.target.value\)\} bg="white" \/>\s*<\/Field>/,
    `<Field label="Imagem do Produto (Opcional)">
                    <HStack gap={4} align="center">
                      <Box flex={1}>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          display="none"
                          id="image-upload"
                          disabled={uploading}
                        />
                        <label htmlFor="image-upload">
                          <Button
                            as="span"
                            variant="outline"
                            w="full"
                            justifyContent="flex-start"
                            color="gray.600"
                            loading={uploading}
                          >
                            <UploadCloud size={18} style={{ marginRight: '8px' }} />
                            {uploading ? 'Enviando...' : (imageUrl ? 'Alterar Imagem' : 'Escolher Imagem')}
                          </Button>
                        </label>
                      </Box>
                      {imageUrl && (
                        <Box w="60px" h="60px" borderRadius="md" overflow="hidden" flexShrink={0} border="1px solid" borderColor="gray.200">
                          <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </Box>
                      )}
                    </HStack>
                  </Field>`
  );
  fs.writeFileSync('packages/frontend/src/pages/Products.jsx', productsContent);
  console.log('Patched Products.jsx');
}
