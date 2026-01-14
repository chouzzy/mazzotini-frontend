'use client';

import { Container, Heading, Text, VStack, Box, List, ListItem, Link, Icon, Flex } from "@chakra-ui/react";
import { PiFileText, PiGavel, PiWarning, PiShieldCheck, PiBookOpen } from "react-icons/pi";

export default function TermsOfUsePage() {
    // Data atual formatada para dar validade temporal ao documento
    const currentDate = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <Box bg="gray.900" minH="100vh" py={12} color="gray.300">
            <Container maxW="container.lg">
                <VStack align="start" gap={10}>
                    
                    {/* Cabeçalho do Documento */}
                    <VStack align="start" gap={4} w="100%" borderBottom="1px solid" borderColor="gray.700" pb={8}>
                        <Flex align="center" gap={3}>
                            <Icon as={PiFileText} color="brand.500" boxSize={10} />
                            <Heading as="h1" size="2xl" color="white">
                                Termos e Condições de Uso
                            </Heading>
                        </Flex>
                        <Text fontSize="md" color="gray.400">
                            Estes termos estabelecem o contrato legal entre você e a Mazzotini. <br />
                            <strong>Última atualização: {currentDate}</strong>
                        </Text>
                    </VStack>

                    {/* Preâmbulo */}
                    <Box>
                        <Text fontSize="lg" mb={4}>
                            Bem-vindo à Plataforma <strong>Mazzotini</strong>.
                        </Text>
                        <Text lineHeight="1.8">
                            Ao aceder, navegar ou utilizar este website e os seus serviços associados (coletivamente referidos como "Plataforma"), você ("Usuário") reconhece que leu, compreendeu e concorda em estar vinculado a estes Termos e Condições de Uso ("Termos"), bem como à nossa Política de Privacidade. Caso não concorde com qualquer parte destes termos, deverá cessar imediatamente o uso da Plataforma.
                        </Text>
                    </Box>

                    {/* Cláusula 1: Objeto */}
                    <Box w="100%">
                        <Heading as="h2" size="lg" color="white" mb={4} display="flex" alignItems="center" gap={2}>
                            <Icon as={PiBookOpen} color="brand.400" /> 1. Objeto e Natureza dos Serviços
                        </Heading>
                        <VStack align="start" gap={3} pl={4} borderLeft="2px solid" borderColor="gray.700">
                            <Text>
                                <strong>1.1.</strong> A Plataforma Mazzotini é uma ferramenta tecnológica de <strong>monitorização, gestão e acompanhamento de ativos judiciais</strong> (créditos judiciais, precatórios e direitos creditórios).
                            </Text>
                            <Text>
                                <strong>1.2. Natureza Informativa:</strong> A Plataforma consolida e exibe informações provenientes de fontes oficiais (Tribunais de Justiça, Diários Oficiais) e de parceiros de dados (como a Thomson Reuters/Legal One). O serviço visa facilitar a visualização do andamento processual e a estimativa de atualização monetária dos ativos.
                            </Text>
                            <Text bg="rgba(255, 255, 0, 0.1)" p={2} borderRadius="md" borderLeft="4px solid" borderColor="yellow.500">
                                <strong>1.3. Isenção de Consultoria Financeira:</strong> A Mazzotini <strong>NÃO</strong> é uma instituição financeira, corretora de valores ou consultora de investimentos. Nenhuma informação contida na Plataforma deve ser interpretada como recomendação de investimento, garantia de rentabilidade futura ou oferta pública de valores mobiliários.
                            </Text>
                        </VStack>
                    </Box>

                    {/* Cláusula 2: Acesso e Cadastro */}
                    <Box w="100%">
                        <Heading as="h2" size="lg" color="white" mb={4} display="flex" alignItems="center" gap={2}>
                            <Icon as={PiShieldCheck} color="brand.400" /> 2. Acesso, Cadastro e Segurança
                        </Heading>
                        <VStack align="start" gap={3} pl={4} borderLeft="2px solid" borderColor="gray.700">
                            <Text>
                                <strong>2.1. Elegibilidade:</strong> O uso da Plataforma é restrito a indivíduos maiores de 18 anos e pessoas jurídicas devidamente constituídas, que possuam capacidade legal para contratar.
                            </Text>
                            <Text>
                                <strong>2.2. Veracidade dos Dados:</strong> O Usuário compromete-se a fornecer informações verdadeiras, exatas, atuais e completas durante o processo de registo. A Mazzotini reserva-se o direito de solicitar documentos comprobatórios (KYC - Know Your Customer) e de suspender contas com dados inconsistentes.
                            </Text>
                            <Text>
                                <strong>2.3. Credenciais de Acesso:</strong> O login e a senha são pessoais e intransferíveis. O Usuário é o único responsável pela segurança das suas credenciais. Qualquer ação realizada através da sua conta será presumida como sendo de sua autoria. A Mazzotini não se responsabiliza por acessos não autorizados resultantes de negligência do Usuário.
                            </Text>
                        </VStack>
                    </Box>

                    {/* Cláusula 3: Limitação de Responsabilidade */}
                    <Box w="100%">
                        <Heading as="h2" size="lg" color="white" mb={4} display="flex" alignItems="center" gap={2}>
                            <Icon as={PiWarning} color="brand.400" /> 3. Limitação de Responsabilidade e Riscos
                        </Heading>
                        <VStack align="start" gap={3} pl={4} borderLeft="2px solid" borderColor="gray.700">
                            <Text>
                                <strong>3.1. Dados de Terceiros:</strong> A Plataforma reflete informações obtidas de sistemas do Poder Judiciário e de terceiros. A Mazzotini envida os melhores esforços para manter a precisão dos dados, mas não garante a infalibilidade, completude ou atualidade absoluta das informações, uma vez que estas dependem de atualizações externas.
                            </Text>
                            <Text>
                                <strong>3.2. Projeções e Estimativas:</strong> Os gráficos de evolução e projeções financeiras apresentados são <strong>estimativas</strong> baseadas em índices econômicos (SELIC, IPCA, etc.) e taxas contratuais. Estes valores são simulados e podem divergir dos valores finais homologados judicialmente. O Usuário reconhece que o valor real do ativo está sujeito a decisões judiciais soberanas.
                            </Text>
                            <Text>
                                <strong>3.3. Risco Judicial:</strong> O Usuário declara estar ciente de que ativos judiciais envolvem riscos inerentes ao sistema legal, incluindo morosidade, recursos, alterações jurisprudenciais e insolvência da parte devedora. A Mazzotini não garante o êxito ou o prazo de recebimento dos créditos.
                            </Text>
                            <Text>
                                <strong>3.4. Indisponibilidade:</strong> A Mazzotini não se responsabiliza por danos decorrentes de indisponibilidade temporária da Plataforma por motivos técnicos, manutenção ou falhas em serviços de terceiros (hospedagem, API do Banco Central, API Legal One).
                            </Text>
                        </VStack>
                    </Box>

                    {/* Cláusula 4: Propriedade Intelectual */}
                    <Box w="100%">
                        <Heading as="h2" size="lg" color="white" mb={4}>4. Propriedade Intelectual</Heading>
                        <Text>
                            Todo o conteúdo, design, código-fonte, logotipos, gráficos e interfaces disponíveis na Plataforma são de propriedade exclusiva da Mazzotini ou de seus licenciadores, estando protegidos pela Lei de Direitos Autorais (Lei nº 9.610/98) e Lei de Propriedade Industrial. É estritamente proibida a cópia, reprodução, engenharia reversa ou exploração comercial não autorizada de qualquer parte da Plataforma.
                        </Text>
                    </Box>

                    {/* Cláusula 5: Proteção de Dados */}
                    <Box w="100%">
                        <Heading as="h2" size="lg" color="white" mb={4}>5. Privacidade e Proteção de Dados</Heading>
                        <Text>
                            O tratamento dos dados pessoais do Usuário é regido pela nossa <strong>Política de Privacidade</strong>, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018). Ao utilizar a Plataforma, o Usuário consente com a coleta e processamento de dados conforme detalhado na referida política.
                        </Text>
                    </Box>

                    {/* Cláusula 6: Modificações */}
                    <Box w="100%">
                        <Heading as="h2" size="lg" color="white" mb={4}>6. Modificações dos Termos</Heading>
                        <Text>
                            A Mazzotini reserva-se o direito de alterar estes Termos a qualquer momento, a seu exclusivo critério. Alterações significativas serão comunicadas através da Plataforma ou por e-mail. O uso continuado dos serviços após tais alterações constitui aceitação tácita dos novos Termos.
                        </Text>
                    </Box>

                    {/* Cláusula 7: Foro */}
                    <Box w="100%">
                        <Heading as="h2" size="lg" color="white" mb={4} display="flex" alignItems="center" gap={2}>
                            <Icon as={PiGavel} color="brand.400" /> 7. Legislação e Foro
                        </Heading>
                        <Text>
                            Estes Termos são regidos pelas leis da República Federativa do Brasil. Para dirimir quaisquer controvérsias oriundas deste instrumento, as partes elegem o <strong>Foro da Comarca da Capital do Estado de São Paulo</strong>, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                        </Text>
                    </Box>

                    {/* Rodapé Final */}
                    <Box pt={10} borderTopWidth="1px" borderColor="gray.700" w="100%" textAlign="center">
                        <Text fontSize="sm" color="gray.500">
                            Ao clicar em "Aceitar" ou ao utilizar a nossa plataforma, você confirma que leu, compreendeu e concorda com todos os termos acima descritos.
                        </Text>
                        <Text mt={4} fontWeight="bold" color="brand.400" fontSize="lg">
                            Mazzotini Gestão de Ativos
                        </Text>
                    </Box>

                </VStack>
            </Container>
        </Box>
    );
}
