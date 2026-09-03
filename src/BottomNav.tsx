import { NavLink } from 'react-router-dom'

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

export function BottomNav() {
  return (
    <nav className="nav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
        <IconHeart />
        위시
      </NavLink>
      <NavLink to="/new" className={({ isActive }) => (isActive ? 'active' : '')}>
        <IconPlus />
        추가
      </NavLink>
    </nav>
  )
}
