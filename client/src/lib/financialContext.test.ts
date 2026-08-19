// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { focusNextField } from "./financialContext";

function keyEvent(target: HTMLElement, key = "Enter") {
  return { key, shiftKey: false, ctrlKey: false, metaKey: false, altKey: false, target, preventDefault: vi.fn() } as unknown as React.KeyboardEvent<HTMLElement>;
}

describe("navegação de formulários por Enter", () => {
  it("avança para o campo seguinte e depois para o botão de submissão", () => {
    document.body.innerHTML = `<form><input id="a" /><select id="b"><option>Um</option></select><button type="submit">Guardar</button></form>`;
    const first = document.querySelector("#a") as HTMLInputElement;
    const second = document.querySelector("#b") as HTMLSelectElement;
    const submit = document.querySelector("button") as HTMLButtonElement;
    const firstEvent = keyEvent(first);
    focusNextField(firstEvent);
    expect(firstEvent.preventDefault).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(second);
    const secondEvent = keyEvent(second);
    focusNextField(secondEvent);
    expect(secondEvent.preventDefault).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(submit);
  });

  it("não submete nem intercepta textarea, botão ou teclas modificadas", () => {
    document.body.innerHTML = `<form><textarea id="notes"></textarea><button id="action" type="button">Acção</button><input id="value" /></form>`;
    const textarea = document.querySelector("#notes") as HTMLTextAreaElement;
    const button = document.querySelector("#action") as HTMLButtonElement;
    const input = document.querySelector("#value") as HTMLInputElement;
    const textareaEvent = keyEvent(textarea);
    focusNextField(textareaEvent);
    expect(textareaEvent.preventDefault).not.toHaveBeenCalled();
    const buttonEvent = keyEvent(button);
    focusNextField(buttonEvent);
    expect(buttonEvent.preventDefault).not.toHaveBeenCalled();
    const modifiedEvent = keyEvent(input);
    Object.assign(modifiedEvent, { shiftKey: true });
    focusNextField(modifiedEvent);
    expect(modifiedEvent.preventDefault).not.toHaveBeenCalled();
  });
});
