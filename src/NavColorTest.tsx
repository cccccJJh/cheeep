import { Link } from 'react-router-dom'

const PALETTES = [
  { name: '체리빨강 / sorbet핑크', wish: '#c43c3c', record: '#e45a96' },
  { name: '벽돌 / 로즈', wish: '#b54a42', record: '#d4789c' },
  { name: '루비 / 베이비핑크', wish: '#a8324a', record: '#f09bb8' },
  { name: '테라코타 / 더스티로즈', wish: '#c45c3e', record: '#c96b86' },
  { name: '와인 / 연핑크', wish: '#8e2f3c', record: '#e8a0b5' },
  { name: '산호 / 핫핑크', wish: '#e06b5c', record: '#e0569a' },
  { name: '딥레드 / 말린장미', wish: '#9b2c2c', record: '#c45d7a' },
  { name: '토마토 / 피치핑크', wish: '#d94f3d', record: '#f3a6a0' },
] as const

function IconHeart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20s-7-4.4-7-9.2C5 8 6.8 6.2 9 6.2c1.3 0 2.4.6 3 1.6.6-1 1.7-1.6 3-1.6 2.2 0 4 1.8 4 4.6 0 4.8-7 9.2-7 9.2z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

export function NavColorTest() {
  return (
    <div className="page">
      <header className="topbar">
        <Link className="back" to="/">
          ‹ 위시
        </Link>
      </header>
      <h1 className="form-title" style={{ fontSize: 22 }}>
        하단바 색 고르기
      </h1>
      <p className="meta" style={{ margin: '8px 0 18px' }}>
        왼쪽이 위시, 오른쪽이 가격 기록이에요.
      </p>
      <div className="swatch-list">
        {PALETTES.map((p) => (
          <section className="swatch-card" key={p.name}>
            <p className="swatch-name">{p.name}</p>
            <p className="swatch-hex">
              {p.wish} · {p.record}
            </p>
            <div className="swatch-nav">
              <span className="swatch-item" style={{ color: p.wish }}>
                <IconHeart />
                위시
              </span>
              <span className="swatch-item" style={{ color: p.record }}>
                <IconPlus />
                가격 기록
              </span>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
