import type { Metadata } from "next";
import { Container } from "@/components/shared/container";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Have a question or need help? Send us a message and we will get back to you as soon as possible.",
};

export default function ContactPage() {
  return (
    <Container className="py-8 sm:py-10 lg:py-12">
      <ContactForm />
    </Container>
  );
}
