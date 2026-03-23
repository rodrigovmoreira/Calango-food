import React, { useState, useCallback } from 'react';
import { 
  Box, Flex, VStack, HStack, Text, Button, Input, 
  Heading, IconButton, Portal, Spinner
} from '@chakra-ui/react';
import { FaTimes, FaTrash, FaMotorcycle, FaCheckCircle, FaUser, FaWhatsapp, FaMapMarkerAlt, FaShoppingBasket } from 'react-icons/fa';
import { toaster } from "./ui/toaster";
import { foodAPI } from '../services/api';

// Máscara de telefone: (XX) 9 XXXX-XXXX
function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

// Máscara de CEP: XXXXX-XXX
function formatCep(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

// Label de campo com asterisco vermelho para obrigatório
function FieldLabel({ icon: IconComp, children, required }) {
  return (
    <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1} display="flex" alignItems="center" gap={1}>
      {IconComp && <IconComp />}
      {children}
      {required && <Text as="span" color="red.500" ml={0.5}>*</Text>}
    </Text>
  );
}

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cart, 
  removeFromCart, 
  total, 
  slug, 
  isStoreOpen,
  restaurantName
}) {
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'phone') {
      setFormData(prev => ({ ...prev, phone: formatPhone(value) }));
      return;
    }

    if (name === 'cep') {
      const formatted = formatCep(value);
      setFormData(prev => ({ ...prev, cep: formatted }));
      const digits = value.replace(/\D/g, '');
      if (digits.length === 8) {
        fetchCep(digits);
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fetchCep = useCallback(async (cep) => {
    setCepLoading(true);
    setCepError('');
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (data.erro) {
        setCepError('CEP não encontrado');
        setFormData(prev => ({ ...prev, street: '', neighborhood: '', city: '', state: '' }));
      } else {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          state: data.uf || ''
        }));
      }
    } catch {
      setCepError('Erro ao consultar CEP');
    } finally {
      setCepLoading(false);
    }
  }, []);

  const validateForm = () => {
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.name.trim()) {
      toaster.create({ title: "Campo Obrigatório", description: "Preencha seu nome completo.", type: "error" });
      return false;
    }
    if (phoneDigits.length !== 11) {
      toaster.create({ title: "WhatsApp Inválido", description: "Informe um número válido com 11 dígitos.", type: "error" });
      return false;
    }
    if (formData.cep.replace(/\D/g, '').length !== 8) {
      toaster.create({ title: "CEP Inválido", description: "Informe um CEP válido com 8 dígitos.", type: "error" });
      return false;
    }
    if (!formData.street.trim()) {
      toaster.create({ title: "Campo Obrigatório", description: "O endereço (rua) é obrigatório.", type: "error" });
      return false;
    }
    if (!formData.number.trim()) {
      toaster.create({ title: "Campo Obrigatório", description: "O número é obrigatório.", type: "error" });
      return false;
    }
    if (!formData.neighborhood.trim()) {
      toaster.create({ title: "Campo Obrigatório", description: "O bairro é obrigatório.", type: "error" });
      return false;
    }
    if (!formData.city.trim() || !formData.state.trim()) {
      toaster.create({ title: "Campo Obrigatório", description: "Cidade e estado são obrigatórios.", type: "error" });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!isStoreOpen) {
      toaster.create({ title: "Loja Fechada", description: "Não estamos aceitando pedidos no momento.", type: "warning" });
      return;
    }

    if (cart.length === 0) {
      toaster.create({ title: "Carrinho Vazio", description: "Adicione itens antes de finalizar.", type: "warning" });
      return;
    }

    if (!validateForm()) return;

    try {
      setLoading(true);

      const itemsPayload = cart.map(item => ({
        productId: item._id,
        name: item.name,
        quantity: 1,
        customizations: item.customizations ? item.customizations.map(c => ({
          name: c.name,
          extraPrice: c.price || c.extraPrice || 0
        })) : []
      }));

      // Endereço completo formatado para o campo address (retrocompatível)
      const fullAddress = [
        `${formData.street}, ${formData.number}`,
        formData.complement ? formData.complement : null,
        formData.neighborhood,
        `${formData.city} - ${formData.state}`,
        `CEP: ${formData.cep}`
      ].filter(Boolean).join(' - ');

      const payload = {
        slug,
        clientId: formData.phone.replace(/\D/g, ''),
        customerName: formData.name,
        items: itemsPayload,
        payment: {
          method: 'pix', 
          cardHash: null 
        },
        delivery: {
          type: 'delivery', 
          address: fullAddress,
          cep: formData.cep.replace(/\D/g, ''),
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          reference: ''
        }
      };

      const response = await foodAPI.createOrder(payload);

      toaster.create({
        title: "Pedido Enviado!",
        description: "Seu pedido foi recebido com sucesso.",
        type: "success",
      });

      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err) {
      console.error(err);
      toaster.create({
        title: "Erro no Pedido",
        description: err.response?.data?.error || "Ocorreu um erro ao processar seu pedido.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Portal>
      {/* Backdrop */}
      <Box 
        position="fixed" top={0} left={0} w="100vw" h="100vh" 
        bg="blackAlpha.600" zIndex={1300} 
        onClick={onClose}
        backdropFilter="blur(4px)"
      />
      
      {/* Drawer */}
      <Flex 
        position="fixed" top={0} right={0} w={{ base: "100%", md: "420px" }} h="100vh" 
        bg="white" zIndex={1400} direction="column"
        boxShadow="-5px 0 20px rgba(0,0,0,0.15)"
        animation="slideIn 0.3s ease-out"
      >
        <style>
          {`
            @keyframes slideIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}
        </style>

        {/* Header */}
        <Flex 
          bgGradient="linear(to-br, brand.500, brand.neon)"
          p={6} color="white" align="center" justify="space-between"
          boxShadow="sm" flexShrink={0}
        >
          <VStack align="start" gap={0}>
            <Heading size="md" fontWeight="800">Seu Pedido</Heading>
            <Text fontSize="sm" opacity={0.9}>{restaurantName}</Text>
          </VStack>
          <IconButton 
            variant="ghost" color="white" _hover={{ bg: "whiteAlpha.300" }}
            onClick={onClose} aria-label="Fechar carrinho"
          >
            <FaTimes />
          </IconButton>
        </Flex>

        {/* Body */}
        <Box flex={1} overflowY="auto" p={6}>
          <VStack align="stretch" gap={6}>
            {/* Itens do Carrinho */}
            <Box>
              <Heading size="sm" mb={4} color="gray.700" display="flex" alignItems="center" gap={2}>
                <FaShoppingBasket color="var(--chakra-colors-brand-500)" /> Itens
              </Heading>
              
              {cart.length === 0 ? (
                <Text color="gray.500" fontSize="sm" textAlign="center" py={4}>
                  Sua sacola está vazia.
                </Text>
              ) : (
                <VStack align="stretch" gap={3}>
                  {cart.map((item, index) => (
                    <Flex key={item.cartId || index} justify="space-between" align="center" p={3} bg="gray.50" borderRadius="lg" border="1px solid" borderColor="gray.100">
                      <VStack align="start" gap={0} flex={1}>
                        <Text fontWeight="bold" fontSize="sm" color="gray.800">{item.name}</Text>
                        <Text fontSize="xs" color="gray.500">R$ {item.price.toFixed(2)}</Text>
                      </VStack>
                      <IconButton size="xs" colorPalette="red" variant="ghost" onClick={() => removeFromCart(item.cartId)}>
                        <FaTrash />
                      </IconButton>
                    </Flex>
                  ))}
                </VStack>
              )}
            </Box>

            <Box h="1px" bg="gray.200" />

            {/* Formulário do Cliente */}
            <Box>
              <Heading size="sm" mb={4} color="gray.700" display="flex" alignItems="center" gap={2}>
                <FaUser color="var(--chakra-colors-brand-500)" /> Seus Dados
              </Heading>
              <VStack gap={4}>
                {/* Nome */}
                <Box w="full">
                  <FieldLabel icon={FaUser} required>Nome Completo</FieldLabel>
                  <Input 
                    placeholder="João Silva" 
                    name="name" value={formData.name} onChange={handleChange} 
                    bg="white" borderRadius="md"
                  />
                </Box>

                {/* WhatsApp */}
                <Box w="full">
                  <FieldLabel icon={FaWhatsapp} required>WhatsApp</FieldLabel>
                  <Input 
                    placeholder="(11) 9 9999-9999" 
                    name="phone" value={formData.phone} onChange={handleChange}
                    bg="white" borderRadius="md"
                    maxLength={16}
                  />
                </Box>
              </VStack>
            </Box>

            <Box h="1px" bg="gray.200" />

            {/* Endereço */}
            <Box>
              <Heading size="sm" mb={4} color="gray.700" display="flex" alignItems="center" gap={2}>
                <FaMapMarkerAlt color="var(--chakra-colors-brand-500)" /> Dados da Entrega
              </Heading>
              <VStack gap={4}>
                {/* CEP */}
                <Box w="full">
                  <FieldLabel required>CEP</FieldLabel>
                  <HStack>
                    <Input 
                      placeholder="01001-000" 
                      name="cep" value={formData.cep} onChange={handleChange}
                      bg="white" borderRadius="md"
                      maxLength={9}
                      flex={1}
                    />
                    {cepLoading && <Spinner size="sm" color="brand.500" />}
                  </HStack>
                  {cepError && <Text fontSize="xs" color="red.500" mt={1}>{cepError}</Text>}
                </Box>

                {/* Endereço (Rua) */}
                <Box w="full">
                  <FieldLabel required>Endereço</FieldLabel>
                  <Input 
                    placeholder="Rua das Flores" 
                    name="street" value={formData.street} onChange={handleChange}
                    bg={formData.street ? "gray.50" : "white"} borderRadius="md"
                  />
                </Box>

                {/* Número + Complemento */}
                <HStack w="full" gap={3}>
                  <Box flex={1}>
                    <FieldLabel required>Número</FieldLabel>
                    <Input 
                      placeholder="511B" 
                      name="number" value={formData.number} onChange={handleChange}
                      bg="white" borderRadius="md"
                    />
                  </Box>
                  <Box flex={2}>
                    <FieldLabel>Complemento</FieldLabel>
                    <Input 
                      placeholder="Apt 45, Bloco B" 
                      name="complement" value={formData.complement} onChange={handleChange}
                      bg="white" borderRadius="md"
                    />
                  </Box>
                </HStack>

                {/* Bairro */}
                <Box w="full">
                  <FieldLabel required>Bairro</FieldLabel>
                  <Input 
                    placeholder="Centro" 
                    name="neighborhood" value={formData.neighborhood} onChange={handleChange}
                    bg={formData.neighborhood ? "gray.50" : "white"} borderRadius="md"
                  />
                </Box>

                {/* Cidade + Estado */}
                <HStack w="full" gap={3}>
                  <Box flex={3}>
                    <FieldLabel required>Cidade</FieldLabel>
                    <Input 
                      placeholder="São Paulo" 
                      name="city" value={formData.city} onChange={handleChange}
                      bg={formData.city ? "gray.50" : "white"} borderRadius="md"
                    />
                  </Box>
                  <Box flex={1}>
                    <FieldLabel required>UF</FieldLabel>
                    <Input 
                      placeholder="SP" 
                      name="state" value={formData.state} onChange={handleChange}
                      bg={formData.state ? "gray.50" : "white"} borderRadius="md"
                      maxLength={2}
                    />
                  </Box>
                </HStack>
              </VStack>
            </Box>
          </VStack>
        </Box>

        {/* Footer */}
        <Box p={6} bg="white" borderTop="1px solid" borderColor="gray.100" boxShadow="0 -4px 10px rgba(0,0,0,0.02)" flexShrink={0}>
          <Flex justify="space-between" mb={4} align="center">
            <Text color="gray.600" fontWeight="bold">Total a Pagar</Text>
            <Text fontSize="2xl" fontWeight="black" color="brand.600">
              R$ {total.toFixed(2)}
            </Text>
          </Flex>

          <Button 
            w="full" h="56px" colorPalette="brand" size="lg"
            fontWeight="bold" fontSize="md"
            onClick={handleSubmit}
            disabled={loading || cart.length === 0 || !isStoreOpen}
          >
            {loading ? <Spinner size="sm" /> : (
              <>
                <FaCheckCircle style={{ marginRight: '8px' }} /> 
                {isStoreOpen ? "Finalizar Pedido" : "Loja Fechada"}
              </>
            )}
          </Button>
        </Box>
      </Flex>
    </Portal>
  );
}
