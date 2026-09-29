'use client';

import { Button, HStack, Icon, Text } from '@chakra-ui/react';
import { PiCaretLeftBold, PiCaretRightBold } from 'react-icons/pi';
import { Fragment } from 'react';

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

/**
 * Paginação compartilhada das tabelas.
 *
 * ## Por que existe
 * O bloco estava duplicado em quatro páginas e divergiu: em /processos e
 * /dashboard a reticência e o número ficavam dentro de um `<Box>` (display
 * block), então o "..." ocupava a linha inteira e empurrava o último número
 * para baixo — a paginação "torta". Em /pastas e /gestao/usuarios o mesmo
 * trecho usava `<Flex>` e por isso não quebrava.
 *
 * Aqui reticência e botão são irmãos diretos do HStack, então o layout
 * horizontal não depende do wrapper.
 */
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    // Mostra sempre a primeira, a última e a janela ao redor da atual.
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

    return (
        <HStack gap={2} mx={{ base: 'auto', md: '0' }}>
            <Button
                size="sm"
                variant="solid"
                colorPalette="gray"
                onClick={() => onPageChange(Math.max(1, page - 1))}
                disabled={page === 1}
            >
                <Icon as={PiCaretLeftBold} mr={1} /> Anterior
            </Button>

            <HStack gap={1} display={{ base: 'none', sm: 'flex' }} align="center">
                {pages.map((p, i, arr) => (
                    <Fragment key={p}>
                        {i > 0 && arr[i - 1] !== p - 1 && (
                            <Text color="gray.600" px={1} userSelect="none">…</Text>
                        )}
                        <Button
                            size="sm"
                            variant="solid"
                            colorPalette={page === p ? 'brand' : 'gray'}
                            onClick={() => onPageChange(p)}
                        >
                            {p}
                        </Button>
                    </Fragment>
                ))}
            </HStack>

            <Button
                size="sm"
                variant="solid"
                colorPalette="gray"
                onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
            >
                Próximo <Icon as={PiCaretRightBold} ml={1} />
            </Button>
        </HStack>
    );
}
