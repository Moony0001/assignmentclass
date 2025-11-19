// --- Imports ---
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config(); 
// --- App Initialization ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(cors()); 
app.use(express.json()); 

// --- Database Connection ---
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test DB Connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Database connected successfully:', res.rows.now);
  }
});


// --- AUTHENTICATION MIDDLEWARE ---


const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (token == null) {
    return res.sendStatus(401); 
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403); 
    }
    req.user = user; 
    next();
  });
};


const authenticateApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name FROM organizations WHERE api_key = $1',
      [apiKey]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid API key' });
    }

    req.organization = result.rows[0]; 
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// --- AUTHENTICATION ROUTES (for Web App) ---


app.post('/auth/register', async (req, res) => {
  const { email, password, organization_name } = req.body;

  if (!email ||!password ||!organization_name) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN'); 

    const orgQuery =
      'INSERT INTO organizations (name) VALUES ($1) RETURNING id, api_key';
    const orgResult = await client.query(orgQuery, [organization_name]);
    const newOrgId = orgResult.rows[0].id;
    const newApiKey = orgResult.rows[0].api_key;

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userQuery =
      'INSERT INTO users (organization_id, email, password_hash) VALUES ($1, $2, $3) RETURNING id';
    await client.query(userQuery, [newOrgId, email, passwordHash]);

    await client.query('COMMIT'); 
    res.status(201).json({
      message: 'Organization and user created successfully',
      organization_id: newOrgId,
      api_key: newApiKey, 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});


app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const payload = {
      userId: user.id,
      email: user.email,
      organization_id: user.organization_id,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    res.json({ token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- WEB APP API ROUTES (Protected by JWT) ---

app.post('/api/v1/beacons', authenticateToken, async (req, res) => {
  const { name, uuid, major, minor, store_id } = req.body;
  const { organization_id } = req.user; 

  try {
    const query = `
      INSERT INTO beacons (organization_id, store_id, name, uuid, major, minor)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [organization_id, store_id, name, uuid, major, minor];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/api/v1/beacons', authenticateToken, async (req, res) => {
  const { organization_id } = req.user;
  try {
    const result = await pool.query(
      'SELECT * FROM beacons WHERE organization_id = $1 ORDER BY name',
      [organization_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Campaign CMS ---

app.post('/api/v1/campaigns', authenticateToken, async (req, res) => {
  const { name, content_title, content_body, image_url } = req.body;
  const { organization_id } = req.user;

  try {
    const query = `
      INSERT INTO campaigns (organization_id, name, content_title, content_body, image_url, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *;
    `;
    const values = [organization_id, name, content_title, content_body, image_url];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/triggers', authenticateToken, async (req, res) => {
  const { campaign_id, beacon_id, trigger_event_type } = req.body;
  
  // TODO: Add check to ensure user's org owns both the campaign and beacon
  
  try {
    const query = `
      INSERT INTO triggers (campaign_id, beacon_id, trigger_event_type)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [campaign_id, beacon_id, trigger_event_type || 'enter_region'];
    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- Analytics Dashboard ---

app.get('/api/v1/analytics/summary', authenticateToken, async (req, res) => {
  const { organization_id } = req.user;
  try {
    const query = `
      SELECT 
        COALESCE(c.name, 'General Traffic') as campaign_name, 
        a.event_type, 
        COUNT(*) as event_count
      FROM analytics_events a
      LEFT JOIN campaigns c ON a.campaign_id = c.id
      WHERE a.organization_id = $1
      GROUP BY c.name, a.event_type
      ORDER BY event_count DESC;
    `;
    const result = await pool.query(query, [organization_id]);
    
    // Transform data for the dashboard
    const summary = {
        storeTraffic: 0,
        campaignViews: 0,
        beaconEvents: 0,
        activeBeacons: 0
    };

    // Simple aggregation logic
    result.rows.forEach(row => {
        const count = parseInt(row.event_count);
        summary.beaconEvents += count;
        if (row.event_type === 'enter_region') summary.storeTraffic += count;
        if (row.event_type === 'campaign_triggered') summary.campaignViews += count;
    });

    // Get active beacon count
    const beaconCount = await pool.query('SELECT COUNT(*) FROM beacons WHERE organization_id = $1', [organization_id]);
    summary.activeBeacons = parseInt(beaconCount.rows[0].count);

    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// --- MOBILE APP API ROUTES (Protected by API Key) ---

app.get('/api/v1/campaigns', authenticateApiKey, async (req, res) => {
  const { id: organization_id } = req.organization; 

  try {
    const query = `
      SELECT 
        c.id as campaign_id,
        c.content_title,
        c.content_body,
        c.image_url,
        t.trigger_event_type,
        b.id as beacon_id,
        b.uuid,
        b.major,
        b.minor
      FROM campaigns c
      JOIN triggers t ON c.id = t.campaign_id
      JOIN beacons b ON t.beacon_id = b.id
      WHERE c.organization_id = $1 AND c.is_active = true;
    `;
    const result = await pool.query(query, [organization_id]);
    res.json(result.rows); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post('/api/v1/analytics/event', authenticateApiKey, async (req, res) => {
  const { beacon_id, campaign_id, user_device_id, event_type } = req.body;
  const { id: organization_id } = req.organization;

  if (!beacon_id ||!user_device_id ||!event_type) {
    return res.status(400).json({ error: 'Missing required event fields' });
  }

  try {
    const query = `
      INSERT INTO analytics_events (organization_id, beacon_id, campaign_id, user_device_id, event_type)
      VALUES ($1, $2, $3, $4, $5);
    `;
    const values = [organization_id, beacon_id, campaign_id, user_device_id, event_type];
    await pool.query(query, values);
    res.sendStatus(204); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/v1/beacons/telemetry', authenticateApiKey, async (req, res) => {
  const { beacon_id, battery_level } = req.body;
  const { id: organization_id } = req.organization;

  if (!beacon_id || battery_level == null) {
    return res.status(400).json({ error: 'Missing beacon_id or battery_level' });
  }

  try {
    const query = `
      UPDATE beacons 
      SET last_battery_level = $1, last_seen = NOW()
      WHERE id = $2 AND organization_id = $3;
    `;
    const values = [battery_level, beacon_id, organization_id];
    await pool.query(query, values);
    res.sendStatus(204); // No Content
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// --- Server Start ---

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});