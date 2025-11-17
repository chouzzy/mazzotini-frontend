
// ============================================================================
//   VARIANTES DE ANIMAÇÃO (Framer Motion)

import { HeroHomepageData } from "@/types";
import { whatsappLink } from "@/utils";
import { useAuth0 } from "@auth0/auth0-react";
import { Flex, Heading, Button, VStack, HStack, Icon, Text, Image } from "@chakra-ui/react";
import { motion, Variants } from "framer-motion";
import { PiArrowRight, PiSignIn } from "react-icons/pi";

// ============================================================================
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: "easeOut" }
    }
};



export function Hero({ pageData }: { pageData: HeroHomepageData }) {

    const { loginWithRedirect } = useAuth0();
    const MotionFlex = motion(Flex);
    const MotionHeading = motion(Heading);
    const MotionText = motion(Text);
    const MotionButton = motion(Button);
    return (
        <Flex as="main" flex={1}
            w='100%'
            flexDir={'column'}
            bgImage={`url('/home/wave.png')`}
            bgSize="contain"
            bgRepeat={'no-repeat'}
            bgPos="bottom"
        >
            < MotionFlex
                as="section"
                w="100%"
                flexDir={'column'}
                minH={{ base: '94vh', md: '94vh' }
                }
                justifyContent="center"
                alignItems="center"
                px={{ base: 4, md: 8 }}
                // bg="black"


                bgRepeat="no-repeat"
                color="white"
                textAlign="center"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >

                <VStack gap={8} maxW="3xl" mb={40}>
                    <MotionHeading
                        as="h1"
                        fontSize={{ base: '3xl', md: '5xl' }}
                        fontWeight="bold"
                        lineHeight={1.2}
                        variants={itemVariants}
                    >
                        {pageData.hero.title}
                    </MotionHeading>
                    <MotionText
                        fontSize={{ base: 'md', md: 'lg' }}
                        color="gray.300"
                        variants={itemVariants}
                    >
                        {pageData.hero.subtitle}
                    </MotionText>
                    <Flex flexDir={{ base: 'column', md: 'row' }} gap={{ base: 4, md: 16 }} justifyContent={'center'} alignItems={'center'}>

                        {/* <MotionButton
                            onClick={() => window.open(whatsappLink(), '_blank')}
                            size={{ base: 'md', md: 'xl' }}
                            py={4}
                            px={12}
                            minW={64}
                            border={'1px solid'}
                            borderColor={'brand.600'}
                            bgColor={'transparent'}
                            _hover={{ bgColor: 'brand.600', color: 'white', transition: '0.3s' }}
                            color={'white'}
                            borderRadius={'2xl'}
                            variants={itemVariants}
                        >
                            <HStack gap={2}>
                                <Text fontWeight={'light'} fontSize={'lg'} letterSpacing={1.2}>{pageData.hero.ctaButtonDemo}</Text>
                            </HStack>
                        </MotionButton> */}
                        <MotionButton
                            onClick={() => loginWithRedirect()}
                            size={{ base: 'md', md: 'xl' }}
                            py={4}
                            px={12}
                            minW={64}
                            bgColor={'brand.600'}
                            _hover={{ bgColor: 'ghostWhite', color: 'brand.700', transition: '0.3s', border: '1px solid' }}
                            color={'white'}
                            borderRadius={'2xl'}
                            variants={itemVariants}
                        >
                            <Flex gap={2} alignItems={'center'} >
                                <Text fontWeight={'light'} fontSize={'lg'} letterSpacing={1.2}>{pageData.hero.ctaButton}</Text>
                                <Icon as={PiSignIn} size={'2xl'} mt={1} />
                            </Flex>
                        </MotionButton>
                    </Flex>
                </VStack>
                {/* <Flex flexDir={'row'} position={'relative'} w='100%' alignItems={'center'} justifyContent={'center'} gap={16} mt={{base:2, md:10}} overflowX={'hidden'} display={{base:'none', md:'flex'}}>
                    <Image boxSize={'md'} objectFit={'contain'} src={pageData.hero.dashboardImage[0]} alt={pageData.hero.title} />
                    <Image w={{base: 600, md: 600}} position={'absolute'} mx='auto' src={pageData.hero.dashboardImage[1]} alt={pageData.hero.title} />
                    <Image boxSize={'md'} objectFit={'contain'} src={pageData.hero.dashboardImage[2]} alt={pageData.hero.title} />
                </Flex> */}
            </MotionFlex >
        </Flex>
    )
}