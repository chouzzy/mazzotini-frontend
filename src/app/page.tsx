import { Accordion, Container, Span, Stack, Text } from "@chakra-ui/react"
import { useState } from "react"
import { Homepage } from "./components/Homepage";
import { useAuth0 } from "@auth0/auth0-react";

export default function Home() {

  return (
    <Homepage />
  );
}
