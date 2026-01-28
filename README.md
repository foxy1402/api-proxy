# 🔥 Portfolio Tracker - CoinMarketCap Proxy

**CORS bypass proxy for CoinMarketCap API using Cloudflare Workers**

This proxy solves the CORS (Cross-Origin Resource Sharing) issue when calling CoinMarketCap API directly from your browser-based portfolio tracker.

---

## ✨ Features

- ✅ **CORS bypass** - Call CoinMarketCap API from any browser
- ✅ **Secure API key storage** - API key stored in Cloudflare environment variables
- ✅ **Free tier compatible** - Works with Cloudflare's free plan
- ✅ **Fast & reliable** - Cloudflare's global CDN network
- ✅ **Easy deployment** - Deploy in 5 minutes
- ✅ **No server maintenance** - Serverless architecture

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

### 3. Update Configuration

Edit `wrangler.toml` and add your Cloudflare account ID:

```toml
account_id = "abc123def456..." # Your actual account ID
```

**How to find your Account ID:**
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click any domain (or "Workers & Pages")
3. Copy "Account ID" from the right sidebar

**(Optional) Change Worker Name:**
You can also change the `name` field in `wrangler.toml` if you prefer a different name:
```toml
name = "my-crypto-proxy" # Default: portfolio-tracker-proxy
```

### 4. Set Your API Key

```bash
npx wrangler secret put CMC_API_KEY
```

Paste your CoinMarketCap API key when prompted.

Get a free key at: [coinmarketcap.com/api](https://pro.coinmarketcap.com/signup)

### 5. Deploy

```bash
npm run deploy
```

**Copy the Worker URL** from the output (e.g., `https://my-crypto-proxy.your-subdomain.workers.dev`).

### 6. Test

1. Open `test.js`
2. Update line 7 with your **deployed Worker URL**:
   ```javascript
   const WORKER_URL = 'https://my-crypto-proxy.your-subdomain.workers.dev';
   ```
3. Run the test:
   ```bash
   node test.js
   ```

---

## 📡 API Endpoints

### Health Check
```
GET https://your-worker.workers.dev/health
```

### Get Current Prices
```
GET https://your-worker.workers.dev/api/quotes/latest?symbol=BTC,ETH
GET https://your-worker.workers.dev/api/quotes/latest?id=1,1027
```

### Get Historical Data
```
GET https://your-worker.workers.dev/api/quotes/historical?id=1&time_start=1609459200&time_end=1640995200&interval=daily
```

### Symbol to ID Mapping
```
GET https://your-worker.workers.dev/api/map?symbol=BTC
```

---

## 🔧 Update Your Portfolio App

After deploying, update your portfolio tracker:

1. Open `js/app.js`
2. Replace `AppConfig.API.COINMARKETCAP_BASE` with your worker URL
3. See `FRONTEND_INTEGRATION.js` for detailed code changes

---

## 📊 Monitoring

### View Logs
```bash
npm run tail
```

### Check Dashboard
[dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Your Worker → Metrics

---

## 💰 Costs

- **Cloudflare Workers**: FREE (100,000 requests/day)
- **CoinMarketCap API**: FREE (10,000 calls/month)

**Total monthly cost: $0** ✨

---

## 📚 Documentation

- [Full Deployment Guide](./DEPLOYMENT_GUIDE.md) - Comprehensive setup instructions
- [Frontend Integration](./FRONTEND_INTEGRATION.js) - Code changes for your app
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)

---

## 🐛 Troubleshooting

### "API key not configured"
```bash
npx wrangler secret put CMC_API_KEY
```

### "Account ID not found"
Add `account_id` to `wrangler.toml`

### CORS still blocked
Make sure you're using the deployed worker URL, not the API directly

---

## 🔐 Security

- ✅ API key stored securely in Cloudflare environment
- ✅ Never exposed to browser/client
- ✅ HTTPS only
- ⚠️ Never commit API keys to git!
- ℹ️ Consider git-ignoring `wrangler.toml` if you want to keep your Account ID private

---

## 📁 File Structure

```
api-proxy/
├── worker.js              # Main worker code
├── wrangler.toml          # Cloudflare configuration
├── package.json           # npm scripts
├── test.js                # Test script
├── DEPLOYMENT_GUIDE.md    # Full deployment guide
├── FRONTEND_INTEGRATION.js # Code changes for frontend
└── README.md              # This file
```

---

## 🎯 Next Steps

1. ✅ Deploy your worker
2. ✅ Test with `node test.js`
3. ✅ Update your portfolio app
4. ✅ Enjoy CORS-free API calls! 🎉

---

## 📞 Support

- [Cloudflare Discord](https://discord.cloudflare.com)
- [CoinMarketCap API Docs](https://coinmarketcap.com/api/documentation/v1/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/cloudflare-workers)

---

**Made with ❤️ for Portfolio Tracker users**
