'use client';

import { VStack, Heading, Flex, Icon, Separator } from '@chakra-ui/react';
import { PiFolderOpen } from 'react-icons/pi';
import { AuthenticationGuard } from '@/app/components/auth/AuthenticationGuard';
import { StagingDocumentsSection } from '@/app/components/documents/StagingDocumentsSection';
import { Toaster } from '@/components/ui/toaster';

export default function MeusDocumentosPage() {
    return (
        <AuthenticationGuard>
            <Toaster />
            <VStack gap={6} align="stretch" w="100%">
                <Flex align="center" gap={3}>
                    <Icon as={PiFolderOpen} color="brand.400" boxSize={6} />
                    <Heading as="h1" size="xl">Meus Documentos</Heading>
                </Flex>

                <Separator borderColor="gray.700" />

                <StagingDocumentsSection />
            </VStack>
        </AuthenticationGuard>
    );
}
