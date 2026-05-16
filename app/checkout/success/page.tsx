import type { Metadata } from "next";
import { CheckoutSuccessPage } from "@/components/checkout/checkout-success-page";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = {
  title: "Order Confirmed",
};

export default function CheckoutSuccessRoute() {
  return (
    <Container className="py-8 sm:py-10 lg:py-12">
      <CheckoutSuccessPage />
    </Container>
  );
}
