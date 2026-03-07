import React, { useState } from 'react';
import { Box, Flex, VStack, Heading, Text, Card, Tabs, Input, Icon } from '@chakra-ui/react';
import { Button } from "../components/ui/button";
import { Field } from "../components/ui/field";
import { Toaster, toaster } from "../components/ui/toaster";
import { authAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { FaUtensils } from 'react-icons/fa';
import { LuEye, LuEyeOff } from "react-icons/lu";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const handleAuth = async (e, type) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    if (type === 'register' && data.password !== data.confirmPassword) {
      toaster.create({ title: "As senhas não coincidem", type: "error" });
      setLoading(false);
      return;
    }

    try {
      const response = type === 'login' 
        ? await authAPI.login({ email: data.email, password: data.password }) 
        : await authAPI.register({ name: data.name, email: data.email, password: data.password });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: 'SET_USER', payload: user });

      toaster.create({ title: `Bem-vindo, ${user.name}!`, type: "success" });
      navigate('/kitchen');
    } catch (err) {
      toaster.create({ 
        title: "Erro na autenticação", 
        description: err.response?.data?.message || "Verifique seus dados", 
        type: "error" 
      });
    } finally { setLoading(false); }
  };

  return (
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
      <Toaster />
      <Flex flex={1} bgGradient="linear(to-br, brand.500, brand.700)" justify="center" align="center" direction="column" p={8} color="white">
        <VStack gap={6}>
          <Box bg="whiteAlpha.200" p={8} borderRadius="full" backdropFilter="blur(10px)">
             <Icon as={FaUtensils} boxSize="100px" />
          </Box>
          <Heading size="3xl" fontWeight="bold">Calango-food</Heading>
          <Text fontSize="xl" opacity={0.9}>Sua Cozinha Digital Automatizada</Text>
        </VStack>
      </Flex>

      <Flex flex={1} bg="gray.50" justify="center" align="center" p={4}>
        <Box w="full" maxW="md">
          <Card.Root variant="outline" boxShadow="2xl" borderRadius="2xl" bg="white">
            <Card.Body p={8}>
              <Tabs.Root defaultValue="login" colorPalette="brand" variant="enclosed">
                <Tabs.List w="full" mb={6}>
                  <Tabs.Trigger value="login" flex={1} py={3} fontWeight="bold">Login</Tabs.Trigger>
                  <Tabs.Trigger value="register" flex={1} py={3} fontWeight="bold">Cadastro</Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content value="login">
                  <form onSubmit={(e) => handleAuth(e, 'login')}>
                    <VStack gap={4} align="stretch">
                      <Heading size="md" textAlign="center" mb={2} color="gray.700">Bem-vindo de volta</Heading>
                      <Field label={<Text color="gray.700">E-mail</Text>}>
                        <Input name="email" type="email" placeholder="seu@email.com" color="gray.800" borderColor="gray.300" />
                      </Field>
                      <Field label={<Text color="gray.700">Senha</Text>}>
                        <Input name="password" type={showPassword ? "text" : "password"} placeholder="Sua senha" color="gray.800" borderColor="gray.300" />
                      </Field>
                      <Button type="submit" colorPalette="brand" size="lg" loading={loading}>Entrar</Button>
                    </VStack>
                  </form>
                </Tabs.Content>

                <Tabs.Content value="register">
                  <form onSubmit={(e) => handleAuth(e, 'register')}>
                    <VStack gap={4} align="stretch">
                      <Heading size="md" textAlign="center" mb={2} color="gray.700">Crie sua conta no Calango Food</Heading>
                      <Field label={<Text color="gray.700">Nome</Text>}>
                        <Input name="name" placeholder="Seu nome" color="gray.800" borderColor="gray.300" />
                      </Field>
                      <Field label={<Text color="gray.700">E-mail</Text>}>
                        <Input name="email" type="email" placeholder="seu@email.com" color="gray.800" borderColor="gray.300" />
                      </Field>
                      <Field label={<Text color="gray.700">Senha</Text>}>
                        <Input name="password" type="password" placeholder="Mínimo 6 caracteres" color="gray.800" borderColor="gray.300" />
                      </Field>
                      <Field label={<Text color="gray.700">Confirmar Senha</Text>}>
                        <Input name="confirmPassword" type="password" placeholder="Repita a senha" color="gray.800" borderColor="gray.300" />
                      </Field>
                      <Button type="submit" colorPalette="brand" size="lg" loading={loading}>Criar Conta</Button>
                    </VStack>
                  </form>
                </Tabs.Content>
              </Tabs.Root>
            </Card.Body>
          </Card.Root>
          <Text fontSize="xs" color="gray.500" textAlign="center" mt={6}>Sistema Rodrigo Dev &copy; 2026</Text>
        </Box>
      </Flex>
    </Flex>
  );
};

export default Login;