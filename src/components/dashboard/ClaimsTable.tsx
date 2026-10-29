import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { TableSkeleton } from "@/components/dashboard/TableSkeleton";
import { useInsuranceClaims, useUpdateClaim, CLAIM_STATUSES } from "@/hooks/useBilling";
import { cn } from "@/lib/utils";

const fmt = (n: number) => `₦${Number(n || 0).toLocaleString()}`;
const statusTone: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  submitted: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  paid: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  denied: "bg-destructive/10 text-destructive border-destructive/20",
};

/** Insurance claims list. Claims are drafted from an invoice (Invoice → "Insurance claim"). */
export function ClaimsTable() {
  const { data: claims = [], isLoading } = useInsuranceClaims();
  const update = useUpdateClaim();

  const setStatus = async (c: any, status: string) => {
    const today = new Date().toISOString().slice(0, 10);
    try {
      await update.mutateAsync({
        id: c.id,
        status,
        submitted_date: status === "submitted" ? c.submitted_date || today : c.submitted_date,
        paid_date: status === "paid" ? today : status === "denied" ? null : c.paid_date,
        amount_paid: status === "paid" ? Number(c.amount_claimed) : c.amount_paid,
      });
      toast({ title: `Claim marked ${status}` });
    } catch (e: any) {
      toast({ title: "Could not update claim", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Card className="border-border bg-card shadow-sm overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/50">
        <CardTitle className="text-[15px] font-semibold">Insurance claims</CardTitle>
        <CardDescription className="text-xs">Open an invoice and choose "Insurance claim" to draft a new one.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <TableSkeleton columns={6} rows={4} />
        ) : claims.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No claims yet" description="Claims you draft from invoices will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/30 border-b border-border/50 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4 text-left font-semibold">Invoice</th>
                  <th className="py-3 px-4 text-left font-semibold">Patient</th>
                  <th className="py-3 px-4 text-left font-semibold hidden md:table-cell">Insurer</th>
                  <th className="py-3 px-4 text-right font-semibold">Claimed</th>
                  <th className="py-3 px-4 text-right font-semibold hidden md:table-cell">Paid</th>
                  <th className="py-3 px-4 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c: any) => (
                  <tr key={c.id} className="border-b border-border/30 last:border-0">
                    <td className="py-3 px-4 font-mono text-xs text-primary font-semibold">{c.invoices?.invoice_number || "—"}</td>
                    <td className="py-3 px-4 font-medium">{c.patients ? `${c.patients.first_name} ${c.patients.last_name}` : "—"}</td>
                    <td className="py-3 px-4 hidden md:table-cell text-muted-foreground">
                      {c.insurer_name}
                      {c.policy_number && <span className="block text-[11px]">Policy {c.policy_number}</span>}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold">{fmt(c.amount_claimed)}</td>
                    <td className="py-3 px-4 text-right tabular-nums hidden md:table-cell text-muted-foreground">{fmt(c.amount_paid)}</td>
                    <td className="py-3 px-4">
                      <Select value={c.status} onValueChange={(v) => setStatus(c, v)}>
                        <SelectTrigger className={cn("h-7 w-[120px] text-[11px] font-semibold capitalize border", statusTone[c.status])}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CLAIM_STATUSES.map((s) => (
                            <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
