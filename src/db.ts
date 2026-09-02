import Dexie, { type EntityTable } from 'dexie'

export type Item = {
  id?: number
  name: string
  createdAt: number
  updatedAt: number
  purchasedAt?: number
  paidPrice?: number
  targetPrice?: number
}

export type Sighting = {
  id?: number
  itemId: number
  price: number
  store: string
  photoBlob?: Blob
  memo?: string
  seenAt: number
}

export type NewItem = Omit<Item, 'id'>
export type NewSighting = Omit<Sighting, 'id'>

const db = new Dexie('cheeep') as Dexie & {
  items: EntityTable<Item, 'id'>
  sightings: EntityTable<Sighting, 'id'>
}

db.version(1).stores({
  items: '++id, name, updatedAt',
  sightings: '++id, itemId, price, seenAt, store',
})

db.version(2).stores({
  items: '++id, name, updatedAt, purchasedAt',
  sightings: '++id, itemId, price, seenAt, store',
})

export { db }

export function sortSightings(list: Sighting[]): Sighting[] {
  return [...list].sort((a, b) => a.price - b.price || b.seenAt - a.seenAt)
}

export function cheapestOf(list: Sighting[]): Sighting | undefined {
  return sortSightings(list)[0]
}

export async function createItem(
  name: string,
  targetPrice?: number,
): Promise<number> {
  const now = Date.now()
  const id = await db.items.add({
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
    ...(targetPrice != null ? { targetPrice } : {}),
  })
  if (id == null) throw new Error('물건 저장에 실패했습니다.')
  return id
}

export async function touchItem(itemId: number): Promise<void> {
  await db.items.update(itemId, { updatedAt: Date.now() })
}

export async function deleteItem(itemId: number): Promise<void> {
  await db.transaction('rw', db.items, db.sightings, async () => {
    await db.sightings.where('itemId').equals(itemId).delete()
    await db.items.delete(itemId)
  })
}

export async function saveSighting(
  data: NewSighting,
  existingId?: number,
): Promise<number> {
  const id = await db.transaction('rw', db.items, db.sightings, async () => {
    const savedId = existingId
      ? (await db.sightings.put({ ...data, id: existingId }), existingId)
      : await db.sightings.add(data)
    await touchItem(data.itemId)
    if (savedId == null) throw new Error('가격 저장에 실패했습니다.')
    return savedId
  })
  return id
}

export async function markPurchased(
  itemId: number,
  paidPrice: number,
): Promise<void> {
  await db.items.update(itemId, {
    paidPrice,
    purchasedAt: Date.now(),
    updatedAt: Date.now(),
  })
}

export async function clearPurchase(itemId: number): Promise<void> {
  await db.items
    .where('id')
    .equals(itemId)
    .modify((item) => {
      delete item.paidPrice
      delete item.purchasedAt
      item.updatedAt = Date.now()
    })
}

export async function setTargetPrice(
  itemId: number,
  targetPrice?: number,
): Promise<void> {
  await db.items
    .where('id')
    .equals(itemId)
    .modify((item) => {
      if (targetPrice == null) delete item.targetPrice
      else item.targetPrice = targetPrice
      item.updatedAt = Date.now()
    })
}

export function isPurchased(item: Item): boolean {
  return item.purchasedAt != null && item.paidPrice != null
}

export async function deleteSighting(id: number, itemId: number): Promise<void> {
  await db.transaction('rw', db.items, db.sightings, async () => {
    await db.sightings.delete(id)
    await touchItem(itemId)
  })
}

export async function loadStoreNames(): Promise<string[]> {
  const stores = await db.sightings.orderBy('store').uniqueKeys()
  return stores
    .map(String)
    .filter((s) => s.trim().length > 0)
    .sort((a, b) => a.localeCompare(b, 'ko'))
}
