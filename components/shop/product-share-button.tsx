"use client";

import { Share2 } from "lucide-react";

export function ProductShareButton({ name }: { name: string }) {
  const handleShare = async () => {
    try {
      const url = window.location.href;

      if (navigator.share) {
        await navigator.share({
          title: name,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
    } catch {
      // Ignore share cancellations or clipboard permission issues.
    }
  };

  return (
    <button
      aria-label="Share product"
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-300 bg-white text-stone-700 transition hover:border-stone-900 hover:text-stone-900"
      onClick={() => void handleShare()}
      type="button"
    >
      <Share2 className="h-4 w-4" />
    </button>
  );
}
