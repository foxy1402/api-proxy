# 🚀 Cloudflare Workers Proxy - Deployment Guide

This proxy bypasses CORS restrictions for CoinMarketCap API and securely stores your API key in Cloudflare's environment variables.

---

## 📋 Prerequisites

1. **Cloudflare Account** (Free tier works!)
   - Sign up at [cloudflare.com](https://cloudflare.com)

2. **CoinMarketCap API Key**
   - Get free key at [coinmarketcap.com/api](https://pro.coinmarketcap.com/signup)
   - Free tier: 10,000 calls/month

3. **Node.js & npm** (for deployment)
   - Download from [nodejs.org](https://nodejs.org)

---

## 🔧 Setup Instructions

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

### Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate.

### Step 3: Configure Your Worker

Edit `wrangler.toml` and add your Cloudflare account ID:

```toml
account_id = "your-account-id-here"
```

**Find your account ID:**
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select any domain (or Workers & Pages)
3. Copy the Account ID from the right sidebar

### Step 4: Set Your API Key (Securely!)

**IMPORTANT:** Never commit your API key to git!

```bash
wrangler secret put CMC_API_KEY
```

When prompted, paste your CoinMarketCap API key.

### Step 5: Deploy to Cloudflare

```bash
npm run deploy
```

Or for production:

```bash
npm run deploy:prod
```

### Step 6: Get Your Worker URL

After deployment, Wrangler will show your worker URL:

```
https://portfolio-tracker-proxy.your-subdomain.workers.dev
```

**Copy this URL** - you'll need it for your frontend app!

---

## 🔗 Update Your Frontend App

### Option A: Update AppConfig (Recommended)

Edit `js/app.js` in your main portfolio app:

```javascript
const AppConfig = {
  API: {
    COINMARKETCAP_PROXY: 'https://portfolio-tracker-proxy.your-subdomain.workers.dev',
    // ... rest of config
  }
}
```

### Option B: Use Environment Variable

Create a `.env` file in your portfolio app:

```env
VITE_CMC_PROXY_URL=https://portfolio-tracker-proxy.your-subdomain.workers.dev
```

---

## 🧪 Testing Your Proxy

### Test 1: Health Check

```bash
curl https://your-worker-url.workers.dev/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Test 2: Get BTC Price

```bash
curl "https://your-worker-url.workers.dev/api/quotes/latest?symbol=BTC"
```

Expected response:
```json
{
  "data": {
    "BTC": {
      "quote": {
        "USD": {
          "price": 43521.50
        }
      }
    }
  }
}
```

### Test 3: From Browser Console

Open your portfolio app and run:

```javascript
fetch('https://your-worker-url.workers.dev/api/quotes/latest?symbol=BTC')
  .then(r => r.json())
  .then(d => console.log('BTC Price:', d.data.BTC.quote.USD.price));
```

---

## 📡 API Endpoints

Your proxy exposes these endpoints:

### 1. Health Check
```
GET /health
```

### 2. Get Current Prices
```
GET /api/quotes/latest?symbol=BTC,ETH
GET /api/quotes/latest?id=1,1027
```

### 3. Get Historical Data
```
GET /api/quotes/historical?id=1&time_start=1609459200&time_end=1640995200&interval=daily
```

### 4. Map Symbol to ID
```
GET /api/map?symbol=BTC
```

---

## 🔐 Security Best Practices

### 1. Never Commit API Keys

Add to `.gitignore`:
```
wrangler.toml
.env
.dev.vars
```

### 2. Use Secrets for Production

```bash
# Set API key
wrangler secret put CMC_API_KEY

# List secrets (doesn't show values)
wrangler secret list

# Delete secret
wrangler secret delete CMC_API_KEY
```

### 3. Restrict Origins (Optional)

Edit `worker.js` to allow only your domain:

```javascript
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://yourusername.github.io',
  // ...
};
```

### 4. Add Rate Limiting (Optional)

Add to `worker.js`:

```javascript
const rateLimit = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 100;

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  const record = rateLimit.get(ip);
  
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}
```

---

## 🐛 Troubleshooting

### Error: "API key not configured"

**Solution:** Set your API key as a secret:
```bash
wrangler secret put CMC_API_KEY
```

### Error: "Account ID not found"

**Solution:** Add `account_id` to `wrangler.toml`:
```toml
account_id = "your-account-id-here"
```

### Error: "CORS policy blocked"

**Solution:** Make sure your worker URL is correct and deployed.

### Error: "Rate limit exceeded"

**Cause:** CoinMarketCap free tier limit (10k/month)

**Solutions:**
1. Upgrade your CMC plan
2. Add caching to your worker (see Advanced section)
3. Reduce request frequency in your app

---

## 📊 Monitoring

### View Real-Time Logs

```bash
npm run tail
```

### Check Usage Dashboard

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select **Workers & Pages**
3. Click your worker
4. View **Metrics** tab

---

## 🚀 Advanced Features

### Add Caching with KV

1. Create KV namespace:
```bash
wrangler kv:namespace create "CACHE"
```

2. Add to `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-id"
```

3. Update `worker.js`:
```javascript
async function handleQuotesLatest(params, env) {
  const cacheKey = `quotes:${params.get('symbol')}`;
  
  // Check cache
  const cached = await env.CACHE.get(cacheKey, 'json');
  if (cached && Date.now() - cached.timestamp < 300000) { // 5 min
    return jsonResponse(cached.data);
  }

  // Fetch from API
  const data = await fetchFromCMC(params, env);
  
  // Store in cache
  await env.CACHE.put(cacheKey, JSON.stringify({
    data,
    timestamp: Date.now()
  }), { expirationTtl: 300 }); // 5 minutes

  return jsonResponse(data);
}
```

### Add Request Logging

Add to `worker.js`:

```javascript
export default {
  async fetch(request, env, ctx) {
    const start = Date.now();
    
    try {
      const response = await handleRequest(request, env);
      
      // Log successful request
      console.log({
        method: request.method,
        url: request.url,
        status: response.status,
        duration: Date.now() - start
      });
      
      return response;
    } catch (error) {
      // Log error
      console.error({
        method: request.method,
        url: request.url,
        error: error.message,
        duration: Date.now() - start
      });
      
      throw error;
    }
  }
};
```

### Add Custom Domain

1. Add domain to Cloudflare
2. Add route to `wrangler.toml`:

```toml
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

3. Deploy:
```bash
npm run deploy
```

Your API will be available at: `https://api.yourdomain.com`

---

## 💰 Cost Estimate

**Cloudflare Workers Free Tier:**
- ✅ 100,000 requests/day
- ✅ 10ms CPU time per request
- ✅ Perfect for personal use!

**Paid Plan ($5/month):**
- 10 million requests/month
- 50ms CPU time per request

**Your CoinMarketCap API:**
- Free: 10,000 calls/month (~333/day)
- Basic: $29/month (30,000 calls/month)

---

## 📝 Maintenance

### Update Your Worker

```bash
npm run deploy
```

### Rollback to Previous Version

```bash
wrangler rollback
```

### View Deployment History

```bash
wrangler deployments list
```

---

## 🎯 Next Steps

1. ✅ Deploy your worker
2. ✅ Update your frontend to use the proxy URL
3. ✅ Test thoroughly
4. ✅ Monitor usage
5. ✅ Add caching (optional)
6. ✅ Set up custom domain (optional)

---

## 📚 Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
- [CoinMarketCap API Docs](https://coinmarketcap.com/api/documentation/v1/)

---

## 🆘 Support

**Issues?**
1. Check [Cloudflare Status](https://www.cloudflarestatus.com/)
2. Review [Worker logs](https://dash.cloudflare.com)
3. Test with `wrangler dev` locally

**Still stuck?**
- Cloudflare Discord: [discord.cloudflare.com](https://discord.cloudflare.com)
- Stack Overflow: [stackoverflow.com/questions/tagged/cloudflare-workers](https://stackoverflow.com/questions/tagged/cloudflare-workers)

---

**🎉 Congratulations!** Your CORS proxy is now live and your portfolio tracker should work perfectly!
