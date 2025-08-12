"use client"

import system from "@/theme"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import { ThemeProvider } from "next-themes"
import { ColorModeProvider } from "./components/ui/color-mode"


export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider>
        <ThemeProvider attribute="class" disableTransitionOnChange>
          {props.children}
        </ThemeProvider>
      </ColorModeProvider>
    </ChakraProvider>
  )
}