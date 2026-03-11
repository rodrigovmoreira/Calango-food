import {
  Box, Container, Flex, Heading, HStack, SimpleGrid, Stack, Text, VStack,
  Icon, Badge, Float
} from '@chakra-ui/react';
import { Button } from "../components/ui/button";
import { Card } from "@chakra-ui/react";
import { Avatar } from "../components/ui/avatar";
import { useNavigate } from 'react-router-dom';
import { 
  FaWhatsapp, FaUtensils, FaMotorcycle, 
  FaQrcode, FaCommentDots, FaTimes
} from 'react-icons/fa';
import React, { useState } from 'react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showChat, setShowChat] = useState(false);

  return (
    <Box bg="gray.50" minH="100vh" color="gray.800">
      {/* Navbar com Glassmorphism */}
      <Box
        as="nav"
        position="fixed"
        w="100%"
        zIndex="docked"
        bg="rgba(255, 255, 255, 0.8)"
        backdropFilter="blur(10px)"
        boxShadow="sm"
        py={4}
      >
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center">
            <HStack gap={2}>
              <Icon as={FaUtensils} w={6} h={6} color="brand.500" />
              <Heading size="md" color="brand.500">
                Calango-food
              </Heading>
            </HStack>

            <HStack gap={4}>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Entrar
              </Button>
              <Button
                colorPalette="brand"
                variant="solid"
                onClick={() => navigate('/login')}
              >
                Começar Agora
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxW="container.xl" pt={{ base: 32, md: 48 }} pb={20}>
        <Stack direction={{ base: 'column', md: 'row' }} gap={12} align="center">
          <VStack align="flex-start" gap={6} flex={1}>
            <Badge colorPalette="brand" variant="subtle" px={3} py={1} borderRadius="full">
              Delivery 100% Automatizado
            </Badge>
            <Heading
              as="h1"
              size="3xl"
              fontWeight="extrabold"
              lineHeight="1.1"
              color="gray.900"
            >
              Transforme seu WhatsApp em uma <Box as="span" color="brand.500">Máquina de Vendas</Box>
            </Heading>
            <Text fontSize="xl" color="gray.600">
              Cardápio digital, pagamentos via PIX e integração com motoboys. Tudo automático, 24h por dia.
            </Text>
            <Stack direction={{ base: 'column', sm: 'row' }} gap={4} w="full">
              <Button
                size="xl"
                colorPalette="brand"
                px={10}
                onClick={() => navigate('/login')}
              >
                <FaWhatsapp /> Criar meu Cardápio
              </Button>
              <Button
                size="xl"
                variant="outline"
                onClick={() => window.open('/demo', '_blank')}
              >
                Ver Exemplo
              </Button>
            </Stack>
          </VStack>

          {/* Simulador de Chat Mobile-First */}
          <Box flex={1} w="full" maxW="400px">
            <Card.Root
              bg="#e5ddd5"
              borderRadius="3xl"
              boxShadow="2xl"
              overflow="hidden"
              borderWidth="8px"
              borderColor="gray.800"
            >
              <Box bg="#075e54" p={3} color="white">
                <HStack gap={3}>
                  <Avatar size="sm" name="Calango Burguer" bg="brand.400" />
                  <VStack align="start" gap={0}>
                    <Text fontWeight="bold" fontSize="sm">Calango Burguer</Text>
                    <Text fontSize="xs" opacity={0.8}>Online</Text>
                  </VStack>
                </HStack>
              </Box>
              <Card.Body p={4} minH="400px" display="flex" flexDirection="column" gap={4}>
                <ChatMessage isUser>Olá! Quero um Combo Calango com Batata.</ChatMessage>
                <ChatMessage>
                  <Box as="span" fontWeight="bold" color="brand.600">CalangoBot: </Box>
                  Excelente escolha! 🍔 O total fica R$ 45,90. 
                  Deseja pagar via PIX para agilizar a entrega?
                </ChatMessage>
                <ChatMessage isUser>Sim, mande a chave.</ChatMessage>
                <ChatMessage>
                  <Box as="span" fontWeight="bold" color="green.600">✅ Pedido Confirmado!</Box>
                  <br />
                  Seu pagamento foi aprovado e o motoboy já foi acionado.
                </ChatMessage>
              </Card.Body>
            </Card.Root>
          </Box>
        </Stack>
      </Container>

      {/* Features Grid */}
      <Box py={24} bg="white">
        <Container maxW="container.xl">
          <VStack gap={4} mb={16} textAlign="center">
            <Heading size="2xl">O Ciclo Completo da Venda</Heading>
            <Text color="gray.500" fontSize="lg">Sua única preocupação será preparar o pedido.</Text>
          </VStack>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={10}>
            <FeatureCard
              icon={FaQrcode}
              title="Cardápio & PIX"
              text="O cliente acessa o cardápio, escolhe e paga. O robô valida o pagamento na hora."
            />
            <FeatureCard
              icon={FaUtensils}
              title="Painel da Cozinha"
              text="Sua equipe recebe o pedido pronto para preparo com todos os detalhes e observações."
            />
            <FeatureCard
              icon={FaMotorcycle}
              title="Logística Ativa"
              text="Integração nativa para chamar o motoboy mais próximo automaticamente."
            />
          </SimpleGrid>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg="gray.900" color="white" py={16}>
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 4 }} gap={12}>
            <VStack align="start" gap={4}>
              <HStack color="brand.400">
                <Icon as={FaUtensils} w={6} h={6} />
                <Heading size="md">Calango-food</Heading>
              </HStack>
              <Text color="gray.400" fontSize="sm">
                A solução definitiva para escalar seu delivery sem contratar mais atendentes.
              </Text>
            </VStack>
            <VStack align="start" gap={3}>
              <Text fontWeight="bold">Plataforma</Text>
              <Text fontSize="sm" color="gray.400" cursor="pointer">Cozinha Digital</Text>
              <Text fontSize="sm" color="gray.400" cursor="pointer">Gestão de Motoboys</Text>
            </VStack>
            <VStack align="start" gap={3}>
              <Text fontWeight="bold">Suporte</Text>
              <Text fontSize="sm" color="gray.400" cursor="pointer">Documentação</Text>
              <Text fontSize="sm" color="gray.400" cursor="pointer">WhatsApp Suporte</Text>
            </VStack>
            <VStack align="start" gap={3}>
              <Text fontWeight="bold">Legal</Text>
              <Text fontSize="sm" color="gray.400" cursor="pointer">Termos de Uso</Text>
              <Text fontSize="sm" color="gray.400" cursor="pointer">Privacidade</Text>
            </VStack>
          </SimpleGrid>
          <Text textAlign="center" color="gray.600" fontSize="xs" mt={20}>
            &copy; {new Date().getFullYear()} Calango-food Tecnologia.
          </Text>
        </Container>
      </Box>

      {/* Widget Flutuante */}
      <Box position="fixed" bottom="30px" right="30px" zIndex="popover">
        <Float>
          <Button
            onClick={() => setShowChat(!showChat)}
            colorPalette="brand"
            size="lg"
            borderRadius="full"
            w="64px"
            h="64px"
            boxShadow="0 10px 25px rgba(0,0,0,0.2)"
          >
            <Icon as={showChat ? FaTimes : FaCommentDots} w={6} h={6} />
          </Button>
        </Float>
      </Box>
    </Box>
  );
};

