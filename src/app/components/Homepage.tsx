'use client'

import {
    Flex,
    Spinner,
} from "@chakra-ui/react";
import { useAuth0 } from "@auth0/auth0-react";
import { Hero } from "./layout/Landing/Hero";
import homepageData from "../data/homepage";
import { FaqSection } from "./layout/Landing/FAQ";
import { AdvantagesSection } from "./layout/Landing/AdvantagesSection";
import { FeedbacksCarousel } from "./layout/Feedbacks/FeedbacksCarousel";
import { AuthenticationGuard } from "./auth/AuthenticationGuard";
import { DashboardOverview } from "./layout/Home/DashboardOverview";




// ============================================================================
//  COMPONENTE PRINCIPAL: Homepage
// ============================================================================
export function Homepage() {
    const { isAuthenticated, isLoading } = useAuth0();

    if (isLoading) {
        return (
            <Flex w="100%" h="100vh" justify="center" align="center">
                <Spinner size="xl" />
            </Flex>
        );
    }

    return (
        <Flex flexDir={'column'} w='100%' alignItems={'center'} justifyContent={'center'}>
            <Flex as="main" flex={1}
                w='100%'
                flexDir={'column'}
            >
                {isAuthenticated ? (
                    <AuthenticationGuard>
                        <DashboardOverview />
                    </AuthenticationGuard>
                ) : (
                    <>
                        <Hero pageData={homepageData} />
                        <AdvantagesSection />
                        <FeedbacksCarousel />
                        <FaqSection />
                    </>
                )}
            </Flex>
        </Flex>
    )
}