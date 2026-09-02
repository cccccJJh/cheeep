import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db, loadStoreNames, saveSighting, type Sighting } from './db'
import { compressImage, fromDateInput, parsePrice, toDateInput } from './lib'
import { Thumb } from './Thumb'

export function SightingForm() {
  const { id, sid } = useParams()
  const navigate = useNavigate()
  const itemId = Number(id)
  const sightingId = sid ? Number(sid) : undefined
  const [itemName, setItemName] = useState('')
  const [price, setPrice] = useState('')
  const [store, setStore] = useState('')
  const [memo, setMemo] = useState('')
  const [seenAt, setSeenAt] = useState(toDateInput(Date.now()))
  const [photo, setPhoto] = useState<Blob>()
  const [stores, setStores] = useState<string[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void (async () => {
      const item = await db.items.get(itemId)
      setItemName(item?.name ?? '')
      setStores(await loadStoreNames())
      if (!sightingId) return
      const existing = await db.sightings.get(sightingId)
      if (!existing) return
      setPrice(String(existing.price))
      setStore(existing.store)
      setMemo(existing.memo ?? '')
      setSeenAt(toDateInput(existing.seenAt))
      setPhoto(existing.photoBlob)
    })()
  }, [itemId, sightingId])

  async function onPhoto(file?: File) {
    if (!file) return
    setPhoto(await compressImage(file))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parsePrice(price)
    const storeName = store.trim()
    if (parsed == null) {
      setError('금액을 숫자로 적어 주세요.')
      return
    }
    if (!storeName) {
      setError('구입처를 적어 주세요.')
      return
    }
    setBusy(true)
    const data: Omit<Sighting, 'id'> = {
      itemId,
      price: parsed,
      store: storeName,
      memo: memo.trim() || undefined,
      seenAt: fromDateInput(seenAt),
      photoBlob: photo,
    }
    await saveSighting(data, sightingId)
    navigate(`/items/${itemId}`)
  }

  return (
    <div className="page">
      <header className="topbar">
        <Link className="back" to={`/items/${itemId}`}>
          ← {itemName || '물건'}
        </Link>
      </header>
      <h1 style={{ fontSize: 22, marginTop: 0 }}>
        {sightingId ? '가격 기록 수정' : '가격 기록'}
      </h1>
      <form className="form" onSubmit={(e) => void onSubmit(e)}>
        <label>
          금액 (원)
          <input
            className="field"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="2980"
          />
        </label>
        <label>
          구입처
          <input
            className="field"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="이마트 월계점"
            list="store-suggest"
          />
          <datalist id="store-suggest">
            {stores.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <label>
          본 날짜
          <input
            className="field"
            type="date"
            value={seenAt}
            onChange={(e) => setSeenAt(e.target.value)}
          />
        </label>
        <label>
          메모
          <textarea
            className="field"
            rows={2}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="행사, 용량 등"
          />
        </label>
        {photo ? <Thumb className="preview" blob={photo} alt="미리보기" /> : null}
        <label className="btn-secondary photo-btn">
          {photo ? '사진 다시 찍기' : '사진 (생략 가능)'}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => void onPhoto(e.target.files?.[0])}
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit" disabled={busy}>
          저장
        </button>
      </form>
    </div>
  )
}
