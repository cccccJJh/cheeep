import type { PackageInfo } from './PackageFields'
import Dexie, { type EntityTable } from 'dexie'

export type ComparisonUnit = '100g' | '100ml' | 'each'

export type Item = PackageInfo & {
  id?: number
  name: string
  categoryId?: number
  photoBlob?: Blob
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

export type Sighting = PackageInfo & {
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

export type Category = { id?: number; name: string }

const db = new Dexie('cheeep') as Dexie & {
  categories: EntityTable<Category, 'id'>
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

db.version(4).stores({
  categories: '++id, name',
  items: '++id, name, updatedAt, purchasedAt, categoryId',
  sightings: '++id, itemId, price, seenAt, store',
}).upgrade(async (tx) => {
  const categoryId = await tx.table('categories').add({ name: '기본' })
  await tx.table('items').toCollection().modify({ categoryId })
})

export async function deleteCategory(categoryId: number) {
  await db.transaction('rw', db.categories, db.items, db.sightings, async () => {
    const keys = await db.items.where('categoryId').equals(categoryId).primaryKeys()
    const ids = keys.filter((id): id is number => id != null)
    await db.sightings.where('itemId').anyOf(ids).delete()
    await db.items.bulkDelete(ids)
    await db.categories.delete(categoryId)
  })
}

export function representativePhoto(list: Sighting[], item: Item) {
  return bestSightingsForItem(list, item).find(s => s.photoBlob)?.photoBlob
    ?? item.photoBlob
    ?? sortSightingsForItem(list, item).find(s => s.photoBlob)?.photoBlob
}

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
  if (sighting.quantity != null || sighting.capacity != null) {
    if (unit === 'each') return sighting.price / (sighting.quantity ?? 1)
    if (sighting.capacity == null || !sighting.capacityUnit) return undefined
    const mass = sighting.capacityUnit === 'g' || sighting.capacityUnit === 'kg'
    if ((unit === '100g') !== mass) return undefined
    const scale = sighting.capacityUnit === 'kg' || sighting.capacityUnit === 'L' ? 1000 : 1
    return unitPriceFrom(sighting.price, sighting.capacity * scale * (sighting.quantity ?? 1), unit)
  }
  return unitPriceFrom(sighting.price, sighting.packageSize, unit)
}

export function sortSightingsForItem(list: Sighting[], item: Item): Sighting[] {
  if (!isStingy(item) || !item.comparisonUnit || list.some(s => unitPriceOf(s, item.comparisonUnit!) == null)) return sortSightings(list)
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
  return bestSightingsForItem(list, item)[0]
}

export function bestSightingsForItem(list: Sighting[], item: Item): Sighting[] {
  if (list.length === 0) return []
  const unit = item.comparisonUnit
  if (isStingy(item) && unit) {
    const withUnit = list.filter((s) => unitPriceOf(s, unit) != null)
    if (withUnit.length === list.length) {
      let min = Infinity
      for (const s of withUnit) {
        const won = unitPriceOf(s, unit)
        if (won != null && won < min) min = won
      }
      return withUnit.filter((s) => unitPriceOf(s, unit) === min)
    }
  }
  const minPrice = Math.min(...list.map((s) => s.price))
  return list.filter((s) => s.price === minPrice)
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
  categoryId?: number,
  photoBlob?: Blob,
  packageInfo: PackageInfo = {},
): Promise<number> {
  const now = Date.now()
  const id = await db.items.add({
    ...packageInfo,
    name: name.trim(),
    categoryId,
    photoBlob,
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
