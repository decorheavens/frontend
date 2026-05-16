import { Container } from "./container";

type StaticContentPageProps = {
  title: string;
  content: string;
};

export function StaticContentPage({ title, content }: StaticContentPageProps) {
  return (
    <section className="py-16 sm:py-20">
      <Container className="max-w-4xl">
        <div className="space-y-8">
          <header className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-stone-50 sm:text-5xl">{title}</h1>
          </header>

          <div
            className="text-[15px] leading-8 text-[color:var(--muted)] sm:text-base [&_a]:font-medium [&_a]:text-amber-300 [&_a]:underline-offset-4 [&_a:hover]:text-amber-200 [&_a:hover]:underline [&_em]:italic [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-stone-50 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-stone-100 [&_li]:mt-2 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_strong]:font-semibold [&_strong]:text-stone-100 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </Container>
    </section>
  );
}
