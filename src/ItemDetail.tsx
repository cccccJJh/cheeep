import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  cheapestForItem,
  type ComparisonUnit,
  clearPurchase,
  db,
  deleteItem,
  deleteSighting,
  isPurchased,
  isStingy,
  setStingyMode,
  sortSightingsForItem,
  type Item,
  type Sighting,
  unitPriceOf,
} from './db'
import {
  formatPackageSize,
  formatWon,
  unitBasis,
  unitHeadline,
  vsTarget,
} from './lib'

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
    if (!nextItem) {
      setItem(undefined)
      setSightings([])
      setReady(true)
      return
    }
    setItem(nextItem)
    setSightings(sortSightingsForItem(nextSightings, nextItem))
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
  const stingy = isStingy(item)
  const unit = item.comparisonUnit
  const best = cheapestForItem(sightings, item)
  const bought = isPurchased(item)
  const bestUnit =
    stingy && unit && best ? unitPriceOf(best, unit) : undefined

  async function onPlainMode() {
    await setStingyMode(itemId, false)
    await reload()
  }

  async function onStingyMode(next?: ComparisonUnit) {
    await setStingyMode(itemId, true, next ?? unit ?? '100g')
    await reload()
  }

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
    <div className="page detail-page">
      <header className="topbar">
        <Link className="back" to="/">
          ‹ 위시
        </Link>
        <button className="btn-danger" type="button" onClick={() => void onDeleteItem()}>
          삭제
        </button>
      </header>

      <div className="detail-head">
        <h1>{item.name}</h1>
        <p className="mode-line">
          {stingy && unit ? `단위비교 · ${unitBasis(unit)}` : '판매가 최저가'}
        </p>
      </div>

      {bought && item.paidPrice != null ? (
        <section className="receipt">
          <p className="receipt-kicker">구매완료</p>
          <p className="kpi-label">구매가</p>
          <p className="kpi">
            {item.paidPrice.toLocaleString('ko-KR')}
            <span>원</span>
          </p>
          {best ? (
            <p className="price-sub">
              기록 최저 {formatWon(best.price)}
              {item.paidPrice === best.price ? ' · 최저가로 삼' : ''}
            </p>
          ) : null}
        </section>
      ) : best ? (
        <section className="receipt">
          <p className="receipt-kicker">BEST</p>
          <p className="kpi-label">
            {stingy && unit ? unitHeadline(unit) : '최저가'}
          </p>
          <p className="kpi">
            {stingy && unit && bestUnit != null
              ? Math.round(bestUnit).toLocaleString('ko-KR')
              : best.price.toLocaleString('ko-KR')}
            <span>원</span>
          </p>
          <p className="receipt-store">{best.store}</p>
          <p className="price-sub">
            {stingy && unit && best.packageSize != null
              ? `${formatPackageSize(best.packageSize, unit)}  ·  ${formatWon(best.price)}`
              : formatWon(best.price)}
          </p>
        </section>
      ) : (
        <section className="receipt empty-receipt">
          <p className="kpi-label">최저가</p>
          <p className="kpi muted-kpi">아직 없음</p>
          <p className="price-sub">매장 가격을 남기면 BEST가 생깁니다.</p>
        </section>
      )}

      <Link className="setting-row" to={`/items/${itemId}/target`}>
        <div>
          <p className="kpi-label">기준가</p>
          <p className="setting-value">
            {item.targetPrice != null ? formatWon(item.targetPrice) : '아직 없음'}
          </p>
          {best && item.targetPrice != null && !stingy ? (
            <p className="price-foot">{vsTarget(best.price, item.targetPrice)}</p>
          ) : null}
        </div>
        <span>수정 ›</span>
      </Link>

      <section className="compare-box">
        <p className="section-label">가격 비교 방식</p>
        <button
          className={item.unitPriceEnabled ? 'method' : 'method on'}
          type="button"
          onClick={() => void onPlainMode()}
        >
          <strong>그냥 최저가</strong>
          <span>판매가격이 가장 싼 곳을 찾아요</span>
        </button>
        <button
          className={item.unitPriceEnabled ? 'method on' : 'method'}
          type="button"
          onClick={() => void onStingyMode()}
        >
          <strong>짠돌이 모드</strong>
          <span>용량까지 따져서 진짜 싼 곳을 찾아요</span>
        </button>
        {item.unitPriceEnabled ? (
          <div className="unit-picks">
            {(
              [
                ['100g', '100g'],
                ['100ml', '100ml'],
                ['each', '1개'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                className={unit === value ? 'chip active' : 'chip'}
                type="button"
                onClick={() => void onStingyMode(value)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <div className="section-row">
        <h2>가격 기록</h2>
        <Link className="text-add" to={`/items/${itemId}/record`}>
          + 기록
        </Link>
      </div>

      {sightings.length === 0 ? (
        <p className="meta pad">아직 가격이 없습니다. 매장에서 찍으면 여기에 쌓입니다.</p>
      ) : (
        <ol className="record-list">
          {sightings.map((s, i) => {
            const unitWon = stingy && unit ? unitPriceOf(s, unit) : undefined
            const isBest = s.id === best?.id
            return (
              <li className={isBest ? 'record-row best-row' : 'record-row'} key={s.id}>
                <span className="num">{i + 1}</span>
                <div className="record-body">
                  <p className="record-store">{s.store}</p>
                  <p className="record-line">
                    {formatWon(s.price)}
                    {stingy && unit && s.packageSize != null
                      ? ` · ${formatPackageSize(s.packageSize, unit)}`
                      : ''}
                  </p>
                  {stingy && unit && unitWon != null ? (
                    <p className="record-unit">
                      {unitHeadline(unit)} {Math.round(unitWon).toLocaleString('ko-KR')}원
                    </p>
                  ) : stingy ? (
                    <p className="record-unit">용량 없음 · 판매가만 있음</p>
                  ) : null}
                </div>
                {isBest ? <span className="best">BEST</span> : null}
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
              </li>
            )
          })}
        </ol>
      )}

      <div className="buy-bar">
        {bought ? (
          <button className="btn-secondary" type="button" onClick={() => void onClearPurchase()}>
            위시로 되돌리기
          </button>
        ) : (
          <Link className="btn" to={`/items/${itemId}/buy`}>
            이 가격으로 구매
          </Link>
        )}
      </div>
    </div>
  )
}
