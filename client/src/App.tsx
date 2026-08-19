import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardLayout";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function Router() {
  return (
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
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
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
