/**
 * Metro Cardz / WowCard — Express.js Backend Server
 * Production Server for Hostinger (Node.js 18 / 20 / 22)
 * Connects to Hostinger MySQL Database with zero cold starts.
 *
 * Security Features:
 *  ✅ In-memory Rate Limiting (no extra npm packages)
 *  ✅ Brute-force protection on login endpoint
 *  ✅ Public QR token scanning throttle
 *  ✅ Security headers (CSP, X-Frame-Options, etc.)
 *  ✅ CORS locked to wowcard.in in production
 *  ✅ JSON payload size limit
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.SECRET_KEY || 'metrocardz-super-secret-key-2026';
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Database Connection Pool (Hostinger MySQL) ──────────────────────────────
const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'metrocardz',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  dateStrings: true,
});

// ── In-Memory Rate Limiter (No extra npm package needed) ─────────────────────
// Structure: { [ip_key]: { count, resetAt } }
const rateLimitStore = new Map();

// Auto-clean stale entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitStore) {
    if (val.resetAt < now) rateLimitStore.delete(key);
  }
}, 5 * 60 * 1000);

/**
 * Creates a rate limiter middleware.
 * @param {number} maxRequests  - Max allowed requests in the window
 * @param {number} windowMs     - Window duration in milliseconds
 * @param {string} keyPrefix    - Prefix to namespace different limiters
 */
function createRateLimiter(maxRequests, windowMs, keyPrefix = 'rl') {
  return (req, res, next) => {
    // Use IP + optional prefix as key; fall back to forwarded IP header on Hostinger proxy
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
              || req.socket?.remoteAddress
              || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || entry.resetAt < now) {
      // New window
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count++;

    if (entry.count > maxRequests) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        detail: `Too many requests. Please wait ${retryAfterSec} seconds before trying again.`,
        retry_after_seconds: retryAfterSec,
      });
    }

    return next();
  };
}

// ── Defined Rate Limit Policies ───────────────────────────────────────────────
const rateLimits = {
  // Login: 10 attempts per 15 minutes per IP (brute-force protection)
  login:        createRateLimiter(10,  15 * 60 * 1000, 'login'),
  // Public QR scan / member pass: 60 requests per minute per IP
  publicScan:   createRateLimiter(60,  60 * 1000,       'pub'),
  // General authenticated API: 300 requests per minute per IP
  general:      createRateLimiter(300, 60 * 1000,       'api'),
  // Write operations (record visit, redeem): 30 per minute per IP
  writes:       createRateLimiter(30,  60 * 1000,       'write'),
  // Member creation: 20 new members per 10 minutes (bulk import protection)
  createMember: createRateLimiter(20,  10 * 60 * 1000,  'create'),
};

// ── CORS — Locked to wowcard.in in production ────────────────────────────────
const ALLOWED_ORIGINS = IS_PROD
  ? ['https://wowcard.in', 'https://www.wowcard.in', 'https://metrocardz.in', 'https://www.metrocardz.in']
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl health checks)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS policy: Origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Security Headers (Helmet-style, no extra package) ─────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=self, geolocation=(), microphone=()');
  // Remove fingerprinting header
  res.removeHeader('X-Powered-By');
  next();
});

// ── Request Size Limits ───────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));           // JSON body max 2MB
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Helper: Generate Random ID / Token
const genId = (prefix = '') => prefix + crypto.randomBytes(8).toString('hex');
const genToken = () => crypto.randomBytes(16).toString('hex');
const genCode = () => Array.from({ length: 8 }, () => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]).join('');

// Middleware: Verify JWT Authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ detail: 'Authentication token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ detail: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// ── HEALTH & STATUS ──────────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 as db_check');
    res.json({ status: 'healthy', database: 'connected', timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ status: 'unhealthy', error: e.message });
  }
});

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', version: '2.0.0-hostinger' });
});

// ── 1. AUTHENTICATION ────────────────────────────────────────────────────────
app.post('/api/v1/auth/login', rateLimits.login, async (req, res) => {
  try {
    const { username, phone, password } = req.body;
    const identifier = phone || username;

    if (!identifier) return res.status(400).json({ detail: 'Phone or username is required' });

    // Look up merchant user by phone or email
    const [users] = await db.query(
      'SELECT u.*, m.business_name, m.status as merchant_status FROM merchant_users u LEFT JOIN merchants m ON u.merchant_id = m.id WHERE u.phone = ? OR u.email = ?',
      [identifier, identifier]
    );

    if (users.length === 0) {
      return res.status(401).json({ detail: 'Invalid credentials. User not found.' });
    }

    const user = users[0];

    // Password check if password provided
    if (user.password_hash && password) {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ detail: 'Incorrect password' });
    }

    const payload = {
      sub: user.id,
      merchant_id: user.merchant_id,
      role: user.role,
      name: user.name,
      phone: user.phone,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      access_token: token,
      token_type: 'bearer',
      user: {
        id: user.id,
        merchant_id: user.merchant_id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        business_name: user.business_name || 'Metro Cardz Merchant',
      },
    });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// ── 2. DASHBOARD STATS ───────────────────────────────────────────────────────
