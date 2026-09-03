import { NavLink, Link } from 'react-router-dom'

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

function IconUndo() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 10H4V5M4.6 14A8 8 0 1 0 6 8.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type Props = {
  right:
    | { kind: 'link'; to: string; label: string; icon: 'plus' | 'undo' }
    | { kind: 'action'; label: string; icon: 'undo'; onClick: () => void }
}

export function BottomNav({ right }: Props) {
  return (
    <nav className="nav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
        <IconHeart />
        위시
      </NavLink>
      {right.kind === 'link' ? (
        <Link to={right.to} className="nav-action">
          {right.icon === 'undo' ? <IconUndo /> : <IconPlus />}
          {right.label}
        </Link>
      ) : (
        <button className="nav-action" type="button" onClick={right.onClick}>
          <IconUndo />
          {right.label}
        </button>
      )}
    </nav>
  )
}
