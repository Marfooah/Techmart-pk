"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bot,
  Shield,
  Truck,
  MessageSquare,
  Zap,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/shared/scroll-reveal";
import { ThemeToggle } from "@/components/shared/theme-toggle";

const features = [
  {
    icon: Bot,
    title: "AI Support Agent",
    description:
      "Gemini-powered assistant with RAG, tool calling, and memory. Answers policies in PKR context and acts on real orders.",
  },
  {
    icon: Shield,
    title: "Guardrails & Audit",
    description:
      "Every AI action is validated and logged. No auto-refunds, strict ownership checks, human escalation when needed.",
  },
  {
    icon: Truck,
    title: "Nationwide Delivery",
    description:
      "Track orders across Pakistan via TCS, Leopards, PostEx, and M&P. COD, JazzCash, and EasyPaisa supported.",
  },
  {
    icon: MessageSquare,
    title: "Tickets & Returns",
    description:
      "Create returns and support tickets from the portal or through conversation with the AI agent.",
  },
  {
    icon: Zap,
    title: "Real-time Tool Calling",
    description:
      "The agent looks up orders, tracks shipments, searches policies, and creates requests — not just chat.",
  },
  {
    icon: BarChart3,
    title: "Admin Intelligence",
    description:
      "Dashboard with escalations, return approvals, sentiment-aware tickets, and full AI audit trail.",
  },
];

const steps = [
  { step: "01", title: "Sign up", desc: "Create your TechMart Pakistan account in seconds." },
  { step: "02", title: "Shop & order", desc: "Browse electronics with prices in PKR, delivered nationwide." },
  { step: "03", title: "Chat with AI", desc: "Ask about orders, returns, or policies — the agent uses real data." },
  { step: "04", title: "Human handoff", desc: "Complex issues escalate to our support team automatically." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-brand text-sm font-bold text-white">
              TM
            </div>
            <span className="font-bold">TechMart <span className="text-primary">Pakistan</span></span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#ai" className="transition-colors hover:text-foreground">AI Agent</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="bg-gradient-brand hover:opacity-90">
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-32">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm shadow-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI-powered support for Pakistani shoppers</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
              Electronics shopping with{" "}
              <br className="hidden sm:block" />
              <span className="text-gradient">intelligent support</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              TechMart Pakistan delivers consumer tech nationwide. Track orders in PKR,
              request returns, and chat with an AI agent that knows your policies and your orders.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-12 px-8 bg-gradient-brand hover:opacity-90">
                <Link href="/signup">
                  Create free account <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-8">
                <Link href="/login">Sign in</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mx-auto mt-16 max-w-4xl"
          >
            <div className="glass rounded-2xl p-1 shadow-2xl">
              <div className="rounded-xl bg-card p-6 md:p-8">
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                  <span className="ml-2">AI Support Chat</span>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="rounded-xl bg-muted p-4">
                    <p className="font-medium text-primary">You</p>
                    <p>My laptop arrived damaged. Can I return it for a refund?</p>
                  </div>
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <p className="font-medium text-primary">TechMart AI</p>
                    <p>
                      I&apos;ve verified your order PK-ORD-10042. Electronics have a 7-day return window.
                      I&apos;ve created a <strong>PENDING</strong> return request — our team will review within 24 hours.
                      Refunds are issued in PKR to your original payment method after inspection.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features — scroll reveal */}
      <section id="features" className="border-t bg-muted/30 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal className="mb-16 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Built for production</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              A complete support stack — not a demo chatbot. RAG, tools, RBAC, and audit logs included.
            </p>
          </ScrollReveal>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 0.08}>
                <div className="group h-full rounded-2xl border bg-card p-6 shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal className="mb-16 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">How it works</h2>
            <p className="mt-4 text-muted-foreground">From sign-up to resolution in four steps</p>
          </ScrollReveal>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <ScrollReveal key={s.step} delay={i * 0.1}>
                <div className="relative">
                  <span className="text-5xl font-bold text-primary/15">{s.step}</span>
                  <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* AI section */}
      <section id="ai" className="border-t bg-slate-950 py-24 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ScrollReveal>
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold md:text-4xl">
                  An AI agent that <span className="text-emerald-400">does</span>, not just talks
                </h2>
                <p className="mt-4 text-slate-400">
                  Powered by Gemini 2.5 Flash with 12 validated tools: search knowledge base,
                  track orders, create returns, escalate to humans — all prices and policies in PKR
                  for Pakistan.
                </p>
                <ul className="mt-8 space-y-3">
                  {[
                    "RAG over company, FAQ, and policy docs",
                    "Conversation memory across sessions",
                    "Confidence scoring with auto-escalation at 0.75",
                    "Full AI audit log for admins",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <ScrollReveal delay={0.2} direction="left">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    {[
                      { n: "12", l: "AI Tools" },
                      { n: "PKR", l: "All Prices" },
                      { n: "100%", l: "Audit Logged" },
                      { n: "24/7", l: "AI Available" },
                    ].map((s) => (
                      <div key={s.l} className="rounded-xl bg-white/5 p-4">
                        <p className="text-2xl font-bold text-emerald-400">{s.n}</p>
                        <p className="text-xs text-slate-400">{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <ScrollReveal>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-3xl font-bold md:text-4xl">Ready to get started?</h2>
            <p className="mt-4 text-muted-foreground">
              Create your account, explore the customer portal, and try the AI support agent.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="bg-gradient-brand hover:opacity-90">
                <Link href="/signup">Sign up free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">I have an account</Link>
              </Button>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} TechMart Pakistan. Lahore, Pakistan.</p>
          <p>support@techmart.pk · Prices in PKR</p>
        </div>
      </footer>
    </div>
  );
}
