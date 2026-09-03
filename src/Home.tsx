import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import {
  db,
  isPurchased,
  isStingy,
  type Item,
  type Sighting,
  unitPriceOf,
} from './db'
import {
  formatPackageSize,
  formatUnitPrice,
  formatWon,
  vsTarget,
} from './lib'

const MAX_MIN_STORES = 3

type Card = {
  item: Item
  count: number
  minPrice?: number
  minSightings: Sighting[]
}

function lowestTotalPrice(list: Sighting[]): number | undefined {
  if (list.length === 0) return undefined
  return Math.min(...list.map((s) => s.price))
}

function tiesForMinPrice(list: Sighting[], minPrice: number): Sighting[] {
  return list
    .filter((s) => s.price === minPrice)
    .sort((a, b) => a.store.localeCompare(b.store, 'ko') || b.seenAt - a.seenAt)
}

function storeNamesLine(list: Sighting[]): string {
  const names: string[] = []
  for (const s of list) {
    const name = s.store.trim()
    if (name && !names.includes(name)) names.push(name)
  }
  return names.join(' · ')
}

function homeStoreLine(sighting: Sighting, item: Item): string {
  const parts: string[] = []
  const store = sighting.store.trim()
  if (store) parts.push(store)

  const unit = item.comparisonUnit
  if (sighting.packageSize != null && sighting.packageSize > 0 && unit) {
    parts.push(formatPackageSize(sighting.packageSize, unit))
  }

  if (isStingy(item) && unit) {
    const won = unitPriceOf(sighting, unit)
    if (won != null && Number.isFinite(won)) {
      parts.push(`(${formatUnitPrice(won, unit)})`)
    }
  }

  return parts.join(' · ')
}

function minPriceSubline(item: Item, ties: Sighting[], shown: Sighting[]): string {
  if (ties.length >= 2 || !isStingy(item)) {
    return storeNamesLine(shown)
  }
  return homeStoreLine(ties[0], item)
}

