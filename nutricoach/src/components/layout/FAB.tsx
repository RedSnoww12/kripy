import { useState } from 'react'
import { Plus, Camera, Mic, X, Keyboard } from 'lucide-react'

interface FABProps {
  onPhoto: () => void
  onAudio: () => void
  onManual: () => void
}

export function FAB({ onPhoto, onAudio, onManual }: FABProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-20 right-4 z-50 flex flex-col-reverse items-end gap-3">
        {open && (
          <div className="flex flex-col gap-3 animate-slide-up">
            <button
              onClick={() => { onPhoto(); setOpen(false) }}
              className="flex items-center gap-3 bg-dark-700 hover:bg-dark-600 text-white rounded-full pl-4 pr-5 py-3 shadow-lg transition-colors"
            >
              <Camera size={20} className="text-accent" />
              <span className="text-sm font-medium">Photo</span>
            </button>
            <button
              onClick={() => { onAudio(); setOpen(false) }}
              className="flex items-center gap-3 bg-dark-700 hover:bg-dark-600 text-white rounded-full pl-4 pr-5 py-3 shadow-lg transition-colors"
            >
              <Mic size={20} className="text-accent" />
              <span className="text-sm font-medium">Dictée</span>
            </button>
            <button
              onClick={() => { onManual(); setOpen(false) }}
              className="flex items-center gap-3 bg-dark-700 hover:bg-dark-600 text-white rounded-full pl-4 pr-5 py-3 shadow-lg transition-colors"
            >
              <Keyboard size={20} className="text-accent" />
              <span className="text-sm font-medium">Manuel</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setOpen(!open)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
            open
              ? 'bg-dark-600 rotate-45'
              : 'bg-accent hover:bg-accent/90'
          }`}
        >
          {open ? <X size={28} className="text-white" /> : <Plus size={28} className="text-dark-900" />}
        </button>
      </div>
    </>
  )
}
