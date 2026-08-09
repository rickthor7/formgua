import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Shield, LogOut, Loader2, Check, X, Crown, FileText, Users, Wallet, ExternalLink, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { popup } from "@/lib/swal";
import { AdminChatPanel } from "@/components/admin/AdminChatPanel";

interface PremiumRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_method: string | null;
  proof_url: string | null;
  duration_months: number;
  notes: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  user_id: string;
  amount: number;
  status: string;
  period_start: string;
  period_end: string | null;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, { email: string; display_name: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<PremiumRequest | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [view, setView] = useState<"requests" | "invoices" | "chat">("requests");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      const ok = !!data;
      setIsAdmin(ok);
      if (!ok) navigate("/dashboard", { replace: true });
    })();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: reqs }, { data: invs }] = await Promise.all([
      supabase.from("premium_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("invoices").select("*").order("created_at", { ascending: false }),
    ]);
    setRequests(reqs ?? []);
    setInvoices(invs ?? []);
    const ids = [...new Set([...(reqs ?? []).map((r: any) => r.user_id), ...(invs ?? []).map((i: any) => i.user_id)])];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id,email,display_name").in("user_id", ids);
      const map: Record<string, any> = {};
      (profs ?? []).forEach((p: any) => { map[p.user_id] = { email: p.email, display_name: p.display_name }; });
      setProfilesMap(map);
    }
    setLoading(false);
  };

  useEffect(() => { if (isAdmin) fetchData(); }, [isAdmin]);

  const openReview = async (r: PremiumRequest) => {
    setReviewing(r);
    setAdminNote(r.admin_note || "");
    setProofUrl(null);
    if (r.proof_url) {
      const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(r.proof_url, 600);
      setProofUrl(data?.signedUrl ?? null);
    }
  };

  const handleApprove = async () => {
    if (!reviewing || !user) return;
    setActionLoading(true);
    try {
      const periodStart = new Date();
      const periodEnd = new Date();
      if (reviewing.duration_months === 0) {
        periodEnd.setDate(periodEnd.getDate() + 7);
      } else {
        periodEnd.setMonth(periodEnd.getMonth() + reviewing.duration_months);
      }

      // 1. Grant premium role
      const { error: roleErr } = await supabase.from("user_roles").upsert(
        { user_id: reviewing.user_id, role: "premium", expires_at: periodEnd.toISOString() },
        { onConflict: "user_id,role" },
      );
      if (roleErr) throw roleErr;

      // 2. Create invoice
      const invoiceNumber = `INV-${Date.now()}-${reviewing.user_id.slice(0, 6).toUpperCase()}`;
      const { error: invErr } = await supabase.from("invoices").insert({
        invoice_number: invoiceNumber,
        user_id: reviewing.user_id,
        premium_request_id: reviewing.id,
        amount: reviewing.amount,
        status: "paid",
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      });
      if (invErr) throw invErr;

      // 3. Update request
      const { error: reqErr } = await supabase.from("premium_requests").update({
        status: "approved",
        admin_note: adminNote.trim() || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      }).eq("id", reviewing.id);
      if (reqErr) throw reqErr;

      popup.success("Premium diaktifkan & invoice dibuat");
      setReviewing(null);
      fetchData();
    } catch (e: any) {
      popup.error(e?.message || "Gagal approve");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reviewing || !user) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from("premium_requests").update({
        status: "rejected",
        admin_note: adminNote.trim() || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      }).eq("id", reviewing.id);
      if (error) throw error;
      popup.success("Permintaan ditolak");
      setReviewing(null);
      fetchData();
    } catch (e: any) {
      popup.error(e?.message || "Gagal");
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) return null;

  const pending = requests.filter(r => r.status === "pending");
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const activeProUsers = invoices.filter(i => i.period_end && new Date(i.period_end) > new Date()).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-4 h-14 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold truncate">Admin Console</h1>
              <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")} className="text-xs h-8 px-2 sm:px-3">
              <span className="hidden sm:inline">User View</span>
              <span className="sm:hidden">User</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); navigate("/"); }} className="text-xs h-8 px-2 sm:px-3">
              <LogOut className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
            <ThemeToggle />
          </div>
        </div>
        <nav className="border-t bg-background/60">
          <div className="max-w-7xl mx-auto flex items-center gap-1 px-3 sm:px-4 overflow-x-auto">
            {([
              { key: "requests", label: "Verifikasi", icon: Users },
              { key: "invoices", label: "Invoice", icon: FileText },
              { key: "chat", label: "Chat", icon: MessageCircle },
            ] as const).map((t) => {
              const Icon = t.icon;
              const active = view === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setView(t.key)}
                  className={`relative flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-xs font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                  {t.key === "requests" && pending.length > 0 && (
                    <Badge variant="destructive" className="h-4 px-1 text-[9px]">{pending.length}</Badge>
                  )}
                  {active && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
        </nav>
      </header>


      <main className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
          <StatCard icon={Users} label="Pending" value={pending.length} accent="amber" />
          <StatCard icon={Crown} label="Pro Aktif" value={activeProUsers} accent="emerald" />
          <StatCard icon={FileText} label="Total Invoice" value={invoices.length} accent="blue" />
          <StatCard icon={Wallet} label="Pendapatan" value={`Rp ${totalRevenue.toLocaleString("id-ID")}`} accent="violet" />
        </div>

        {view === "requests" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Permintaan Upgrade Premium</CardTitle>
                <CardDescription>Review bukti pembayaran lalu approve / reject.</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : requests.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Belum ada permintaan</p>
                ) : (
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">User</TableHead>
                          <TableHead className="whitespace-nowrap">Durasi</TableHead>
                          <TableHead className="whitespace-nowrap">Nominal</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="whitespace-nowrap">Tanggal</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="text-xs">
                              <p className="font-medium">{profilesMap[r.user_id]?.display_name || "—"}</p>
                              <p className="text-muted-foreground">{profilesMap[r.user_id]?.email || r.user_id.slice(0, 8)}</p>
                            </TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{durationLabel(r.duration_months)}</TableCell>
                            <TableCell className="text-xs font-semibold whitespace-nowrap">Rp {r.amount.toLocaleString("id-ID")}</TableCell>
                            <TableCell>
                              <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"} className="text-[10px]">
                                {r.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleDateString("id-ID")}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => openReview(r)}>Review</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
        )}

        {view === "invoices" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Daftar Invoice</CardTitle>
                <CardDescription>Riwayat pembayaran premium yang sudah disetujui.</CardDescription>
              </CardHeader>
              <CardContent className="px-2 sm:px-6">
                {invoices.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">Belum ada invoice</p>
                ) : (
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap">Invoice</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead className="whitespace-nowrap">Nominal</TableHead>
                          <TableHead className="whitespace-nowrap">Periode</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.map((i) => (
                          <TableRow key={i.id}>
                            <TableCell className="text-xs font-mono whitespace-nowrap">{i.invoice_number}</TableCell>
                            <TableCell className="text-xs">{profilesMap[i.user_id]?.email || i.user_id.slice(0, 8)}</TableCell>
                            <TableCell className="text-xs font-semibold whitespace-nowrap">Rp {i.amount.toLocaleString("id-ID")}</TableCell>
                            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(i.period_start).toLocaleDateString("id-ID")} →{" "}
                              {i.period_end ? new Date(i.period_end).toLocaleDateString("id-ID") : "∞"}
                            </TableCell>
                            <TableCell><Badge variant={i.status === "paid" ? "default" : "secondary"} className="text-[10px]">{i.status}</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
        )}

        {view === "chat" && user && (
          <AdminChatPanel adminId={user.id} />
        )}
      </main>

      <Dialog open={!!reviewing} onOpenChange={(v) => !v && setReviewing(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Review Permintaan Premium</DialogTitle></DialogHeader>
          {reviewing && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">User:</span> <p className="font-medium">{profilesMap[reviewing.user_id]?.email}</p></div>
                <div><span className="text-muted-foreground">Durasi:</span> <p className="font-medium">{durationLabel(reviewing.duration_months)}</p></div>
                <div><span className="text-muted-foreground">Nominal:</span> <p className="font-semibold">Rp {reviewing.amount.toLocaleString("id-ID")}</p></div>
                <div><span className="text-muted-foreground">Metode:</span> <p className="font-medium">{reviewing.payment_method || "—"}</p></div>
              </div>
              {reviewing.notes && (
                <div className="text-xs"><span className="text-muted-foreground">Catatan user:</span> <p>{reviewing.notes}</p></div>
              )}
              {proofUrl && (
                <div>
                  <p className="text-xs font-medium mb-1.5">Bukti Transfer:</p>
                  <a href={proofUrl} target="_blank" rel="noreferrer" className="block rounded-lg border overflow-hidden">
                    <img src={proofUrl} alt="bukti" className="w-full max-h-72 object-contain bg-muted" onError={(e) => { (e.currentTarget as any).style.display = "none"; }} />
                  </a>
                  <a href={proofUrl} target="_blank" rel="noreferrer" className="text-[11px] text-primary inline-flex items-center gap-1 mt-1.5">
                    <ExternalLink className="h-3 w-3" /> Buka di tab baru
                  </a>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Catatan Admin (opsional)</label>
                <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} rows={2} className="resize-none" placeholder="Catatan untuk user..." />
              </div>
              {reviewing.status === "pending" ? (
                <div className="flex gap-2 justify-end pt-1">
                  <Button variant="outline" onClick={handleReject} disabled={actionLoading} className="gap-1.5">
                    <X className="h-4 w-4" /> Tolak
                  </Button>
                  <Button onClick={handleApprove} disabled={actionLoading} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve
                  </Button>
                </div>
              ) : (
                <p className="text-[11px] text-muted-foreground italic">Permintaan sudah {reviewing.status}.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function durationLabel(months: number) {
  if (months === 0) return "1 minggu";
  if (months === 12) return "1 tahun";
  return `${months} bln`;
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number | string; accent: string }) {
  const colorMap: Record<string, string> = {
    amber: "from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    blue: "from-blue-500/20 to-blue-500/5 text-blue-600 dark:text-blue-400",
    violet: "from-violet-500/20 to-violet-500/5 text-violet-600 dark:text-violet-400",
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`inline-flex h-9 w-9 rounded-lg bg-gradient-to-br ${colorMap[accent]} items-center justify-center mb-2`}>
          <Icon className="h-4 w-4" />
        </div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
