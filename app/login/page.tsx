import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { AuthCard } from "@/components/shared/auth-card";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <Container className="flex min-h-[80vh] items-center justify-center py-12">
      <AuthCard mode="login" />
    </Container>
  );
}
