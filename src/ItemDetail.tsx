import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import {
  bestSightingsForItem,
  type ComparisonUnit,
  clearPurchase,
  db,
  deleteItem,
  deleteSighting,
  isPurchased,
  isStingy,
  setStingyMode,
  setTargetPrice,
  sortSightingsForItem,
  type Item,
  type Sighting,
  unitPriceFrom,
  unitPriceOf,
} from './db'
import {
  formatPackageSize,
  formatPurchaseDate,
  formatWon,
  parseOptionalPrice,
  unitHeadline,
} from './lib'

function compareLabel(item: Item): string {
  if (isStingy(item) && item.comparisonUnit) {
    if (item.comparisonUnit === 'each') return '개당'
    return unitHeadline(item.comparisonUnit)
  }
  return '총 가격'
}

function purchaseLines(item: Item): string[] {
  const lines: string[] = []
  const head: string[] = []
  const store = item.purchasedStore?.trim()
  if (store) head.push(store)
  if (item.paidPrice != null) head.push(formatWon(item.paidPrice))
  if (head.length) lines.push(head.join(' · '))

  const extra: string[] = []
  const qty = item.purchasedQuantity
  const unit = item.comparisonUnit
  if (qty != null && qty > 0) {
    extra.push(unit ? formatPackageSize(qty, unit) : qty.toLocaleString('ko-KR'))
  }
  if (isStingy(item) && unit && item.paidPrice != null && qty != null) {
    const unitWon = unitPriceFrom(item.paidPrice, qty, unit)
    if (unitWon != null) {
      extra.push(`${unitHeadline(unit)} ${Math.round(unitWon).toLocaleString('ko-KR')}원`)
    }
  }
  if (extra.length) lines.push(extra.join(' · '))
  if (item.purchasedAt != null) {
    lines.push(`${formatPurchaseDate(item.purchasedAt)} 구매`)
  }
  return lines
}

