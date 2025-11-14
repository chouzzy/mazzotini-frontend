// src\app\providers.tsx
"use client"

import system from "@/theme"
import { ChakraProvider, defaultSystem, Toaster } from "@chakra-ui/react"
import { ThemeProvider } from "next-themes"
import { ColorModeProvider } from "./components/ui/color-mode"
import { Auth0ProviderWithHistory } from "./components/providers/Auth0ProviderWithHistory"
// import { Toaster } from "@/components/ui/toaster"
// import { ProfileCompletionGuard } from "./components/auth/ProfileCompletionGuard"


export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          <Auth0ProviderWithHistory>
            {/* <ProfileCompletionGuard> */}
              {props.children}
            {/* </ProfileCompletionGuard> */}
          </Auth0ProviderWithHistory>
        </ThemeProvider>
      </ColorModeProvider>
    </ChakraProvider>
  )
}