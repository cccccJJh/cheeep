import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  cheapestForItem,
  db,
  isPurchased,
  isStingy,
  markPurchased,
  sortSightingsForItem,
  type Item,
  type Sighting,
  unitPriceFrom,
  unitPriceOf,
} from './db'
import {
  formatPackageSize,
  formatWon,
  parseOptionalPrice,
  parsePrice,
  sizeUnitShort,
  unitHeadline,
} from './lib'

function applySighting(
  sighting: Sighting,
  setStore: (v: string) => void,
  setPrice: (v: string) => void,
  setQuantity: (v: string) => void,
) {
  setStore(sighting.store)
  setPrice(String(sighting.price))
  setQuantity(sighting.packageSize != null ? String(sighting.packageSize) : '')
}

export function BuyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const itemId = Number(id)
  const [item, setItem] = useState<Item>()
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [store, setStore] = useState('')
  const [price, setPrice] = useState('')
  const [quantity, setQuantity] = useState('')
  const [pickedId, setPickedId] = useState<number>()
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void (async () => {
      const nextItem = await db.items.get(itemId)
      if (!nextItem) {
        setReady(true)
        return
      }
      const list = sortSightingsForItem(
        await db.sightings.where('itemId').equals(itemId).toArray(),
        nextItem,
      )
      setItem(nextItem)
      setSightings(list)

      if (isPurchased(nextItem)) {
        setStore(nextItem.purchasedStore ?? '')
        if (nextItem.paidPrice != null) setPrice(String(nextItem.paidPrice))
        if (nextItem.purchasedQuantity != null) {
          setQuantity(String(nextItem.purchasedQuantity))
        }
        setReady(true)
        return
      }

      const best = cheapestForItem(list, nextItem)
      if (best) {
        applySighting(best, setStore, setPrice, setQuantity)
        setPickedId(best.id)
      }
      setReady(true)
    })()
  }, [itemId])

  const stingy = item ? isStingy(item) : false
  const unit = item?.comparisonUnit
  const best = item ? cheapestForItem(sightings, item) : undefined
  const editing = item ? isPurchased(item) : false

  const liveUnit = useMemo(() => {
    if (!stingy || !unit) return null
    const parsedPrice = parsePrice(price)
    const parsedSize = parseOptionalPrice(quantity)
    if (parsedPrice == null || parsedSize == null || parsedSize === undefined) {
      return null
    }
    const won = unitPriceFrom(parsedPrice, parsedSize, unit)
    if (won == null) return null
    return `${unitHeadline(unit)} ${Math.round(won).toLocaleString('ko-KR')}원`
  }, [price, quantity, stingy, unit])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmedStore = store.trim()
    if (!trimmedStore) {
      setError('구매처를 적어 주세요.')
      return
    }
    const parsed = parsePrice(price)
    if (parsed == null) {
      setError('구매한 금액을 숫자로 적어 주세요.')
      return
    }
    const parsedQty = quantity.trim() ? parseOptionalPrice(quantity) : undefined
    if (quantity.trim() && parsedQty == null) {
      setError('용량/수량은 숫자로 적어 주세요. 비워 둬도 됩니다.')
      return
    }
    await markPurchased(
      itemId,
      parsed,
      trimmedStore,
      typeof parsedQty === 'number' ? parsedQty : undefined,
    )
    navigate(`/items/${itemId}`)
  }

  if (!ready) {
    return <div className="page">불러오는 중…</div>
  }

  if (!item) {
    return (
      <div className="page">
        <p className="meta">물건을 찾을 수 없습니다.</p>
        <Link to="/">위시로</Link>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="topbar">
        <Link className="back" to={`/items/${itemId}`}>
          ← {item.name}
        </Link>
      </header>
      <h1 className="form-title" style={{ fontSize: 22 }}>
        {editing ? '구매 정보 수정' : '구매완료'}
      </h1>
      <p className="meta" style={{ margin: '8px 0 16px' }}>
        실제로 산 곳과 금액을 남깁니다. 가격 기록은 참고용으로만 채워집니다.
      </p>
      <form className="form" onSubmit={(e) => void onSubmit(e)}>
        <label>
          구매처
          <input
            className="field"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            placeholder="예: 홈플러스"
            autoFocus={!store}
          />
        </label>
        <label>
          구매금액
          <div className="money-field">
            <input
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="11000"
            />
            <span>원</span>
          </div>
        </label>
        <label>
          용량/수량 <span className="opt">(선택)</span>
          <div className="money-field">
            <input
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="비워 둬도 됩니다"
            />
            {unit ? <span>{sizeUnitShort(unit)}</span> : null}
          </div>
        </label>
        {liveUnit ? <p className="live-unit">{liveUnit}</p> : null}
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit">
          구매완료로 저장
        </button>
      </form>

      {sightings.length > 0 ? (
        <section className="pick-section">
          <h2>가격 기록에서 불러오기</h2>
          <p className="meta">값을 채울 뿐, 구매를 확정하지는 않습니다.</p>
          <div className="pick-list">
            {sightings.map((s) => {
              const isBest = s.id === best?.id
              const unitWon = stingy && unit ? unitPriceOf(s, unit) : undefined
              return (
                <button
                  className={pickedId === s.id ? 'pick-row on' : 'pick-row'}
                  key={s.id}
                  type="button"
                  onClick={() => {
                    applySighting(s, setStore, setPrice, setQuantity)
                    setPickedId(s.id)
                    setError('')
                  }}
                >
                  <span className="pick-dot" aria-hidden />
                  <div className="pick-body">
                    <p className="pick-store">
                      {s.store}
                      {isBest ? <span className="best">BEST</span> : null}
                    </p>
                    <p className="pick-line">
                      {formatWon(s.price)}
                      {s.packageSize != null && unit
                        ? ` · ${formatPackageSize(s.packageSize, unit)}`
                        : s.packageSize != null
                          ? ` · ${s.packageSize.toLocaleString('ko-KR')}`
                          : ''}
                    </p>
                    {unitWon != null && unit ? (
                      <p className="pick-unit">
                        {unitHeadline(unit)} {Math.round(unitWon).toLocaleString('ko-KR')}원
                      </p>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}
