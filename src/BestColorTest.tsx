import { Link } from 'react-router-dom'

const BG = '#dde7e3'
const BORDER = '#c5d4cf'

const INKS = [
  { name: '딥포레스트', fg: '#2f7d6d' },
  { name: '위시탭 글자', fg: '#3f6f68' },
  { name: '단위비교 글자', fg: '#4e716a' },
  { name: '빈티지 틸', fg: '#3a7d72' },
  { name: '슬레이트', fg: '#4f5e5d' },
  { name: '세이지', fg: '#5a9b45' },
  { name: '더스티 틸', fg: '#5e8a82' },
  { name: '청록 슬레이트', fg: '#3b6f8a' },
  { name: '올리브', fg: '#5a6b52' },
  { name: '페일 잉크', fg: '#6b7571' },
] as const

export function BestColorTest() {
  return (
    <div className="page">
      <header className="topbar">
        <Link className="back" to="/">
          ‹ 위시
        </Link>
      </header>
      <h1 className="form-title" style={{ fontSize: 22 }}>
        BEST 색 고르기
      </h1>
      <p className="meta" style={{ margin: '8px 0 18px' }}>
        배경은 회끼 민트 {BG}, 테두리 {BORDER}. 글자색만 다릅니다.
      </p>
      <div className="swatch-list">
        {INKS.map((p) => (
          <section className="swatch-card" key={p.name}>
            <p className="swatch-name">{p.name}</p>
            <p className="swatch-hex">{p.fg}</p>
            <div className="best-preview-row">
              <span className="num">1</span>
              <p className="record-store" style={{ margin: 0 }}>
                약국
                <span
                  className="best"
                  style={{
                    background: BG,
                    color: p.fg,
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  BEST
                </span>
              </p>
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
