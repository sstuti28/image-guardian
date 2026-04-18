import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { ShieldCheck, Search, Gavel, Lock } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen grid-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <Link to="/auth">
          <Button variant="outline" size="sm">Sign in</Button>
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pt-12 pb-24">
        <section className="text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
            OSINT · Privacy First · Zero Storage
          </div>
          <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
            Find where your <span className="text-gradient-cyber">image</span> appears online.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground">
            LOOKOUT scans the open web for unauthorized use of your photos and generates legally
            formatted Section 79 (IT Act) takedown notices in one click.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-cyber text-primary-foreground hover:opacity-90 shadow-glow">
                Start a scan
              </Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="outline">How it works</Button>
            </a>
          </div>
        </section>

        <section id="how" className="mt-28 grid gap-6 md:grid-cols-3">
          {[
            { icon: Search, title: "Reverse image search", desc: "Powered by Google Lens via SerpApi. Finds visually similar matches across the public web." },
            { icon: Gavel, title: "One-click takedowns", desc: "Auto-generates Section 79 notices addressed to the platform's grievance officer." },
            { icon: Lock, title: "No image storage", desc: "Your photos are processed in-memory and never persisted to our database." },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-card/60 p-6 backdrop-blur transition hover:border-primary/40 hover:shadow-neon"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-20 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          End-to-end encrypted in transit. Images discarded after scan.
        </section>
      </main>
    </div>
  );
}