// --- Subcomponentes Auxiliares ---

const ChatMessage = ({ isUser, children }) => (
  <Flex justify={isUser ? "flex-end" : "flex-start"}>
    <Box
      bg={isUser ? "brand.500" : "white"}
      color={isUser ? "white" : "gray.800"}
      p={3}
      borderRadius="2xl"
      borderBottomRightRadius={isUser ? "0" : "2xl"}
      borderBottomLeftRadius={isUser ? "2xl" : "0"}
      maxW="80%"
      boxShadow="sm"
      fontSize="sm" // Aplicado diretamente na Box para evitar Text dentro de Text
    >
      {children}
    </Box>
  </Flex>
);

const FeatureCard = ({ icon, title, text }) => (
  <VStack
    bg="gray.50"
    p={10}
    borderRadius="2xl"
    align="center"
    gap={5}
    borderWidth="1px"
    borderColor="gray.100"
    _hover={{ transform: 'translateY(-8px)', boxShadow: 'xl', borderColor: 'brand.200' }}
    transition="all 0.3s"
  >
    <Box bg="brand.50" p={4} borderRadius="xl" color="brand.500">
      <Icon as={icon} w={8} h={8} />
    </Box>
    <Heading size="md" textAlign="center">{title}</Heading>
    <Text color="gray.500" textAlign="center" fontSize="sm">{text}</Text>
  </VStack>
);

export default LandingPage;