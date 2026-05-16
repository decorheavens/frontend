"use client";

import { CheckCircle2, Mail, MessageSquare, Send, User } from "lucide-react";
import { useState } from "react";
import { STORE_NAME } from "@/lib/constants";
import { contactApi } from "@/services/client-api";
import { ApiError } from "@/services/client-api";
import { Button } from "@/components/shared/button";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      await contactApi.send({ name, email, subject, message });
      setSuccess(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message);
      } else {
        setError("Something went wrong. Please try again later.");
      }
    } finally {
      setIsPending(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="glass-panel overflow-hidden rounded-[2rem] p-8 sm:p-10 lg:p-12 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400/20 to-emerald-500/10 border border-emerald-300/20">
            <CheckCircle2 className="h-10 w-10 text-emerald-300" />
          </div>
          <h2 className="mt-6 font-display text-3xl text-stone-50 sm:text-4xl">
            Message sent!
          </h2>
          <p className="mt-4 text-sm leading-7 text-[color:var(--muted)] max-w-md mx-auto">
            Thank you for reaching out. We have received your message and will get back to you as soon as possible.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => setSuccess(false)} size="lg" variant="secondary">
              Send another message
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02)),rgba(10,10,14,0.82)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8 lg:p-10">
        <div className="hero-orb hero-orb--gold -left-10 top-0 h-40 w-40" />
        <div className="hero-orb hero-orb--blue right-0 top-8 h-36 w-36" />

        <div className="relative z-10">
          <div className="mb-8 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">
              <MessageSquare className="h-4 w-4" />
              Get in touch
            </div>
            <h1 className="mt-5 font-display text-4xl leading-none text-stone-50 sm:text-5xl">
              Contact us
            </h1>
            <p className="mt-4 text-sm leading-7 text-[color:var(--muted)] sm:text-base">
              Have a question about your order, a product, or just want to say hello?
              Fill out the form below and the {STORE_NAME} team will get back to you shortly.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                  <User className="h-4 w-4" />
                </div>
                <input
                  className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 py-3.5 pl-11 pr-4 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300 transition"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                  required
                  minLength={2}
                  maxLength={80}
                  value={name}
                />
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  autoComplete="email"
                  className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 py-3.5 pl-11 pr-4 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300 transition"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  required
                  type="email"
                  value={email}
                />
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30">
                <MessageSquare className="h-4 w-4" />
              </div>
              <input
                className="w-full rounded-[1.4rem] border border-white/10 bg-white/6 py-3.5 pl-11 pr-4 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300 transition"
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Subject"
                required
                minLength={3}
                maxLength={120}
                value={subject}
              />
            </div>

            <textarea
              className="w-full resize-none rounded-[1.4rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300 transition min-h-[160px]"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write your message here..."
              required
              minLength={10}
              maxLength={2000}
              rows={6}
              value={message}
            />

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-white/30">
                {message.length}/2000
              </p>
              <div className="text-right">
                {error ? (
                  <p className="mb-3 rounded-[1.2rem] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100 inline-block">
                    {error}
                  </p>
                ) : null}
              </div>
            </div>

            <Button className="w-full sm:w-auto" disabled={isPending} size="lg" type="submit">
              <Send className="mr-2 h-4 w-4" />
              {isPending ? "Sending..." : "Send message"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
