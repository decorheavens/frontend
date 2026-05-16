import type { Metadata } from "next";
import { CartPageContent } from "@/components/cart/cart-page";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";

export const metadata: Metadata = {
  title: "Your Cart",
};

export default function CartPage() {
  return (
    <Container className="py-12 sm:py-16">
      <div className="mb-10">
        <SectionHeading eyebrow="Cart" title="Your cart." />
      </div>
      <CartPageContent />
    </Container>
  );
}
