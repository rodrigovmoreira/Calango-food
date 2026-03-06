import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const config = defineConfig({
  globalCss: {
    "html, body": {
      backgroundColor: "white",
      color: "gray.800",
    }
  },
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#E8F5E9' },
          100: { value: '#C8E6C9' },
          200: { value: '#A5D6A7' },
          300: { value: '#81C784' },
          400: { value: '#66BB6A' },
          500: { value: '#6FA374' }, // Moss Green (Primary)
          600: { value: '#578A5C' }, // Darker Moss (Hover)
          700: { value: '#388E3C' },
          800: { value: '#2E7D32' },
          900: { value: '#1B5E20' },
          neon: { value: '#A78BFA' }, // Lavender
        },
      },
      fonts: {
        heading: { value: '"Segoe UI", sans-serif' },
        body: { value: '"Segoe UI", sans-serif' },
      },
    },
    semanticTokens: {
      shadows: {
        sm: { value: '0 1px 2px 0 rgba(167, 139, 250, 0.5)' },
        base: { value: '0 1px 3px 0 rgba(167, 139, 250, 0.6), 0 1px 2px 0 rgba(167, 139, 250, 0.3)' },
        md: { value: '0 4px 6px -1px rgba(167, 139, 250, 0.6), 0 2px 4px -1px rgba(167, 139, 250, 0.3)' },
        lg: { value: '0 10px 15px -3px rgba(167, 139, 250, 0.6), 0 4px 6px -2px rgba(167, 139, 250, 0.3)' },
        xl: { value: '0 20px 25px -5px rgba(167, 139, 250, 0.6), 0 10px 10px -5px rgba(167, 139, 250, 0.3)' },
      }
    },
    recipes: {
      button: {
        variants: {
          variant: {
            brand: {
              bg: 'brand.500',
              color: 'white',
              _hover: {
                bg: 'brand.600',
                boxShadow: 'md',
                _disabled: {
                  bg: 'brand.500',
                }
              },
              _active: {
                bg: 'brand.700',
              }
            }
          }
        }
      },
      card: {
        base: {
          container: {
            borderColor: 'rgba(167, 139, 250, 0.3)',
            borderWidth: '1px',
            boxShadow: 'md',
            bg: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(10px)',
          }
        }
      }
    }
  }
});

const system = createSystem(defaultConfig, config);
export default system;
