import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { reverseImageSearch, type Sighting } from "@/lib/search-client";
import { TakedownDialog } from "@/components/TakedownDialog";
import { Upload, ImageOff, ExternalLink, Gavel, LogOut, RefreshCcw, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({ meta: [{ title: "Dashboard · LOOKOUT" }] }),
});

type Phase = "idle" | "scanning" | "results" | "error";

function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<Sighting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [takedown, setTakedown] = useState<Sighting | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const progressTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  const startProgress = () => {
    setProgress(8);
    progressTimer.current = window.setInterval(() => {
      setProgress((p) => (p < 90 ? p + Math.random() * 6 : p));
    }, 350);
  };
  const stopProgress = () => {
    if (progressTimer.current) window.clearInterval(progressTimer.current);
    progressTimer.current = null;
  };

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setPhase("scanning");
      setError(null);
      startProgress();
      try {
        const res = await reverseImageSearch(file);
        stopProgress();
        setProgress(100);
        setResults(res);
        setPhase("results");
        toast.success(`Found ${res.length} sighting${res.length === 1 ? "" : "s"}`);
      } catch (e) {
        stopProgress();
        setError(e instanceof Error ? e.message : "Scan failed");
        setPhase("error");
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const reset = () => {
    setPhase("idle");
    setPreview(null);
    setResults([]);
    setProgress(0);
    setError(null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen grid-bg">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/"><Logo /></Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
          <Button variant="ghost" size="sm" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        {phase === "idle" && (
          <section
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="group cursor-pointer rounded-2xl border-2 border-dashed border-border bg-card/40 p-16 text-center backdrop-blur transition hover:border-primary hover:bg-card/60 hover:shadow-neon"
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-cyber shadow-glow">
              <Upload className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold">Drop a portrait to begin scan</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              JPEG or PNG, up to 8MB. Your image is processed in-memory and discarded immediately after the search.
            </p>
            <Button className="mt-6 bg-gradient-cyber text-primary-foreground hover:opacity-90">
              Select image
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </section>
        )}

        {phase === "scanning" && (
          <section className="rounded-2xl border border-border bg-card/60 p-10 backdrop-blur">
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              {preview && (
                <img
                  src={preview}
                  alt="Scanning subject"
                  className="h-32 w-32 rounded-xl border border-primary/40 object-cover shadow-glow"
                />
              )}
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
                  Searching global databases…
                </div>
                <Progress value={progress} className="mt-3" />
                <p className="mt-3 text-xs text-muted-foreground">
                  Querying Google Lens · cross-referencing public web · {Math.round(progress)}%
                </p>
              </div>
            </div>
          </section>
        )}

        {phase === "error" && (
          <section className="rounded-2xl border border-destructive/40 bg-destructive/10 p-8">
            <div className="flex items-start gap-4">
              <ShieldAlert className="h-6 w-6 text-destructive" />
              <div className="flex-1">
                <h3 className="font-semibold">Scan failed</h3>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                <Button className="mt-4" variant="outline" onClick={reset}>
                  <RefreshCcw className="h-4 w-4" /> Try again
                </Button>
              </div>
            </div>
          </section>
        )}

        {phase === "results" && (
          <section>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {results.length} <span className="text-gradient-cyber">sightings</span> detected
                </h2>
                <p className="text-sm text-muted-foreground">Review each match. Trigger a takedown for unauthorized use.</p>
              </div>
              <Button variant="outline" onClick={reset}>
                <RefreshCcw className="h-4 w-4" /> New scan
              </Button>
            </div>

            {results.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card/60 p-12 text-center">
                <ImageOff className="mx-auto h-10 w-10 text-muted-foreground" />
                <p className="mt-3 font-medium">No matches found on the public web.</p>
                <p className="text-sm text-muted-foreground">Your image isn't indexed in the sources we scanned.</p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((r, i) => (
                  <article
                    key={`${r.source_url}-${i}`}
                    className="group overflow-hidden rounded-xl border border-border bg-card/60 backdrop-blur transition hover:border-primary/50 hover:shadow-neon"
                  >
                    <div className="aspect-video overflow-hidden bg-muted">
                      {r.thumbnail ? (
                        <img
                          src={r.thumbnail}
                          alt={r.title || r.source_name}
                          loading="lazy"
                          className="h-full w-full object-cover transition group-hover:scale-105"
                          onError={(e) => ((e.currentTarget.style.display = "none"))}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                          <ImageOff className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="truncate text-xs font-medium uppercase tracking-wider text-primary">
                        {r.source_name}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold">{r.title || r.source_url}</h3>
                      <div className="mt-4 flex gap-2">
                        <a
                          href={r.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            <ExternalLink className="h-3.5 w-3.5" /> Visit
                          </Button>
                        </a>
                        <Button
                          size="sm"
                          className="flex-1 bg-gradient-cyber text-primary-foreground hover:opacity-90"
                          onClick={() => setTakedown(r)}
                        >
                          <Gavel className="h-3.5 w-3.5" /> Take action
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <TakedownDialog
        sighting={takedown}
        userEmail={user.email ?? ""}
        onOpenChange={(open) => !open && setTakedown(null)}
      />
    </div>
  );
}
