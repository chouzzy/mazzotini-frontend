// src/components/ui/MotionButton.tsx (ou onde preferir)
'use client'; // Necessário para hooks e interatividade

import { JSX } from "react";
import { Button, ButtonProps as ChakraButtonProps, Text, useBreakpointValue } from "@chakra-ui/react";
import { motion, Variants, Transition } from 'framer-motion'; // Importe motion e Variants
import { PiArrowRight, PiArrowRightBold } from "react-icons/pi";
import { FaLongArrowAltRight } from "react-icons/fa";


interface MotionButtonProps extends ChakraButtonProps {
    text?: string | JSX.Element,
    action?: () => void
}

const ChakraMotionButton = motion(Button);

export function MotionButton({ text = "Consulte agora" }: MotionButtonProps) {

    // Define as variantes de animação
    const buttonVariants: Variants = {
        initial: { // Estado normal (sem hover, sem clique)
            boxShadow: "0px 2px 5px rgba(0,0,0,0.1)", // Sombra sutil inicial (opcional)
            border: '1px solid white', // Borda azul
            backgroundColor: 'transparent',
            color: '#FFFFFF',
        },
        hover: { // Estado no hover
            backgroundColor: '#54b9c9',
            border: '1px solid #54b9c9', // Borda azul
            scale: 1.05, // Aumenta 5%
            boxShadow: "0px 4px 12px rgba(0,0,0,0.15)", // Sombra um pouco maior
            transition: { // Transição específica para o estado de hover
                type: "spring", // Tipo de transição (spring, tween)
                stiffness: 400,
                damping: 15
            }
        },
        tap: { // Estado ao clicar/pressionar
            scale: 0.80, // Diminui 5%
        }
    };

    // Transição padrão para todas as animações do botão (se não especificado na variante)
    const defaultTransition: Transition = {
        type: "spring",
        stiffness: 500,
        damping: 30
    };

    return (
        <ChakraMotionButton
            variants={buttonVariants}
            initial="initial"       // Define o estado inicial (o nome da variante)
            whileHover="hover"      // Anima para o estado "hover" ao passar o mouse
            whileTap="tap"          // Anima para o estado "tap" ao clicar
            transition={defaultTransition}
            style={{
                fontWeight: 'normal'
            }}
        >
            {text} {/* Usa a prop 'text' ou o 'children' padrão */}
        </ChakraMotionButton>
    );
}

export function GetStartedMotionButton({ text = "Ver mais" }: MotionButtonProps) {
    const isMobile = useBreakpointValue({
        base: true,
        md: false
    })

    // Define as variantes de animação
    const buttonVariants: Variants = {
        initial: { // Estado normal (sem hover, sem clique)
            boxShadow: "0px 2px 5px rgba(0,0,0,0.1)", // Sombra sutil inicial (opcional)
            backgroundColor: '#FF5F5E',
            color: '#FFFFFF',
            width: 150
        },
        hover: { // Estado no hover
            backgroundColor: '#54b9c9',
            boxShadow: "0px 4px 12px rgba(0,0,0,0.15)", // Sombra um pouco maior
            width: 500,
            transition: { // Transição específica para o estado de hover
                type: "spring", // Tipo de transição (spring, tween)
                stiffness: 400,
                damping: 100
            }
        },
        tap: { // Estado ao clicar/pressionar
            scale: 0.80, // Diminui 5%
        }
    };

    // Transição padrão para todas as animações do botão (se não especificado na variante)
    const defaultTransition: Transition = {
        type: "spring",
        stiffness: 500,
        damping: 100
    };

    return (
        <ChakraMotionButton
            variants={buttonVariants}
            initial="initial"       // Define o estado inicial (o nome da variante)
            whileHover="hover"      // Anima para o estado "hover" ao passar o mouse
            whileTap="tap"          // Anima para o estado "tap" ao clicar
            transition={defaultTransition}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 20
            }}
            fontSize={{ base: 16, md: 16 }}
            borderRadius={'2xl'}
        >
            <Text textAlign={{base: 'center', md:'start'}} w='100%'>
                {text} {/* Usa a prop 'text' ou o 'children' padrão */}
            </Text>
            {isMobile ? '' : <FaLongArrowAltRight style={{paddingTop:1}}  />
            }
        </ChakraMotionButton>
    );
}