import Dexie, { type EntityTable } from 'dexie'

export type ComparisonUnit = '100g' | '100ml' | 'each'

export type Item = {
  id?: number
  name: string
  createdAt: number
  updatedAt: number
  purchasedAt?: number
  paidPrice?: number
  purchasedStore?: string
  purchasedQuantity?: number
  targetPrice?: number
  unitPriceEnabled?: boolean
  comparisonUnit?: ComparisonUnit
}

export type Sighting = {
  id?: number
  itemId: number
  price: number
  store: string
  photoBlob?: Blob
  memo?: string
  seenAt: number
  packageSize?: number
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

db.version(3).stores({
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

export function isStingy(item: Item): boolean {
  return item.unitPriceEnabled === true && item.comparisonUnit != null
}

export function unitPriceFrom(
  price: number,
  size: number | undefined,
  unit: ComparisonUnit,
): number | undefined {
  if (size == null || size <= 0) return undefined
  if (unit === 'each') return price / size
  return (price * 100) / size
}

export function unitPriceOf(
  sighting: Sighting,
  unit: ComparisonUnit,
): number | undefined {
  return unitPriceFrom(sighting.price, sighting.packageSize, unit)
}

export function sortSightingsForItem(list: Sighting[], item: Item): Sighting[] {
  if (!isStingy(item) || !item.comparisonUnit) return sortSightings(list)
  const unit = item.comparisonUnit
  return [...list].sort((a, b) => {
    const ua = unitPriceOf(a, unit)
    const ub = unitPriceOf(b, unit)
    if (ua == null && ub == null) return a.price - b.price || b.seenAt - a.seenAt
    if (ua == null) return 1
    if (ub == null) return -1
    return ua - ub || a.price - b.price || b.seenAt - a.seenAt
  })
}

export function cheapestForItem(
  list: Sighting[],
  item: Item,
): Sighting | undefined {
  if (!isStingy(item) || !item.comparisonUnit) return cheapestOf(list)
  return sortSightingsForItem(list, item).find(
    (s) => unitPriceOf(s, item.comparisonUnit!) != null,
  )
}

export async function setStingyMode(
  itemId: number,
  enabled: boolean,
  comparisonUnit?: ComparisonUnit,
): Promise<void> {
  await db.items
    .where('id')
    .equals(itemId)
    .modify((item) => {
      if (!enabled) {
        item.unitPriceEnabled = false
      } else {
        item.unitPriceEnabled = true
        if (comparisonUnit) item.comparisonUnit = comparisonUnit
      }
      item.updatedAt = Date.now()
    })
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
  purchasedStore: string,
  purchasedQuantity?: number,
): Promise<void> {
  const store = purchasedStore.trim()
  await db.items
    .where('id')
    .equals(itemId)
    .modify((item) => {
      item.paidPrice = paidPrice
      item.purchasedStore = store
      item.purchasedAt = Date.now()
      if (purchasedQuantity != null) item.purchasedQuantity = purchasedQuantity
      else delete item.purchasedQuantity
      item.updatedAt = Date.now()
    })
}

export async function clearPurchase(itemId: number): Promise<void> {
  await db.items
    .where('id')
    .equals(itemId)
    .modify((item) => {
      delete item.paidPrice
      delete item.purchasedAt
      delete item.purchasedStore
      delete item.purchasedQuantity
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
