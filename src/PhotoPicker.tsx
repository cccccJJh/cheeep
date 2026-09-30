import { useState } from 'react'
import { Thumb } from './Thumb'
import { compressImage } from './lib'
export function PhotoPicker({ photo, onChange }: { photo?: Blob; onChange: (photo?: Blob) => void | Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function choose(file?: File) {
    if (!file) return
    setBusy(true); setError('')
    try { await onChange(await compressImage(file)) }
    catch { setError('사진을 저장하지 못했습니다. 다른 사진으로 다시 시도해 주세요.') }
    finally { setBusy(false) }
  }
  return <div className="wish-photo-picker">
    <Thumb blob={photo} className="representative" alt="위시 사진" />
    <label className="btn-secondary photo-btn">{busy ? '사진 처리 중…' : photo ? '사진 변경 · 갤러리' : '사진 추가 · 갤러리'}<input aria-label="위시 사진 선택" type="file" accept="image/*" disabled={busy} onChange={e => { void choose(e.target.files?.[0]); e.target.value = '' }} /></label>
    {photo && <button type="button" disabled={busy} onClick={() => { void onChange(undefined) }}>사진 삭제</button>}
    {error && <p className="error" role="alert">{error}</p>}
  </div>
}
