import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { cheapestOf, db, isPurchased, markPurchased } from './db'
import { parsePrice } from './lib'

export function BuyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const itemId = Number(id)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    void (async () => {
      const item = await db.items.get(itemId)
      if (!item) return
      setName(item.name)
      setEditing(isPurchased(item))
      if (item.paidPrice) {
        setPrice(String(item.paidPrice))
        return
      }
      const list = await db.sightings.where('itemId').equals(itemId).toArray()
      const best = cheapestOf(list)
      if (best) setPrice(String(best.price))
    })()
  }, [itemId])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parsePrice(price)
    if (parsed == null) {
      setError('구매한 금액을 숫자로 적어 주세요.')
      return
    }
    await markPurchased(itemId, parsed)
    navigate(`/items/${itemId}`)
  }

  return (
    <div className="page">
      <header className="topbar">
        <Link className="back" to={`/items/${itemId}`}>
          ← {name || '위시'}
        </Link>
      </header>
      <h1 style={{ fontSize: 22, marginTop: 0 }}>
        {editing ? '구매 금액 수정' : '구매완료'}
      </h1>
      <p className="meta" style={{ margin: '0 0 16px' }}>
        실제로 산 금액을 남깁니다. 최저가 기록이 있으면 미리 채워 둡니다.
      </p>
      <form className="form" onSubmit={(e) => void onSubmit(e)}>
        <label>
          구매한 금액 (원)
          <input
            className="field"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="2980"
            autoFocus
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit">
          구매완료로 저장
        </button>
      </form>
    </div>
  )
}
