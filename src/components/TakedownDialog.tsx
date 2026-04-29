import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Mail, Sparkles, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { draftAITakedown, type Sighting } from "@/lib/search-client";
import { INDIAN_CYBERCRIME_CONTACTS } from "@/lib/cybercrime-contacts";

type Props = {
  sighting: Sighting | null;
  userEmail: string;
  onOpenChange: (open: boolean) => void;
};

const GRIEVANCE_PLACEHOLDER = "grievance@platform.example";

function buildNotice({
  fullName,
  email,
  sighting,
}: {
  fullName: string;
  email: string;
  sighting: Sighting;
}) {
  const today = new Date().toISOString().split("T")[0];
  return `To,
The Grievance Officer,
${sighting.source_name}

Date: ${today}

Subject: Notice for removal of unlawful content under Section 79 of the Information Technology Act, 2000 read with Rule 3(2) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021

Dear Grievance Officer,

I, ${fullName || "[Your Full Name]"}, am writing to formally request the immediate removal of content hosted on your platform that infringes upon my rights and constitutes a violation of applicable laws.

1. Identification of the infringing content:
   URL: ${sighting.source_url}
   Title / context: ${sighting.title || "N/A"}

2. Nature of the violation:
   The above URL hosts an image of me that has been published, shared, or distributed without my consent. This constitutes a violation of my right to privacy under Article 21 of the Constitution of India, and falls within the categories of unlawful content described in Rule 3(1)(b) of the IT Rules, 2021 (including but not limited to content that is invasive of another's privacy, defamatory, or impersonative).

3. Statement of good faith:
   I have a good faith belief that the use of the above-described material is not authorized by me, my agent, or the law. The information in this notice is accurate, and under penalty of perjury, I am the person whose likeness is depicted, or am authorized to act on behalf of that person.

4. Action requested:
   Pursuant to Section 79(3)(b) of the IT Act and Rule 3(2)(a) of the IT Rules, 2021, I request that ${sighting.source_name} disable access to or remove the above content within thirty-six (36) hours of receipt of this notice. Failure to do so may result in loss of safe harbour protection and further legal action.

5. Contact information:
   Name: ${fullName || "[Your Full Name]"}
   Email: ${email}

Yours sincerely,
${fullName || "[Your Full Name]"}
`;
}

export function TakedownDialog({ sighting, userEmail, onOpenChange }: Props) {
  const [fullName, setFullName] = useState("");
  const [grievanceEmail, setGrievanceEmail] = useState("");
  const [aiBody, setAiBody] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [ccSelected, setCcSelected] = useState<Set<string>>(new Set());

  const fallbackBody = useMemo(
    () => (sighting ? buildNotice({ fullName, email: userEmail, sighting }) : ""),
    [fullName, userEmail, sighting]
  );
  const body = aiBody ?? fallbackBody;

  if (!sighting) return null;

  const subject = `Section 79 IT Act takedown — ${sighting.source_url}`;
  const ccList = Array.from(ccSelected).join(",");
  const mailto = `mailto:${encodeURIComponent(grievanceEmail || GRIEVANCE_PLACEHOLDER)}${ccList ? `?cc=${encodeURIComponent(ccList)}&` : "?"}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const copy = async () => {
    await navigator.clipboard.writeText(body);
    toast.success("Notice copied to clipboard");
  };

  const generateAI = async () => {
    setDrafting(true);
    try {
      const letter = await draftAITakedown({
        source_url: sighting.source_url,
        source_name: sighting.source_name,
        title: sighting.title,
        full_name: fullName || "[Your Full Name]",
        email: userEmail,
        risk: sighting.risk,
        category: sighting.category,
      });
      setAiBody(letter);
      toast.success("AI-drafted notice ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI draft failed");
    } finally {
      setDrafting(false);
    }
  };

  const toggleCc = (email: string) => {
    setCcSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  return (
    <Dialog open={!!sighting} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Section 79 takedown notice</DialogTitle>
          <DialogDescription>
            Pre-filled for <span className="text-primary">{sighting.source_name}</span>
            {sighting.risk && (
              <span className={
                "ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase " +
                (sighting.risk === "high"
                  ? "bg-destructive/20 text-destructive"
                  : sighting.risk === "medium"
                    ? "bg-yellow-500/20 text-yellow-500"
                    : "bg-emerald-500/20 text-emerald-500")
              }>
                {sighting.risk} risk
              </span>
            )}
            . Review, then send via email.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullname">Your full name</Label>
              <Input
                id="fullname"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value.slice(0, 100))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grievance">Grievance officer email</Label>
              <Input
                id="grievance"
                type="email"
                placeholder={GRIEVANCE_PLACEHOLDER}
                value={grievanceEmail}
                onChange={(e) => setGrievanceEmail(e.target.value.slice(0, 255))}
              />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                CC Indian cybercrime authorities
              </Label>
              <span className="text-[10px] text-muted-foreground">
                {ccSelected.size} selected
              </span>
            </div>
            <div className="grid max-h-40 gap-1.5 overflow-y-auto sm:grid-cols-2">
              {INDIAN_CYBERCRIME_CONTACTS.map((c) => (
                <label
                  key={c.email}
                  className="flex cursor-pointer items-start gap-2 rounded p-1.5 text-xs hover:bg-muted/50"
                >
                  <Checkbox
                    checked={ccSelected.has(c.email)}
                    onCheckedChange={() => toggleCc(c.email)}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{c.email}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Notice preview {aiBody && <span className="ml-2 text-[10px] text-primary">AI-drafted</span>}</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={generateAI}
                disabled={drafting}
              >
                {drafting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {aiBody ? "Regenerate with AI" : "Draft with AI"}
              </Button>
            </div>
            <Textarea readOnly value={body} className="min-h-[280px] font-mono text-xs" />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={copy}>
            <Copy className="h-4 w-4" /> Copy
          </Button>
          <a href={mailto}>
            <Button className="bg-gradient-cyber text-primary-foreground hover:opacity-90 shadow-glow">
              <Mail className="h-4 w-4" /> Open email draft
            </Button>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
