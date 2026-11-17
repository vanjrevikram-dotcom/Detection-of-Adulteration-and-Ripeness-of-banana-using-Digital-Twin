import { useEffect, useRef, useState } from 'react'
import { FaCloudUploadAlt, FaFileExcel, FaSyncAlt, FaTimes } from 'react-icons/fa'
import { toast } from './Toast'

interface Props {
  label: string
  accept: string
  hint: string
  file: File | null
  onFile: (f: File | null) => void
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export default function FileUpload({ label, accept, hint, file, onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const isImage = !!file && (file.type.startsWith('image/') || /\.(jpe?g|png)$/i.test(file.name))

  useEffect(() => {
    if (!file || !isImage) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file]) // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (f: File | undefined | null) => {
    if (!f) return
    const allowed = accept.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
    const ext = '.' + (f.name.split('.').pop() ?? '').toLowerCase()
    if (allowed.length > 0 && !allowed.includes(ext)) {
      toast(`Invalid file type. Expected: ${allowed.join(', ')}`, 'error')
      return
    }
    onFile(f)
  }

  return (
    <div>
      <p className="label font-semibold">{label}</p>
      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]) }}
          className={`group flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-6 text-center transition-all duration-300 hover:-translate-y-0.5 ${
            dragging
              ? 'border-brand-500 bg-brand-500/15 shadow-lg shadow-brand-500/25 scale-[1.01]'
              : 'border-brand-500/40 bg-brand-500/5 hover:border-brand-500 hover:bg-brand-500/10 hover:shadow-lg hover:shadow-brand-500/15 dark:bg-brand-500/5'
          }`}
        >
          <span className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600 transition-transform duration-300 group-hover:scale-110 ${dragging ? 'scale-125' : ''}`}>
            <FaCloudUploadAlt size={22} />
          </span>
          <span className="text-sm font-bold">
            {dragging ? 'Drop the file here' : <>Drag & drop or <span className="text-brand-600 underline underline-offset-2">browse</span></>}
          </span>
          <span className="text-xs text-black dark:text-white">{hint}</span>
        </button>
      ) : (
        <div className="card-hover flex items-center gap-3 rounded-2xl border border-brand-500/40 bg-brand-500/5 p-3 dark:border-brand-500/40">
          {preview ? (
            <img src={preview} alt="preview" className="h-14 w-14 shrink-0 rounded-xl border border-brand-500/25 object-cover" />
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600">
              <FaFileExcel size={24} />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{file.name}</p>
            <p className="text-xs text-black dark:text-white">{formatSize(file.size)} · ready</p>
          </div>
          <button type="button" onClick={() => inputRef.current?.click()} title="Replace file"
            className="rounded-lg p-2 text-black transition-all duration-200 hover:scale-110 hover:text-brand-600 dark:text-white">
            <FaSyncAlt size={15} />
          </button>
          <button type="button" onClick={() => onFile(null)} title="Remove file"
            className="rounded-lg p-2 text-black transition-all duration-200 hover:scale-110 hover:text-red-500 dark:text-white">
            <FaTimes size={15} />
          </button>
        </div>
      )}
      <input ref={inputRef} type="file" accept={accept} className="hidden"
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
    </div>
  )
}
