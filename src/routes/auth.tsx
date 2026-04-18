import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Sign in · LOOKOUT" }] }),
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const handle = async (mode: "signin" | "signup") => {
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) {
          if (error.message.toLowerCase().includes("not confirmed")) {
            toast.error("Email not confirmed. Tap 'Resend confirmation' below.");
            return;
          }
          throw error;
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    const emailParse = schema.shape.email.safeParse(email);
    if (!emailParse.success) {
      toast.error("Enter your email above first");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: emailParse.data,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) throw error;
      toast.success("Confirmation email sent. Check your inbox.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to resend");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg flex flex-col">
      <header className="mx-auto w-full max-w-6xl px-6 py-6">
        <Link to="/"><Logo /></Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-6 pb-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 p-8 backdrop-blur shadow-neon">
          <h1 className="text-2xl font-bold">Access your <span className="text-gradient-cyber">control panel</span></h1>
          <p className="mt-1 text-sm text-muted-foreground">Email + password. No tracking, no profiles sold.</p>

          <Tabs defaultValue="signin" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            {(["signin", "signup"] as const).map((m) => (
              <TabsContent key={m} value={m} className="space-y-4 mt-6">
                <div className="space-y-2">
                  <Label htmlFor={`${m}-email`}>Email</Label>
                  <Input id={`${m}-email`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`${m}-pw`}>Password</Label>
                  <Input id={`${m}-pw`} type="password" autoComplete={m === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button
                  className="w-full bg-gradient-cyber text-primary-foreground hover:opacity-90 shadow-glow"
                  disabled={busy}
                  onClick={() => handle(m)}
                >
                  {busy ? "…" : m === "signin" ? "Sign in" : "Create account"}
                </Button>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
