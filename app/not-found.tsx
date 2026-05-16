import Link from "next/link";
import { Button } from "@/components/shared/button";
import { Container } from "@/components/shared/container";

export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] items-center justify-center py-16">
      <div className="glass-panel max-w-xl rounded-[2rem] p-10 text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-amber-300">404</p>
        <h1 className="mt-4 font-display text-5xl text-stone-50">Not found</h1>
        <p className="mt-4 text-sm leading-7 text-[color:var(--muted)]">
          The page you were looking for is not here, but the rest of the collection is ready.
        </p>
        <div className="mt-8">
          <Link href="/shop">
            <Button>Back to shop</Button>
          </Link>
        </div>
      </div>
    </Container>
  );
}
