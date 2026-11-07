export const createElement = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, unknown> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined) {
      continue;
    }
    if (key === 'text') {
      e.textContent = String(value);
    } else if (key === 'className') {
      e.className = String(value);
    } else if (key === 'onclick' && typeof value === 'function') {
      e.addEventListener('click', value as EventListener);
    } else if (key === 'oninput' && typeof value === 'function') {
      e.addEventListener('input', value as EventListener);
    } else if (key === 'onkeydown' && typeof value === 'function') {
      e.addEventListener('keydown', value as EventListener);
    } else if (key === 'disabled') {
      (e as HTMLButtonElement).disabled = Boolean(value);
    } else if (key === 'selected') {
      (e as HTMLOptionElement).selected = Boolean(value);
    } else if (key === 'value') {
      (e as HTMLInputElement).value = String(value);
    } else {
      e.setAttribute(key, String(value));
    }
  }
  for (const c of children) {
    e.append(c);
  }
  return e;
};

export const clearChildren = (node: HTMLElement): void => {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
};
