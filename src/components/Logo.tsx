import { Eye } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-md bg-gradient-cyber shadow-glow">
        <Eye className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
      </div>
      <span className="text-lg font-bold tracking-[0.2em] text-foreground">LOOKOUT</span>
    </div>
  );
}
