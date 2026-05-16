"use client";

import { FileText, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import type { AdminStaticPage } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { adminApi } from "@/services/client-api";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminMetricCard } from "./admin-metric-card";

type PageFormState = {
  title: string;
  description: string;
  content: string;
};

function buildFormState(page: AdminStaticPage): PageFormState {
  return {
    title: page.title,
    description: page.description,
    content: page.content,
  };
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

function normalizeEditorContent(value: string) {
  return value
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/<div(\s[^>]*)?>/gi, "<p>")
    .replace(/<\/div>/gi, "</p>")
    .replace(/<p>\s*(<br\s*\/?>|\u00A0|&nbsp;|\s)*<\/p>/gi, "")
    .trim();
}

function buildPayload(form: PageFormState) {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    content: normalizeEditorContent(form.content),
  };
}

type ToolbarButton = {
  label: string;
  command: string;
  value?: string;
};

const toolbarButtons: ToolbarButton[] = [
  { label: "Bold", command: "bold" },
  { label: "Paragraph", command: "formatBlock", value: "<p>" },
  { label: "H2", command: "formatBlock", value: "<h2>" },
  { label: "H3", command: "formatBlock", value: "<h3>" },
  { label: "Bullets", command: "insertUnorderedList" },
  { label: "Numbers", command: "insertOrderedList" },
];

