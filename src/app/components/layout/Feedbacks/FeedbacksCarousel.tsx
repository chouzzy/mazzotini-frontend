// src/components/layout/FeedbacksCarousel.tsx
'use client';

// --- React e Chakra UI ---
import { useEffect, useState } from 'react';
import {
    Box,
    Text,
    Flex,
    Avatar,
    HStack,
    Icon,
    VStack,
    useBreakpointValue,
} from '@chakra-ui/react';
import { PiStarFill, PiCaretDoubleDownThin } from 'react-icons/pi';

// --- Swiper ---
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// --- Dados Locais ---
import { mazzotiniTestimonials, Testimonial } from '../../../data/testimonials';
import { useColorModeValue } from '../../ui/color-mode';


// ============================================================================
//   Componente para o Card Individual de Depoimento
// ============================================================================
interface TestimonialCardProps {
    testimonial: Testimonial;
}

function TestimonialCard({ testimonial }: TestimonialCardProps) {

    // --- Hooks e Estado ---

    // Hook para detectar se a visualização é mobile ou desktop
    const isMobile = useBreakpointValue({ base: true, sm: true, md: false });

    // Define um limite de caracteres para truncar o texto baseado no tamanho da tela
    // O valor padrão 200 é usado como fallback
    let testimonialLengthBox = useBreakpointValue({ base: 300, md: 500 }) || 200;

    // Estado que controla se o texto está truncado ou não.
    // Inicia como 'true' (truncado) se o texto for menor que o limite, mostrando o botão "Ver mais".
    const [isTruncated, setIsTruncated] = useState(true);

    // Hooks para definir cores baseadas no tema (light/dark mode)
    const quoteColor = useColorModeValue('gray.200', 'gray.300');
    const authorNameColor = useColorModeValue('white', 'white');
    const authorTitleColor = useColorModeValue('gray.400', 'gray.500');
    const starColor = useColorModeValue('yellow.400', 'yellow.500');


    // --- Renderização do Componente ---

    return (
        <Flex
            // Layout
            direction={{ base: 'column', md: 'row' }}
            alignItems={'center'}
            gap={{ base: 6, md: 16 }}
            py={{ base: 8, md: 12 }}
            color="white"
            maxW={{ base: '100%', md: '1920px' }} 
            mx='auto'
        >
            {/* Avatar do Autor (Aparece apenas em telas maiores que 'md') */}
            {(testimonial.authorImage && !isMobile) && (
                <Avatar.Root
                    boxSize={{ base: 24, md: 48 }}
                    shape="rounded"
                    overflow="hidden"
                >
                    <Avatar.Fallback name={testimonial.authorName} />
                    <Avatar.Image src={testimonial.authorImage} alt={`Foto de ${testimonial.authorName}`} />
                </Avatar.Root>
            )}

            {/* Conteúdo Principal (Citação, Autor, Avaliação) */}
            <Flex
                // Layout
                direction={{ base: 'column-reverse', md: 'column' }}
                width="100%"
                gap={4}
                align="flex-start"
                px={{ base: 4, md: 0 }}
                textAlign={{ base: 'justify', md: 'left' }}
            >
                {/* Bloco da Citação e Botão "Ver mais" */}
                <Flex
                    flexDir={'column'}
                    fontSize={{ base: 'sm', md: 'xl' }}
                    color={quoteColor}
                    lineHeight="tall"
                    letterSpacing={'wide'}
                >
                    <Text lineClamp={testimonial.quote.length > testimonialLengthBox && isTruncated ? 6 : undefined}>
                        {testimonial.quote}
                    </Text>

                    {/* Botão para expandir/recolher o texto (só aparece se o texto for longo) */}
                    {testimonial.quote.length > testimonialLengthBox && isTruncated && (
                        <Flex
                            as="button"
                            w='100%'
                            alignItems={'center'}
                            justifyContent={'center'}
                            p={2}
                            gap={2}
                            color='brand.400'
                            cursor={'pointer'}
                            onClick={() => setIsTruncated(false)} // Ao clicar, mostra o texto completo
                            _hover={{ color: 'brand.300' }}
                        >
                            Ver mais <PiCaretDoubleDownThin size={16} />
                        </Flex>
                    )}
                </Flex>

                {/* Bloco de Informações do Autor e Avaliação */}
                <Flex flexDir={'column'} width="100%" gap={2}>
                    <VStack
                        width="100%"
                        align={{ base: 'center', md: 'flex-start' }}
                        gap={1}
                    >
                        {/* Avatar do Autor (Aparece apenas em telas 'base') */}
                        {(testimonial.authorImage && isMobile) && (
                            <Avatar.Root
                                boxSize={{ base: 24, md: 48 }}
                                shape="rounded"
                                overflow="hidden"
                            >
                                <Avatar.Fallback name={testimonial.authorName} />
                                <Avatar.Image src={testimonial.authorImage} alt={`Foto de ${testimonial.authorName}`} />
                            </Avatar.Root>
                        )}

                        <Text fontWeight="bold" fontSize="xl" color={authorNameColor}>
                            {testimonial.authorName}
                        </Text>
                        <Text fontSize="md" color={authorTitleColor}>
                            {testimonial.authorTitle}
                        </Text>
                    </VStack>

                    {/* Renderiza as estrelas de avaliação se houver uma nota */}
                    {testimonial.rating && testimonial.rating > 0 && (
                        <HStack
                            width="100%"
                            justify={{ base: 'center', md: 'flex-start' }}
                        >
                            {Array.from({ length: 5 }).map((_, index) => (
                                <Icon
                                    key={index}
                                    as={PiStarFill}
                                    color={index < testimonial.rating! ? starColor : 'gray.600'}
                                    boxSize={5}
                                />
                            ))}
                        </HStack>
                    )}
                </Flex>
            </Flex>
        </Flex>
    );
}


// ============================================================================
//   Componente Principal que Monta o Carrossel
// ============================================================================
export function FeedbacksCarousel() {
    return (
        <Box
        
            bgColor={'black'}
            width="100%"
            px={8}
            minH={{ base: 'auto', md: '320px' }}
            borderRadius="sm"
            className="testimonial-carousel" // Classe para estilizações customizadas de CSS
        >
            <Swiper
                // Módulos do Swiper para funcionalidade
                modules={[Navigation, Pagination, Autoplay]}

                // Configurações do Carrossel
                spaceBetween={30}
                slidesPerView={1}
                loop={true}

                // Autoplay
                autoplay={{
                    delay: 5000,
                    disableOnInteraction: false,
                }}

                // Paginação (bolinhas)
                pagination={{
                    clickable: true,
                    dynamicBullets: true,
                }}

                // Navegação (setas) - desabilitada no seu código original
                navigation={false}

                className="mySwiper"
            >
                {/* Mapeia os dados dos depoimentos para criar um slide para cada um */}
                {mazzotiniTestimonials.map((testimonial) => {

                    // if (testimonial.id != '2') { return null; }
                    return (
                        <SwiperSlide key={testimonial.id}>
                            <TestimonialCard testimonial={testimonial} />
                        </SwiperSlide>
                    )
                }
                )}
            </Swiper>
        </Box>
    );
}