export function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const itemId = Number(id)
  const [item, setItem] = useState<Item>()
  const [sightings, setSightings] = useState<Sighting[]>([])
  const [ready, setReady] = useState(false)
  const [openMenu, setOpenMenu] = useState<number>()
  const [compareOpen, setCompareOpen] = useState(false)
  const [targetOpen, setTargetOpen] = useState(false)
  const [targetDraft, setTargetDraft] = useState('')
  const [targetError, setTargetError] = useState('')

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

  useEffect(() => {
    if (openMenu == null) return
    function close() {
      setOpenMenu(undefined)
    }
    const timer = window.setTimeout(() => {
      document.addEventListener('click', close)
    }, 0)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('click', close)
    }
  }, [openMenu])

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
  const bestIds = new Set(
    bestSightingsForItem(sightings, item)
      .map((s) => s.id)
      .filter((id): id is number => id != null),
  )
  const anyUnitPrice =
    stingy && unit
      ? sightings.some((s) => unitPriceOf(s, unit) != null)
      : false
  const bought = isPurchased(item)
  const boughtLines = bought ? purchaseLines(item) : []

  async function onPlainMode() {
    await setStingyMode(itemId, false)
    await reload()
  }

  async function onStingyMode(next?: ComparisonUnit) {
    await setStingyMode(itemId, true, next ?? unit ?? '100g')
    await reload()
  }

  async function onSaveTarget() {
    const parsed = parseOptionalPrice(targetDraft)
    if (parsed === null) {
      setTargetError('기준가는 숫자로 적어 주세요. 비워 두면 지워집니다.')
      return
    }
    await setTargetPrice(itemId, parsed)
    setTargetError('')
    setTargetOpen(false)
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
    setOpenMenu(undefined)
    await reload()
  }

  return (
    <>
    <div className="page detail-page has-nav">
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
      </div>

      <div className="fact-list">
        <button
          className="fact-row"
          type="button"
          onClick={() => {
            setCompareOpen(false)
            setTargetOpen((open) => {
              const next = !open
              if (next) {
                setTargetDraft(item.targetPrice != null ? String(item.targetPrice) : '')
                setTargetError('')
              }
              return next
            })
          }}
        >
          <span className="fact-key">기준가</span>
          <span className="fact-right">
            <span className="fact-val">
              {item.targetPrice != null ? formatWon(item.targetPrice) : '없음'}
            </span>
            <span className="fact-go" aria-hidden>
              ›
            </span>
          </span>
        </button>
        {targetOpen ? (
          <div className="fact-extra">
            <div className="money-field">
              <input
                inputMode="numeric"
                value={targetDraft}
                onChange={(e) => setTargetDraft(e.target.value)}
                placeholder="비워 두면 없음"
                autoFocus
              />
              <span>원</span>
            </div>
            {targetError ? <p className="error">{targetError}</p> : null}
            <button className="btn fact-save" type="button" onClick={() => void onSaveTarget()}>
              저장
            </button>
          </div>
        ) : null}

        <button
          className="fact-row"
          type="button"
          onClick={() => {
            setTargetOpen(false)
            setCompareOpen((open) => !open)
          }}
        >
          <span className="fact-key">가격 비교</span>
          <span className="fact-right">
            <span className="fact-val">{compareLabel(item)}</span>
            <span className="fact-go" aria-hidden>
              ›
            </span>
          </span>
        </button>
        {compareOpen ? (
          <div className="fact-extra">
            <button
              className={item.unitPriceEnabled ? 'method' : 'method on'}
              type="button"
              onClick={() => void onPlainMode()}
            >
              <strong>그냥 최저가</strong>
            </button>
            <button
              className={item.unitPriceEnabled ? 'method on' : 'method'}
              type="button"
              onClick={() => void onStingyMode()}
            >
              <strong>짠돌이 모드</strong>
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
          </div>
        ) : null}

        {bought ? (
          <>
            <Link className="fact-row" to={`/items/${itemId}/buy`}>
              <span className="fact-key">구매 상태</span>
              <span className="fact-right">
                <span className="fact-val">구매완료</span>
                <span className="fact-go" aria-hidden>
                  ›
                </span>
              </span>
            </Link>
            {boughtLines.length ? (
              <div className="purchase-note">
                {boughtLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <Link className="fact-row" to={`/items/${itemId}/buy`}>
            <span className="fact-key">구매 상태</span>
            <span className="fact-right">
              <span className="fact-val">미구매</span>
              <span className="fact-go" aria-hidden>
                ›
              </span>
            </span>
          </Link>
        )}
      </div>

      <div className="section-row">
        <h2>가격 기록{sightings.length ? ` ${sightings.length}` : ''}</h2>
      </div>

      {sightings.length === 0 ? (
        <p className="meta pad">아직 가격이 없습니다. 매장에서 찍으면 여기에 쌓입니다.</p>
      ) : (
        <ol className="record-list">
          {sightings.map((s, i) => {
            const unitWon = stingy && unit ? unitPriceOf(s, unit) : undefined
            const isBest = s.id != null && bestIds.has(s.id)
            return (
              <li className={isBest ? 'record-row best-row' : 'record-row'} key={s.id}>
                <span className="num">{i + 1}</span>
                <div className="record-body">
                  <p className="record-store">
                    {s.store}
                    {isBest ? <span className="best">BEST</span> : null}
                  </p>
                  {stingy && unit && unitWon != null ? (
                    <p className="record-unit">
                      {unitHeadline(unit)} {Math.round(unitWon).toLocaleString('ko-KR')}원
                    </p>
                  ) : stingy && anyUnitPrice ? (
                    <p className="record-unit">용량 없음 · 판매가로 비교</p>
                  ) : null}
                  <p className="record-line">
                    {formatWon(s.price)}
                    {s.packageSize != null && unit
                      ? ` · ${formatPackageSize(s.packageSize, unit)}`
                      : s.packageSize != null
                        ? ` · ${s.packageSize.toLocaleString('ko-KR')}`
                        : ''}
                  </p>
                </div>
                <div className="more-wrap">
                  <button
                    className="more-btn"
                    type="button"
                    aria-label="기록 메뉴"
                    onClick={(e) => {
                      e.stopPropagation()
                      setOpenMenu(openMenu === s.id ? undefined : s.id)
                    }}
                  >
                    ⋯
                  </button>
                  {openMenu === s.id ? (
                    <div className="more-menu">
                      <Link to={`/items/${itemId}/record/${s.id}`}>수정</Link>
                      <button
                        type="button"
                        onClick={() => void onDeleteSighting(s)}
                      >
                        삭제
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
    {bought ? (
      <BottomNav
        right={{
          kind: 'action',
          label: '위시로 되돌리기',
          icon: 'undo',
          tone: 'undo',
          onClick: () => void onClearPurchase(),
        }}
      />
    ) : (
      <BottomNav
        right={{
          kind: 'link',
          to: `/items/${itemId}/record`,
          label: '가격 기록',
          icon: 'plus',
          tone: 'record',
        }}
      />
    )}
    </>
  )
}
