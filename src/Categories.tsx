import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { liveQuery } from 'dexie'
import { db, deleteCategory, type Category } from './db'
const Context = createContext<{ categories: Category[]; selected?: number }>({ categories: [] })
export const useCategories = () => useContext(Context)
export function Categories({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selected, setSelected] = useState<number | undefined>(() => Number(localStorage.getItem('cheeep-category')) || undefined)
  const [ready, setReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState<number>()
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  useEffect(() => {
    const sub = liveQuery(() => db.categories.toArray()).subscribe(list => { setCategories(list); setReady(true) })
    return () => sub.unsubscribe()
  }, [])
  useEffect(() => {
    if (!ready) return
    if (!categories.some(c => c.id === selected)) setSelected(categories[0]?.id)
  }, [categories, selected, ready])
  useEffect(() => {
    if (selected != null) localStorage.setItem('cheeep-category', String(selected))
    else localStorage.removeItem('cheeep-category')
  }, [selected])
  async function save() {
    const name = draft.trim()
    if (!name) { setError('카테고리 이름을 입력해 주세요.'); return }
    if (categories.some(c => c.name === name && c.id !== editing)) { setError('이미 있는 이름이에요.'); return }
    try {
      if (editing != null) await db.categories.update(editing, { name })
      else { const id = await db.categories.add({ name }); setSelected(id); setOpen(false) }
      setDraft(''); setEditing(undefined); setError('')
    } catch { setError('저장하지 못했어요. 다시 시도해 주세요.') }
  }
  async function remove(c: Category) {
    if (c.id == null) return
    const count = await db.items.where('categoryId').equals(c.id).count()
    if (!confirm(count ? `‘${c.name}’ 카테고리의 위시 ${count}개와 연결된 가격 기록·사진이 모두 삭제됩니다. 삭제하시겠어요?` : `‘${c.name}’ 카테고리를 삭제하시겠어요?`)) return
    try { await deleteCategory(c.id); if (editing === c.id) { setEditing(undefined); setDraft('') }; navigate('/') }
    catch { setError('삭제하지 못했어요. 다시 시도해 주세요.') }
  }
  const show = open || (ready && !categories.length)
  return <Context.Provider value={{ categories, selected }}>
    <div className="category-bar"><select aria-label="현재 카테고리" value={selected ?? ''} onChange={e => {
      if (e.target.value === 'manage') { setOpen(true); return }
      setSelected(Number(e.target.value)); if (location.pathname !== '/new') navigate('/')
    }}><option value="" disabled>카테고리 선택</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}<option value="manage">카테고리 관리…</option></select></div>
    {children}
    {show && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="category-title">
      <div className="section-row"><h2 id="category-title">카테고리 관리</h2>{categories.length > 0 && <button type="button" onClick={() => setOpen(false)}>닫기</button>}</div>
      {!categories.length && <p>첫 카테고리를 만들어 주세요.</p>}
      {categories.map(c => <div className="category-row" key={c.id}><span>{c.name}</span><button onClick={() => { setEditing(c.id); setDraft(c.name); setError('') }}>수정</button><button className="btn-danger" onClick={() => void remove(c)}>삭제</button></div>)}
      <form onSubmit={e => { e.preventDefault(); void save() }}><input className="field" aria-label="카테고리 이름" maxLength={40} placeholder="예: 일본여행, 가챠" value={draft} onChange={e => setDraft(e.target.value)} />{error && <p className="error">{error}</p>}<button className="btn" type="submit">{editing != null ? '이름 저장' : '카테고리 추가'}</button>{editing != null && <button type="button" onClick={() => { setEditing(undefined); setDraft(''); setError('') }}>취소</button>}</form>
    </section></div>}
  </Context.Provider>
}
