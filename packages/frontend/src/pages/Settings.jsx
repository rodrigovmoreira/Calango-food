import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Heading, Box, Text, VStack, HStack, Icon, Image, Badge, Spinner, Tabs, Input, Switch, Flex } from '@chakra-ui/react';
import { Button } from "../components/ui/button";
import { Toaster, toaster } from "../components/ui/toaster";
import { FaWhatsapp, FaCheckCircle, FaExclamationTriangle, FaStore, FaClock } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import { foodAPI, authAPI } from '../services/api';

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function Settings() {
  const { state, dispatch } = useApp();
  const { isConnected, mode, qrCode } = state.whatsappStatus;

  const [profileLoading, setProfileLoading] = useState(true);
  const [storeName, setStoreName] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [operatingHours, setOperatingHours] = useState([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await authAPI.getProfile();
      setStoreName(data.storeName || '');
      setIsOpen(data.isOpen ?? true);
      setOperatingHours(data.operatingHours || []);
    } catch (err) {
      toaster.create({ title: "Erro", description: "Falha ao carregar configurações", type: "error" });
    } finally {
      setProfileLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await authAPI.updateProfile({ storeName, isOpen, operatingHours });
      toaster.create({ title: "Sucesso", description: "Configurações salvas", type: "success" });
    } catch (err) {
      toaster.create({ title: "Erro", description: "Falha ao salvar", type: "error" });
    }
  };

  const handleDayToggle = (index) => {
    const newHours = [...operatingHours];
    newHours[index].isActive = !newHours[index].isActive;
    setOperatingHours(newHours);
  };

  const handleTimeChange = (index, field, value) => {
    const newHours = [...operatingHours];
    newHours[index][field] = value;
    setOperatingHours(newHours);
  };

  const handleConnect = async () => {
    try {
      // Força a interface de loading imediatamente no clique
      dispatch({
        type: 'SET_WHATSAPP_STATUS',
        payload: { mode: 'Iniciando...', isConnected: false }
      });
      await foodAPI.connectWhatsApp();
    } catch (err) {
      console.error("Erro ao iniciar conexão:", err);
    }
  };

  return (
    <Sidebar>
      <Box p={{ base: 4, md: 8 }}>
        <Heading color="brand.500" size="xl" mb={6}>Configurações</Heading>

        <Tabs.Root defaultValue="hours" variant="line" colorPalette="brand">
          <Tabs.List mb={6}>
            <Tabs.Trigger value="hours" gap={2}><FaClock /> Loja e Horários</Tabs.Trigger>
            <Tabs.Trigger value="whatsapp" gap={2}><FaWhatsapp /> WhatsApp</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="hours">
            {profileLoading ? <Spinner /> : (
              <VStack align="stretch" gap={8} maxW="800px">
                <Box p={6} bg="white" borderRadius="xl" shadow="sm" borderWidth="1px">
                  <Heading size="md" mb={4}>Informações Básicas</Heading>
                  <VStack align="stretch" gap={4}>
                    <Box>
                      <Text fontWeight="bold" mb={2}>Nome da Loja</Text>
                      <Input
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Ex: Calango Food Delivery"
                      />
                      {/* FEEDBACK DO LINK AMIGÁVEL */}
                      <Text fontSize="xs" mt={2} color="gray.500">
                        Seu link público será:
                        <Text as="span" color="brand.600" fontWeight="bold" ml={1}>
                          calangofood.com/cardapio/{storeName.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/[\s_]+/g, '-')}
                        </Text>
                      </Text>
                    </Box>

                    <Flex
                      justify="space-between"
                      align="center"
                      p={4}
                      bg={isOpen ? "green.50" : "red.50"}
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor={isOpen ? "green.200" : "red.200"}
                    >
                      <Box>
                        <Heading size="sm" color={isOpen ? "green.700" : "red.700"}>
                          {isOpen ? "Sua loja está ABERTA" : "Sua loja está FECHADA (Pausa de Emergência)"}
                        </Heading>
                        <Text fontSize="sm" color="gray.600">Ative para fechar o cardápio independentemente do horário.</Text>
                      </Box>
                      {/* AJUSTE NO ONCHANGE DO SWITCH */}
                      <Switch.Root
                        checked={isOpen}
                        onCheckedChange={(e) => setIsOpen(e.checked)}
                        colorPalette={isOpen ? "green" : "red"}
                        size="lg"
                      >
                        <Switch.HiddenInput />
                        <Switch.Control><Switch.Thumb /></Switch.Control>
                      </Switch.Root>
                    </Flex>
                  </VStack>
                </Box>

                <Box p={6} bg="white" borderRadius="xl" shadow="sm" borderWidth="1px">
                  <Heading size="md" mb={6}>Horário de Funcionamento</Heading>
                  <VStack align="stretch" gap={4}>
                    {operatingHours.map((schedule, index) => (
                      <Flex key={schedule.day} justify="space-between" align="center" p={3} bg="gray.50" borderRadius="md" opacity={schedule.isActive ? 1 : 0.6}>
                        <Flex gap={4} align="center" w="150px">
                          <Switch.Root checked={schedule.isActive} onChange={() => handleDayToggle(index)} colorPalette="brand">
                            <Switch.HiddenInput />
                            <Switch.Control><Switch.Thumb /></Switch.Control>
                          </Switch.Root>
                          <Text fontWeight={schedule.isActive ? "bold" : "normal"}>{DAYS_OF_WEEK[schedule.day]}</Text>
                        </Flex>

                        <Flex gap={4} align="center" flex={1} justify="flex-end" display={schedule.isActive ? "flex" : "none"}>
                          <Input type="time" w="130px" value={schedule.openTime} onChange={(e) => handleTimeChange(index, 'openTime', e.target.value)} bg="white" />
                          <Text>até</Text>
                          <Input type="time" w="130px" value={schedule.closeTime} onChange={(e) => handleTimeChange(index, 'closeTime', e.target.value)} bg="white" />
                        </Flex>

                        {!schedule.isActive && (
                          <Text color="red.500" fontSize="sm" fontStyle="italic" w="full" textAlign="right">Fechado</Text>
                        )}
                      </Flex>
                    ))}
                  </VStack>
                  <Button mt={8} colorPalette="brand" size="lg" w="full" onClick={saveSettings}>Salvar Alterações</Button>
                </Box>
              </VStack>
            )}
          </Tabs.Content>

          <Tabs.Content value="whatsapp">
            <Box p={8} borderRadius="2xl" bg="white" shadow="sm" borderWidth="1px" maxW="800px">
              <VStack align="start" gap={4} mb={8}>
                <Heading color="brand.500" size="lg">Integração Automática</Heading>
                <Badge colorPalette={isConnected ? "green" : "orange"} size="lg" px={4} py={1} borderRadius="full">Status: {mode}</Badge>
              </VStack>
              <Box p={8} borderRadius="2xl" bg="gray.50" textAlign="center" border="1px dashed" borderColor="gray.300">
                {isConnected ? (
                  <VStack gap={4} py={10}>
                    <Icon as={FaCheckCircle} w={20} h={20} color="green.500" />
                    <Heading size="md">Seu WhatsApp está ativo!</Heading>
                    <Text color="gray.500">O Calango-food está processando seus pedidos.</Text>
                  </VStack>
                ) : (
                  <VStack gap={6} py={6}>
                    {!qrCode && mode !== 'Iniciando...' ? (
                      <>
                        <Icon as={FaWhatsapp} w={20} h={20} color="gray.300" />
                        <Button colorPalette="brand" size="lg" onClick={handleConnect}>Gerar QR Code de Conexão</Button>
                      </>
                    ) : (
                      <VStack gap={4}>
                        <Text fontWeight="bold">Leia o QR Code com seu celular:</Text>
                        {qrCode ? (
                          <Box p={4} bg="white" borderRadius="xl" border="2px solid" borderColor="brand.500">
                            <Image src={qrCode} alt="WhatsApp QR Code" w="250px" h="250px" />
                          </Box>
                        ) : (
                          <VStack><Spinner color="brand.500" size="xl" /><Text>Iniciando motor do WhatsApp...</Text></VStack>
                        )}
                        <HStack color="orange.500" fontSize="sm"><Icon as={FaExclamationTriangle} /><Text>Mantenha conectado à internet.</Text></HStack>
                      </VStack>
                    )}
                  </VStack>
                )}
              </Box>
            </Box>
          </Tabs.Content>
        </Tabs.Root>
      </Box>
      <Toaster />
    </Sidebar>
  );
}