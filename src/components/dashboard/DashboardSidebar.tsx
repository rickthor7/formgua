import { LayoutDashboard, FileText, BarChart3, Home, BookOpen, Info, MessageCircle, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const baseItems = [
  { title: "Beranda", icon: Home, url: "/" },
  { title: "Dashboard", icon: LayoutDashboard, url: "/dashboard" },
  { title: "Form", icon: FileText, url: "/dashboard#forms" },
  { title: "Analitik", icon: BarChart3, url: "/dashboard#analitik" },
  { title: "Analisis AI", icon: Sparkles, url: "/analisis", authOnly: true, premium: true },
  { title: "Chat Admin", icon: MessageCircle, url: "/chat-admin", authOnly: true },
  { title: "Panduan", icon: BookOpen, url: "/panduan" },
  { title: "Tentang", icon: Info, url: "/tentang" },
] as const;

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user } = useAuth();
  const items = baseItems.filter((i) => !("authOnly" in i && (i as any).authOnly) || !!user);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md shadow-primary/30 relative overflow-hidden">
            <FileText className="h-4.5 w-4.5 text-primary-foreground relative z-10" strokeWidth={2.5} />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-extrabold tracking-tight text-gradient">FormGua</span>
              <span className="text-[10px] text-muted-foreground font-medium">Form Builder</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
              Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink
                      to={item.url}
                      end={item.url === "/" || item.url === "/dashboard"}
                      data-tour={item.url === "/analisis" ? "ai-analysis" : item.url === "/dashboard#analitik" ? "realtime-analytics" : undefined}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-gradient-to-r from-primary/15 to-accent/10 text-primary font-semibold border-l-2 border-primary"
                    >

                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span className="truncate flex-1">{item.title}</span>}
                      {!collapsed && "premium" in item && (item as any).premium && (
                        <span className="text-[8px] font-bold text-amber-500 bg-amber-500/15 rounded px-1 py-0.5 leading-none">PRO</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <div className={collapsed ? "flex justify-center" : "flex items-center justify-between gap-2"}>
          {!collapsed && (
            <span className="text-[10px] text-muted-foreground">v1.0</span>
          )}
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
