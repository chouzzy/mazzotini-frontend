import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Provider from "./providers"
import { Container, Flex } from "@chakra-ui/react";
import { Header } from "./components/layout/Header";
import { useAuth0 } from "@auth0/auth0-react";
import { Footer } from "./components/layout/Footer";


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
          <Flex flexDir={'column'} bg={'bodyBg'}
            bgImage={`url('/home/bg.png')`}
            bgSize="cover"
            bgRepeat={'no-repeat'}
            bgPos="top"
          >
            <Flex flexDir={'column'} mx='auto' minH="100vh" w='100%' alignItems={'center'} justifyContent={'center'}>
              <Header />
              {children}
              <Footer />
            </Flex>
          </Flex>
        </Provider>
      </body>
    </html>
  );
}
