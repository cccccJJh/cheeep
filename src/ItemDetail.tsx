import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  cheapestOf,
  clearPurchase,
  db,
  deleteItem,
  deleteSighting,
  isPurchased,
  sortSightings,
  type Item,
  type Sighting,
} from './db'
import { formatDate, formatWon, vsTarget } from './lib'
import { Thumb } from './Thumb'

export function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const itemId = Number(id)
  const [item, setItem] = useState<Item>()
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [ready, setReady] = useState(false)

  async function reload() {
    const nextItem = await db.items.get(itemId)
    const nextSightings = await db.sightings.where('itemId').equals(itemId).toArray()
    setItem(nextItem)
    setSightings(sortSightings(nextSightings))
    setReady(true)
  }

  useEffect(() => {
    if (!Number.isFinite(itemId)) return
    void reload()
  }, [itemId])

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

  const itemName = item.name
  const best = cheapestOf(sightings)
  const bought = isPurchased(item)

  async function onClearPurchase() {
    if (!confirm('구매완료를 취소하고 다시 위시로 둘까요?')) return
    await clearPurchase(itemId)
    await reload()
  }

  async function onDeleteItem() {
    if (!confirm(`“${itemName}”을 위시에서 지울까요? 가격 기록도 같이 사라집니다.`)) return
    await deleteItem(itemId)
    navigate('/')
  }

  async function onDeleteSighting(sighting: Sighting) {
    if (!sighting.id) return
    if (!confirm('이 가격 기록을 지울까요?')) return
    await deleteSighting(sighting.id, itemId)
    await reload()
  }

  return (
    <div className="page">
      <header className="topbar">
        <Link className="back" to="/">
          ← 위시
        </Link>
        <button className="btn-danger" type="button" onClick={() => void onDeleteItem()}>
          위시에서 삭제
        </button>
      </header>

      <div className="panel">
        {bought && item.paidPrice != null ? (
          <div className="hero">
            {best?.photoBlob ? (
              <Thumb className="hero-photo" blob={best.photoBlob} alt={item.name} />
            ) : null}
            <span className="bought-badge">구매완료</span>
            <h1 className="price" style={{ marginTop: 8 }}>
              {item.name}
            </h1>
            <p className="price">{formatWon(item.paidPrice)}</p>
            <p className="meta">
              구매한 금액
              {item.purchasedAt ? ` · ${formatDate(item.purchasedAt)}` : ''}
            </p>
            {best ? (
              <p className="meta">
                찍어 둔 최저가 {formatWon(best.price)}
                {item.paidPrice === best.price
                  ? ' · 최저가로 삼'
                  : item.paidPrice > best.price
                    ? ` · 최저가보다 ${formatWon(item.paidPrice - best.price)} 더 줌`
                    : ` · 최저가보다 ${formatWon(best.price - item.paidPrice)} 싸게 삼`}
              </p>
            ) : null}
            {item.targetPrice != null ? (
              <p className="meta">{vsTarget(item.paidPrice, item.targetPrice)}</p>
            ) : null}
          </div>
        ) : best ? (
          <div className="hero">
            {best.photoBlob ? (
              <Thumb className="hero-photo" blob={best.photoBlob} alt={item.name} />
            ) : null}
            <span className="best">최저가 · {best.store}</span>
            <h1 className="price" style={{ marginTop: 8 }}>
              {item.name}
            </h1>
            <p className="price">{formatWon(best.price)}</p>
            <p className="meta">{formatDate(best.seenAt)}</p>
            {item.targetPrice != null ? (
              <p className="meta">
                기준가 {formatWon(item.targetPrice)} · {vsTarget(best.price, item.targetPrice)}
              </p>
            ) : null}
            {best.memo ? <p className="meta">{best.memo}</p> : null}
          </div>
        ) : (
          <div className="hero">
            <h1 className="price" style={{ fontSize: 22 }}>
              {item.name}
            </h1>
            <p className="meta">
              위시에만 올려 둔 상태입니다. 가격과 사진은 나중에 넣어도 됩니다.
            </p>
            {item.targetPrice != null ? (
              <p className="price" style={{ fontSize: 20 }}>
                기준가 {formatWon(item.targetPrice)}
              </p>
            ) : null}
          </div>
        )}
        <div className="action-stack">
          {bought ? (
            <>
              <Link className="btn" to={`/items/${itemId}/buy`}>
                구매한 금액 수정
              </Link>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => void onClearPurchase()}
              >
                위시로 되돌리기
              </button>
            </>
          ) : (
            <Link className="btn" to={`/items/${itemId}/buy`}>
              구매완료
            </Link>
          )}
          <Link className="btn-secondary" to={`/items/${itemId}/target`}>
            {item.targetPrice != null ? '기준가 수정' : '기준가 적기'}
          </Link>
          <Link className="btn-secondary" to={`/items/${itemId}/record`}>
            + 가격 기록
          </Link>
        </div>
      </div>

      <h2 style={{ fontSize: 15, margin: '20px 0 8px' }}>기록 {sightings.length}건 · 싼 순</h2>
      <div className="panel">
        {sightings.length === 0 ? (
          <p className="meta" style={{ padding: 16 }}>
            아직 가격이 없습니다. 매장에서 찍으면 여기에 쌓입니다.
          </p>
        ) : (
          sightings.map((s) => (
            <div
              className={s.id === best?.id ? 'sighting best-row' : 'sighting'}
              key={s.id}
            >
              <Thumb blob={s.photoBlob} alt={s.store} />
              <div>
                {s.id === best?.id ? <span className="best">최저가</span> : null}
                <h3>{formatWon(s.price)}</h3>
                <p className="meta">{s.store}</p>
                <p className="meta">{formatDate(s.seenAt)}</p>
                {s.memo ? <p className="meta">{s.memo}</p> : null}
              </div>
              <div className="row-actions">
                <Link className="btn-ghost" to={`/items/${itemId}/record/${s.id}`}>
                  수정
                </Link>
                <button
                  className="btn-danger"
                  type="button"
                  onClick={() => void onDeleteSighting(s)}
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
