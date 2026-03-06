import React, { useState } from 'react';
import {
  Box, Flex, VStack, Heading, Text, Image, Card, 
  Tabs, Stack, Alert
} from '@chakra-ui/react';
// Importe os componentes de UI da sua pasta local, não da lib principal
import { Button } from "../components/ui/button"; 
import { Field } from "../components/ui/field"; // O substituto do FormControl na v3
import { Input } from "@chakra-ui/react"; 
import { Toaster, toaster } from "../components/ui/toaster"; 
import { authAPI } from '../services/api';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.target);
    const data = {
      email: formData.get('email'),
      password: formData.get('password')
    };

    try {
      const response = await authAPI.login(data);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: 'SET_USER', payload: user });
      
      toaster.create({
        title: "Bem-vindo!",
        type: "success",
      });
      
      navigate('/kitchen');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao entrar');
      setLoading(false);
    }
  };

  return (
    <Flex minH="100vh" direction={{ base: 'column', md: 'row' }}>
      <Toaster />
      
      <Flex flex={1} bgGradient="linear(to-br, brand.500, brand.700)" justify="center" align="center" p={12} color="white">
        <VStack gap={6}>
          <Heading size="3xl" fontWeight="extrabold">Calango-food</Heading>
          <Text fontSize="xl">Delivery inteligente e automatizado.</Text>
        </VStack>
      </Flex>

      <Flex flex={1} bg="gray.50" justify="center" align="center" p={8}>
        <Card.Root maxW="md" w="full" variant="outline" boxShadow="xl" bg="white">
          <Card.Body p={10}>
            <form onSubmit={handleLogin}>
              <VStack gap={6} align="stretch">
                <Heading size="lg" textAlign="center">Entrar</Heading>
                
                {error && <Alert.Root status="error"><Alert.Content>{error}</Alert.Content></Alert.Root>}

                {/* Na v3 usamos Field em vez de FormControl */}
                <Field label="E-mail">
                  <Input name="email" type="email" placeholder="seu@email.com" size="lg" />
                </Field>

                <Field label="Senha">
                  <Input name="password" type="password" placeholder="••••••••" size="lg" />
                </Field>

                <Button type="submit" colorPalette="brand" size="xl" loading={loading}>
                  Acessar Sistema
                </Button>
              </VStack>
            </form>
          </Card.Body>
        </Card.Root>
      </Flex>
    </Flex>
  );
};

export default Login;