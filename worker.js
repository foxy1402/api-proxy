/**
 * Cloudflare Worker - CoinMarketCap API Proxy
 * 
 * Bypasses CORS restrictions and securely handles API key
 * Deploy to Cloudflare Workers or Pages Functions
 */

// CORS headers for all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// CoinMarketCap API base URL
const CMC_API_BASE = 'https://pro-api.coinmarketcap.com/v1';

/**
 * Main request handler
 */
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }

    try {
      // Parse request
      const url = new URL(request.url);
      const path = url.pathname;

      // Route to appropriate handler
      if (path === '/health') {
        return handleHealth();
      }

      if (path === '/api/quotes/latest') {
        return await handleQuotesLatest(url.searchParams, env);
      }

      if (path === '/api/quotes/historical') {
        return await handleQuotesHistorical(url.searchParams, env);
      }

      if (path === '/api/map') {
        return await handleMap(url.searchParams, env);
      }

      // Unknown endpoint
      return jsonResponse({ error: 'Not found' }, 404);

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({
        error: 'Internal server error',
        message: error.message
      }, 500);
    }
  }
};

/**
 * Health check endpoint
 */
function handleHealth() {
  return jsonResponse({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle /cryptocurrency/quotes/latest
 * Query params: symbol or id
 */
async function handleQuotesLatest(params, env) {
  const apiKey = env.CMC_API_KEY;
  
  if (!apiKey) {
    return jsonResponse({
      error: 'API key not configured',
      hint: 'Set CMC_API_KEY in Cloudflare environment variables'
    }, 500);
  }

  // Build query string
  const symbol = params.get('symbol');
  const id = params.get('id');

  if (!symbol && !id) {
    return jsonResponse({
      error: 'Missing required parameter: symbol or id'
    }, 400);
  }

  let queryString = '';
  if (symbol) queryString = `symbol=${encodeURIComponent(symbol)}`;
  if (id) queryString = `id=${encodeURIComponent(id)}`;

  // Call CoinMarketCap API
  const response = await fetch(
    `${CMC_API_BASE}/cryptocurrency/quotes/latest?${queryString}`,
    {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return jsonResponse({
      error: 'CoinMarketCap API error',
      status: response.status,
      message: data.status?.error_message || 'Unknown error'
    }, response.status);
  }

  return jsonResponse(data);
}

/**
 * Handle /cryptocurrency/quotes/historical
 * Query params: id, time_start, time_end, interval
 */
async function handleQuotesHistorical(params, env) {
  const apiKey = env.CMC_API_KEY;
  
  if (!apiKey) {
    return jsonResponse({
      error: 'API key not configured'
    }, 500);
  }

  const id = params.get('id');
  const timeStart = params.get('time_start');
  const timeEnd = params.get('time_end');
  const interval = params.get('interval') || 'daily';

  if (!id) {
    return jsonResponse({
      error: 'Missing required parameter: id'
    }, 400);
  }

  // Build query string
  const queryParams = new URLSearchParams({
    id,
    interval
  });

  if (timeStart) queryParams.set('time_start', timeStart);
  if (timeEnd) queryParams.set('time_end', timeEnd);

  // Call CoinMarketCap API
  const response = await fetch(
    `${CMC_API_BASE}/cryptocurrency/quotes/historical?${queryParams}`,
    {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return jsonResponse({
      error: 'CoinMarketCap API error',
      status: response.status,
      message: data.status?.error_message || 'Unknown error'
    }, response.status);
  }

  return jsonResponse(data);
}

/**
 * Handle /cryptocurrency/map
 * Query params: symbol
 */
async function handleMap(params, env) {
  const apiKey = env.CMC_API_KEY;
  
  if (!apiKey) {
    return jsonResponse({
      error: 'API key not configured'
    }, 500);
  }

  const symbol = params.get('symbol');

  if (!symbol) {
    return jsonResponse({
      error: 'Missing required parameter: symbol'
    }, 400);
  }

  // Call CoinMarketCap API
  const response = await fetch(
    `${CMC_API_BASE}/cryptocurrency/map?symbol=${encodeURIComponent(symbol)}`,
    {
      headers: {
        'X-CMC_PRO_API_KEY': apiKey,
        'Accept': 'application/json'
      }
    }
  );

  const data = await response.json();

  if (!response.ok) {
    return jsonResponse({
      error: 'CoinMarketCap API error',
      status: response.status,
      message: data.status?.error_message || 'Unknown error'
    }, response.status);
  }

  return jsonResponse(data);
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  });
}
