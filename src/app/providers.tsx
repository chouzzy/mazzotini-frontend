"use client"

import system from "@/theme"
import { ChakraProvider } from "@chakra-ui/react"
import { ThemeProvider } from "next-themes"
import { Auth0ProviderWithHistory } from "./components/providers/Auth0ProviderWithHistory"

export default function Providers(props: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ThemeProvider 
        attribute="class" 
        disableTransitionOnChange 
        defaultTheme="dark"
        enableSystem={false}
        forcedTheme="dark"
      >
        <Auth0ProviderWithHistory>
            {props.children}
        </Auth0ProviderWithHistory>
      </ThemeProvider>
    </ChakraProvider>
  )
}