import { db } from '../lib/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { SHOPS } from '../data/shops'

export async function seedShops() {
  const writes = SHOPS.map(({ color, distanceKm, ...rest }) =>
    setDoc(doc(db, 'shops', String(rest.id)), {
      ...rest,
      ownerId: null,
      geoPoint: null,
      photoURL: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  )
  await Promise.all(writes)
  return SHOPS.length
}
