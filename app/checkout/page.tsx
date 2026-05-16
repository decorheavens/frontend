import type { Metadata } from "next";
import { CheckoutLayoutForm } from "@/components/checkout/checkout-layout-form";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return (
    <Container className="py-8 sm:py-10 lg:py-12">
      <CheckoutLayoutForm />
    </Container>
  );
}
