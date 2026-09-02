import { NavLink } from 'react-router-dom'

export function BottomNav() {
  return (
    <nav className="nav">
      <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
        위시
      </NavLink>
      <NavLink to="/new" className={({ isActive }) => (isActive ? 'active' : '')}>
        + 위시
      </NavLink>
    </nav>
  )
}
