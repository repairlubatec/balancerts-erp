import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { BarChart3, Building2, Calculator, ChevronDown, ClipboardCheck, FileText, Landmark, LayoutDashboard, LogOut, PanelLeft, Receipt, Settings2, ShieldCheck, Truck, UsersRound, WalletCards, Warehouse } from "lucide-react";
import React, { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { WorkspaceTabBar, type WorkspaceTab } from "./WorkspaceTabBar";
import { DesktopMenuBar, DesktopStatusBar } from "./DesktopMenuBar";
import { Button } from "./ui/button";

const menuItems = [
  { icon: LayoutDashboard, label: "Minhas Empresas", group: "Contexto", path: "/" },
  { icon: Building2, label: "Empresas", group: "Contexto", path: "/empresas" },
  { icon: Calculator, label: "Contabilidade", group: "Financeira", path: "/contabilidade" },
  { icon: WalletCards, label: "Tesouraria", group: "Financeira", path: "/tesouraria" },
  { icon: Receipt, label: "Facturação", group: "Comercial", path: "/facturacao" },
  { icon: UsersRound, label: "Clientes", group: "Comercial", path: "/clientes" },
  { icon: Truck, label: "Fornecedores", group: "Comercial", path: "/fornecedores" },
  { icon: FileText, label: "Documentos", group: "Comercial", path: "/documentos" },
  { icon: Warehouse, label: "Stock", group: "Operações", path: "/stock" },
  { icon: Warehouse, label: "Imobilizado", group: "Operações", path: "/imobilizado" },
  { icon: Landmark, label: "Fiscalidade", group: "Controlo", path: "/fiscalidade" },
  { icon: BarChart3, label: "Relatórios", group: "Controlo", path: "/relatorios" },
  { icon: ClipboardCheck, label: "Fecho", group: "Controlo", path: "/fecho" },
  { icon: ShieldCheck, label: "Auditoria", group: "Controlo", path: "/auditoria" },
  { icon: Settings2, label: "Definições", group: "Sistema", path: "/definicoes" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => startLogin()}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const activePath = location.split("?")[0] || "/";
  const [openPaths, setOpenPaths] = useState<string[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("balancerts.workspaceTabs") ?? "[]") as unknown;
      const valid = Array.isArray(stored) ? stored.filter((path): path is string => typeof path === "string" && menuItems.some((item) => item.path === path)) : [];
      return valid.length ? Array.from(new Set(["/", ...valid])) : ["/"];
    } catch {
      return ["/"];
    }
  });
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("balancerts.collapsedMenuGroups") ?? "[]") as unknown;
      return Array.isArray(stored) ? stored.filter((group): group is string => typeof group === "string") : [];
    } catch {
      return [];
    }
  });
  const toggleGroup = (group: string) => setCollapsedGroups((current) => current.includes(group) ? current.filter((item) => item !== group) : [...current, group]);
  const workspaceTabs: WorkspaceTab[] = openPaths.map((path) => menuItems.find((item) => item.path === path)).filter((item): item is (typeof menuItems)[number] => Boolean(item));

  useEffect(() => {
    if (!openPaths.includes(activePath) && menuItems.some((item) => item.path === activePath)) {
      setOpenPaths((current) => [...current, activePath]);
    }
  }, [activePath, openPaths]);

  useEffect(() => {
    localStorage.setItem("balancerts.workspaceTabs", JSON.stringify(openPaths));
  }, [openPaths]);

  useEffect(() => {
    localStorage.setItem("balancerts.collapsedMenuGroups", JSON.stringify(collapsedGroups));
  }, [collapsedGroups]);

  const workspaceTabPaths = workspaceTabs.map((tab) => tab.path).join("|");

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const shortcut = event.key.toLowerCase();
      if (shortcut === "k") {
        event.preventDefault();
        setLocation("/?shortcuts=1");
        return;
      }
      if (shortcut === "w" && openPaths.length > 1) {
        event.preventDefault();
        closeWorkspace(activePath);
        return;
      }
      const number = Number(event.key);
      if (number >= 1 && number <= 9 && workspaceTabs[number - 1]) {
        event.preventDefault();
        setLocation(workspaceTabs[number - 1].path);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [activePath, openPaths.length, setLocation, workspaceTabPaths]);

  const selectWorkspace = (path: string) => {
    setOpenPaths((current) => current.includes(path) ? current : [...current, path]);
    setLocation(path);
  };

  const closeWorkspace = (path: string) => {
    if (openPaths.length <= 1) return;
    const index = openPaths.indexOf(path);
    const remaining = openPaths.filter((item) => item !== path);
    setOpenPaths(remaining);
    if (path === activePath) {
      setLocation(remaining[Math.max(0, index - 1)] ?? "/");
    }
  };

  const openNextWorkspace = () => {
    const next = menuItems.find((item) => !openPaths.includes(item.path)) ?? menuItems[0];
    selectWorkspace(next.path);
  };

  const handleMenuCommand = (command: string) => {
    if (command === "view") {
      toggleSidebar();
      return;
    }
    if (command === "operations") {
      selectWorkspace("/facturacao");
      return;
    }
    if (command === "reports") {
      selectWorkspace("/relatorios");
      return;
    }
    if (command === "file") {
      selectWorkspace("/empresas");
      return;
    }
    if (command === "window") {
      openNextWorkspace();
      return;
    }
    if (command === "help") {
      setLocation("/?shortcuts=1");
    }
  };
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === activePath);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-[#aeb8c4] bg-[#edf1f5]"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-11 justify-center border-b border-[#c9d1db] bg-[#e5e9ee]">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                  className="h-7 w-7 flex items-center justify-center rounded-sm border border-[#b8c3cf] bg-[#f5f7f9] hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1267d6] shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold tracking-tight truncate text-[#1267d6]">
                    BALANCERTS.ERP
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {menuItems.map((item, index) => {
                const isActive = activePath === item.path;
                const previous = menuItems[index - 1];
                const firstOfGroup = !previous || previous.group !== item.group;
                const groupOpen = !collapsedGroups.includes(item.group) || activePath === item.path;
                return (
                  <React.Fragment key={item.path}>
                    {!isCollapsed && firstOfGroup && <li className="list-none px-2 pb-1 pt-2"><button type="button" onClick={() => toggleGroup(item.group)} className="flex w-full items-center justify-between text-left text-[9px] font-bold uppercase tracking-[0.14em] text-[#7a8795] outline-none hover:text-[#1d568f] focus-visible:ring-1 focus-visible:ring-[#1267d6]"><span>{item.group}</span><ChevronDown className={`h-3 w-3 transition-transform ${groupOpen ? "" : "-rotate-90"}`} /></button></li>}
                  {(!isCollapsed && !groupOpen) ? null : <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => selectWorkspace(item.path)}
                      tooltip={item.label}
                      className={`h-8 rounded-sm border border-transparent text-[12px] transition-all font-normal ${isActive ? "border-[#b7c9dc] bg-[#d9e6f4] text-[#123d70] shadow-none" : "hover:border-[#d0d8e2] hover:bg-white"}`}
                    >
                      <item.icon
                        className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                      />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>}
                  </React.Fragment>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-[#c9d1db] bg-[#e5e9ee] p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="border-l border-[#aeb8c4] bg-[#dfe4ea]">
        <DesktopMenuBar activeModule={activeMenuItem?.label} onCommand={handleMenuCommand} />
        <WorkspaceTabBar
          tabs={workspaceTabs}
          activePath={activePath}
          onSelect={selectWorkspace}
          onClose={closeWorkspace}
          onNew={openNextWorkspace}
        />
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="erp-workspace flex min-h-0 flex-1 flex-col bg-[#dfe4ea] p-3">{children}</main>
        <DesktopStatusBar module={activeMenuItem?.label} />
      </SidebarInset>
    </>
  );
}
