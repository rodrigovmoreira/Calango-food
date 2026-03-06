import Sidebar from '../components/Sidebar';
import { Heading, Box, Text } from '@chakra-ui/react';

export default function Settings() {
  return (
    <Sidebar>
      <Box p={8} borderRadius="2xl" bg="white" boxShadow="xl">
        <Heading color="brand.500" mb={4}>Configurações de WhatsApp</Heading>
        <Text>O QR Code aparecerá aqui em breve.</Text>
      </Box>
    </Sidebar>
  );
}