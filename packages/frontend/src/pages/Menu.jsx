import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Box, Container, Heading, Text, VStack, SimpleGrid, Card, Image, 
  Badge, Flex, Tabs, Button, Input, Field
} from '@chakra-ui/react';
import { Toaster, toaster } from "../components/ui/toaster";
import { DialogBody, DialogCloseTrigger, DialogContent, DialogHeader, DialogRoot, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { ShoppingCartIcon, PlusIcon, MinusIcon, MapPinIcon } from 'lucide-react';
import { foodAPI } from '../services/api';

export default function Menu() {
  const { tenantId } = useParams();
  const [storeProfile, setStoreProfile] = useState({ storeName: 'Carregando...', isOperatingNow: true });
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchMenuAndStore = async () => {
      try {
         const [storeRes, menuRes] = await Promise.all([
            foodAPI.getPublicProfile(tenantId),
            foodAPI.getPublicProducts(tenantId)
         ]);
         setStoreProfile(storeRes.data);
         setProducts(menuRes.data);
      } catch (err) {
         console.error('Failed to load menu:', err);
         toaster.create({ title: "Erro", description: "Loja não encontrada ou falha no cardápio.", type: "error" });
      } finally {
         setLoading(false);
      }
    };
    if (tenantId) fetchMenuAndStore();
  }, [tenantId]);

  const addToCart = (product) => {
    if (!storeProfile.isOperatingNow) {
       return toaster.create({ title: "Loja Fechada", description: "Não estamos recebendo pedidos no momento.", type: "warning" });
    }
    setCart(prev => {
      const existing = prev.find(item => item.productId === product._id);
      if (existing) {
        return prev.map(item => item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        productId: product._id, 
        name: product.name, 
        price: product.price, 
        quantity: 1, 
        customizations: [] 
      }];
    });
    toaster.create({ title: "Adicionado", description: `${product.name} no carrinho!`, type: "success" });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQtd = item.quantity + delta;
        return newQtd > 0 ? { ...item, quantity: newQtd } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!customerName || !deliveryAddress || !customerPhone) {
      return toaster.create({ title: "Aviso", description: "Preencha seus dados para entrega.", type: "warning" });
    }
    if (cart.length === 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        tenantId,
        clientId: customerPhone,
        customerName, // You might need to add this to OrderSchema or send it as part of client info
        items: cart,
        method: paymentMethod, // 'pix' ou 'card' ... 'pagbank' vs 'pix_internal'
        address: deliveryAddress
      };

      const { data } = await foodAPI.createOrder(payload);
      
      toaster.create({
        title: "Pedido Realizado!",
        description: "Seu pedido foi enviado para a cozinha.",
        type: "success"
      });

      setCart([]);
      setIsCartOpen(false);
      
      // Aqui você pode redirecionar para a tela de Acompanhamento / Pagamento
      if (data.paymentData?.qrCodeUrl) {
         window.open(data.paymentData.qrCodeUrl, '_blank');
      }

    } catch (err) {
      toaster.create({
        title: "Ops!",
        description: err.response?.data?.error || "Erro ao processar pedido. Tente novamente.",
        type: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <Flex justify="center" align="center" h="100vh"><Text>Carregando cardápio...</Text></Flex>;

  return (
    <Box minH="100vh" bg="#fdfdfd">
      {/* Header Estilizado usando o brand.500 */}
      <Box w="100%" bgGradient="to-r" gradientFrom="brand.500" gradientTo="brand.700" color="white" py={8} px={4} shadow="md">
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <VStack align="start" gap={1}>
              <Heading size="2xl">Calango Delivery</Heading>
              <Text opacity={0.9} fontSize="lg">O melhor sabor, direto para você!</Text>
            </VStack>
            
            <DialogRoot open={isCartOpen} onOpenChange={(e) => setIsCartOpen(e.open)}>
              <DialogTrigger asChild>
                <Button variant="surface" bg="white" color="brand.600" size="lg" position="relative" borderRadius="full" px={6}>
                  <ShoppingCartIcon />
                  <Text ml={2} fontWeight="bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}</Text>
                  {cart.length > 0 && (
                    <Badge position="absolute" top="-2" right="-2" colorPalette="red" borderRadius="full" w={6} h={6} display="flex" alignItems="center" justifyContent="center">
                      {cart.reduce((a, b) => a + b.quantity, 0)}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Seu Pedido</DialogTitle>
                  <DialogCloseTrigger />
                </DialogHeader>
                <DialogBody pb={6}>
                  {cart.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={4}>Seu carrinho está vazio.</Text>
                  ) : (
                    <VStack align="stretch" gap={4}>
                      {cart.map(item => (
                        <Flex key={item.productId} justify="space-between" align="center" borderBottomWidth={1} pb={2}>
                          <Box flex="1">
                            <Text fontWeight="bold">{item.name}</Text>
                            <Text fontSize="sm" color="gray.500">
                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                            </Text>
                          </Box>
                          <Flex align="center" bg="gray.100" borderRadius="md" p={1}>
                            <Button size="xs" variant="ghost" onClick={() => updateQuantity(item.productId, -1)}><MinusIcon size={14} /></Button>
                            <Text px={3} fontWeight="bold">{item.quantity}</Text>
                            <Button size="xs" variant="ghost" onClick={() => updateQuantity(item.productId, 1)}><PlusIcon size={14} /></Button>
                          </Flex>
                        </Flex>
                      ))}
                      
                      <Flex justify="space-between" pt={4}>
                        <Heading size="md">Total:</Heading>
                        <Heading size="md" color="brand.600">
                           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}
                        </Heading>
                      </Flex>

                      <Box mt={4} borderTopWidth={1} pt={4}>
                        <VStack gap={3}>
                           <Input placeholder="Seu Nome" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                           <Input placeholder="Seu WhatsApp (apenas números)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                           <Input placeholder="Endereço de Entrega Completo" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                           <Box w="full">
                             <Text fontSize="sm" mb={1} fontWeight="bold">Pagamento</Text>
                             <Flex gap={2}>
                                <Button flex={1} variant={paymentMethod === 'pix' ? 'solid' : 'outline'} colorPalette="brand" onClick={() => setPaymentMethod('pix')}>PIX</Button>
                                <Button flex={1} variant={paymentMethod === 'card' ? 'solid' : 'outline'} colorPalette="brand" onClick={() => setPaymentMethod('card')}>Cartão na Entrega</Button>
                             </Flex>
                           </Box>
                        </VStack>
                      </Box>

                      <Button mt={4} colorPalette="brand" size="lg" w="full" onClick={handleCheckout} loading={isSubmitting}>
                        Finalizar Pedido Agora
                      </Button>
                    </VStack>
                  )}
                </DialogBody>
              </DialogContent>
            </DialogRoot>
          </Flex>
        </Container>
      </Box>

      {/* Grid de Produtos */}
      <Container maxW="container.xl" py={12}>
         {products.length === 0 ? (
           <VStack py={20} opacity={0.6}>
              <Heading size="md">Nenhum produto disponível no momento :(</Heading>
           </VStack>
         ) : (
           <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={8}>
            {products.map(product => (
              <Card.Root key={product._id} variant="elevated" overflow="hidden" borderRadius="xl" _hover={{ transform: 'translateY(-4px)', transition: '0.2s', shadow: 'xl' }}>
                <Image 
                  src={product.imageUrl || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=800&auto=format&fit=crop'} 
                  alt={product.name} 
                  h="200px" 
                  w="full" 
                  objectFit="cover" 
                />
                <Card.Body>
                  <Flex justify="space-between" align="start" mb={2}>
                     <Heading size="md">{product.name}</Heading>
                     <Badge colorPalette="brand" variant="subtle" fontSize="md" px={2} py={1} borderRadius="md">
                       {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                     </Badge>
                  </Flex>
                  <Text color="gray.500" fontSize="sm" noOfLines={2} mb={4}>
                    {product.description || 'Delicioso item do nosso cardápio, feito com os melhores ingredientes da região.'}
                  </Text>
                  <Button w="full" colorPalette="brand" variant="outline" onClick={() => addToCart(product)} leftIcon={<PlusIcon size={18} />}>
                    Adicionar ao Carrinho
                  </Button>
                </Card.Body>
              </Card.Root>
            ))}
           </SimpleGrid>
         )}
      </Container>
      <Toaster />
    </Box>
  );
}
