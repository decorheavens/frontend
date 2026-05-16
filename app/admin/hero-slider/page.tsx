import type { Metadata } from "next";
import { HeroSliderAdminPanel } from "@/components/admin/hero-slider-admin-panel";
import { AdminPageShell } from "@/components/admin/admin-page-shell";

export const metadata: Metadata = {
  title: "Admin Hero Slider",
};

export default function AdminHeroSliderPage() {
  return (
    <AdminPageShell
      description="Upload images, configure slice animation, and control the hero section slider from here."
      eyebrow="Hero Slider"
      title="Hero slider manager."
    >
      <HeroSliderAdminPanel />
    </AdminPageShell>
  );
}
