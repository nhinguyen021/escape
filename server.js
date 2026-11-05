
import express from 'express';
import dotenv from 'dotenv';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const { Pool } = pg;
const app = express();
const PORT = Number(process.env.PORT || 3000);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not configured.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true'
    ? { rejectUnauthorized: false }
    : undefined
});

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

// Only known Escape modules may store state.
const ALLOWED_KEYS = new Set([
  'forest-garden',
  'neon-city',
  'impossible',
  'place-oracle',
  'volume',
  'sea',
  'rain-piano',
  'street-shops'
]);

function validClientId(value) {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function requireClient(req, res, next) {
  const clientId = req.get('x-client-id');

  if (!validClientId(clientId)) {
    return res.status(400).json({
      error: 'A valid x-client-id UUID header is required.'
    });
  }

  req.clientId = clientId;
  next();
}

function requireAllowedKey(req, res, next) {
  if (!ALLOWED_KEYS.has(req.params.key)) {
    return res.status(404).json({ error: 'Unknown state key.' });
  }

  next();
}

// Health check, including database connectivity.
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health check failed:', error.message);
    res.status(503).json({
      status: 'error',
      database: 'unavailable'
    });
  }
});

// Read saved state.
app.get(
  '/api/state/:key',
  requireClient,
  requireAllowedKey,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT state, updated_at
         FROM escape_state
         WHERE client_id = $1 AND state_key = $2`,
        [req.clientId, req.params.key]
      );

      if (result.rowCount === 0) {
        return res.json({ state: null, updated_at: null });
      }

      res.json({
        state: result.rows[0].state,
        updated_at: result.rows[0].updated_at
      });
    } catch (error) {
      console.error('State read failed:', error.message);
      res.status(500).json({ error: 'Unable to read state.' });
    }
  }
);

// Create or update saved state.
app.put(
  '/api/state/:key',
  requireClient,
  requireAllowedKey,
  async (req, res) => {
    if (!Object.hasOwn(req.body, 'state')) {
      return res.status(400).json({
        error: 'Request body must contain a state property.'
      });
    }

    try {
      const result = await pool.query(
        `INSERT INTO escape_state (client_id, state_key, state)
         VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (client_id, state_key)
         DO UPDATE SET
           state = EXCLUDED.state,
           updated_at = CURRENT_TIMESTAMP
         RETURNING state, updated_at`,
        [req.clientId, req.params.key, JSON.stringify(req.body.state)]
      );

      res.json({
        saved: true,
        state: result.rows[0].state,
        updated_at: result.rows[0].updated_at
      });
    } catch (error) {
      console.error('State write failed:', error.message);
      res.status(500).json({ error: 'Unable to save state.' });
    }
  }
);

// Delete saved state.
app.delete(
  '/api/state/:key',
  requireClient,
  requireAllowedKey,
  async (req, res) => {
    try {
      await pool.query(
        `DELETE FROM escape_state
         WHERE client_id = $1 AND state_key = $2`,
        [req.clientId, req.params.key]
      );

      res.json({ deleted: true });
    } catch (error) {
      console.error('State delete failed:', error.message);
      res.status(500).json({ error: 'Unable to delete state.' });
    }
  }
);

// Serve the existing Escape website without changing its UI.
app.use(express.static(__dirname));

async function start() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS escape_state (
      client_id UUID NOT NULL,
      state_key TEXT NOT NULL,
      state JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (client_id, state_key)
    )
  `);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Escape server listening on port ${PORT}`);
  });
}

start().catch(error => {
  console.error('Server startup failed:', error);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
