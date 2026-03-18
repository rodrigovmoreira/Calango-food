import { Box, VStack, Icon, Flex, Text, Button } from '@chakra-ui/react';
import { Settings, LogOut, Utensils, Bike, ChefHat } from 'lucide-react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const NavItem = ({ icon, children, to, onClick }) => {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Flex
      as={onClick ? 'button' : RouterLink}
      to={to}
      onClick={onClick}
      align="center"
      p="4"
      mx="4"
      borderRadius="lg"
      cursor="pointer"
      w="85%" // Ajuste para não colar na borda
      bg={active ? 'brand.500' : 'transparent'}
      color={active ? 'white' : 'gray.600'}
      _hover={{
        bg: 'brand.400',
        color: 'white',
      }}
      transition="0.2s"
    >
      <Icon mr="4" fontSize="18" as={icon} />
      <Text fontWeight="medium">{children}</Text>
    </Flex>
  );
};

export default function Sidebar({ children }) {
  const { dispatch } = useApp();
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Limpa o mini-banco do navegador
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // 2. Avisa o Gerente (AppContext) para resetar tudo
    dispatch({ type: 'LOGOUT' });

    // 3. Manda para a Landing Page
    navigate('/');
  };

  return (
    <Box minH="100vh">
      <Box
        bg="white"
        borderRightWidth="1px"
        borderRightColor="gray.200"
        w={{ base: 'full', md: 60 }}
        pos="fixed"
        h="full"
      >
        <Flex h="20" alignItems="center" mx="8" mb={4}>
          <Text fontSize="2xl" fontWeight="bold" color="brand.500">
            Calango-Food
          </Text>
        </Flex>

        <VStack align="stretch">
          <NavItem icon={ChefHat} to="/kitchen">Cozinha</NavItem>
          <NavItem icon={Bike} to="/entregadores">Entregadores</NavItem>
          <NavItem icon={Utensils} to="/products">Cardápio (Pratos)</NavItem>
          <NavItem icon={Settings} to="/settings">Configurações</NavItem>
          <NavItem icon={LogOut} onClick={handleLogout}>Sair</NavItem>
        </VStack>
      </Box>

      <Box ml={{ base: 0, md: 60 }} p="4">
        {children}
      </Box>
    </Box>
  );
}