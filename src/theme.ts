import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react"

const config = defineConfig({
    globalCss: {
        "html, body": {
            margin: '0',
            padding: '0',
            bgColor: '{colors.gray.800}',
            color: '{colors.whiteAlpha.900}'
        },
    },
    theme: {
        tokens: {
            colors: {
                brand: {
                    50: { value: "#F9F6EE" },
                    100: { value: "#F0EAD6" },
                    200: { value: "#E6DBC0" },
                    300: { value: "#DCD0AA" },
                    400: { value: "#D2C594" },
                    500: { value: "#d2be82" },
                    600: { value: "#B8A76E" },
                    700: { value: "#9E905A" },
                    800: { value: "#847946" },
                    900: { value: "#6A6232" },
                },
            },
        },
        semanticTokens: {
            colors: {
                bodyBg: {
                    value: { base: "{colors.gray.800}", _dark: "{colors.gray.800}" }
                },
                textPrimary: {
                    value: { base: "{colors.whiteAlpha.900}", _dark: "{colors.whiteAlpha.900}" }
                },
            }
        }
    },
})

const system = createSystem(defaultConfig, config)

export default system