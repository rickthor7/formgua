import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { FormManager } from "@/components/dashboard/FormManager";
import { ResponseChart } from "@/components/dashboard/ResponseChart";
import { CreateFormDialog } from "@/components/dashboard/CreateFormDialog";
import { SelectFormTypeDialog, type FormType } from "@/components/dashboard/SelectFormTypeDialog";
import { DeleteFormDialog } from "@/components/dashboard/DeleteFormDialog";
import { UpgradePremiumDialog } from "@/components/dashboard/UpgradePremiumDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, LogOut, User as UserIcon, LogIn, Crown, Sparkles, Infinity as InfinityIcon, HelpCircle } from "lucide-react";
import { OnboardingTour, TOUR_STORAGE_KEY } from "@/components/OnboardingTour";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { popup } from "@/lib/swal";

interface FormWithCount {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  responseCount: number;
  slug: string | null;
  password: string | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const [forms, setForms] = useState<FormWithCount[]>([]);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<FormType>("bebas");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; password: string | null; isOwned: boolean } | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [aiUsed, setAiUsed] = useState(0);
  const [tourOpen, setTourOpen] = useState(false);

  // Auto-start onboarding tour once (works for guest & logged-in)
  useEffect(() => {
    if (loading) return;
    if (localStorage.getItem(TOUR_STORAGE_KEY)) return;
    const t = window.setTimeout(() => setTourOpen(true), 600);
    return () => window.clearTimeout(t);
  }, [loading]);


  // Redirect admin to /admin; load roles & quota
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: roles }, { data: prof }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("profiles").select("ai_usage_count").eq("user_id", user.id).maybeSingle(),
      ]);
      const r = (roles ?? []).map((x: any) => x.role);
      if (r.includes("admin")) {
        navigate("/admin", { replace: true });
        return;
      }
      setIsPremium(r.includes("premium"));
      setAiUsed(prof?.ai_usage_count ?? 0);
    })();
  }, [user, navigate]);

  useEffect(() => {
    if (searchParams.get("upgrade") === "1" && user) {
      setUpgradeOpen(true);
      searchParams.delete("upgrade");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, user, setSearchParams]);

  const fetchForms = async () => {
    setLoading(true);
    let query = supabase.from("forms").select("*").order("created_at", { ascending: false });
    // Logged in: only show forms owned by this user.
    // Guest: only show forms without an owner (truly public).
    if (user) {
      query = query.eq("owner_id", user.id);
    } else {
      query = query.is("owner_id", null);
    }
    const { data: formsData, error } = await query;
    if (error) { popup.error("Gagal memuat form"); setLoading(false); return; }

    const ids = (formsData || []).map((f: any) => f.id);
    const countMap: Record<string, number> = {};
    if (ids.length) {
      const { data: responses } = await supabase.from("form_responses").select("form_id").in("form_id", ids);
      responses?.forEach((r: any) => { countMap[r.form_id] = (countMap[r.form_id] || 0) + 1; });
    }

    setForms((formsData || []).map((f: any) => ({ ...f, responseCount: countMap[f.id] || 0 })));
    setLoading(false);
  };

  useEffect(() => { fetchForms(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user?.id]);

  const buildSeedFields = (formType: FormType) => {
    if (formType === "responden") {
      return [{
        id: crypto.randomUUID(),
        type: "likert",
        label: "",
        required: false,
        options: ["1", "2", "3", "4", "5"],
      }];
    }
    if (formType === "ujian") {
      return [{
        id: crypto.randomUUID(),
        type: "exam_mc",
        label: "",
        required: true,
        options: ["A", "B", "C", "D", "E"],
        answer_key: "",
        points_correct: 10,
        points_wrong: 0,
      }];
    }
    return [];
  };

  const handleCreate = async (data: { title: string; description: string; password: string; giveaway_enabled: boolean; giveaway_ewallets: string[]; giveaway_mode: "equal" | "random"; giveaway_total_amount: number; giveaway_winner_count: number; notify_enabled: boolean; notify_email: string; layout_mode: "paginated" | "scroll"; form_type: FormType; ai_prompt: string }) => {
    let seedFields: any[] = buildSeedFields(data.form_type);

    // Generate fields via AI jika user mengisi ai_prompt
    if (data.ai_prompt && data.ai_prompt.trim()) {
      try {
        const { data: aiData, error: aiErr } = await supabase.functions.invoke("generate-form-ai", {
          body: {
            prompt: data.ai_prompt.trim(),
            form_type: data.form_type,
            title: data.title,
            description: data.description,
          },
        });
        if (aiErr) {
          popup.error(aiErr.message || "Gagal generate dengan AI");
        } else if (aiData?.error) {
          popup.error(aiData.error);
        } else if (Array.isArray(aiData?.fields) && aiData.fields.length) {
          seedFields = aiData.fields;
        }
      } catch (e: any) {
        popup.error("Gagal menghubungi AI: " + (e?.message || "unknown"));
      }
    }

    const { data: created, error } = await supabase.from("forms").insert({
      title: data.title,
      description: data.description || null,
      status: "active",
      fields: seedFields as any,
      form_type: data.form_type,
      password: user ? null : data.password,
      owner_id: user?.id ?? null,
      giveaway_enabled: data.giveaway_enabled,
      giveaway_ewallets: data.giveaway_ewallets,
      giveaway_mode: data.giveaway_mode,
      giveaway_total_amount: data.giveaway_total_amount,
      giveaway_winner_count: data.giveaway_winner_count,
      notify_enabled: data.notify_enabled,
      notify_email: data.notify_email || null,
      layout_mode: data.layout_mode,
    } as any).select().single();
    if (error) { popup.error("Gagal membuat form"); return; }
    popup.success(data.ai_prompt ? "Form berhasil dibuat dengan AI!" : "Form berhasil dibuat!");
    setDialogOpen(false);
    fetchForms();
    // Langsung arahkan ke builder untuk lanjut edit
    if (created?.id) navigate(`/builder/${created.id}`);
  };

  const handleDeleteRequest = (id: string) => {
    const form = forms.find(f => f.id === id);
    if (!form) return;
    setDeleteTarget({ id: form.id, title: form.title, password: form.password, isOwned: !!user });
  };

  const handleDeleteConfirm = async (password: string) => {
    if (!deleteTarget) return;
    // Owner login: skip password verification (RLS handles it)
    if (!deleteTarget.isOwned && deleteTarget.password && deleteTarget.password !== password) {
      popup.error("Password salah!");
      return;
    }
    const { error } = await supabase.from("forms").delete().eq("id", deleteTarget.id);
    if (error) { popup.error("Gagal menghapus form"); return; }
    popup.success("Form dihapus");
    setDeleteTarget(null);
    fetchForms();
  };

  const handleDuplicate = async (id: string) => {
    const { data: fullForm } = await supabase.from("forms").select("*").eq("id", id).single();
    if (!fullForm) { popup.error("Form tidak ditemukan"); return; }

    const { error } = await supabase.from("forms").insert({
      title: `${fullForm.title} (Salinan)`,
      description: fullForm.description,
      status: "draft",
      fields: fullForm.fields,
      password: user ? null : (fullForm as any).password,
      owner_id: user?.id ?? null,
      giveaway_enabled: (fullForm as any).giveaway_enabled,
      giveaway_ewallets: (fullForm as any).giveaway_ewallets,
      giveaway_mode: (fullForm as any).giveaway_mode,
      giveaway_total_amount: (fullForm as any).giveaway_total_amount,
      giveaway_winner_count: (fullForm as any).giveaway_winner_count,
      notify_enabled: (fullForm as any).notify_enabled,
      notify_email: (fullForm as any).notify_email,
      layout_mode: (fullForm as any).layout_mode,
      banner_url: (fullForm as any).banner_url,
      form_type: (fullForm as any).form_type || "bebas",
    } as any);
    if (error) { popup.error("Gagal menduplikasi form"); return; }
    popup.success("Form berhasil diduplikasi!");
    fetchForms();
  };

  const totalResponses = forms.reduce((s, f) => s + f.responseCount, 0);
  const activeForms = forms.filter((f) => f.status === "active").length;
  const completionRate = totalResponses > 0 ? Math.round((forms.filter(f => f.responseCount > 0).length / Math.max(forms.length, 1)) * 100) : 0;

  const openTypeDialog = () => setTypeDialogOpen(true);
  const handleSelectType = (t: FormType) => {
    setSelectedType(t);
    setTypeDialogOpen(false);
    setDialogOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-3 sm:px-4 gap-2">
            <SidebarTrigger />
            <div className="flex-1 min-w-0">
              <h1 className="text-sm font-semibold truncate">Dashboard</h1>
              {user ? (
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground truncate">Mode Tamu (publik)</p>
              )}
            </div>
            <Button onClick={() => setTourOpen(true)} variant="ghost" size="icon" className="h-8 w-8" title="Mulai Tur Fitur" aria-label="Mulai Tur Fitur">
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button data-tour="ai-builder" onClick={openTypeDialog} size="sm" className="gap-1.5 h-8 text-xs">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Form Baru</span>
              <span className="sm:hidden">Baru</span>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <UserIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="text-xs truncate">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={async () => { await signOut(); navigate("/"); }} className="text-xs">
                    <LogOut className="h-3.5 w-3.5 mr-2" />
                    Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => navigate("/auth")} variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Login</span>
              </Button>
            )}
            <ThemeToggle />
          </header>
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 overflow-auto">
            {user && (
              isPremium ? (
                <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-rose-500/10 p-4 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center shrink-0">
                    <Crown className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold flex items-center gap-1.5">Premium Aktif <InfinityIcon className="h-3.5 w-3.5 text-amber-500" /></p>
                    <p className="text-[11px] text-muted-foreground">Generate AI tanpa batas + Analisis Data AI eksklusif.</p>
                  </div>
                  <Button size="sm" onClick={() => navigate("/analisis")} className="bg-gradient-to-r from-primary to-accent gap-1.5 shrink-0">
                    <Sparkles className="h-3.5 w-3.5" /> Analisis Data AI
                  </Button>
                </div>
              ) : (
                <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 p-4 flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <p className="text-sm font-bold">Pakai AI: <span className="text-primary">{Math.max(3 - aiUsed, 0)}/3</span> tersisa</p>
                    <p className="text-[11px] text-muted-foreground">Upgrade Premium untuk generate AI unlimited & dukungan prioritas.</p>
                  </div>
                  <Button size="sm" onClick={() => setUpgradeOpen(true)} className="bg-amber-500 hover:bg-amber-600 gap-1.5">
                    <Crown className="h-3.5 w-3.5" /> Upgrade
                  </Button>
                </div>
              )
            )}
            {!loading && (
              <>
                <div id="forms" data-tour="customizer" className="scroll-mt-20">
                  <FormManager forms={forms} onCreateForm={openTypeDialog} onDeleteForm={handleDeleteRequest} onDuplicateForm={handleDuplicate} />
                </div>
                <div data-tour="gamification">
                  <QuickStats totalForms={forms.length} totalResponses={totalResponses} completionRate={completionRate} activeForms={activeForms} />
                </div>
                <div id="analitik" data-tour="analytics" className="scroll-mt-20">
                  <ResponseChart />
                </div>

              </>
            )}
          </main>
        </div>
      </div>
      <SelectFormTypeDialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen} onSelect={handleSelectType} />
      <CreateFormDialog open={dialogOpen} onOpenChange={setDialogOpen} formType={selectedType} onSubmit={handleCreate} />
      <DeleteFormDialog
        open={!!deleteTarget}
        onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}
        formTitle={deleteTarget?.title || ""}
        onConfirm={handleDeleteConfirm}
      />
      <UpgradePremiumDialog open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      <OnboardingTour open={tourOpen} onClose={() => setTourOpen(false)} />

    </SidebarProvider>
  );
}
