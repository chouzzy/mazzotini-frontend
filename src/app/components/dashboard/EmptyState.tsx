//src/app/components/dashboard/EmptyState.tsx
'use client';

import { VStack, Heading, Text, Button, Icon, Link } from '@chakra-ui/react';
import { PiPlusCircle } from 'react-icons/pi';
import NextLink from 'next/link';

interface EmptyStateProps {
    title?: string;
    description?: string;
    buttonLabel?: string;
    buttonHref?: string;
}

export function EmptyState({ title = 'No data found', description = 'There is no data to display. Add some data to see it here.', buttonLabel = 'Add data', buttonHref = '#' }: EmptyStateProps) {
    return (
        <VStack
            bg="gray.900"
            p={10}
            borderRadius="lg"
            border="1px dashed"
            borderColor="gray.700"
            gap={4}
            textAlign="center"
            w="100%"
            my={8}
        >
            <Heading size="md">{title}</Heading>
            <Text color="gray.400" maxW="md">
                {description}
            </Text>
            <Link href={buttonHref} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <Button
                    colorScheme="blue"
                >
                    <Icon as={PiPlusCircle} mr={2} />
                    {buttonLabel}
                </Button>
            </Link>
        </VStack>
    );
}
