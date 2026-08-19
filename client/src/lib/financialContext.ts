import React from "react";

export function focusNextField(event: React.KeyboardEvent<HTMLElement>) {
  if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
  const target = event.target as HTMLElement;
  if (["BUTTON", "TEXTAREA"].includes(target.tagName)) return;
  const form = target.closest("form");
  if (!form) return;
  const fields = Array.from(form.querySelectorAll<HTMLElement>("input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])")).filter((field) => field.tabIndex !== -1);
  const index = fields.indexOf(target);
  if (index >= 0 && index < fields.length - 1) {
    event.preventDefault();
    fields[index + 1]?.focus();
  }
}
