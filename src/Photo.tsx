import { useState } from 'react'
import { Thumb } from './Thumb'
export function Photo({ blob, large = false, alt }: { blob?: Blob; large?: boolean; alt: string }) {
  const [open, setOpen] = useState(false)
  return <><button type="button" className={large ? 'photo-button large' : 'photo-button'} disabled={!blob} aria-label={`${alt} 사진 확대`} onClick={() => setOpen(true)}><Thumb blob={blob} className={large ? 'representative' : 'record-photo'} alt={alt} fallback="🐥" /></button>{open && <div className="modal-backdrop" onClick={() => setOpen(false)}><section className="modal photo-modal" role="dialog" aria-modal="true" aria-label="사진 확대" onClick={e => e.stopPropagation()}><div className="photo-modal-head"><button className="btn-ghost" type="button" autoFocus onClick={() => setOpen(false)}>닫기</button></div><button type="button" className="expanded-photo-button" aria-label="확대 사진 닫기" onClick={() => setOpen(false)}><Thumb blob={blob} className="expanded-photo" alt={alt} /></button></section></div>}</>
}
