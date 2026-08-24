import { Toaster } from "@/components/ui/sonner";
import { lazy, Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
const Home = lazy(() => import("@/pages/Home"));
const Saadi = lazy(() => import("@/pages/Saadi"));
const Pgca = lazy(() => import("@/pages/Pgca"));

function RouteLoading() {
  return (
    <div className="flex min-h-[240px] items-center justify-center bg-[#e8edf2] p-6" role="status" aria-live="polite">
      <span className="rounded-sm border border-[#bfc9d4] bg-white px-4 py-3 text-xs font-medium text-[#305b88] shadow-sm">A carregar módulo…</span>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Switch>
      <Route path="/" component={Home} />
      <Route path="/contabilidade" component={Home} />
      <Route path="/facturacao" component={Home} />
      <Route path="/comercial" component={Home} />
      <Route path="/clientes" component={Home} />
      <Route path="/fornecedores" component={Home} />
      <Route path="/compras" component={Home} />
      <Route path="/documentos" component={Home} />
      <Route path="/fiscalidade" component={Home} />
      <Route path="/stock" component={Home} />
      <Route path="/imobilizado" component={Home} />
      <Route path="/tesouraria" component={Home} />
      <Route path="/relatorios" component={Home} />
      <Route path="/fecho" component={Home} />
      <Route path="/tarefas" component={Home} />
      <Route path="/auditoria" component={Home} />
      <Route path="/empresas" component={Home} />
      <Route path="/definicoes" component={Home} />
      <Route path="/ia" component={Home} />
      <Route path="/saadi" component={Saadi} />
      <Route path="/pgca" component={Pgca} />
      <Route path="/rh" component={Home} />
      <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <DashboardLayout>
            <Router />
          </DashboardLayout>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