export function PageContentAdminPanel() {
  const { initialized, isAdmin, token } = useAuth();
  const [pages, setPages] = useState<AdminStaticPage[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [form, setForm] = useState<PageFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");
  const selectedSlugRef = useRef<string | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);

  selectedSlugRef.current = selectedSlug;

  useEffect(() => {
    if (!initialized || !token || !isAdmin) {
      return;
    }

    let cancelled = false;

    void adminApi
      .listContentPages(token)
      .then((response) => {
        if (cancelled) {
          return;
        }

        setPages(response.pages);
        setError("");

        const preferredSlug = selectedSlugRef.current;
        const nextPage =
          response.pages.find((page) => page.slug === preferredSlug) ?? response.pages[0] ?? null;

        setSelectedSlug(nextPage?.slug ?? null);
        setForm(nextPage ? buildFormState(nextPage) : null);
      })
      .catch((caughtError) => {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load pages.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialized, isAdmin, token]);

  useEffect(() => {
    if (!editorRef.current || !form) {
      return;
    }

    if (document.activeElement === editorRef.current) {
      return;
    }

    const nextContent = form.content.trim().length > 0 ? form.content : "<p></p>";

    if (editorRef.current.innerHTML !== nextContent) {
      editorRef.current.innerHTML = nextContent;
    }
  }, [form, selectedSlug]);

  const selectedPage = useMemo(
    () => pages.find((page) => page.slug === selectedSlug) ?? null,
    [pages, selectedSlug],
  );

  if (!initialized) {
    return <div className="text-sm text-[color:var(--muted)]">Loading admin pages...</div>;
  }

  if (!isAdmin || !token) {
    return (
      <EmptyState
        actionHref="/admin/login"
        actionLabel="Login as admin"
        description="Only admin accounts can edit website page content."
        title="Admin access required."
      />
    );
  }

  const customizedCount = pages.filter((page) => page.isCustomized).length;

  const selectPage = (page: AdminStaticPage) => {
    setSelectedSlug(page.slug);
    setForm(buildFormState(page));
    setError("");
  };

  const updateField = (field: keyof Omit<PageFormState, "content">, value: string) => {
    setForm((current) => (current ? { ...current, [field]: value } : current));
  };

  const syncEditorState = () => {
    if (!editorRef.current) {
      return;
    }

    const normalizedContent = normalizeEditorContent(editorRef.current.innerHTML);

    setForm((current) => (current ? { ...current, content: normalizedContent } : current));
  };

  const applyEditorCommand = (command: string, value?: string) => {
    if (!editorRef.current) {
      return;
    }

    editorRef.current.focus();
    document.execCommand(command, false, value);
    syncEditorState();
  };

  const handleEditorPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
    syncEditorState();
  };

  const savePage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedPage || !form) {
      return;
    }

    const payload = buildPayload(form);

    if (payload.title.length < 2) {
      setError("Title must be at least 2 characters.");
      return;
    }

    if (payload.description.length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }

    if (stripHtml(payload.content).length < 10) {
      setError("Content must be at least 10 characters.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await adminApi.updateContentPage(token, selectedPage.slug, payload);
      setPages((current) =>
        current.map((page) => (page.slug === response.page.slug ? response.page : page)),
      );
      setForm(buildFormState(response.page));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save page.");
    } finally {
      setSaving(false);
    }
  };

  const resetPage = async () => {
    if (!selectedPage) {
      return;
    }

    const confirmed = window.confirm("Reset this page back to the default content?");

    if (!confirmed) {
      return;
    }

    setResetting(true);
    setError("");

    try {
      const response = await adminApi.resetContentPage(token, selectedPage.slug);
      setPages((current) =>
        current.map((page) => (page.slug === response.page.slug ? response.page : page)),
      );
      setForm(buildFormState(response.page));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to reset page.");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard hint="Footer-linked pages" label="Pages" value={pages.length} />
        <AdminMetricCard hint="Pages currently using saved overrides" label="Customized" value={customizedCount} />
        <AdminMetricCard hint="Pages still using default content" label="Defaults" value={pages.length - customizedCount} />
        <AdminMetricCard
          hint={selectedPage ? selectedPage.slug : "Select a page to edit"}
          label="Current page"
          value={selectedPage?.label ?? "None"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="glass-panel rounded-[2rem] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Website pages</p>
            <h3 className="mt-2 text-2xl font-semibold text-stone-50">Edit footer-linked content</h3>
            <p className="mt-2 text-sm text-[color:var(--muted)]">
              Keep title and meta clean, then write the full page content in one editor box.
            </p>
          </div>

          {loading ? <p className="text-sm text-[color:var(--muted)]">Loading pages...</p> : null}
          {error ? <p className="text-sm text-red-200">{error}</p> : null}

          <div className="space-y-3">
            {pages.map((page) => (
              <button
                className={`glass-panel w-full rounded-[1.6rem] p-4 text-left transition ${
                  selectedPage?.slug === page.slug ? "ring-1 ring-cyan-300" : ""
                }`}
                key={page.slug}
                onClick={() => selectPage(page)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-stone-50">{page.label}</p>
                    <p className="mt-1 text-xs text-[color:var(--muted)]">/pages/{page.slug}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                      page.isCustomized ? "bg-cyan-300 text-slate-950" : "bg-white/8 text-white/60"
                    }`}
                  >
                    {page.isCustomized ? "Edited" : "Default"}
                  </span>
                </div>
                {page.updatedAt ? (
                  <p className="mt-3 text-xs text-[color:var(--muted)]">
                    Updated {formatDateTime(page.updatedAt)}
                  </p>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {selectedPage && form ? (
          <form className="glass-panel rounded-[2rem] p-6" onSubmit={savePage}>
            <div className="flex flex-col gap-4 border-b border-white/8 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
                  Page editor
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-stone-50">{selectedPage.label}</h3>
                <p className="mt-2 text-sm text-[color:var(--muted)]">/pages/{selectedPage.slug}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedPage.isCustomized ? (
                  <Button
                    disabled={resetting || saving}
                    onClick={() => void resetPage()}
                    type="button"
                    variant="ghost"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {resetting ? "Resetting..." : "Reset to default"}
                  </Button>
                ) : null}
                <Button disabled={saving || resetting} type="submit">
                  <FileText className="h-4 w-4" />
                  {saving ? "Saving..." : "Save page"}
                </Button>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm text-white/70">Title</label>
                <input
                  className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                  onChange={(event) => updateField("title", event.target.value)}
                  value={form.title}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-white/70">Meta description</label>
                <textarea
                  className="min-h-24 w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-white/35"
                  onChange={(event) => updateField("description", event.target.value)}
                  value={form.description}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="text-sm text-white/70">Page content</label>
                    <p className="mt-1 text-xs text-[color:var(--muted)]">
                      Use bold text, headings, and lists from the toolbar. Pasted text stays clean.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 rounded-[1.3rem] border border-white/10 bg-black/20 p-3">
                  {toolbarButtons.map((button) => (
                    <Button
                      className="rounded-full"
                      disabled={saving || resetting}
                      key={button.label}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => applyEditorCommand(button.command, button.value)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      {button.label}
                    </Button>
                  ))}
                </div>

                <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                  <div
                    className="min-h-[360px] rounded-[1.1rem] border border-white/8 bg-white/4 px-4 py-4 text-sm leading-7 text-stone-100 outline-none [&_a]:text-amber-300 [&_a]:underline-offset-4 [&_em]:italic [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-stone-50 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-stone-100 [&_li]:mt-2 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_strong]:font-semibold [&_strong]:text-stone-50 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6"
                    contentEditable
                    onBlur={syncEditorState}
                    onInput={syncEditorState}
                    onPaste={handleEditorPaste}
                    ref={editorRef}
                    suppressContentEditableWarning
                  />
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="glass-panel rounded-[2rem] p-8 text-sm text-[color:var(--muted)]">
            Select a page from the list to start editing.
          </div>
        )}
      </div>
    </div>
  );
}
