import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex min-h-[360px] w-full items-center justify-center p-4">
      <section className="w-full max-w-xl border border-[#9eabb8] bg-[#fbfcfd]">
        <header className="flex h-9 items-center gap-2 border-b border-[#182b41] bg-[#172b42] px-3 text-xs text-white">
          <span className="font-semibold tracking-tight">BALANCERTS</span><span className="font-semibold text-[#79c324]">.ERP</span>
          <span className="ml-auto text-[10px] uppercase tracking-[0.12em] text-[#b9c8d8]">Erro de navegação</span>
        </header>
        <div className="flex items-start gap-3 p-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[#e0b3a8] bg-[#fff5f2] text-[#b6442f]"><AlertTriangle className="h-4 w-4" /></div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#b6442f]">Código 404</p>
            <h1 className="mt-1 text-base font-semibold text-[#1d2a38]">Janela não encontrada</h1>
            <p className="mt-1 text-xs leading-relaxed text-[#687787]">O módulo ou endereço solicitado não está disponível no BALANCERTS.ERP.</p>
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-[#d9e0e7] bg-[#eef1f4] px-3 py-2">
          <Button type="button" variant="outline" onClick={() => setLocation("/")} className="h-7 rounded-sm border-[#aeb8c4] bg-white px-3 text-[11px] text-[#1d2a38]"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar à área principal</Button>
        </footer>
      </section>
    </div>
  );
}
