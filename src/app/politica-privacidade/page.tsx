'use client';

import { Container, Heading, Text, VStack, Box, List, ListItem, Link, Icon, Flex, Accordion } from "@chakra-ui/react";
import { PiShieldCheck, PiLockKey, PiShareNetwork, PiCookie, PiUserFocus, PiFiles } from "react-icons/pi";

export default function PrivacyPolicyPage() {
    // Data atual formatada
    const currentDate = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <Box bg="gray.900" minH="100vh" py={12} color="gray.300">
            <Container maxW="container.lg">
                <VStack align="start" gap={10}>
                    
                    {/* Cabeçalho */}
                    <VStack align="start" gap={4} w="100%" borderBottom="1px solid" borderColor="gray.700" pb={8}>
                        <Flex align="center" gap={3}>
                            <Icon as={PiShieldCheck} color="brand.500" boxSize={10} />
                            <Heading as="h1" size="2xl" color="white">
                                Política de Privacidade e Proteção de Dados
                            </Heading>
                        </Flex>
                        <Text fontSize="md" color="gray.400">
                            Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). <br />
                            <strong>Vigência a partir de: {currentDate}</strong>
                        </Text>
                    </VStack>

                    {/* Introdução */}
                    <Box>
                        <Text lineHeight="1.8">
                            A <strong>Mazzotini</strong> ("Nós", "Controlador") leva a sua privacidade a sério. Esta Política descreve como coletamos, usamos, armazenamos e compartilhamos os seus dados pessoais quando você utiliza a nossa Plataforma de Gestão de Ativos Judiciais. 
                            <br /><br />
                            Ao cadastrar-se e utilizar os nossos serviços, você ("Titular", "Usuário") declara ciência e aceite das práticas descritas neste documento.
                        </Text>
                    </Box>

                    {/* 1. Dados Coletados */}
                    <Box w="100%">
                        <Heading as="h2" size="lg" color="white" mb={4} display="flex" alignItems="center" gap={2}>
                            <Icon as={PiFiles} color="brand.400" /> 1. Quais Dados Coletamos
                        </Heading>
                        <Text mb={4}>Coletamos apenas os dados estritamente necessários para a prestação do serviço e cumprimento de obrigações legais:</Text>
                        
                        <VStack align="start" gap={4} pl={4} borderLeft="2px solid" borderColor="gray.700">
                            <Box>
                                <Text fontWeight="bold" color="white">1.1. Dados de Identificação e Cadastro:</Text>
                                <Text>Nome completo, CPF, RG, data de nascimento, nacionalidade, estado civil e gênero.</Text>
                            </Box>
                            <Box>
                                <Text fontWeight="bold" color="white">1.2. Dados de Contato:</Text>
                                <Text>Endereço de e-mail, número de telefone (celular/fixo) e endereços físicos (residencial e comercial).</Text>
                            </Box>
                            <Box>
                                <Text fontWeight="bold" color="white">1.3. Documentos Digitalizados:</Text>
                                <Text>Imagens ou PDFs de documentos de identificação (RG/CNH) e comprovantes de residência, necessários para validação de identidade (KYC) e auditoria jurídica.</Text>
                            </Box>
                            <Box>
                                <Text fontWeight="bold" color="white">1.4. Dados Financeiros e Processuais:</Text>
                                <Text>Informações sobre ativos judiciais, valores de aquisição, percentuais de participação e dados bancários para eventuais repasses.</Text>
                            </Box>
                        </VStack>
                    </Box>

                    {/* 2. Finalidade */}
                    <Box w="100%">
                        <Heading as="h2" size="lg" color="white" mb={4} display="flex" alignItems="center" gap={2}>
                            <Icon as={PiUserFocus} color="brand.400" /> 2. Para que Usamos os seus Dados
                        </Heading>
                        <Text mb={2}>O tratamento dos seus dados tem as seguintes bases legais e finalidades:</Text>
                        <List.Root ps={5} gap={2}>
                            <List.Item><strong>Execução de Contrato:</strong> Para criar a sua conta, gerir o seu portfólio de ativos e permitir o acesso ao Dashboard.</List.Item>
                            <List.Item><strong>Integração Jurídica:</strong> Para vincular o seu perfil aos processos judiciais nos sistemas dos Tribunais e sistemas parceiros (Legal One).</List.Item>
                            <List.Item><strong>Cumprimento de Dever Legal:</strong> Para manter registros exigidos pela legislação fiscal e judicial brasileira.</List.Item>
                            <List.Item><strong>Segurança:</strong> Para verificar a sua identidade e prevenir fraudes ou acessos não autorizados.</List.Item>
                        </List.Root>
                    </Box>

                    {/* 3. Compartilhamento (CRÍTICO PARA O SEU SISTEMA) */}
                    <Box w="100%">
                        <Heading as="h2" size="lg" color="white" mb={4} display="flex" alignItems="center" gap={2}>
                            <Icon as={PiShareNetwork} color="brand.400" /> 3. Compartilhamento com Terceiros
                        </Heading>
                        <Text mb={4}>
                            A Mazzotini não vende os seus dados. No entanto, para a operação da Plataforma, necessitamos compartilhar dados com parceiros tecnológicos essenciais (Operadores), sempre exigindo conformidade com a LGPD:
                        </Text>
                        <VStack align="start" gap={3} pl={4} bg="gray.800" p={4} borderRadius="md">
                            <Text>
                                <strong>3.1. Thomson Reuters (Legal One):</strong> Os seus dados de cadastro (Nome, CPF, Endereço) são sincronizados com o sistema de gestão jurídica Legal One para permitir o vínculo correto entre você e os processos judiciais que acompanha.
                            </Text>
                            <Box h={0.5} bgColor='gray.600' w='100%'/>
                            <Text>
                                <strong>3.2. Provedor de Identidade (Auth0):</strong> Utilizamos serviços de autenticação segura para gerir o seu login e proteger as suas credenciais.
                            </Text>
                            <Box h={0.5} bgColor='gray.600' w='100%'/>
                            <Text>
                                <strong>3.3. Infraestrutura de Nuvem:</strong> Os dados e documentos são armazenados em servidores seguros (bancos de dados e storage) que atendem a padrões internacionais de segurança da informação (ISO 27001).
                            </Text>
                        </VStack>
                    </Box>

                    {/* 4. Cookies */}
                    <Box w="100%">
                        <Heading as="h2" size="lg" color="white" mb={4} display="flex" alignItems="center" gap={2}>
                            <Icon as={PiCookie} color="brand.400" /> 4. Cookies e Tecnologias de Rastreamento
                        </Heading>
                        <Text>
                            Utilizamos cookies principalmente para <strong>sessão e segurança</strong> (para manter você logado e proteger sua conta). Você pode configurar o seu navegador para recusar todos os cookies, mas isso pode impedir o uso de funcionalidades críticas da Plataforma (como o login).
                        </Text>
                    </Box>

                    {/* 5. Segurança */}
                    <Box w="100%">
                        <Heading as="h2" size="lg" color="white" mb={4} display="flex" alignItems="center" gap={2}>
                            <Icon as={PiLockKey} color="brand.400" /> 5. Segurança dos Dados
                        </Heading>
                        <Text>
                            Adotamos medidas técnicas e administrativas robustas para proteger os seus dados, incluindo criptografia em trânsito (SSL/TLS) e em repouso, controle de acesso rigoroso e monitoramento de segurança. No entanto, nenhuma transmissão pela internet é 100% segura, e não podemos garantir segurança absoluta contra ataques cibernéticos sofisticados.
                        </Text>
                    </Box>

                    {/* 6. Seus Direitos */}
                    <Box w="100%">
                        <Heading as="h2" size="lg" color="white" mb={4} display="flex" alignItems="center" gap={2}>
                            <Icon as={PiShieldCheck} color="brand.400" /> 6. Seus Direitos (LGPD)
                        </Heading>
                        <Text mb={4}>
                            Como titular dos dados, o Artigo 18 da LGPD garante a você os seguintes direitos, que podem ser exercidos a qualquer momento:
                        </Text>
                        <List.Root ps={5} gap={1}>
                            <List.Item>Confirmação da existência de tratamento;</List.Item>
                            <List.Item>Acesso aos dados;</List.Item>
                            <List.Item>Correção de dados incompletos, inexatos ou desatualizados;</List.Item>
                            <List.Item>Anonimização, bloqueio ou eliminação de dados desnecessários;</List.Item>
                            <List.Item>Portabilidade dos dados a outro fornecedor de serviço;</List.Item>
                            <List.Item>Eliminação dos dados pessoais tratados com o consentimento do titular;</List.Item>
                            <List.Item>Revogação do consentimento.</List.Item>
                        </List.Root>
                        <Text mt={4} fontSize="sm" color="yellow.200">
                            * Nota: A eliminação de dados poderá ser negada caso a manutenção seja necessária para cumprimento de obrigação legal ou regulatória (ex: Receita Federal, normas do Judiciário).
                        </Text>
                    </Box>

                    {/* Contato */}
                    <Box pt={8} borderTopWidth="1px" borderColor="gray.700" w="100%">
                        <Heading as="h3" size="md" color="white" mb={2}>Encarregado de Dados (DPO)</Heading>
                        <Text>
                            Para exercer os seus direitos ou tirar dúvidas sobre esta Política, entre em contato com o nosso Encarregado de Proteção de Dados:
                        </Text>
                        <Text mt={2} fontWeight="bold" color="white">
                            E-mail: contato@awer.co
                        </Text>
                        
                        <Text mt={8} fontSize="sm" color="gray.500">
                            A Mazzotini reserva-se o direito de alterar esta Política de Privacidade a qualquer momento. A versão mais atualizada estará sempre disponível neste endereço.
                        </Text>
                    </Box>

                </VStack>
            </Container>
        </Box>
    );
}
