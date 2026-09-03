import { Navigate, Route, Routes } from 'react-router-dom'
import { BuyForm } from './BuyForm'
import { Home } from './Home'
import { ItemDetail } from './ItemDetail'
import { NewItem } from './NewItem'
import { SightingForm } from './SightingForm'
import { TargetForm } from './TargetForm'

export default function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewItem />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/items/:id/target" element={<TargetForm />} />
        <Route path="/items/:id/buy" element={<BuyForm />} />
        <Route path="/items/:id/record" element={<SightingForm />} />
        <Route path="/items/:id/record/:sid" element={<SightingForm />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
