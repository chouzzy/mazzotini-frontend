"use client"

import system from "@/theme"
import { ChakraProvider } from "@chakra-ui/react"
import { ThemeProvider } from "next-themes"
import { SWRConfig } from "swr"
import { Auth0ProviderWithHistory } from "./components/providers/Auth0ProviderWithHistory"
import { ViewModeProvider } from "@/context/ViewModeContext"

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
          <SWRConfig value={{
            revalidateOnFocus: false,
            shouldRetryOnError: false,
            dedupingInterval: 5000,
          }}>
            <ViewModeProvider>
                {props.children}
            </ViewModeProvider>
          </SWRConfig>
        </Auth0ProviderWithHistory>
      </ThemeProvider>
    </ChakraProvider>
  )
}