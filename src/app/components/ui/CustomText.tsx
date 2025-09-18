import { Text, FlexProps as ChakraFlexProps, Flex } from "@chakra-ui/react";
import { JSX } from "react";

interface CustomTextProps extends ChakraFlexProps {
    text?: string | JSX.Element,
}

export function CustomText({ text = 'Shop Now', fontSize = 'sm', color = 'TextColor', fontWeight='normal', ...restProps }: CustomTextProps) {

    return (
        <Flex {...restProps} fontSize={fontSize} color={color} fontWeight={fontWeight}>
            {text}
        </Flex>
    )
}