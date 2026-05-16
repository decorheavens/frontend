import { Container } from "@/components/shared/container";
import { HeroSliceCarousel } from "@/components/home/hero-slice-carousel";
import type { HeroSliderSettings } from "@/lib/types";

type HomeHeroProps = {
  sliderSettings?: HeroSliderSettings | null;
};

export function HomeHero({ sliderSettings }: HomeHeroProps) {
  const hasSlider =
    sliderSettings?.enabled &&
    sliderSettings.images.length > 0;

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api$/, "") ?? "http://localhost:4000";

  if (hasSlider) {
    return (
      <section className="relative overflow-hidden border-b border-white/8 h-[250px] sm:h-[360px] lg:h-[480px] xl:h-[520px]">
        <HeroSliceCarousel apiBaseUrl={apiBaseUrl} settings={sliderSettings} />
      </section>
    );
  }

  return (
    <section className="ambient-grid relative overflow-hidden border-b border-white/8">
      <div className="hero-orb hero-orb--gold left-0 top-10 h-56 w-56 sm:h-72 sm:w-72" />
      <div className="hero-orb hero-orb--blue right-10 top-28 h-48 w-48 sm:h-64 sm:w-64" />
      <Container className="relative z-10 py-16 sm:py-24 lg:py-32">
        <div className="fade-up max-w-4xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.42em] text-amber-300">DecorHeavens</p>
          <h1 className="font-display text-4xl leading-none tracking-tight text-stone-50 sm:text-6xl lg:text-8xl">
            Elevate Every Living Space
          </h1>
        </div>
      </Container>
    </section>
  );
}
