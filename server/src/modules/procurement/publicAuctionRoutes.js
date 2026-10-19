import { Router } from 'express'
import pool from '../../config/db.js'

const router = Router()
const toPublicItem = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  vehicleType: row.vehicle_type,
  lotNumber: row.lot_number,
  initialPrice: row.initial_price,
  minimumIncrement: row.minimum_increment,
  maximumPrice: row.maximum_price,
  startsAt: row.starts_at,
  endsAt: row.ends_at,
  photoUrl: row.photo_path,
  documentUrl: row.document_path,
  documentName: row.document_name,
})

router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id,title,description,vehicle_type,lot_number,initial_price,minimum_increment,maximum_price,starts_at,ends_at,photo_path,document_path,document_name
       FROM auction_items WHERE status='published' AND ends_at > NOW() ORDER BY starts_at ASC`,
    )
    res.json({ items: rows.map(toPublicItem) })
  } catch (error) {
    console.error('Could not load public auctions:', error.message)
    res.status(500).json({ error: 'Could not load published auctions.' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id,title,description,vehicle_type,lot_number,initial_price,minimum_increment,maximum_price,starts_at,ends_at,photo_path,document_path,document_name
       FROM auction_items WHERE id=$1 AND status='published' AND ends_at > NOW()`,
      [req.params.id],
    )
    if (!rows.length) return res.status(404).json({ error: 'Auction not found or no longer open.' })
    res.json({ item: toPublicItem(rows[0]) })
  } catch (error) {
    console.error('Could not load public auction:', error.message)
    res.status(500).json({ error: 'Could not load auction details.' })
  }
})

export default router
