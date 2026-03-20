// packages/frontend/src/pages/MenuPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Flex, Heading, Text, VStack, SimpleGrid, Container, 
  Badge, Button, Image, Icon, HStack, Spinner, Center
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { FaShoppingBasket, FaClock, FaExclamationCircle } from 'react-icons/fa';
import { isStoreOpen } from '../utils/dateUtils';
import { foodAPI } from '../services/api';
import { toaster } from "../components/ui/toaster";
import CartDrawer from '../components/CartDrawer';
import ProductModal from '../components/ProductModal';

export default function MenuPage() {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const removeFromCart = (cartId) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  // 1. BUSCA DE DADOS REAIS DO BACKEND 
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        // Rota pública que retorna dados da loja e produtos pelo slug
        const response = await foodAPI.getPublicMenu(slug); 
        
        const { store, menuItems } = response.data;
        setRestaurant(store);
        setProducts(menuItems);
        
        // Validação de horário em tempo real [cite: 24]
        setIsOpen(isStoreOpen(store.operatingHours));
      } catch (err) {
        toaster.create({
          title: "Erro ao carregar cardápio",
          description: "Verifique o link ou sua conexão.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchMenu();
  }, [slug]);

  const addToCart = (product) => {
    if (!isOpen) {
      toaster.create({
        title: "Loja Fechada",
        description: "Não estamos aceitando pedidos no momento.",
        type: "warning",
      });
      return;
    }
    setCart(prev => [...prev, { ...product, cartId: Date.now() + Math.random() }]);
  };

  const openProductModal = (product) => {
    if (!isOpen) {
      toaster.create({
        title: "Loja Fechada",
        description: "Não estamos aceitando pedidos no momento.",
        type: "warning",
      });
      return;
    }
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  const totalCart = cart.reduce((acc, item) => acc + item.price, 0);

  if (loading) return (
    <Center h="100vh"><Spinner size="xl" color="brand.500" /></Center>
  );

  if (!restaurant) return (
    <Center h="100vh">
      <VStack color="gray.500">
        <Icon as={FaExclamationCircle} boxSize="50px" />
        <Text fontSize="xl">Restaurante não encontrado.</Text>
      </VStack>
    </Center>
  );

  // Agrupamento por categoria dinâmico (Universal para qualquer restaurante) 
  const categories = [...new Set(products.map(p => p.category))];

  return (
    <Box minH="100vh" bg="gray.100" pb="120px">
      {/* HEADER DINÂMICO COM BRANDING DO TENANT  */}
      <Flex 
        h={{ base: "220px", md: "300px" }} 
        bgGradient="to-br"
        gradientFrom={restaurant.primaryColor || "brand.700"}
        gradientTo="brand.neon"
        justify="center" 
        align="center"
        color="white"
        textAlign="center"
        px={4}
        position="relative"
      >
        <VStack gap={3} position="relative" top="-20px">
          {restaurant.logoUrl && (
            <Image 
              src={restaurant.logoUrl} 
              h="90px" 
              w="90px" 
              objectFit="cover" 
              borderRadius="full" 
              mb={2} 
              border="4px solid rgba(255,255,255,0.2)"
              boxShadow="xl"
            />
          )}
          <Heading size="4xl" fontWeight="900" letterSpacing="tight" textShadow="0px 2px 10px rgba(0,0,0,0.3)">
            {restaurant.name}
          </Heading>
          <HStack bg="rgba(0,0,0,0.3)" backdropFilter="blur(5px)" px={5} py={1.5} borderRadius="full">
            <Icon as={FaClock} />
            <Text fontSize="sm" fontWeight="bold" letterSpacing="wide">
              {isOpen ? "LOJA ABERTA" : "LOJA FECHADA"}
            </Text>
          </HStack>
        </VStack>
      </Flex>

      <Container maxW="container.lg" mt={{ base: "-40px", md: "-60px" }} position="relative" zIndex={2}>
        <Box 
          bg="white" 
          p={{ base: 5, md: 10 }} 
          borderRadius="3xl" 
          boxShadow="0 20px 40px -10px rgba(0,0,0,0.08)"
          minH="50vh"
        >
          <VStack gap={10} align="stretch">
            {categories.map((cat, index) => (
              <Box key={cat}>
                <Heading 
                  size="xl" 
                  mb={6} 
                  color="gray.800" 
                  fontWeight="900"
                  letterSpacing="tight"
                  mt={index === 0 ? 0 : 8}
                >
                  {cat}
                </Heading>
                
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                  {products.filter(p => p.category === cat).map(product => (
                    <Flex 
                      key={product._id} 
                      p={5} 
                      bg="gray.50" 
                      borderRadius="2xl" 
                      border="1px solid" 
                      borderColor="gray.100"
                      _hover={{ 
                        borderColor: "brand.300", 
                        bg: "white",
                        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.12)", 
                        transform: "translateY(-4px)" 
                      }}
                      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                      align="center" 
                      gap={4}
                      cursor={product.isAvailable && isOpen ? "pointer" : "not-allowed"}
                      opacity={product.isAvailable ? 1 : 0.6}
                      onClick={() => { if(product.isAvailable && isOpen) openProductModal(product); }}
                      position="relative"
                      overflow="hidden"
                    >
                      <VStack align="start" gap={1} flex={1}>
                        <Text fontWeight="bold" fontSize="lg" color="gray.800" lineHeight="tight">
                          {product.name}
                        </Text>
                        <Text fontSize="sm" color="gray.500" noOfLines={2} lineHeight="short" mb={2}>
                          {product.description}
                        </Text>
                        <Text color="brand.600" fontWeight="900" fontSize="lg">
                          R$ {product.price.toFixed(2)}
                        </Text>
                      </VStack>
                      
                      <VStack align="end" gap={3}>
                        {product.imageUrl && (
                          <Image 
                            src={product.imageUrl} 
                            boxSize={{ base: "90px", md: "110px" }} 
                            objectFit="cover" 
                            borderRadius="xl" 
                            boxShadow="md"
                          />
                        )}
                        <Button 
                          size="xs" 
                          colorPalette="brand" 
                          borderRadius="full"
                          px={4}
                          py={4}
                          fontWeight="bold"
                          textTransform="uppercase"
                          letterSpacing="wider"
                          disabled={!isOpen || !product.isAvailable}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            if(product.isAvailable && isOpen) openProductModal(product); 
                          }}
                        >
                          {product.isAvailable ? 'Adicionar' : 'Esgotado'}
                        </Button>
                      </VStack>
                    </Flex>
                  ))}
                </SimpleGrid>
              </Box>
            ))}

            {categories.length === 0 && (
              <Center py={20}>
                <Text color="gray.400" fontSize="lg">Nenhum produto cadastrado nesta loja.</Text>
              </Center>
            )}
          </VStack>
        </Box>
      </Container>

      {/* FOOTER DA SACOLA (STICKY) COM GLASSMORPHISM */}
      {cart.length > 0 && (
        <Box 
          position="fixed" 
          bottom={0} 
          left="0" 
          w="100%" 
          px={4} 
          py={6}
          bgGradient="to-t"
          gradientFrom="rgba(255,255,255,0.9)"
          gradientTo="rgba(255,255,255,0)"
          zIndex={1000}
        >
          <Button 
            w="full" 
            maxW="container.md" 
            mx="auto"
            h="70px" 
            display="flex"
            colorPalette="brand" 
            boxShadow="0 10px 25px -5px rgba(0,0,0,0.3)"
            borderRadius="2xl"
            justifyContent="space-between"
            px={8}
            _hover={{ transform: 'translateY(-2px) scale(1.01)', boxShadow: "0 15px 35px -5px rgba(0,0,0,0.4)" }}
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
            onClick={() => setIsCartOpen(true)}
          >
            <HStack gap={4}>
              <Flex bg="whiteAlpha.300" p={2} borderRadius="full">
                <Icon as={FaShoppingBasket} boxSize="20px" />
              </Flex>
              <VStack align="start" gap={0}>
                <Text fontSize="xs" fontWeight="bold" opacity={0.9} textTransform="uppercase" letterSpacing="wide">
                  {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                </Text>
                <Text fontWeight="black" fontSize="lg">Ver Sacola</Text>
              </VStack>
            </HStack>
            <Text fontSize="2xl" fontWeight="black" letterSpacing="tight">R$ {totalCart.toFixed(2)}</Text>
          </Button>
        </Box>
      )}

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        removeFromCart={removeFromCart}
        total={totalCart}
        slug={slug}
        isStoreOpen={isOpen}
        restaurantName={restaurant.name}
      />

      <ProductModal 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        onAddToCart={addToCart}
      />
    </Box>
  );
}