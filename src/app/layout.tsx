import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Provider from './providers';
import { Flex } from '@chakra-ui/react';
// 1. Remova a importação do Header e Footer daqui
// import { Header } from "./components/layout/Header";
// import { Footer } from "./components/layout/Footer";

// 2. Importe o novo LayoutController
import { LayoutController } from './components/layout/LayoutController';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Mazzotini',
  description: 'Acompanhamento do seu crédito na palma da sua mão',
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
          <Flex
            flexDir={'column'}
            bg={'bodyBg'}
            bgImage={`url('/home/bg.png')`}
            bgSize="cover"
            bgRepeat={'no-repeat'}
            bgPos="top"
            minH={'100vh'}
            color={'textPrimary'}
          >
            <Flex
              flexDir={'column'}
              mx="auto"
              minH="100vh"
              h='100%'
              w="100%"
              alignItems={'center'}
              justifyContent={'center'}
            >
              <LayoutController>{children}</LayoutController>
            </Flex>
          </Flex>
        </Provider>
      </body>
    </html>
  );
}
