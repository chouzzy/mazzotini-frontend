'use client'
import { Container, Stack, Accordion, Span, Text, Avatar } from "@chakra-ui/react";
import { useState } from "react";
import { ColorModeButton } from "./ui/color-mode";


export function Homepage() {


    const items = [
        { value: "first-item", title: "First Item", text: "Some value 1..." },
        { value: "second-item", title: "Second Item", text: "Some value 2..." },
        { value: "third-item", title: "Third Item", text: "Some value 3..." },
    ]
    const [value, setValue] = useState(["second-item"])
    return (
        <Container border={'1px solid white'} bgColor={'bodyBg'}>
            <ColorModeButton />
            <Avatar.Root>
                <Avatar.Fallback name="Segun Adebayo" />
                <Avatar.Image src="https://conteudo.imguol.com.br/c/esporte/c8/2025/04/27/neymar-compareceu-a-vila-belmiro-para-acompanhar-santos-x-bragantino-jogo-do-brasileirao-1745801642717_v2_300x300.jpg.webp" />
            </Avatar.Root>
            <Stack gap="4">
                <Text fontWeight="medium">Expanded: {value.join(", ")}</Text>
                <Accordion.Root value={value} onValueChange={(e) => setValue(e.value)}>
                    {items.map((item, index) => (
                        <Accordion.Item key={index} value={item.value}>
                            <Accordion.ItemTrigger>
                                <Span flex="1">{item.title}</Span>
                                <Accordion.ItemIndicator />
                            </Accordion.ItemTrigger>
                            <Accordion.ItemContent>
                                <Accordion.ItemBody>{item.text}</Accordion.ItemBody>
                            </Accordion.ItemContent>
                        </Accordion.Item>
                    ))}
                </Accordion.Root>
            </Stack>
        </Container>
    )
}