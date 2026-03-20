import React, { useState, useEffect } from 'react';
import { 
  Box, Flex, Text, Button, IconButton, Image, Heading, VStack, HStack, 
  Portal, Badge 
} from '@chakra-ui/react';
import { FaTimes, FaPlus, FaMinus } from 'react-icons/fa';

export default function ProductModal({ isOpen, onClose, product, onAddToCart }) {
  const [selections, setSelections] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [currentTotal, setCurrentTotal] = useState(0);

  useEffect(() => {
    if (isOpen && product) {
      setSelections({});
      setQuantity(1);
      calculateTotal({}, 1);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const calculateTotal = (currentSelections, qty) => {
    let basePrice = product.price || 0;
    let customPrice = 0;
    let hasReplacementStrategy = false;

    if (product.attributeGroups) {
      product.attributeGroups.forEach(group => {
        const selectedForGroup = currentSelections[group.name] || [];
        if (selectedForGroup.length > 0) {
          const prices = selectedForGroup.map(optName => {
            const opt = group.options.find(o => o.name === optName);
            return opt ? Number(opt.price || 0) : 0;
          });

          let groupTotal = 0;
          if (group.pricingStrategy === 'HIGHEST') {
            groupTotal = Math.max(...prices);
            hasReplacementStrategy = true;
          } else if (group.pricingStrategy === 'AVERAGE') {
            const sum = prices.reduce((a, b) => a + b, 0);
            groupTotal = sum / prices.length;
            hasReplacementStrategy = true;
          } else {
            groupTotal = prices.reduce((a, b) => a + b, 0);
          }
          customPrice += groupTotal;
        }
      });
    }

    if (hasReplacementStrategy) {
      basePrice = 0;
    }

    setCurrentTotal((basePrice + customPrice) * qty);
  };

  const handleAddOption = (group, optionName) => {
    setSelections(prev => {
      const currentGroupSelections = prev[group.name] || [];

      if (group.maxOptions === 1) {
        const newSelections = { ...prev, [group.name]: [optionName] };
        calculateTotal(newSelections, quantity);
        return newSelections;
      } 
      
      if (currentGroupSelections.length < group.maxOptions) {
        const newSelections = { ...prev, [group.name]: [...currentGroupSelections, optionName] };
        calculateTotal(newSelections, quantity);
        return newSelections;
      }

      return prev;
    });
  };

  const handleRemoveOption = (group, optionName) => {
    setSelections(prev => {
      const currentGroupSelections = prev[group.name] || [];
      const index = currentGroupSelections.lastIndexOf(optionName);
      
      if (index !== -1) {
        const next = [...currentGroupSelections];
        next.splice(index, 1);
        const newSelections = { ...prev, [group.name]: next };
        calculateTotal(newSelections, quantity);
        return newSelections;
      }

      return prev;
    });
  };

  const handleQuantityChange = (delta) => {
    const newQty = Math.max(1, quantity + delta);
    setQuantity(newQty);
    calculateTotal(selections, newQty);
  };

  const isValid = () => {
    if (!product.attributeGroups) return true;
    for (const group of product.attributeGroups) {
      const selectedCount = (selections[group.name] || []).length;
      if (selectedCount < group.minOptions || selectedCount > group.maxOptions) {
        return false;
      }
    }
    return true;
  };

  const handleAdd = () => {
    if (!isValid()) return;

    // Constrói o array plano de customizations para o CartDrawer
    const finalCustomizations = [];
    Object.entries(selections).forEach(([groupName, optionNames]) => {
      const groupDef = product.attributeGroups.find(g => g.name === groupName);
      if (groupDef) {
        optionNames.forEach(optName => {
          const optDef = groupDef.options.find(o => o.name === optName);
          if (optDef) {
            finalCustomizations.push({
              name: optDef.name,
              price: Number(optDef.price || 0)
            });
          }
        });
      }
    });

    // Submete como vários itens caso a quantity > 1 (simplificação do carrinho MVP)
    // Ou passamos { ...product, price: unitTotal, customizations } enviando pro Cart avaliar.
    // O CartDrawer mapeia item._id -> item.productId, unitário.
    for (let i = 0; i < quantity; i++) {
        onAddToCart({
          ...product,
          price: currentTotal / quantity, // Preço unitário ajustado com customizações
          customizations: finalCustomizations
        });
    }
    onClose();
  };

  return (
    <Portal>
      <Box position="fixed" top={0} left={0} w="100vw" h="100vh" bg="blackAlpha.600" zIndex={1500} onClick={onClose} backdropFilter="blur(3px)" />
      
      <Flex position="fixed" top={0} right={0} w={{ base: "100%", md: "500px" }} h="100vh" bg="gray.50" zIndex={1600} direction="column" boxShadow="-5px 0 20px rgba(0,0,0,0.2)" animation="slideIn 0.3s ease-out">
        <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Imagem Cover */}
        <Box position="relative" h="250px" bg="gray.200">
          {product.imageUrl ? (
            <Image src={product.imageUrl} w="full" h="full" objectFit="cover" />
          ) : (
            <Flex w="full" h="full" bgGradient="linear(to-br, brand.500, brand.neon)" align="center" justify="center">
              <Text color="white" fontWeight="bold" fontSize="2xl">{product.name}</Text>
            </Flex>
          )}
          
          <IconButton position="absolute" top={4} right={4} colorPalette="gray" bg="white" rounded="full" onClick={onClose} aria-label="Fechar" shadow="md">
            <FaTimes />
          </IconButton>
        </Box>

        {/* Detalhes do Produto */}
        <Box flex={1} overflowY="auto" pb="100px">
          <Box p={6} bg="white" shadow="sm">
            <Heading size="xl" mb={2} color="gray.800">{product.name}</Heading>
            <Text color="gray.500">{product.description}</Text>
            <Text color="brand.600" fontSize="2xl" fontWeight="black" mt={4}>
               A partir de R$ {product.price.toFixed(2)}
            </Text>
          </Box>

          {/* Opções */}
          {product.attributeGroups && product.attributeGroups.map((group, gIdx) => {
            const currentGroupSelections = selections[group.name] || [];
            const isGroupValid = currentGroupSelections.length >= group.minOptions && currentGroupSelections.length <= group.maxOptions;

            return (
              <Box key={gIdx} mt={4} p={6} bg="white" shadow="sm">
                <Flex justify="space-between" align="center" mb={2}>
                  <Heading size="md" color="gray.800">{group.name}</Heading>
                  {!isGroupValid && group.minOptions > 0 && (
                    <Badge colorPalette="red">Obrigatório</Badge>
                  )}
                </Flex>
                <Text fontSize="sm" color="gray.500" mb={4}>
                  Escolha de {group.minOptions} até {group.maxOptions} opções
                  {group.pricingStrategy !== 'SUM' && ` (Cobrança: ${group.pricingStrategy === 'HIGHEST' ? 'Maior Valor' : 'Proporcional'})`}
                </Text>

                <VStack align="stretch" gap={3}>
                  {group.options.map((opt, oIdx) => {
                    const count = currentGroupSelections.filter(n => n === opt.name).length;
                    const totalSelectedInGroup = currentGroupSelections.length;

                    if (group.maxOptions === 1) {
                      const isSelected = count > 0;
                      return (
                        <Flex 
                          key={oIdx} 
                          p={4} 
                          bg={isSelected ? "brand.50" : "white"} 
                          border="2px solid" 
                          borderColor={isSelected ? "brand.500" : "gray.200"} 
                          borderRadius="xl"
                          cursor="pointer"
                          onClick={() => handleAddOption(group, opt.name)}
                          justify="space-between"
                          align="center"
                          transition="all 0.2s"
                        >
                          <Text fontWeight={isSelected ? "bold" : "medium"} color={isSelected ? "brand.700" : "gray.700"}>
                            {opt.name}
                          </Text>
                          <Text fontWeight="bold" color="gray.600">
                            {opt.price === null || opt.price === undefined || opt.price === '' 
                              ? 'Incluso' 
                              : `+ R$ ${Number(opt.price).toFixed(2)}`}
                          </Text>
                        </Flex>
                      );
                    } else {
                      const canAdd = totalSelectedInGroup < group.maxOptions;
                      return (
                        <Flex 
                          key={oIdx} 
                          p={4} 
                          bg="white" 
                          border="1px solid" 
                          borderColor="gray.200" 
                          borderRadius="xl"
                          justify="space-between"
                          align="center"
                        >
                          <Box>
                            <Text fontWeight="medium" color="gray.700">{opt.name}</Text>
                            <Text fontWeight="bold" color="gray.500" fontSize="sm">
                              {opt.price === null || opt.price === undefined || opt.price === '' 
                                ? 'Incluso' 
                                : `+ R$ ${Number(opt.price).toFixed(2)}`}
                            </Text>
                          </Box>
                          
                          <Flex align="center" gap={3} bg="gray.100" borderRadius="xl" px={2} py={1}>
                            <IconButton 
                              size="sm" variant="ghost" color="gray.600"
                              disabled={count === 0} 
                              onClick={() => handleRemoveOption(group, opt.name)}
                            >
                              <FaMinus size={12}/>
                            </IconButton>
                            <Text fontWeight="bold" w="20px" textAlign="center">{count}</Text>
                            <IconButton 
                              size="sm" variant="ghost" color="gray.600"
                              disabled={!canAdd} 
                              onClick={() => handleAddOption(group, opt.name)}
                            >
                              <FaPlus size={12}/>
                            </IconButton>
                          </Flex>
                        </Flex>
                      );
                    }
                  })}
                </VStack>
              </Box>
            );
          })}
        </Box>

        {/* Call to Action Footer */}
        <Box position="absolute" bottom={0} left={0} w="full" p={4} bg="white" borderTop="1px solid" borderColor="gray.100" shadow="lg">
          <Flex gap={4}>
            <HStack bg="gray.100" borderRadius="xl" px={4} py={3}>
              <IconButton variant="ghost" color="gray.600" size="sm" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}><FaMinus /></IconButton>
              <Text fontWeight="bold" w="20px" textAlign="center">{quantity}</Text>
              <IconButton variant="ghost" color="gray.600" size="sm" onClick={() => handleQuantityChange(1)}><FaPlus /></IconButton>
            </HStack>
            
            <Button 
              flex={1} 
              colorPalette="brand" 
              size="lg" 
              h="56px" 
              borderRadius="xl"
              onClick={handleAdd}
              disabled={!isValid()}
            >
              Adicionar • R$ {currentTotal.toFixed(2)}
            </Button>
          </Flex>
        </Box>
      </Flex>
    </Portal>
  );
}
