import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  db,
  isStingy,
  loadStoreNames,
  saveSighting,
  type ComparisonUnit,
  type Sighting,
  unitPriceOf,
} from './db'
import {
  compressImage,
  fromDateInput,
  parsePrice,
  sizeUnitShort,
  toDateInput,
  unitHeadline,
} from './lib'
import { Thumb } from './Thumb'

export function SightingForm() {
  const { id, sid } = useParams()
  const navigate = useNavigate()
  const itemId = Number(id)
  const sightingId = sid ? Number(sid) : undefined
  const [itemName, setItemName] = useState('')
  const [stingy, setStingy] = useState(false)
  const [unit, setUnit] = useState<ComparisonUnit>()
  const [packageSize, setPackageSize] = useState('')
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
      setStingy(item ? isStingy(item) : false)
      setUnit(item?.comparisonUnit)
      setStores(await loadStoreNames())
      if (!sightingId) return
      const existing = await db.sightings.get(sightingId)
      if (!existing) return
      setPrice(String(existing.price))
      setStore(existing.store)
      setMemo(existing.memo ?? '')
      setSeenAt(toDateInput(existing.seenAt))
      setPhoto(existing.photoBlob)
      if (existing.packageSize != null) setPackageSize(String(existing.packageSize))
    })()
  }, [itemId, sightingId])

  const liveUnit = useMemo(() => {
    if (!stingy || !unit) return null
    const parsedPrice = parsePrice(price)
    const parsedSize = parsePrice(packageSize)
    if (parsedPrice == null || parsedSize == null) return null
    const won = unitPriceOf(
      {
        itemId,
        price: parsedPrice,
        store: '',
        seenAt: 0,
        packageSize: parsedSize,
      },
      unit,
    )
    if (won == null) return null
    return `${unitHeadline(unit)} ${Math.round(won).toLocaleString('ko-KR')}원`
  }, [itemId, packageSize, price, stingy, unit])

  async function onPhoto(file?: File) {
    if (!file) return
    setPhoto(await compressImage(file))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parsePrice(price)
    const storeName = store.trim()
    if (parsed == null) {
      setError('판매 가격을 숫자로 적어 주세요.')
      return
    }
    if (!storeName) {
      setError('구입처를 적어 주세요.')
      return
    }
    let size: number | undefined
    if (stingy) {
      const parsedSize = parsePrice(packageSize)
      if (parsedSize == null) {
        setError('용량 또는 수량을 숫자로 적어 주세요.')
        return
      }
      size = parsedSize
    } else {
      const parsedSize = packageSize.trim() ? parsePrice(packageSize) : undefined
      if (packageSize.trim() && parsedSize == null) {
        setError('용량 또는 수량을 숫자로 적어 주세요.')
        return
      }
      size = parsedSize ?? undefined
    }
    setBusy(true)
    const data: Omit<Sighting, 'id'> = {
      itemId,
      price: parsed,
      store: storeName,
      memo: memo.trim() || undefined,
      seenAt: fromDateInput(seenAt),
      photoBlob: photo,
      ...(size != null ? { packageSize: size } : {}),
    }
    await saveSighting(data, sightingId)
    navigate(`/items/${itemId}`)
  }

  return (
    <div className="page">
      <header className="topbar">
        <Link className="back" to={`/items/${itemId}`}>
          ‹ {itemName || '위시'}
        </Link>
      </header>
      <h1 className="form-title">가격 기록</h1>
      <form className="form" onSubmit={(e) => void onSubmit(e)}>
        <label>
          판매 가격
          <div className="money-field">
            <input
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="12000"
            />
            <span>원</span>
          </div>
        </label>
        {stingy && unit ? (
          <label>
            용량
            <div className="money-field">
              <input
                inputMode="numeric"
                value={packageSize}
                onChange={(e) => setPackageSize(e.target.value)}
                placeholder={unit === 'each' ? '2' : '800'}
              />
              <span>{sizeUnitShort(unit)}</span>
            </div>
          </label>
        ) : null}
        {liveUnit ? <div className="live-unit">{liveUnit}</div> : null}
        <label>
          구입처
          <input
            className="field"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="홈플러스"
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
        {photo ? <Thumb className="preview" blob={photo} alt="미리보기" /> : null}
        <label className="btn-secondary photo-btn">
          {photo ? '사진 다시 선택' : '사진 선택'}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => void onPhoto(e.target.files?.[0])}
          />
        </label>
        <label>
          메모 <span className="opt">선택</span>
          <textarea
            className="field"
            rows={2}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="행사, 용량 등"
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
