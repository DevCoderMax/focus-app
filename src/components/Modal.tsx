import { useEffect } from 'react';
import { X } from 'lucide-react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Optional header title. Omit to render a headerless modal. */
  title?: React.ReactNode;
  size?: ModalSize;
  /** Fixed footer area, e.g. Cancel/Save buttons. */
  footer?: React.ReactNode;
  /** Close when the backdrop is clicked. Default true. */
  closeOnBackdrop?: boolean;
  /** Close when Escape is pressed. Default true. */
  closeOnEsc?: boolean;
  /** Extra classes appended to the card container. */
  className?: string;
  children: React.ReactNode;
}

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  footer,
  closeOnBackdrop = true,
  closeOnEsc = true,
  className = '',
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKey = (event: KeyboardEvent) => {
      if (closeOnEsc && event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);

    // Lock body scroll while the modal is open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, closeOnEsc, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={closeOnBackdrop ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-xl ${SIZE_CLASS[size]} ${className}`}
        onClick={(event) => event.stopPropagation()}
      >
        {title !== undefined && (
          <div className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
            <h2 className="text-xl font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 transition-colors hover:text-white"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        )}

        <div className="overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="border-t border-gray-800 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
