import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { AuthCard } from "@/components/shared/auth-card";

export const metadata: Metadata = {
  title: "Admin Login",
};

export default function AdminLoginPage() {
  return (
    <Container className="flex min-h-screen items-center justify-center py-12">
      <AuthCard mode="login" portal="admin" />
    </Container>
  );
}
