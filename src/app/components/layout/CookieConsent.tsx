'use client';

import { Box, Button, Flex, Text, Link, Container } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { PiCookie } from 'react-icons/pi';

export function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Verifica se o usuário já aceitou os cookies
        const consent = localStorage.getItem('mazzotini-cookie-consent');
        if (!consent) {
            // Pequeno delay para a animação ficar suave na entrada
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('mazzotini-cookie-consent', 'true');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <Box
            position="fixed"
            bottom="0"
            left="0"
            right="0"
            zIndex={9999}
            bg="gray.900"
            borderTop="1px solid"
            borderColor="gray.700"
            boxShadow="0 -4px 6px -1px rgba(0, 0, 0, 0.1)"
            p={4}
            // Animação simples de entrada via CSS inline se a keyframe não existir no tema
            style={{ animation: 'slideInBottom 0.5s ease-out' }}
        >
            <Container maxW="container.xl">
                <Flex
                    direction={{ base: 'column', md: 'row' }}
                    align="center"
                    justify="space-between"
                    gap={4}
                >
                    <Flex align="center" gap={3}>
                        <Box color="brand.500" fontSize="2xl">
                            <PiCookie />
                        </Box>
                        <Text fontSize="sm" color="gray.300">
                            Nós utilizamos cookies para melhorar a sua experiência e garantir a segurança do sistema. 
                            Ao continuar navegando, você concorda com a nossa{' '}
                            <Link href="/politica-privacidade" color="brand.400" textDecoration="underline">
                                Política de Privacidade
                            </Link>.
                        </Text>
                    </Flex>
                    
                    <Button 
                        onClick={handleAccept}
                        colorScheme="brand" 
                        bgColor="brand.600"
                        color="white"
                        size="sm"
                        minW="120px"
                        _hover={{ bgColor: 'brand.700' }}
                    >
                        Concordar e Fechar
                    </Button>
                </Flex>
            </Container>
            
            {/* Definição da animação localmente para garantir que funcione */}
            <style jsx global>{`
                @keyframes slideInBottom {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </Box>
    );
}
