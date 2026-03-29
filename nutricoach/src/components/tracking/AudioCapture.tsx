import { useState, useRef, useEffect } from 'react'
import { Mic, Square } from 'lucide-react'

interface AudioCaptureProps {
  onCapture: (blob: Blob) => void
  onCancel: () => void
}

export function AudioCapture({ onCapture, onCancel }: AudioCaptureProps) {
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const chunks = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (mediaRecorder.current?.state === 'recording') {
        mediaRecorder.current.stop()
      }
    }
  }, [])

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
        onCapture(blob)
      }

      recorder.start()
      setRecording(true)
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000)
    } catch {
      onCancel()
    }
  }

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRecorder.current?.stop()
    setRecording(false)
  }

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="fixed inset-0 z-50 bg-dark-900/95 flex flex-col items-center justify-center gap-6">
      <p className="text-dark-400 text-sm">
        {recording ? 'Enregistrement en cours...' : 'Appuie pour commencer'}
      </p>

      {recording && (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-danger animate-pulse" />
          <span className="text-white text-2xl font-mono tabular-nums">{formatTime(duration)}</span>
        </div>
      )}

      <div className="flex gap-4">
        {!recording ? (
          <button
            onClick={startRecording}
            className="w-20 h-20 rounded-full bg-accent flex items-center justify-center active:scale-95 transition-transform"
          >
            <Mic size={32} className="text-dark-900" />
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="w-20 h-20 rounded-full bg-danger flex items-center justify-center active:scale-95 transition-transform"
          >
            <Square size={28} className="text-white" fill="white" />
          </button>
        )}
      </div>

      <button onClick={onCancel} className="text-dark-500 text-sm mt-4">
        Annuler
      </button>
    </div>
  )
}
