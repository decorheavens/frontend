import type { Route } from "next";
import Link from "next/link";
import { Button } from "./button";

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: Route;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="glass-panel flex flex-col items-start gap-4 rounded-[2rem] p-8">
      <h3 className="font-display text-3xl text-stone-50">{title}</h3>
      {description ? (
        <p className="max-w-xl text-sm leading-7 text-[color:var(--muted)]">{description}</p>
      ) : null}
      {actionHref && actionLabel ? (
        <Link href={actionHref}>
          <Button>{actionLabel}</Button>
        </Link>
      ) : null}
    </div>
  );
}
