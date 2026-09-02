import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { cheapestOf, db, isPurchased, type Item, type Sighting } from './db'
import { formatDate, formatWon, vsTarget } from './lib'
import { Thumb } from './Thumb'

type Card = {
  item: Item
  cheapest?: Sighting
  count: number
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
        return { item, cheapest: cheapestOf(list), count: list.length }
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
    <div className="page">
      <header className="topbar">
        <div className="brand">
          <strong>Cheeep</strong>
          <span>사고 싶은 것 · 이름만 남겨도 됨</span>
        </div>
      </header>

      <input
        className="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="위시 이름이나 구입처 검색"
        type="search"
        enterKeyHint="search"
      />

      <div className="tabs">
        <button
          className={tab === 'open' ? 'tab active' : 'tab'}
          type="button"
          onClick={() => setTab('open')}
        >
          위시
        </button>
        <button
          className={tab === 'done' ? 'tab active' : 'tab'}
          type="button"
          onClick={() => setTab('done')}
        >
          구매완료
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
                위시에 넣기
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="card-list">
          {cards.map((card) => {
            const id = card.item.id
            if (!id) return null
            return (
              <Link
                className={isPurchased(card.item) ? 'item-card bought' : 'item-card'}
                key={id}
                to={`/items/${id}`}
              >
                <Thumb blob={card.cheapest?.photoBlob} alt={card.item.name} />
                <div className="card-body">
                  <h2>{card.item.name}</h2>
                  {isPurchased(card.item) && card.item.paidPrice != null ? (
                    <>
                      <span className="bought-badge">구매완료</span>
                      <p className="price">{formatWon(card.item.paidPrice)}</p>
                      <p className="meta">
                        구매한 금액
                        {card.item.purchasedAt
                          ? ` · ${formatDate(card.item.purchasedAt)}`
                          : ''}
                      </p>
                      {card.item.targetPrice != null ? (
                        <p className="meta">
                          {vsTarget(card.item.paidPrice, card.item.targetPrice)}
                        </p>
                      ) : null}
                    </>
                  ) : card.cheapest ? (
                    <>
                      <span className="best">최저가 · {card.cheapest.store}</span>
                      {card.item.targetPrice != null ? (
                        <span
                          className={
                            card.cheapest.price <= card.item.targetPrice
                              ? 'best'
                              : 'wait-badge'
                          }
                          style={{ marginLeft: 6 }}
                        >
                          {card.cheapest.price <= card.item.targetPrice
                            ? '기준가 이하'
                            : '기준가보다 비쌈'}
                        </span>
                      ) : null}
                      <p className="price">{formatWon(card.cheapest.price)}</p>
                      <p className="meta">
                        {formatDate(card.cheapest.seenAt)} · 기록 {card.count}건
                        {card.item.targetPrice != null
                          ? ` · 기준가 ${formatWon(card.item.targetPrice)}`
                          : ''}
                      </p>
                    </>
                  ) : (
                    <p className="meta">
                      {card.item.targetPrice != null
                        ? `기준가 ${formatWon(card.item.targetPrice)} · 매장 가격은 나중에`
                        : '위시만 남겨 둠 · 가격은 나중에'}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
