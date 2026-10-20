import { Router } from 'express'
import pool from '../../config/db.js'
import authenticate from '../../middleware/auth.js'
import authorize from '../../middleware/authorize.js'

const router = Router()
const toPublicItem = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  listingIntent: row.listing_intent || 'sell',
  vehicleType: row.vehicle_type,
  lotNumber: row.lot_number,
  initialPrice: row.initial_price,
  maximumPrice: row.maximum_price,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  photoUrl: row.photo_path,
  documentUrl: row.document_path,
  documentName: row.document_name,
  status: row.status,
  bidderCount: row.bidder_count == null ? 0 : Number(row.bidder_count),
})

router.get('/my-bids', authenticate, authorize('bidder'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT b.id,b.amount,b.created_at,b.updated_at,ai.id AS auction_item_id,ai.title,ai.vehicle_type,ai.lot_number,ai.status,ai.starts_at,ai.ends_at
       FROM auction_bids b JOIN auction_items ai ON ai.id=b.auction_item_id
       WHERE b.bidder_id=$1 ORDER BY b.updated_at DESC`,
      [req.user.sub],
    )
    res.json({ bids: rows.map((row) => ({ id: row.id, amount: row.amount, createdAt: row.created_at, updatedAt: row.updated_at, auctionItemId: row.auction_item_id, title: row.title, vehicleType: row.vehicle_type, lotNumber: row.lot_number, status: row.status, startsAt: row.starts_at, endsAt: row.ends_at })) })
  } catch (error) {
    console.error('Could not load bidder bids:', error.message)
    res.status(500).json({ error: 'Could not load your bids.' })
  }
})

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id,title,description,listing_intent,vehicle_type,lot_number,initial_price,maximum_price,starts_at,ends_at,photo_path,document_path,document_name
       FROM auction_items WHERE status='published' AND ends_at > NOW() ORDER BY starts_at ASC`,
    )
    res.json({ items: rows.map(toPublicItem) })
  } catch (error) {
    console.error('Could not load public auctions:', error.message)
    res.status(500).json({ error: 'Could not load published auctions.' })
  }
})

router.get('/home-items', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id,title,description,listing_intent,vehicle_type,lot_number,initial_price,maximum_price,starts_at,ends_at,status,photo_path,document_path,document_name
       FROM auction_items ORDER BY created_at DESC`,
    )
    res.json({ items: rows.map(toPublicItem) })
  } catch (error) {
    console.error('Could not load homepage auction items:', error.message)
    res.status(500).json({ error: 'Could not load homepage auction items.' })
  }
})

router.post('/:id/bids', authenticate, authorize('bidder'), async (req, res) => {
  const amount = Number(req.body?.amount)
  if (!Number.isFinite(amount) || amount <= 0 || !/^\d{1,12}(\.\d{1,2})?$/.test(String(req.body?.amount ?? ''))) {
    return res.status(400).json({ error: 'Enter a valid bid amount with up to two decimal places.' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      `SELECT id, initial_price, maximum_price
       FROM auction_items
       WHERE id=$1 AND status='published' AND starts_at <= NOW() AND ends_at > NOW()
       FOR UPDATE`,
      [req.params.id],
    )
    const item = rows[0]
    if (!item) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'This auction is not currently accepting bids.' })
    }
    if (item.maximum_price == null) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'This auction does not have a maximum price yet. Please contact the procurement office.' })
    }
    if (amount < Number(item.initial_price)) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Your sealed bid must be at least the initial price.' })
    }
    if (amount > Number(item.maximum_price)) {
      await client.query('ROLLBACK')
      return res.status(400).json({ error: 'Your bid cannot exceed the listed maximum price.' })
    }

    const bidResult = await client.query(
      `INSERT INTO auction_bids (auction_item_id, bidder_id, bidder_username, bidder_email, amount)
       SELECT $1,u.id,u.username,u.email,$3
       FROM users u
       WHERE u.id=$2 AND u.role='bidder' AND u.is_active=TRUE
       ON CONFLICT (auction_item_id, bidder_id)
       DO UPDATE SET bidder_username=EXCLUDED.bidder_username,bidder_email=EXCLUDED.bidder_email,amount=EXCLUDED.amount,updated_at=NOW()`,
      [item.id, req.user.sub, amount],
    )
    if (!bidResult.rowCount) {
      await client.query('ROLLBACK')
      return res.status(401).json({ error: 'Your bidder account is no longer active. Please sign in again.' })
    }
    await client.query('COMMIT')
    res.status(201).json({ message: 'Your sealed bid has been submitted.' })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('Could not submit sealed bid:', error.message)
    res.status(500).json({ error: 'Could not submit your bid.' })
  } finally {
    client.release()
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ai.id,ai.title,ai.description,ai.listing_intent,ai.vehicle_type,ai.lot_number,ai.initial_price,ai.maximum_price,ai.starts_at,ai.ends_at,ai.status,ai.photo_path,ai.document_path,ai.document_name,
              (SELECT COUNT(*)::int FROM auction_bids b WHERE b.auction_item_id=ai.id) AS bidder_count
       FROM auction_items ai WHERE ai.id=$1`,
      [req.params.id],
    )
    if (!rows.length) return res.status(404).json({ error: 'Auction not found.' })
    res.json({ item: toPublicItem(rows[0]) })
  } catch (error) {
    console.error('Could not load public auction:', error.message)
    res.status(500).json({ error: 'Could not load auction details.' })
  }
})

export default router