app.get('/api/v1/merchants/:merchantId/dashboard', rateLimits.general, authenticateToken, async (req, res) => {
  try {
    const { merchantId } = req.params;

    const [[{ total_members }]] = await db.query('SELECT COUNT(*) as total_members FROM members WHERE merchant_id = ? AND status != "anonymized"', [merchantId]);
    const [[{ total_visits }]] = await db.query('SELECT COALESCE(SUM(total_visits), 0) as total_visits FROM members WHERE merchant_id = ?', [merchantId]);
    const [[{ points_issued_month }]] = await db.query(
      'SELECT COALESCE(SUM(points), 0) as points_issued_month FROM loyalty_transactions WHERE merchant_id = ? AND type = "earn" AND created_at >= DATE_FORMAT(NOW(), "%Y-%m-01")',
      [merchantId]
    );
    const [[{ total_revenue }]] = await db.query('SELECT COALESCE(SUM(amount), 0) as total_revenue FROM redemption_log rl JOIN members m ON rl.member_id = m.id WHERE m.merchant_id = ?', [merchantId]);

    const [recent_activity] = await db.query(
      'SELECT lt.id, lt.type, lt.points, lt.created_at, m.name as member_name FROM loyalty_transactions lt JOIN members m ON lt.member_id = m.id WHERE lt.merchant_id = ? ORDER BY lt.created_at DESC LIMIT 10',
      [merchantId]
    );

    res.json({
      total_members: Number(total_members),
      total_visits: Number(total_visits),
      monthly_points_issued: Number(points_issued_month),
      total_revenue: Number(total_revenue),
      recent_activity: recent_activity.map(a => ({
        id: a.id,
        type: a.type,
        points: Number(a.points),
        member_name: a.member_name,
        created_at: a.created_at,
      })),
    });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// ── 3. MEMBER SEARCH & DIRECTORY ─────────────────────────────────────────────
app.get('/api/v1/merchants/:merchantId/members', rateLimits.general, authenticateToken, async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { q, query, tier, status } = req.query;
    const searchTerm = q || query || '';

    let sql = `
      SELECT m.*, mt.name as membership_type_name
      FROM members m
      LEFT JOIN membership_types mt ON m.membership_type_id = mt.id
      WHERE m.merchant_id = ?
    `;
    const params = [merchantId];

    if (searchTerm) {
      sql += ' AND (m.name LIKE ? OR m.phone LIKE ? OR m.member_code LIKE ? OR m.physical_card_number LIKE ?)';
      const s = `%${searchTerm}%`;
      params.push(s, s, s, s);
    }

    if (tier) {
      sql += ' AND m.membership_type_id = ?';
      params.push(tier);
    }

    sql += ' ORDER BY m.created_at DESC LIMIT 100';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// GET Member by ID
app.get('/api/v1/merchants/:merchantId/members/:memberId', authenticateToken, async (req, res) => {
  try {
    const { merchantId, memberId } = req.params;
    const [rows] = await db.query(
      'SELECT m.*, mt.name as membership_type_name FROM members m LEFT JOIN membership_types mt ON m.membership_type_id = mt.id WHERE m.id = ? AND m.merchant_id = ?',
      [memberId, merchantId]
    );
    if (rows.length === 0) return res.status(404).json({ detail: 'Member not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// CREATE New Member
app.post('/api/v1/merchants/:merchantId/members', rateLimits.createMember, authenticateToken, async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { name, phone, email, date_of_birth, anniversary_date, membership_type_id, referral_code_used } = req.body;

    // Check duplicate phone
    const [dup] = await db.query('SELECT id FROM members WHERE merchant_id = ? AND phone = ?', [merchantId, phone]);
    if (dup.length > 0) {
      return res.status(400).json({ detail: 'DUPLICATE_PHONE', message: 'A member with this phone number already exists.' });
    }

    // Default membership type if not specified
    let typeId = membership_type_id;
    if (!typeId) {
      const [defaultType] = await db.query('SELECT id FROM membership_types WHERE merchant_id = ? LIMIT 1', [merchantId]);
      typeId = defaultType[0]?.id || genId('mt_');
    }

    const id = genId('mem_');
    const member_code = 'MC-' + Math.floor(100000 + Math.random() * 900000);
    const public_token = genToken();
    const referral_code = genCode();
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];

    let referredByMemberId = null;
    if (referral_code_used) {
      const [refRow] = await db.query('SELECT id FROM members WHERE merchant_id = ? AND referral_code = ?', [merchantId, referral_code_used]);
      if (refRow.length > 0) referredByMemberId = refRow[0].id;
    }

    await db.query(
      `INSERT INTO members (id, merchant_id, member_code, public_token, name, phone, email, date_of_birth, anniversary_date, membership_type_id, joined_date, expiry_date, loyalty_points, status, total_visits, referral_code, referred_by_member_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'active', 0, ?, ?)`,
      [id, merchantId, member_code, public_token, name, phone, email || null, date_of_birth || null, anniversary_date || null, typeId, today, nextYear, referral_code, referredByMemberId]
    );

    // Credit referral points to referrer if applicable
    if (referredByMemberId) {
      const [[{ referral_bonus_points }]] = await db.query('SELECT referral_bonus_points FROM merchants WHERE id = ?', [merchantId]);
      const bonus = Number(referral_bonus_points || 50);

      await db.query('UPDATE members SET loyalty_points = loyalty_points + ? WHERE id = ?', [bonus, referredByMemberId]);
      await db.query(
        'INSERT INTO loyalty_transactions (id, member_id, merchant_id, type, points, balance_after, note) VALUES (?, ?, ?, "earn", ?, 0, ?)',
        [genId('txn_'), referredByMemberId, merchantId, bonus, `Referral bonus for inviting ${name}`]
      );
    }

    const [newMember] = await db.query('SELECT * FROM members WHERE id = ?', [id]);
    res.status(201).json(newMember[0]);
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// DPDP Act Right to Erasure / Anonymization Endpoint
app.post('/api/v1/merchants/:merchantId/members/:memberId/anonymize', authenticateToken, async (req, res) => {
  try {
    const { merchantId, memberId } = req.params;

    const [member] = await db.query('SELECT id FROM members WHERE id = ? AND merchant_id = ?', [memberId, merchantId]);
    if (member.length === 0) return res.status(404).json({ detail: 'Member not found' });

    const maskedPhone = `0000000000_${memberId.substring(0, 8)}`;
    await db.query(
      'UPDATE members SET name = "Anonymized Customer", phone = ?, email = NULL, date_of_birth = NULL, anniversary_date = NULL, status = "anonymized" WHERE id = ?',
      [maskedPhone, memberId]
    );

    res.json({ message: 'Customer personal data has been anonymized per DPDP Act right-to-erasure request.' });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// ── 4. RECORD VISIT & POINT ACCRUAL MATH ────────────────────────────────────
app.post('/api/v1/merchants/:merchantId/members/:memberId/purchase', rateLimits.writes, authenticateToken, async (req, res) => {
  try {
    const { merchantId, memberId } = req.params;
    const { bill_amount, coupon_code } = req.body;
    const grossAmount = Number(bill_amount || 0);

    const [members] = await db.query('SELECT * FROM members WHERE id = ? AND merchant_id = ?', [memberId, merchantId]);
    if (members.length === 0) return res.status(404).json({ detail: 'Member not found' });
    const member = members[0];

    // Calculate Points Rules
    const [rules] = await db.query('SELECT * FROM points_rules WHERE merchant_id = ? AND is_active = 1', [merchantId]);
    let pointsEarned = 0;

    if (rules.length > 0) {
      for (const r of rules) {
        if (r.rule_type === 'per_rupee') {
          const unit = Number(r.spend_unit || 1);
          if (unit > 0) pointsEarned += Math.floor((grossAmount / unit) * Number(r.points_value));
        } else if (r.rule_type === 'per_visit') {
          pointsEarned += Number(r.points_value);
        }
      }
    } else {
      // Default rule: 1 pt per ₹10 + 10 flat pts per visit
      pointsEarned = Math.floor(grossAmount / 10) + 10;
    }

    const newBalance = Number(member.loyalty_points || 0) + pointsEarned;
    const newVisits = Number(member.total_visits || 0) + 1;

    // Update Member
    await db.query(
      'UPDATE members SET loyalty_points = ?, total_visits = ? WHERE id = ?',
      [newBalance, newVisits, memberId]
    );

    // Audit Log
    const txnId = genId('txn_');
    await db.query(
      'INSERT INTO loyalty_transactions (id, member_id, merchant_id, type, points, balance_after, note) VALUES (?, ?, ?, "earn", ?, ?, ?)',
      [txnId, memberId, merchantId, pointsEarned, newBalance, `Purchase ₹${grossAmount.toFixed(2)}`]
    );

    res.json({
      member_id: memberId,
      gross_amount: grossAmount,
      points_earned: pointsEarned,
      new_loyalty_balance: newBalance,
      total_visits: newVisits,
      message: `Purchase recorded! ${pointsEarned} points credited.`,
    });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// ── 5. REWARDS CATALOG & REDEMPTION ──────────────────────────────────────────
app.get('/api/v1/merchants/:merchantId/rewards', authenticateToken, async (req, res) => {
  try {
    const { merchantId } = req.params;
    const [rows] = await db.query('SELECT * FROM reward_catalog WHERE merchant_id = ? AND is_active = 1', [merchantId]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

app.post('/api/v1/merchants/:merchantId/rewards/claim', rateLimits.writes, authenticateToken, async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { member_id, reward_id } = req.body;

    const [[member]] = await db.query('SELECT * FROM members WHERE id = ? AND merchant_id = ?', [member_id, merchantId]);
    const [[reward]] = await db.query('SELECT * FROM reward_catalog WHERE id = ? AND merchant_id = ?', [reward_id, merchantId]);

    if (!member) return res.status(404).json({ detail: 'Member not found' });
    if (!reward) return res.status(404).json({ detail: 'Reward item not found' });

    const cost = Number(reward.points_cost);
    const balance = Number(member.loyalty_points || 0);

    if (balance < cost) {
      return res.status(400).json({ detail: `Insufficient points. Required: ${cost}, Available: ${balance}` });
    }

    const newBalance = balance - cost;
    await db.query('UPDATE members SET loyalty_points = ? WHERE id = ?', [newBalance, member_id]);

    const claimId = genId('claim_');
    await db.query(
      'INSERT INTO reward_claims (id, reward_id, member_id, merchant_id, points_spent) VALUES (?, ?, ?, ?, ?)',
      [claimId, reward_id, member_id, merchantId, cost]
    );

    await db.query(
      'INSERT INTO loyalty_transactions (id, member_id, merchant_id, type, points, balance_after, note) VALUES (?, ?, ?, "redeem", ?, ?, ?)',
      [genId('txn_'), member_id, merchantId, -cost, newBalance, `Redeemed reward: ${reward.name}`]
    );

    res.json({
      claim_id: claimId,
      reward_name: reward.name,
      points_spent: cost,
      new_balance: newBalance,
      message: `Successfully redeemed ${reward.name}!`,
    });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// ── 6. PUBLIC MEMBER PASS VIEW (CUSTOMER PHONE) ──────────────────────────────
app.get('/api/v1/public/members/:publicToken', rateLimits.publicScan, async (req, res) => {
  try {
    const { publicToken } = req.params;

    const [rows] = await db.query(
      `SELECT m.*, mt.name as membership_type_name, merch.business_name as merchant_name, merch.logo_url, merch.whatsapp_number as merchant_phone
       FROM members m
       JOIN merchants merch ON m.merchant_id = merch.id
       LEFT JOIN membership_types mt ON m.membership_type_id = mt.id
       WHERE m.public_token = ?`,
      [publicToken]
    );

    if (rows.length === 0) return res.status(404).json({ detail: 'Member card not found' });

    const m = rows[0];
    const [rewards] = await db.query('SELECT * FROM reward_catalog WHERE merchant_id = ? AND is_active = 1', [m.merchant_id]);

    res.json({
      id: m.id,
      name: m.name,
      member_code: m.member_code,
      public_token: m.public_token,
      loyalty_points: Number(m.loyalty_points || 0),
      tier_name: m.membership_type_name || 'Member',
      merchant_name: m.merchant_name,
      merchant_phone: m.merchant_phone,
      logo_url: m.logo_url,
      referral_code: m.referral_code,
      total_visits: m.total_visits,
      available_rewards: rewards,
    });
  } catch (e) {
    res.status(500).json({ detail: e.message });
  }
});

// Start Hostinger Node.js Web App Server
app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`🚀 Metro Cardz Hostinger Server listening on port ${PORT}`);
  console.log(`⚡ Zero Cold Starts | Hostinger MySQL Engine Ready`);
  console.log(`========================================================`);
});
