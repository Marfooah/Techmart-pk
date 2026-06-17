import Link from "next/link";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-emerald-500/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand font-bold">
            TM
          </div>
          <span className="text-xl font-bold">TechMart Pakistan</span>
        </Link>
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Smart support for<br />
            <span className="text-emerald-400">Pakistani shoppers</span>
          </h2>
          <p className="mt-4 max-w-md text-slate-400">
            Track orders, manage returns, and chat with an AI agent that understands PKR pricing,
            local couriers, and your policies.
          </p>
        </div>
        <p className="relative text-sm text-slate-500">© TechMart Pakistan · Lahore</p>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-4 lg:justify-end">
          <Link href="/" className="flex items-center gap-2 font-bold lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-xs text-white">
              TM
            </div>
            TechMart
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
