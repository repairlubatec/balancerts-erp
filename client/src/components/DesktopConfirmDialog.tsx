import React from "react";
import { Button } from "@/components/ui/button";
import { DesktopWindowFrame } from "@/components/DesktopWindowFrame";

export function DesktopConfirmDialog({ open, title, subtitle, description, onConfirm, onCancel, pending, confirmLabel = "Confirmar" }: { open: boolean; title: string; subtitle: string; description: string; onConfirm: () => void; onCancel: () => void; pending?: boolean; confirmLabel?: string }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0b1f33]/35 p-4" role="presentation"><div className="w-full max-w-lg" role="dialog" aria-modal="true" aria-labelledby="desktop-confirm-dialog-title"><DesktopWindowFrame title={title} subtitle={subtitle} onClose={pending ? undefined : onCancel}><div className="space-y-4 bg-[#f7f9fb] p-4"><div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950"><p id="desktop-confirm-dialog-title" className="font-semibold">Confirmação necessária</p><p className="mt-1 text-amber-900">{description}</p></div><div className="flex justify-end gap-2 border-t border-[#dbe5f1] pt-3"><Button type="button" variant="outline" disabled={pending} onClick={onCancel} className="bg-white">Cancelar</Button><Button type="button" disabled={pending} onClick={onConfirm} className="bg-[#1267d6] hover:bg-[#0f58b8]">{pending ? "A actualizar…" : confirmLabel}</Button></div></div></DesktopWindowFrame></div></div>;
}
