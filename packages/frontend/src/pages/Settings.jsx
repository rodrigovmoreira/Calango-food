import React from 'react';
import Sidebar from '../components/Sidebar';
import { Heading, Box, Text, VStack, HStack, Icon, Image, Badge, Spinner } from '@chakra-ui/react';
import { Button } from "../components/ui/button";
import { FaWhatsapp, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import { foodAPI } from '../services/api';

export default function Settings() {
  const { state } = useApp(); //
  const { isConnected, mode, qrCode } = state.whatsappStatus;

  const handleConnect = async () => {
    try {
      // Dispara a rota protegida que inicia o WppService para este tenant
      await foodAPI.connectWhatsApp(); 
    } catch (err) {
      console.error("Erro ao iniciar conexão:", err);
    }
  };

  return (
    <Sidebar>
      <Box p={{ base: 4, md: 8 }}>
        <VStack align="stretch" gap={6}>
          <Box p={8} borderRadius="2xl" bg="white" boxShadow="md" border="1px solid" borderColor="gray.100">
            <VStack align="start" gap={4}>
              <Heading color="brand.500" size="lg">Integração WhatsApp</Heading>
              <Text color="gray.600">
                Conecte seu WhatsApp para automatizar o envio de cardápios, confirmações de pagamento 
                e avisos para motoboys.
              </Text>
              
              <Badge colorPalette={isConnected ? "green" : "orange"} size="lg" px={4} py={1} borderRadius="full">
                Status: {mode}
              </Badge>
            </VStack>
          </Box>

          <Box p={8} borderRadius="2xl" bg="white" boxShadow="md" textAlign="center" border="1px solid" borderColor="gray.100">
            {isConnected ? (
              <VStack gap={4} py={10}>
                <Icon as={FaCheckCircle} w={20} h={20} color="green.500" />
                <Heading size="md">Seu WhatsApp está ativo!</Heading>
                <Text color="gray.500">O Calango-food está pronto para processar seus pedidos 24h.</Text>
                <Button variant="outline" colorPalette="red" mt={4}>
                  Desconectar WhatsApp
                </Button>
              </VStack>
            ) : (
              <VStack gap={6} py={6}>
                {!qrCode && mode !== 'Iniciando...' ? (
                  <>
                    <Icon as={FaWhatsapp} w={20} h={20} color="gray.300" />
                    <Button colorPalette="brand" size="lg" onClick={handleConnect}>
                      Gerar QR Code de Conexão
                    </Button>
                  </>
                ) : (
                  <VStack gap={4}>
                    <Text fontWeight="bold">Leia o QR Code com seu celular:</Text>
                    {qrCode ? (
                      <Box p={4} bg="white" borderRadius="xl" border="2px solid" borderColor="brand.500">
                        <Image src={qrCode} alt="WhatsApp QR Code" w="250px" h="250px" />
                      </Box>
                    ) : (
                      <VStack>
                        <Spinner color="brand.500" size="xl" />
                        <Text>Iniciando motor do WhatsApp...</Text>
                      </VStack>
                    )}
                    <HStack color="orange.500" fontSize="sm">
                      <Icon as={FaExclamationTriangle} />
                      <Text>Mantenha o celular conectado à internet.</Text>
                    </HStack>
                  </VStack>
                )}
              </VStack>
            )}
          </Box>
        </VStack>
      </Box>
    </Sidebar>
  );
}