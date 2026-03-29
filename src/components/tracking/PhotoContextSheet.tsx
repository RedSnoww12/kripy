import { useState, useRef } from 'react'
import { Mic, Square, Send, X, Loader2 } from 'lucide-react'

interface PhotoContextSheetProps {
  base64Image: string
  onAnalyze: (context?: string) => void
  onCancel: () => void
  onTranscribe?: (blob: Blob) => Promise<string>
}

export function PhotoContextSheet({ base64Image, onAnalyze, onCancel, onTranscribe }: PhotoContextSheetProps) {
  const [context, setContext] = useState('')
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorder.current = recorder
      chunks.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        handleAudioBlob(blob)
      }

      recorder.start()
      setRecording(true)
      setDuration(0)
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    } catch (_e) {
      // ignore mic permission error
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  const handleAudioBlob = async (blob: Blob) => {
    if (!onTranscribe) return
    setTranscribing(true)
    try {
      const text = await onTranscribe(blob)
      if (text) {
        setContext((prev) => prev ? `${prev} ${text}` : text)
      }
    } catch (_e) {
      // ignore transcription error — user can type manually
    } finally {
      setTranscribing(false)
    }
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onCancel} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-dark-800 rounded-t-3xl animate-slide-up max-w-lg mx-auto">
        <div className="w-10 h-1 bg-dark-600 rounded-full mx-auto mt-3" />

        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-white font-semibold">Décrire le plat</p>
            <button onClick={onCancel} className="p-1 text-dark-500 active:text-dark-300">
              <X size={20} />
            </button>
          </div>

          {/* Photo preview + hint */}
          <div className="flex gap-4 items-start">
            <img
              src={`data:image/jpeg;base64,${base64Image}`}
              alt="Photo du repas"
              className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 space-y-1.5 pt-1">
              <p className="text-xs text-dark-400 leading-relaxed">
                Ajoute des détails pour une estimation précise (optionnel)
              </p>
              <p className="text-xs text-dark-500 italic">
                Ex : "200g de riz cuit, 200g de poulet grillé, filet d'huile"
              </p>
            </div>
          </div>

          {/* Text input */}
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Ingrédients et quantités..."
            rows={3}
            className="w-full bg-dark-700 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-500 outline-none resize-none"
          />

          {/* Voice button */}
          {onTranscribe && (
            !recording ? (
              <button
                onClick={startRecording}
                disabled={transcribing}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-dark-700 text-dark-400 active:bg-dark-600 transition-colors disabled:opacity-50"
              >
                {transcribing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm">Transcription...</span>
                  </>
                ) : (
                  <>
                    <Mic size={18} />
                    <span className="text-sm">Dicter la description</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-danger/15 border border-danger/40 text-danger active:opacity-80 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                <span className="text-sm font-medium tabular-nums">{formatTime(duration)}</span>
                <Square size={16} fill="currentColor" />
                <span className="text-sm">Arrêter</span>
              </button>
            )
          )}

          {/* Actions */}
          <div className="flex gap-3 pb-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-dark-700 text-dark-400 text-sm active:bg-dark-600 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => onAnalyze(context.trim() || undefined)}
              disabled={recording || transcribing}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-dark-900 font-semibold active:bg-accent/80 transition-colors disabled:opacity-50"
            >
              <Send size={16} />
              <span className="text-sm">Analyser</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