export function Home() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'open' | 'done'>('open')
  const [items, setItems] = useState<Item[]>([])
  const [sightings, setSightings] = useState<Sighting[]>([])

  useEffect(() => {
    void Promise.all([
      db.items.orderBy('updatedAt').reverse().toArray(),
      db.sightings.toArray(),
    ]).then(([nextItems, nextSightings]) => {
      setItems(nextItems)
      setSightings(nextSightings)
    })
  }, [])

  const wishCount = items.filter((i) => !isPurchased(i)).length
  const doneCount = items.filter((i) => isPurchased(i)).length

  const cards = useMemo<Card[]>(() => {
    const byItem = new Map<number, Sighting[]>()
    for (const s of sightings) {
      const list = byItem.get(s.itemId) ?? []
      list.push(s)
      byItem.set(s.itemId, list)
    }
    const q = query.trim().toLowerCase()
    return items
      .map((item) => {
        const list = item.id ? (byItem.get(item.id) ?? []) : []
        const minPrice = lowestTotalPrice(list)
        return {
          item,
          count: list.length,
          minPrice,
          minSightings: minPrice == null ? [] : tiesForMinPrice(list, minPrice),
        }
      })
      .filter((card) => {
        const bought = isPurchased(card.item)
        if (tab === 'open' && bought) return false
        if (tab === 'done' && !bought) return false
        if (!q) return true
        const nameHit = card.item.name.toLowerCase().includes(q)
        const storeHit = sightings.some(
          (s) =>
            s.itemId === card.item.id && s.store.toLowerCase().includes(q),
        )
        return nameHit || storeHit
      })
  }, [items, query, sightings, tab])

  const trimmed = query.trim()

  return (
    <>
    <div className="page has-nav">
      <header className="home-hero">
        <h1>Cheeep</h1>
        <p>사고 싶은 건, 쌀 때 사자.</p>
      </header>

      <label className="search-wrap">
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          className="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="물건이나 구입처 검색"
          type="search"
          enterKeyHint="search"
        />
      </label>

      <div className="tabs">
        <button
          className={tab === 'open' ? 'tab active' : 'tab'}
          type="button"
          onClick={() => setTab('open')}
        >
          위시 {wishCount}
        </button>
        <button
          className={tab === 'done' ? 'tab active' : 'tab'}
          type="button"
          onClick={() => setTab('done')}
        >
          구매완료 {doneCount}
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="empty">
          {trimmed ? (
            <>
              <p>
                {tab === 'done'
                  ? `구매완료에 “${trimmed}”가 없어요.`
                  : `위시에 “${trimmed}”가 없어요. 이름만 넣어도 됩니다.`}
              </p>
              {tab === 'open' ? (
                <button
                  className="btn"
                  type="button"
                  onClick={() =>
                    navigate('/new', { state: { name: trimmed } })
                  }
                >
                  이 이름으로 위시에 넣기
                </button>
              ) : null}
            </>
          ) : tab === 'done' ? (
            <p>아직 구매완료가 없어요. 산 물건에서 금액을 남기면 여기로 옵니다.</p>
          ) : (
            <>
              <p>사고 싶은 이름을 적으세요. 가격이랑 사진은 나중에 매장에서.</p>
              <Link className="btn" to="/new">
                ＋ 위시 추가
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="card-list">
          {cards.map((card) => {
            const id = card.item.id
            if (!id) return null
            const stingy = isStingy(card.item)
            const shown = card.minSightings.slice(0, MAX_MIN_STORES)
            const extraTies = card.minSightings.length - shown.length
            const minLine =
              card.minPrice != null
                ? minPriceSubline(card.item, card.minSightings, shown)
                : ''
            return (
              <Link
                className={isPurchased(card.item) ? 'price-card bought' : 'price-card'}
                key={id}
                to={`/items/${id}`}
              >
                <div className="price-card-top">
                  <h2>{card.item.name}</h2>
                  <div className="card-tags">
                    {stingy ? <span className="mode-tag">단위비교</span> : null}
                    {isPurchased(card.item) ? (
                      <span className="bought-badge">구매완료</span>
                    ) : null}
                    {card.count > 0 ? (
                      <span className="count-tag">{card.count}</span>
                    ) : null}
                  </div>
                </div>

                {isPurchased(card.item) && card.item.paidPrice != null ? (
                  <>
                    <p className="kpi-label">구매가</p>
                    <p className="kpi">
                      {card.item.paidPrice.toLocaleString('ko-KR')}
                      <span>원</span>
                    </p>
                    <p className="price-sub">
                      {[
                        card.item.purchasedStore?.trim(),
                        card.item.targetPrice != null
                          ? vsTarget(card.item.paidPrice, card.item.targetPrice)
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' · ') || '실제로 산 금액'}
                    </p>
                  </>
                ) : card.minPrice != null ? (
                  <>
                    <p className="kpi-label">최저가</p>
                    <p className="kpi">
                      {card.minPrice.toLocaleString('ko-KR')}
                      <span>원</span>
                    </p>
                    {minLine ? <p className="price-sub">{minLine}</p> : null}
                    {extraTies > 0 ? (
                      <p className="price-more">외 {extraTies}곳 동일 최저가</p>
                    ) : null}
                  </>
                ) : (
                  <>
                    <p className="kpi-label">최저가</p>
                    <p className="kpi muted-kpi">아직 없음</p>
                    <p className="price-sub">
                      {card.item.targetPrice != null
                        ? `기준가 ${formatWon(card.item.targetPrice)}`
                        : '매장에서 가격을 남기면 여기 뜹니다'}
                    </p>
                  </>
                )}
              </Link>
            )
          })}
          {tab === 'open' ? (
            <Link className="add-wish" to="/new">
              ＋ 위시 추가
            </Link>
          ) : null}
        </div>
      )}
    </div>
    <BottomNav
      right={{ kind: 'link', to: '/new', label: '위시 추가', icon: 'plus' }}
    />
    </>
  )
}
