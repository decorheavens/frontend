import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl space-y-4", align === "center" && "mx-auto text-center")}>
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-amber-300">
        {eyebrow}
      </p>
      <h2 className="font-display text-3xl tracking-tight text-stone-50 sm:text-4xl lg:text-5xl">{title}</h2>
      {description ? <p className="text-base leading-7 text-[color:var(--muted)] sm:text-lg">{description}</p> : null}
    </div>
  );
}
