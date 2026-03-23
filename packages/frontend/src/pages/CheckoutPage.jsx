import React, { useState, useCallback } from 'react';
import {
  Box, Flex, VStack, HStack, Text, Button, Input, Heading,
  Container, Icon, Spinner, Center
} from '@chakra-ui/react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  FaUser, FaWhatsapp, FaMapMarkerAlt, FaArrowRight, FaArrowLeft,
  FaCreditCard, FaCheckCircle, FaShoppingBasket, FaQrcode
} from 'react-icons/fa';
import { toaster } from "../components/ui/toaster";
import { foodAPI } from '../services/api';

// === UTILITÁRIOS ===

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function formatCep(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function FieldLabel({ icon: IconComp, children, required }) {
  return (
    <Text fontSize="xs" fontWeight="bold" color="gray.600" mb={1} display="flex" alignItems="center" gap={1}>
      {IconComp && <IconComp />}
      {children}
      {required && <Text as="span" color="red.500" ml={0.5}>*</Text>}
    </Text>
  );
}

// === STEPPER VISUAL ===

const STEPS = [
  { label: 'Dados', icon: FaUser },
  { label: 'Pagamento', icon: FaCreditCard },
  { label: 'Confirmação', icon: FaCheckCircle },
];

function Stepper({ currentStep }) {
  return (
    <Flex justify="center" align="center" gap={0} mb={8}>
      {STEPS.map((step, index) => {
        const isActive = index === currentStep;
        const isDone = index < currentStep;
        return (
          <React.Fragment key={step.label}>
            {index > 0 && (
              <Box
                h="2px" flex={1} maxW="60px"
                bg={isDone ? "brand.500" : "gray.200"}
                transition="background 0.3s"
              />
            )}
            <VStack gap={1}>
              <Flex
                w="44px" h="44px" borderRadius="full"
                align="center" justify="center"
                bg={isActive ? "brand.500" : isDone ? "brand.500" : "gray.200"}
                color={isActive || isDone ? "white" : "gray.500"}
                transition="all 0.3s"
                boxShadow={isActive ? "0 4px 14px rgba(0,0,0,0.15)" : "none"}
                transform={isActive ? "scale(1.1)" : "scale(1)"}
              >
                {isDone ? <FaCheckCircle size={18} /> : <step.icon size={16} />}
              </Flex>
              <Text
                fontSize="xs"
                fontWeight={isActive ? "bold" : "normal"}
                color={isActive ? "brand.600" : isDone ? "brand.500" : "gray.400"}
              >
                {step.label}
              </Text>
            </VStack>
          </React.Fragment>
        );
      })}
    </Flex>
  );
}

// === ETAPA 1: DADOS + ENDEREÇO ===

function StepDados({ formData, onChange, onNext, cepLoading, cepError }) {
  return (
    <VStack align="stretch" gap={5} animation="fadeIn 0.3s ease-out">
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <Heading size="md" color="gray.800" mb={2}>Seus Dados</Heading>

      <Box w="full">
        <FieldLabel icon={FaUser} required>Nome Completo</FieldLabel>
        <Input placeholder="João Silva" name="name" value={formData.name} onChange={onChange} bg="white" borderRadius="md" />
      </Box>

      <Box w="full">
        <FieldLabel icon={FaWhatsapp} required>WhatsApp</FieldLabel>
        <Input placeholder="(11) 9 9999-9999" name="phone" value={formData.phone} onChange={onChange} bg="white" borderRadius="md" maxLength={16} />
      </Box>

      <Box h="1px" bg="gray.200" my={2} />

      <Heading size="sm" color="gray.700" display="flex" alignItems="center" gap={2}>
        <FaMapMarkerAlt color="var(--chakra-colors-brand-500)" /> Endereço de Entrega
      </Heading>

      <Box w="full">
        <FieldLabel required>CEP</FieldLabel>
        <HStack>
          <Input placeholder="01001-000" name="cep" value={formData.cep} onChange={onChange} bg="white" borderRadius="md" maxLength={9} flex={1} />
          {cepLoading && <Spinner size="sm" color="brand.500" />}
        </HStack>
        {cepError && <Text fontSize="xs" color="red.500" mt={1}>{cepError}</Text>}
      </Box>

      <Box w="full">
        <FieldLabel required>Endereço</FieldLabel>
        <Input placeholder="Rua das Flores" name="street" value={formData.street} onChange={onChange} bg={formData.street ? "gray.50" : "white"} borderRadius="md" />
      </Box>

      <HStack w="full" gap={3}>
        <Box flex={1}>
          <FieldLabel required>Número</FieldLabel>
          <Input placeholder="511B" name="number" value={formData.number} onChange={onChange} bg="white" borderRadius="md" />
        </Box>
        <Box flex={2}>
          <FieldLabel>Complemento</FieldLabel>
          <Input placeholder="Apt 45, Bloco B" name="complement" value={formData.complement} onChange={onChange} bg="white" borderRadius="md" />
        </Box>
      </HStack>

      <Box w="full">
        <FieldLabel required>Bairro</FieldLabel>
        <Input placeholder="Centro" name="neighborhood" value={formData.neighborhood} onChange={onChange} bg={formData.neighborhood ? "gray.50" : "white"} borderRadius="md" />
      </Box>

      <HStack w="full" gap={3}>
        <Box flex={3}>
          <FieldLabel required>Cidade</FieldLabel>
          <Input placeholder="São Paulo" name="city" value={formData.city} onChange={onChange} bg={formData.city ? "gray.50" : "white"} borderRadius="md" />
        </Box>
        <Box flex={1}>
          <FieldLabel required>UF</FieldLabel>
          <Input placeholder="SP" name="state" value={formData.state} onChange={onChange} bg={formData.state ? "gray.50" : "white"} borderRadius="md" maxLength={2} />
        </Box>
      </HStack>

      <Button w="full" h="52px" colorPalette="brand" size="lg" fontWeight="bold" onClick={onNext} mt={4}>
        Escolher Pagamento <FaArrowRight style={{ marginLeft: '8px' }} />
      </Button>
    </VStack>
  );
}

// === ETAPA 2: FORMA DE PAGAMENTO ===

function StepPagamento({ paymentMethod, setPaymentMethod, onNext, onPrev, total }) {
  const methods = [
    { id: 'pix', label: 'PIX', desc: 'Pagamento instantâneo', icon: FaQrcode, color: 'teal' },
    { id: 'card', label: 'Cartão de Crédito', desc: 'Crédito / Débito', icon: FaCreditCard, color: 'purple' },
  ];

  return (
    <VStack align="stretch" gap={5} animation="fadeIn 0.3s ease-out">
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <Heading size="md" color="gray.800" mb={2}>Forma de Pagamento</Heading>

      <VStack gap={4}>
        {methods.map(m => {
          const isSelected = paymentMethod === m.id;
          return (
            <Flex
              key={m.id}
              w="full" p={5} borderRadius="xl"
              border="2px solid"
              borderColor={isSelected ? "brand.500" : "gray.200"}
              bg={isSelected ? "brand.50" : "white"}
              cursor="pointer"
              onClick={() => setPaymentMethod(m.id)}
              transition="all 0.2s"
              _hover={{ borderColor: isSelected ? "brand.500" : "gray.300", transform: "translateY(-2px)", boxShadow: "md" }}
              align="center" gap={4}
            >
              <Flex
                w="50px" h="50px" borderRadius="xl"
                bg={isSelected ? "brand.500" : "gray.100"}
                color={isSelected ? "white" : "gray.500"}
                align="center" justify="center"
                transition="all 0.2s"
              >
                <m.icon size={22} />
              </Flex>
              <VStack align="start" gap={0} flex={1}>
                <Text fontWeight="bold" color="gray.800">{m.label}</Text>
                <Text fontSize="sm" color="gray.500">{m.desc}</Text>
              </VStack>
              <Box
                w="22px" h="22px" borderRadius="full"
                border="2px solid"
                borderColor={isSelected ? "brand.500" : "gray.300"}
                bg={isSelected ? "brand.500" : "transparent"}
                transition="all 0.2s"
                display="flex" alignItems="center" justifyContent="center"
              >
                {isSelected && <Box w="8px" h="8px" borderRadius="full" bg="white" />}
              </Box>
            </Flex>
          );
        })}
      </VStack>

      <Flex
        p={4} bg="gray.50" borderRadius="xl" justify="space-between" align="center" mt={2}
      >
        <Text color="gray.600" fontWeight="bold">Total do Pedido</Text>
        <Text fontSize="2xl" fontWeight="black" color="brand.600">R$ {total.toFixed(2)}</Text>
      </Flex>

      <HStack gap={3} mt={4}>
        <Button flex={1} h="52px" variant="outline" onClick={onPrev}>
          <FaArrowLeft style={{ marginRight: '8px' }} /> Voltar
        </Button>
        <Button flex={2} h="52px" colorPalette="brand" fontWeight="bold" onClick={onNext} disabled={!paymentMethod}>
          Revisar Pedido <FaArrowRight style={{ marginLeft: '8px' }} />
        </Button>
      </HStack>
    </VStack>
  );
}

// === ETAPA 3: CONFIRMAÇÃO ===

function StepConfirmacao({ cart, formData, paymentMethod, total, onPrev, onConfirm, loading }) {
  const methodLabels = { pix: 'PIX', card: 'Cartão de Crédito' };

  return (
    <VStack align="stretch" gap={5} animation="fadeIn 0.3s ease-out">
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      <Heading size="md" color="gray.800" mb={2}>Confirme seu Pedido</Heading>

      {/* Itens */}
      <Box p={4} bg="gray.50" borderRadius="xl">
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={3} textTransform="uppercase" letterSpacing="wide">
          <FaShoppingBasket style={{ display: 'inline', marginRight: '6px' }} />
          {cart.length} {cart.length === 1 ? 'item' : 'itens'}
        </Text>
        <VStack align="stretch" gap={2}>
          {cart.map((item, i) => (
            <Flex key={item.cartId || i} justify="space-between" align="center">
              <VStack align="start" gap={0}>
                <Text fontSize="sm" fontWeight="bold" color="gray.800">{item.name}</Text>
                {item.customizations?.length > 0 && (
                  <Text fontSize="xs" color="gray.400">+ {item.customizations.map(c => c.name).join(', ')}</Text>
                )}
              </VStack>
              <Text fontSize="sm" fontWeight="bold" color="gray.700">R$ {item.price.toFixed(2)}</Text>
            </Flex>
          ))}
        </VStack>
      </Box>

      {/* Dados do Cliente */}
      <Box p={4} bg="gray.50" borderRadius="xl">
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={3} textTransform="uppercase" letterSpacing="wide">
          <FaUser style={{ display: 'inline', marginRight: '6px' }} />
          Cliente
        </Text>
        <Text fontSize="sm" color="gray.800" fontWeight="bold">{formData.name}</Text>
        <Text fontSize="sm" color="gray.600">{formData.phone}</Text>
      </Box>

      {/* Endereço */}
      <Box p={4} bg="gray.50" borderRadius="xl">
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={3} textTransform="uppercase" letterSpacing="wide">
          <FaMapMarkerAlt style={{ display: 'inline', marginRight: '6px' }} />
          Entrega
        </Text>
        <Text fontSize="sm" color="gray.800">
          {formData.street}, {formData.number}
          {formData.complement ? ` - ${formData.complement}` : ''}
        </Text>
        <Text fontSize="sm" color="gray.600">
          {formData.neighborhood} — {formData.city}/{formData.state}
        </Text>
        <Text fontSize="xs" color="gray.400">CEP: {formData.cep}</Text>
      </Box>

      {/* Pagamento */}
      <Box p={4} bg="gray.50" borderRadius="xl">
        <Text fontSize="xs" fontWeight="bold" color="gray.500" mb={3} textTransform="uppercase" letterSpacing="wide">
          <FaCreditCard style={{ display: 'inline', marginRight: '6px' }} />
          Pagamento
        </Text>
        <Text fontSize="sm" fontWeight="bold" color="gray.800">{methodLabels[paymentMethod]}</Text>
      </Box>

      {/* Total */}
      <Flex p={5} bg="brand.50" borderRadius="xl" border="2px solid" borderColor="brand.200" justify="space-between" align="center">
        <Text color="brand.700" fontWeight="bold" fontSize="lg">Total</Text>
        <Text fontSize="3xl" fontWeight="black" color="brand.600">R$ {total.toFixed(2)}</Text>
      </Flex>

      <HStack gap={3} mt={2}>
        <Button flex={1} h="56px" variant="outline" onClick={onPrev} disabled={loading}>
          <FaArrowLeft style={{ marginRight: '8px' }} /> Voltar
        </Button>
        <Button
          flex={2} h="56px" colorPalette="brand" fontWeight="bold" fontSize="md"
          onClick={onConfirm} disabled={loading}
        >
          {loading ? <Spinner size="sm" /> : (
            <><FaCheckCircle style={{ marginRight: '8px' }} /> Confirmar Pedido</>
          )}
        </Button>
      </HStack>
    </VStack>
  );
}

// === PÁGINA PRINCIPAL ===

export default function CheckoutPage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { cart = [], total = 0, restaurantName = '', isStoreOpen = true } = location.state || {};

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [formData, setFormData] = useState({
    name: '', phone: '', cep: '', street: '', number: '',
    complement: '', neighborhood: '', city: '', state: ''
  });

  // Se o usuário acessar direto sem carrinho, volta pro cardápio
  if (cart.length === 0) {
    return (
      <Center h="100vh" bg="gray.50">
        <VStack gap={4}>
          <Text fontSize="xl" color="gray.500">Seu carrinho está vazio.</Text>
          <Button colorPalette="brand" onClick={() => navigate(`/cardapio/${slug}`)}>
            Voltar ao Cardápio
          </Button>
        </VStack>
      </Center>
    );
  }

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
      if (digits.length === 8) fetchCep(digits);
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const fetchCep = async (cep) => {
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
  };

  const validateStep1 = () => {
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.name.trim()) { toaster.create({ title: "Campo Obrigatório", description: "Preencha seu nome completo.", type: "error" }); return false; }
    if (phoneDigits.length !== 11) { toaster.create({ title: "WhatsApp Inválido", description: "Informe um número válido com 11 dígitos.", type: "error" }); return false; }
    if (formData.cep.replace(/\D/g, '').length !== 8) { toaster.create({ title: "CEP Inválido", description: "Informe um CEP válido.", type: "error" }); return false; }
    if (!formData.street.trim()) { toaster.create({ title: "Campo Obrigatório", description: "O endereço é obrigatório.", type: "error" }); return false; }
    if (!formData.number.trim()) { toaster.create({ title: "Campo Obrigatório", description: "O número é obrigatório.", type: "error" }); return false; }
    if (!formData.neighborhood.trim()) { toaster.create({ title: "Campo Obrigatório", description: "O bairro é obrigatório.", type: "error" }); return false; }
    if (!formData.city.trim() || !formData.state.trim()) { toaster.create({ title: "Campo Obrigatório", description: "Cidade e estado são obrigatórios.", type: "error" }); return false; }
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !validateStep1()) return;
    if (step === 1 && !paymentMethod) { toaster.create({ title: "Selecione", description: "Escolha uma forma de pagamento.", type: "warning" }); return; }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => setStep(prev => prev - 1);

  const handleConfirm = async () => {
    if (!isStoreOpen) {
      toaster.create({ title: "Loja Fechada", description: "Não estamos aceitando pedidos.", type: "warning" });
      return;
    }

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

      const fullAddress = [
        `${formData.street}, ${formData.number}`,
        formData.complement || null,
        formData.neighborhood,
        `${formData.city} - ${formData.state}`,
        `CEP: ${formData.cep}`
      ].filter(Boolean).join(' - ');

      const payload = {
        slug,
        clientId: formData.phone.replace(/\D/g, ''),
        customerName: formData.name,
        items: itemsPayload,
        payment: { method: paymentMethod, cardHash: null },
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
        title: "Pedido Confirmado! 🎉",
        description: "Seu pedido foi enviado para a cozinha.",
        type: "success",
      });

      // Redireciona para a tela de acompanhamento
      setTimeout(() => {
        navigate(`/pedido/${response.data.orderId}`, {
          state: { restaurantName }
        });
      }, 1000);

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

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box
        bgGradient="linear(to-br, brand.500, brand.neon)"
        py={6} px={4} color="white" textAlign="center"
      >
        <Text fontSize="sm" opacity={0.9}>{restaurantName}</Text>
        <Heading size="lg" fontWeight="800" mt={1}>Checkout</Heading>
      </Box>

      <Container maxW="container.sm" py={8} px={4}>
        <Box bg="white" p={{ base: 6, md: 8 }} borderRadius="2xl" boxShadow="0 10px 30px -10px rgba(0,0,0,0.08)">
          <Stepper currentStep={step} />

          {step === 0 && (
            <StepDados
              formData={formData}
              onChange={handleChange}
              onNext={handleNext}
              cepLoading={cepLoading}
              cepError={cepError}
            />
          )}

          {step === 1 && (
            <StepPagamento
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              onNext={handleNext}
              onPrev={handlePrev}
              total={total}
            />
          )}

          {step === 2 && (
            <StepConfirmacao
              cart={cart}
              formData={formData}
              paymentMethod={paymentMethod}
              total={total}
              onPrev={handlePrev}
              onConfirm={handleConfirm}
              loading={loading}
            />
          )}
        </Box>
      </Container>
    </Box>
  );
}
