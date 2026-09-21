import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Send, Bot, Loader2, ChevronDown } from 'lucide-react'
import { queryAI } from '../services/api'

const DEFAULT_CONVERSATION = [
  {
    id: 1,
    role: 'user',
    text: 'Find the best truck for this shipment',
  },
  {
    id: 2,
    role: 'assistant',
    text: "Based on my analysis, **Truck TN-38-A1234** is the best match for your shipment. It's traveling from Chennai → Coimbatore, and your drop at **Erode** lies directly along its route. With 5,000 kg available capacity and a match score of **94%**, this is an excellent corridor match.",
    suggestions: [
      'Why was this truck selected?',
      'How much will I save?',
      'Can another truck carry this shipment?',
    ],
  },
]

/**
 * AIAssistant View
 * Palette:
 * - Primary Navy:   #0F2747
 * - Orange Accent:  #F59E0B
 * - Background:     #F8FAFC
 * - White:          #FFFFFF
 * - Dark Text:      #172033
 * - Secondary Text: #64748B
 * - Success:        #16A34A
 * - Danger:         #DC2626
 * - Border:         #E2E8F0
 */
export default function AIAssistant({ context = null, onCollapse = null, isFloating = false }) {
  const [messages, setMessages] = useState(DEFAULT_CONVERSATION)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text) {
    const q = (text || input).trim()
    if (!q) return
    setInput('')

    const userMsg = { id: Date.now(), role: 'user', text: q }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await queryAI(q, context)
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          text: res.response,
          suggestions: res.suggestions,
          confidence: res.confidence,
        },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', text: '⚠️ Unable to reach AI assistant. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // Render markdown with highlighted text using brand palette
  function renderText(text) {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      if (line.startsWith('|')) {
        // Simple table row
        const cells = line.split('|').filter(Boolean)
        if (cells.every(c => /^[-\s:]+$/.test(c))) return null
        return (
          <div key={i} className="flex justify-between gap-2 text-xs py-1.5 border-b border-[#E2E8F0] text-[#172033]">
            <span className="text-[#64748B]">{cells[0]?.trim()}</span>
            <span className="font-semibold text-[#16A34A]">{cells[1]?.trim() || cells[cells.length - 1]?.trim()}</span>
          </div>
        )
      }
      const parts = line.split(/\*\*([^*]+)\*\*/g)
      return (
        <p key={i} className={`leading-relaxed ${line === '' ? 'h-2' : ''}`}>
          {parts.map((part, j) =>
            j % 2 === 1
              ? (
                <strong
                  key={j}
                  className="font-bold text-[#0F2747] bg-amber-50/80 px-1 py-0.5 rounded border border-amber-200/60"
                >
                  {part}
                </strong>
              )
              : <span key={j}>{part}</span>
          )}
        </p>
      )
    })
  }

  return (
    <div className={`flex flex-col bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl overflow-hidden ${
      isFloating ? 'w-full h-full' : 'h-full w-full'
    }`}>
      {/* Header — Executive Primary Navy (#0F2747) with Orange Accent (#F59E0B) */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0F2747] text-white border-b border-[#163660] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#163660] border border-white/10 flex items-center justify-center text-[#F59E0B] shadow-xs shrink-0">
            <Bot size={18} className="text-[#F59E0B]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white leading-tight">AI Logistics Assistant</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] inline-block animate-pulse" />
              <span className="text-[11px] text-emerald-300 font-medium">Online</span>
            </div>
          </div>
        </div>
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Minimize Assistant"
          >
            <ChevronDown size={18} />
          </button>
        )}
      </div>

      {/* Chat Messages — Background #F1F5F9 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-0 bg-[#F1F5F9]">
        {messages.map(msg => (
          <div key={msg.id} className="space-y-2">
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                {/* User Message — Primary Navy #0F2747 Bubble */}
                <div className="bg-[#0F2747] text-white text-[13px] px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-sm font-medium max-w-[85%] leading-relaxed">
                  {msg.text}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-1.5 max-w-[94%]">
                {/* Assistant Message — White #FFFFFF Card with Border #E2E8F0 */}
                <div className="bg-white border border-[#E2E8F0] text-[#172033] text-[13px] leading-relaxed p-4 rounded-2xl rounded-tl-xs shadow-xs">
                  {renderText(msg.text)}
                </div>

                {/* Clickable suggestion chips stacked vertically */}
                {msg.suggestions?.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1.5 w-full">
                    {msg.suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => send(s)}
                        className="w-fit text-left text-xs px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] text-[#172033] hover:text-[#0F2747] hover:bg-slate-50 hover:border-[#F59E0B] transition-all cursor-pointer font-medium shadow-xs"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#0F2747] bg-white border border-[#E2E8F0] px-3.5 py-2 rounded-xl w-fit shadow-xs">
            <Loader2 size={14} className="animate-spin text-[#F59E0B]" />
            <span className="font-medium">Analyzing routes & pricing…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar — White container with Border #E2E8F0 */}
      <div className="p-3 bg-white border-t border-[#E2E8F0] shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about routes, pricing..."
            className="flex-1 bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-xs text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:border-[#0F2747] focus:ring-2 focus:ring-[#0F2747]/10 transition-colors"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl bg-[#0F2747] hover:bg-[#163660] active:bg-[#08172b] disabled:opacity-50 text-white flex items-center justify-center shrink-0 shadow-sm transition-all cursor-pointer"
            title="Send Message"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Global Floating AI Assistant Widget
 * Renders the floating trigger button at bottom-right, and expands into the popup.
 */
export function FloatingAIAssistant() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {isOpen ? (
        createPortal(
          <div className="fixed inset-0 z-50 pointer-events-auto flex flex-col justify-end md:justify-start md:block">
            {/* Mobile backdrop */}
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs md:hidden animate-fade-in"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <div className="fixed inset-x-0 bottom-0 md:bottom-6 md:right-6 md:left-auto w-full md:w-[420px] h-[86vh] md:h-[530px] rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden z-50 animate-slide-up md:animate-scale-in flex flex-col bg-white">
              <AIAssistant isFloating={true} onCollapse={() => setIsOpen(false)} />
            </div>
          </div>,
          document.body
        )
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-[calc(var(--bottom-nav-h)+var(--sab)+12px)] md:bottom-6 right-3.5 md:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 bg-[#0F2747] hover:bg-[#163660] border border-white/20 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer group select-none"
          title="Open AI Logistics Assistant"
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#163660] border border-white/10 flex items-center justify-center text-[#F59E0B] shadow-xs">
            <Bot size={15} className="text-[#F59E0B]" />
          </div>
          <span className="text-xs font-bold tracking-wide text-white">AI Assistant</span>
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
        </button>
      )}
    </>
  )
}
