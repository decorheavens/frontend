import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { VerificationPendingCard } from "@/components/shared/verification-pending-card";

export const metadata: Metadata = {
  title: "Verify Email",
};

export default function VerificationPendingPage() {
  return (
    <Container className="flex min-h-[80vh] items-center justify-center py-12">
      <VerificationPendingCard />
    </Container>
  );
}
