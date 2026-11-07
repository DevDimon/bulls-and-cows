import { createElement } from './dom.js';

export interface ModalOptions {
  readonly title: string;
  readonly message: string;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly onConfirm: () => void;
  readonly onCancel?: () => void;
}

export const openModal = (opts: ModalOptions): void => {
  const previousFocus = document.activeElement as HTMLElement | null;

  const cancelBtn = createElement('button', {
    className: 'secondary',
    text: opts.cancelText ?? 'Отмена',
  });
  const confirmBtn = createElement('button', {
    text: opts.confirmText ?? 'OK',
  });

  const overlay = createElement(
    'div',
    {
      className: 'modal-overlay',
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': 'modal-title',
    },
    [
      createElement('div', { className: 'modal' }, [
        createElement('h2', { id: 'modal-title', text: opts.title }),
        createElement('p', { text: opts.message }),
        createElement('div', { className: 'modal-actions' }, [cancelBtn, confirmBtn]),
      ]),
    ],
  );

  const close = (): void => {
    document.removeEventListener('keydown', onKey, true);
    overlay.remove();
    if (previousFocus && 'focus' in previousFocus) {
      previousFocus.focus();
    }
  };

  const cancel = (): void => {
    close();
    opts.onCancel?.();
  };

  const confirm = (): void => {
    close();
    opts.onConfirm();
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
      return;
    }
    if (e.key === 'Tab') {
      const focusables = [cancelBtn, confirmBtn];
      const idx = focusables.indexOf(document.activeElement as HTMLButtonElement);
      e.preventDefault();
      const next = e.shiftKey
        ? (idx - 1 + focusables.length) % focusables.length
        : (idx + 1) % focusables.length;
      focusables[next].focus();
    }
  };

  cancelBtn.addEventListener('click', cancel);
  confirmBtn.addEventListener('click', confirm);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      cancel();
    }
  });
  document.addEventListener('keydown', onKey, true);

  document.body.append(overlay);
  queueMicrotask(() => cancelBtn.focus());
};
