import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { db, setTargetPrice } from './db'
import { parseOptionalPrice } from './lib'

export function TargetForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const itemId = Number(id)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void (async () => {
      const item = await db.items.get(itemId)
      if (!item) return
      setName(item.name)
      if (item.targetPrice) setPrice(String(item.targetPrice))
    })()
  }, [itemId])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = parseOptionalPrice(price)
    if (parsed === null) {
      setError('기준가는 숫자로 적어 주세요. 비워 두면 지워집니다.')
      return
    }
    await setTargetPrice(itemId, parsed)
    navigate(`/items/${itemId}`)
  }

  return (
    <div className="page">
      <header className="topbar">
        <Link className="back" to={`/items/${itemId}`}>
          ← {name || '위시'}
        </Link>
      </header>
      <h1 style={{ fontSize: 22, marginTop: 0 }}>기준가</h1>
      <p className="meta" style={{ margin: '0 0 16px' }}>
        이 정도면 사겠다는 금액입니다. 안 적어도 되고, 나중에 바꿔도 됩니다.
      </p>
      <form className="form" onSubmit={(e) => void onSubmit(e)}>
        <label>
          기준가 (원)
          <input
            className="field"
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="비워 두면 없음"
            autoFocus
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit">
          저장
        </button>
      </form>
    </div>
  )
}
