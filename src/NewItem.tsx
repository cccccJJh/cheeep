import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createItem } from './db'
import { parseOptionalPrice } from './lib'

export function NewItem() {
  const navigate = useNavigate()
  const location = useLocation()
  const preset =
    typeof location.state === 'object' &&
    location.state &&
    'name' in location.state &&
    typeof location.state.name === 'string'
      ? location.state.name
      : ''
  const [name, setName] = useState(preset)
  const [target, setTarget] = useState('')
  const [error, setError] = useState('')

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('사고 싶은 이름을 적어 주세요.')
      return
    }
    const targetPrice = parseOptionalPrice(target)
    if (targetPrice === null) {
      setError('기준가는 숫자로 적어 주세요. 비워 둬도 됩니다.')
      return
    }
    await createItem(trimmed, targetPrice)
    navigate('/')
  }

  return (
    <div className="page">
      <header className="topbar">
        <Link className="back" to="/">
          ← 위시
        </Link>
      </header>
      <h1 style={{ fontSize: 22, marginTop: 0 }}>위시에 넣기</h1>
      <p className="meta" style={{ margin: '0 0 16px' }}>
        이름만 적어도 됩니다. 기준가는 이 정도면 사겠다는 금액이고, 안 적어도 돼요.
      </p>
      <form className="form" onSubmit={onSubmit}>
        <label>
          사고 싶은 것
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 코카콜라 1.5L"
            autoFocus
          />
        </label>
        <label>
          기준가 (선택)
          <input
            className="field"
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="예: 3000 · 비워 둬도 됨"
          />
        </label>
        {error ? <p className="error">{error}</p> : null}
        <button className="btn" type="submit">
          위시에 저장
        </button>
      </form>
    </div>
  )
}
