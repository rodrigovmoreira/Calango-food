import { Box, VStack, Icon, Link, Flex, Text } from '@chakra-ui/react';
import { LayoutDashboard, Settings, LogOut, Utensils } from 'lucide-react';
import { Link as RouterLink, useLocation } from 'react-router-dom';

const NavItem = ({ icon, children, to }) => {
  const location = useLocation();
  const active = location.pathname === to;

  return (
    <Link
      as={RouterLink}
      to={to}
      style={{ textDecoration: 'none' }}
      _focus={{ boxShadow: 'none' }}
      w="full"
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        bg={active ? 'brand.500' : 'transparent'}
        color={active ? 'white' : 'inherit'}
        _hover={{
          bg: 'brand.400',
          color: 'white',
        }}
      >
        <Icon mr="4" fontSize="16" as={icon} />
        {children}
      </Flex>
    </Link>
  );
};

export default function Sidebar({ children }) {
  return (
    <Box minH="100vh">
      <Box
        transition="3s ease"
        bg="white"
        borderRightWidth="1px"
        borderRightStyle="solid"
        borderRightColor="gray.200"
        w={{ base: 'full', md: 60 }}
        pos="fixed"
        h="full"
      >
        <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
          <Text fontSize="2xl" fontWeight="bold" color="brand.500">
            Calango-food
          </Text>
        </Flex>
        <VStack spacing={1}>
          <NavItem icon={Utensils} to="/kitchen">Cozinha</NavItem>
          <NavItem icon={Settings} to="/settings">WhatsApp</NavItem>
          <NavItem icon={LogOut} to="/">Sair</NavItem>
        </VStack>
      </Box>
      <Box ml={{ base: 0, md: 60 }} p="4">
        {children}
      </Box>
    </Box>
  );
}