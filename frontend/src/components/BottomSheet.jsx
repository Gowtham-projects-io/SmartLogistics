import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

/**
 * BottomSheet — iOS/Android-style modal sheet.
 * Rendered through a React Portal directly to document.body
 * so parent CSS animations/transforms do not interfere with fixed positioning.
 */
export default function BottomSheet({ open, onClose, title, children }) {
  const sheetRef = useRef(null)

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = originalOverflow }
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-auto">
      {/* Overlay backdrop */}
      <div
        className="bottom-sheet-overlay animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet panel */}
      <div
        ref={sheetRef}
        className="bottom-sheet flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2E8F0] shrink-0 bg-white">
            <h2 className="text-base font-bold text-[#172033]">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#64748B] hover:text-[#172033] hover:bg-slate-100 transition-colors cursor-pointer -mr-1"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 overscroll-contain">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
