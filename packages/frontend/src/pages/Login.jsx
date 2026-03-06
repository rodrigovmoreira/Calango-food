import { Button } from "../components/ui/button";
import { Input } from "@chakra-ui/react"; 
import { Box, Flex, VStack, Heading } from "@chakra-ui/react";
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  return (
    <Flex minH="100vh" align="center" justify="center" 
      bgImage="url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1500&q=80')" 
      bgSize="cover">
      <Box 
        p={8} 
        w="400px" 
        borderRadius="xl" 
        // Glassmorphism effect:
        bg="rgba(255, 255, 255, 0.1)" 
        backdropFilter="blur(12px)" 
        border="1px solid rgba(255, 255, 255, 0.2)"
        boxShadow="xl"
      >
        <VStack spacing={6}>
          <Heading color="white" size="lg">Calango-food</Heading>
          <Input placeholder="E-mail" variant="outline" color="white" _placeholder={{color: 'gray.300'}} />
          <Input placeholder="Senha" type="password" variant="outline" color="white" _placeholder={{color: 'gray.300'}} />
          <Button variant="brand" w="full" onClick={() => navigate('/kitchen')}>
            Entrar no Painel
          </Button>
        </VStack>
      </Box>
    </Flex>
  );
}