// packages/frontend/src/pages/MenuPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Flex, Heading, Text, VStack, SimpleGrid, Container, 
  Badge, Button, Image, Icon, HStack, Spinner, Center, Input
} from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import { FaShoppingBasket, FaClock, FaExclamationCircle, FaHome, FaPercentage, FaUser } from 'react-icons/fa';
import { isStoreOpen } from '../utils/dateUtils';
import { foodAPI } from '../services/api';
import { toaster } from "../components/ui/toaster";
import CartDrawer from '../components/CartDrawer';
import ProductModal from '../components/ProductModal';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export default function MenuPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { state: { cart }, dispatch } = useApp();
  
  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPromotionsOnly, setShowPromotionsOnly] = useState(false);
  const [categoryOrder, setCategoryOrder] = useState([]); // Ordem definida pelo lojista
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeOrderId, setActiveOrderId] = useState(null);

  const removeFromCart = React.useCallback((cartId) => {
    dispatch({ type: 'SET_CART', payload: cart.filter(item => item.cartId !== cartId) });
  }, [cart, dispatch]);

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

        // Busca categorias públicas do tenant para respeitar a ordem definida pelo lojista
        try {
          const catResponse = await foodAPI.getPublicCategories(store.tenantId || store._id);
          setCategoryOrder(catResponse.data.map(c => c.name));
        } catch { /* Sem cats cadastradas, usa agrupamento simples */ }
        
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

    if (slug) {
      fetchMenu();
      
      // Verifica se tem pedido em andamento no localStorage
      const lastOrderId = localStorage.getItem('calango_last_order');
      const lastOrderTime = localStorage.getItem('calango_last_order_time');
      
      if (lastOrderId && lastOrderTime) {
        // Se passou de 24h, limpa o cache
        const hoursPassed = (Date.now() - parseInt(lastOrderTime)) / (1000 * 60 * 60);
        if (hoursPassed > 24) {
          localStorage.removeItem('calango_last_order');
          localStorage.removeItem('calango_last_order_time');
        } else {
          setActiveOrderId(lastOrderId);
        }
      }
    }
  }, [slug]);

  const addToCart = React.useCallback((product) => {
    if (!isOpen) {
      toaster.create({
        title: "Loja Fechada",
        description: "Não estamos aceitando pedidos no momento.",
        type: "warning",
      });
      return;
    }
    dispatch({ type: 'SET_CART', payload: [...cart, { ...product, cartId: Date.now() + Math.random() }] });
  }, [isOpen, cart, dispatch]);

  const openProductModal = React.useCallback((product) => {
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
  }, [isOpen]);

  const totalCart = useMemo(() => cart.reduce((acc, item) => acc + item.price, 0), [cart]);

  // Agrupamento por categoria respeitando a ordem do lojista
  const filteredProducts = useMemo(() => {
    let result = products;

    if (showPromotionsOnly) {
      result = result.filter(p => p.isPromo || (p.originalPrice && p.originalPrice > p.price));
    }

    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return result;
  }, [products, searchTerm, showPromotionsOnly]);

  const orderedCategories = useMemo(() => {
    const allCategoryNames = [...new Set(filteredProducts.map(p => p.category).filter(Boolean))];
    return [
      ...categoryOrder.filter(c => allCategoryNames.includes(c)), // Categorias com ordem definida
      ...allCategoryNames.filter(c => !categoryOrder.includes(c)), // Sem ordem: no final
    ];
  }, [filteredProducts, categoryOrder]);

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

  return (
    <Box minH="100vh" bg="gray.100" pb="120px">
      {/* HEADER DINÂMICO COM BRANDING DO TENANT  */}
      <Box position="relative" bg="white" pb={4} borderBottom="1px solid" borderColor="gray.200" boxShadow="sm">
        {/* Banner de Fundo (Capa) */}
        <Box
          h={{ base: "140px", md: "240px" }}
          w="100%"
          bg={restaurant.primaryColor || "brand.500"}
          backgroundImage={restaurant.coverImageUrl ? `url(${restaurant.coverImageUrl})` : "none"}
          backgroundSize="cover"
          backgroundPosition="center"
          position="relative"
        >
          <Box position="absolute" inset="0" bg="blackAlpha.300" />
        </Box>

        {/* Container Principal de Informações do Restaurante */}
        <Container maxW="container.lg" position="relative" zIndex={3}>
          <Flex
            direction={{ base: "column", md: "row" }}
            align={{ base: "center", md: "flex-end" }}
            justify="space-between"
            mt={{ base: "-45px", md: "-50px" }}
            px={{ base: 0, md: 4 }}
          >
            {/* Esquerda: Logo e Detalhes */}
            <Flex direction={{ base: "column", md: "row" }} align="center" gap={{ base: 3, md: 6 }}>
              {restaurant.logoUrl ? (
                <Image
                  src={restaurant.logoUrl}
                  h={{ base: "90px", md: "140px" }}
                  w={{ base: "90px", md: "140px" }}
                  objectFit="cover"
                  borderRadius="full"
                  border="4px solid white"
                  boxShadow="xl"
                  bg="white"
                  zIndex={2}
                />
              ) : (
                <Flex
                  h={{ base: "90px", md: "140px" }}
                  w={{ base: "90px", md: "140px" }}
                  bg="white"
                  borderRadius="full"
                  border="4px solid white"
                  boxShadow="xl"
                  align="center"
                  justify="center"
                  zIndex={2}
                >
                  <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                    {restaurant.name.charAt(0)}
                  </Text>
                </Flex>
              )}

              <VStack align={{ base: "center", md: "start" }} gap={1} mt={{ base: 0, md: 10 }}>
                <Heading size={{ base: "xl", md: "2xl" }} fontWeight="900" color={{ base: "gray.800", md: "gray.800" }} letterSpacing="tight">
                  {restaurant.name}
                </Heading>
                <HStack mt={1}>
                  <Badge colorPalette={isOpen ? "green" : "red"} variant="solid" px={3} py={1} borderRadius="full" fontSize="xs" fontWeight="bold">
                    <Flex align="center" gap={1}>
                      <Icon as={FaClock} />
                      {isOpen ? "LOJA ABERTA" : "LOJA FECHADA"}
                    </Flex>
                  </Badge>
                </HStack>
              </VStack>
            </Flex>

            {/* Direita: Botões Desktop */}
            <Flex
              display={{ base: "none", md: "flex" }}
              gap={3}
              mt={{ base: 0, md: 8 }}
            >
              <Button
                variant={!showPromotionsOnly ? "solid" : "subtle"}
                colorPalette="brand"
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setShowPromotionsOnly(false); }}
                borderRadius="full"
                size="sm"
                fontWeight="bold"
              >
                <Icon as={FaHome} mr={1} />
                Início
              </Button>
              <Button
                variant={showPromotionsOnly ? "solid" : "subtle"}
                colorPalette="brand"
                onClick={() => setShowPromotionsOnly(!showPromotionsOnly)}
                borderRadius="full"
                size="sm"
                fontWeight="bold"
              >
                <Icon as={FaPercentage} mr={1} />
                Promoções
              </Button>
              <Button
                variant={activeOrderId ? "solid" : "subtle"}
                colorPalette={activeOrderId ? "orange" : "brand"}
                onClick={() => {
                  if (activeOrderId) {
                    navigate(`/pedido/${activeOrderId}`, { state: { restaurantName: restaurant.name, slug } });
                  } else {
                    toaster.create({ title: "Nenhum pedido", description: "Faça login para ver seu histórico.", type: "info" });
                  }
                }}
                borderRadius="full"
                size="sm"
                fontWeight="bold"
              >
                <Icon as={activeOrderId ? FaExclamationCircle : FaShoppingBasket} mr={1} />
                {activeOrderId ? "Pedido Ativo" : "Pedidos"}
              </Button>
              <Button
                variant="subtle"
                colorPalette="brand"
                onClick={() => toaster.create({ title: "Em breve", description: "O cadastro e login de clientes estará disponível em breve.", type: "info" })}
                borderRadius="full"
                size="sm"
                fontWeight="bold"
              >
                <Icon as={FaUser} mr={1} />
                Perfil
              </Button>
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Container maxW="container.lg" mt={{ base: "30px", md: "40px" }} position="relative" zIndex={2} pb={{ base: "140px", md: 0 }}>
        <Box 
          bg="white" 
          p={{ base: 5, md: 10 }} 
          borderRadius="3xl" 
          boxShadow="0 10px 30px -5px rgba(0,0,0,0.05)"
          minH="50vh"
        >
          <VStack gap={10} align="stretch">
            {/* BARRA DE BUSCA */}
            <Input
              size="lg"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              bg="gray.50"
              borderRadius="xl"
              boxShadow="sm"
            />
            {orderedCategories.map((cat, index) => (
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
                  {filteredProducts.filter(p => p.category === cat).map(product => (
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
                      wrap="nowrap"
                    >
                      <VStack align="start" gap={1} flex={1} minW={0} overflow="hidden">
                        <Text fontWeight="bold" fontSize="lg" color="gray.800" lineHeight="tight" noOfLines={2}>
                          {product.name}
                        </Text>
                        <Text fontSize="sm" color="gray.500" noOfLines={2} lineHeight="short" mb={2}>
                          {product.description}
                        </Text>
                        <HStack>
                          <Text color="brand.600" fontWeight="900" fontSize="lg">
                            R$ {product.price.toFixed(2)}
                          </Text>
                          {(product.originalPrice && product.originalPrice > product.price) && (
                            <Text color="gray.400" textDecoration="line-through" fontSize="sm">
                              R$ {product.originalPrice.toFixed(2)}
                            </Text>
                          )}
                        </HStack>
                      </VStack>
                      
                      <VStack align="end" gap={3} flexShrink={0}>
                        {product.imageUrl && (
                          <Image 
                            src={product.imageUrl} 
                            boxSize={{ base: "90px", md: "110px" }} 
                            minW={{ base: "90px", md: "110px" }}
                            maxW="100%"
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

            {orderedCategories.length === 0 && (
              <Center py={20}>
                <Text color="gray.400" fontSize="lg">Nenhum produto cadastrado nesta loja.</Text>
              </Center>
            )}
          </VStack>
        </Box>
      </Container>

      {/* Mobile App-like Bottom Navigation & Sticky Cart */}
      <Box display={{ base: 'block', md: 'none' }} position="fixed" bottom="0" left="0" w="full" zIndex={1000}>
        {/* Sticky Cart Summary */}
        {cart.length > 0 && (
          <Flex
            bg="brand.500"
            color="white"
            p={4}
            px={6}
            justify="space-between"
            align="center"
            onClick={() => setIsCartOpen(true)}
            cursor="pointer"
            boxShadow="0 -4px 10px rgba(0,0,0,0.1)"
            position="relative"
            zIndex={2}
          >
            <Flex align="center" gap={3}>
              <Box bg="whiteAlpha.300" w="30px" h="30px" display="flex" alignItems="center" justifyContent="center" borderRadius="full" fontWeight="bold">
                {cart.length}
              </Box>
              <Text fontWeight="bold" fontSize="lg">Ver pedido</Text>
            </Flex>
            <Text fontWeight="bold" fontSize="lg">
              R$ {totalCart.toFixed(2)}
            </Text>
          </Flex>
        )}

        {/* Bottom Navigation Bar */}
        <Flex
          bg="white"
          borderTop="1px solid"
          borderColor="gray.200"
          pt={3}
          pb={6}
          px={2}
          justify="space-around"
          align="center"
          boxShadow="0 -2px 10px rgba(0, 0, 0, 0.05)"
          position="relative"
          zIndex={1}
        >
          <VStack gap={1} color={!showPromotionsOnly ? "brand.500" : "gray.400"} cursor="pointer" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setShowPromotionsOnly(false); }}>
            <Icon as={FaHome} boxSize="24px" />
            <Text fontSize="xs" fontWeight="bold">Início</Text>
          </VStack>

          <VStack gap={1} color={showPromotionsOnly ? "brand.500" : "gray.400"} cursor="pointer" onClick={() => setShowPromotionsOnly(!showPromotionsOnly)}>
            <Icon as={FaPercentage} boxSize="24px" />
            <Text fontSize="xs" fontWeight={showPromotionsOnly ? "bold" : "normal"}>Promoções</Text>
          </VStack>

          <VStack gap={1} color={activeOrderId ? "orange.400" : "gray.400"} cursor="pointer" onClick={() => {
            if (activeOrderId) {
              navigate(`/pedido/${activeOrderId}`, { state: { restaurantName: restaurant.name, slug } });
            } else {
              toaster.create({ title: "Nenhum pedido", description: "Faça login para ver seu histórico.", type: "info" });
            }
          }}>
            <Box position="relative">
              <Icon as={activeOrderId ? FaExclamationCircle : FaShoppingBasket} boxSize="24px" />
              {activeOrderId && (
                <Box position="absolute" top="-2px" right="-8px" bg="red.500" color="white" borderRadius="full" w="12px" h="12px" display="flex" alignItems="center" justifyContent="center" />
              )}
            </Box>
            <Text fontSize="xs" fontWeight={activeOrderId ? "bold" : "normal"}>{activeOrderId ? "Ativo" : "Pedidos"}</Text>
          </VStack>

          <VStack gap={1} color="gray.400" cursor="pointer" onClick={() => toaster.create({ title: "Em breve", description: "O cadastro e login de clientes estará disponível em breve.", type: "info" })}>
            <Icon as={FaUser} boxSize="24px" />
            <Text fontSize="xs">Perfil</Text>
          </VStack>
        </Flex>
      </Box>

      {/* Desktop Sticky Cart */}
      {cart.length > 0 && (
        <Box 
          display={{ base: 'none', md: 'block' }}
          position="fixed"
          bottom={8}
          left="0" 
          w="100%" 
          px={4} 
          py={0}
          zIndex={1000}
          pointerEvents="none"
        >
          <Button 
            w="full" 
            maxW="container.md" 
            mx="auto"
            h="70px" 
            display="flex"
            colorPalette="brand" 
            boxShadow="0 10px 25px -5px rgba(0,0,0,0.3)"
            borderRadius="full"
            pointerEvents="auto"
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