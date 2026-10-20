-- Safe to rerun: stores procurement's own free-text listing label.
ALTER TABLE auction_items
    ADD COLUMN IF NOT EXISTS listing_intent VARCHAR(180) NOT NULL DEFAULT 'TO BE SELL';

ALTER TABLE auction_items
    DROP CONSTRAINT IF EXISTS auction_items_listing_intent_check;

ALTER TABLE auction_items
    ALTER COLUMN listing_intent TYPE VARCHAR(180),
    ALTER COLUMN listing_intent SET DEFAULT 'TO BE SELL';

UPDATE auction_items
SET listing_intent = CASE LOWER(listing_intent)
    WHEN 'sell' THEN 'TO BE SELL'
    WHEN 'buy' THEN 'ITEM TO BE BUY'
    ELSE listing_intent
END;
