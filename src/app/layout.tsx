import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Provider from "./providers"
import { Container } from "@chakra-ui/react";
import { Header } from "./components/layout/Header";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mazzotini",
  description: "Acompanhamento do seu crédito na palma da sua mão",
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Provider>
          <Container bg={'bodyBg'}>
            <Header />
            {children}
          </Container>
        </Provider>
      </body>
    </html>
  );
}
