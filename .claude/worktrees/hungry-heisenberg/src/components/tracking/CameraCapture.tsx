import { useRef } from 'react'

interface CameraCaptureProps {
  onCapture: (base64: string) => void
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1]
      onCapture(base64)
    }
    reader.readAsDataURL(file)
  }

  // Trigger immediately
  setTimeout(() => inputRef.current?.click(), 100)

  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      capture="environment"
      onChange={handleChange}
      className="hidden"
    />
  )
}
