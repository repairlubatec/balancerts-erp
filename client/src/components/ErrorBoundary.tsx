import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#dfe4ea] p-4">
          <section className="w-full max-w-2xl border border-[#9eabb8] bg-[#fbfcfd]">
            <header className="flex h-9 items-center gap-2 border-b border-[#182b41] bg-[#172b42] px-3 text-xs text-white"><span className="font-semibold">BALANCERTS</span><span className="font-semibold text-[#79c324]">.ERP</span><span className="ml-auto text-[10px] uppercase tracking-[0.12em] text-[#b9c8d8]">Recuperação do sistema</span></header>
            <div className="flex items-start gap-3 p-5"><div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#e0b3a8] bg-[#fff5f2] text-[#b6442f]"><AlertTriangle className="h-4 w-4" /></div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b6442f]">Erro inesperado</p><h2 className="mt-1 text-base font-semibold text-[#1d2a38]">A janela não conseguiu concluir a operação</h2><p className="mt-1 text-xs text-[#687787]">Os dados persistentes não foram alterados. Reinicie a janela e tente novamente.</p></div></div>
            <details className="mx-5 mb-4 border border-[#d9e0e7] bg-[#f5f6f8] px-3 py-2"><summary className="cursor-pointer text-[11px] font-semibold text-[#536273]">Ver detalhe técnico</summary><pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-[10px] text-[#687787]">{this.state.error?.stack}</pre></details>
            <footer className="flex justify-end border-t border-[#d9e0e7] bg-[#eef1f4] px-3 py-2"><button type="button" onClick={() => window.location.reload()} className="flex h-7 items-center gap-1.5 border border-[#1267d6] bg-[#1267d6] px-3 text-[11px] text-white hover:bg-[#0f58b8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1267d6]"><RotateCcw className="h-3.5 w-3.5" /> Reiniciar janela</button></footer>
          </section>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
