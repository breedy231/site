const { DashboardEngine } = require('../dashboard-lib/dashboard-engine');
const WeatherService = require('../dashboard-lib/weather-service');
const fs = require('fs');
const path = require('path');

/**
 * Netlify Function for Kindle Dashboard Generation
 * Integrated into personal site at brendanreed.tech
 */

// In-memory cache for dashboard images (5 minute TTL)
const imageCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Security token for Kindle access
const DASHBOARD_TOKEN = process.env.DASHBOARD_TOKEN || 'kindle-dashboard-2024';

/**
 * Generate dashboard image buffer
 */
async function generateDashboard(layout = 'weather', options = {}) {
    try {
        // Load layout configuration
        const layoutPath = path.join(__dirname, '../dashboard-lib/layouts', `${layout}.json`);
        let layoutConfig;

        try {
            const layoutData = fs.readFileSync(layoutPath, 'utf8');
            layoutConfig = JSON.parse(layoutData);
        } catch (error) {
            console.warn(`Layout ${layout} not found, using default weather layout`);
            const defaultLayoutPath = path.join(__dirname, '../dashboard-lib/layouts/weather.json');
            const defaultLayoutData = fs.readFileSync(defaultLayoutPath, 'utf8');
            layoutConfig = JSON.parse(defaultLayoutData);
        }

        // Initialize services
        const weatherService = new WeatherService({
            latitude: options.latitude || 41.8781, // Chicago
            longitude: options.longitude || -87.6298,
            timezone: options.timezone || 'America/Chicago',
            mockData: false // Always use real data in production
        });

        // Get data
        const weather = await weatherService.getFormattedWeather();

        // Create dashboard engine
        const engine = new DashboardEngine();

        // Add current time data
        const now = new Date();
        const timeData = {
            time: now.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: 'America/Chicago'
            }),
            date: now.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                timeZone: 'America/Chicago'
            }),
            timestamp: now.toISOString()
        };

        // Generate dashboard
        const imageBuffer = await engine.generateDashboard(layoutConfig, {
            weather,
            time: timeData,
            // Device stats disabled for cloud deployment
            device: {
                battery: 'Cloud',
                temperature: 'N/A',
                memory: 'N/A',
                wifi: 'Connected',
                uptime: 'N/A'
            }
        });

        return imageBuffer;

    } catch (error) {
        console.error('Dashboard generation error:', error);
        throw new Error(`Failed to generate dashboard: ${error.message}`);
    }
}

/**
 * Main Netlify Function handler
 */
exports.handler = async (event, context) => {
    try {
        const { httpMethod, path: requestPath, queryStringParameters, headers } = event;

        // Handle OPTIONS requests for CORS
        if (httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
                },
                body: ''
            };
        }

        // Only allow GET requests
        if (httpMethod !== 'GET') {
            return {
                statusCode: 405,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Method not allowed' })
            };
        }

        // Extract parameters
        const params = queryStringParameters || {};
        const layout = params.layout || 'weather';
        const token = params.token || headers.authorization?.replace('Bearer ', '');
        const forceRefresh = params.refresh === 'true';

        // Simple token authentication for Kindle
        if (token !== DASHBOARD_TOKEN) {
            return {
                statusCode: 401,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid token' })
            };
        }

        // Check cache first (unless force refresh)
        const cacheKey = `dashboard_${layout}`;
        const cached = imageCache.get(cacheKey);

        if (!forceRefresh && cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            console.log('Serving cached dashboard');
            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'image/png',
                    'Cache-Control': 'public, max-age=300',
                    'X-Cache': 'HIT',
                    'X-Source': 'brendantreed.com'
                },
                body: cached.buffer.toString('base64'),
                isBase64Encoded: true
            };
        }

        // Generate new dashboard
        console.log(`Generating dashboard with layout: ${layout}`);
        const imageBuffer = await generateDashboard(layout, {
            latitude: params.lat ? parseFloat(params.lat) : undefined,
            longitude: params.lon ? parseFloat(params.lon) : undefined,
            timezone: params.tz || undefined
        });

        // Cache the result
        imageCache.set(cacheKey, {
            buffer: imageBuffer,
            timestamp: Date.now()
        });

        // Clean up old cache entries
        for (const [key, value] of imageCache.entries()) {
            if (Date.now() - value.timestamp > CACHE_TTL) {
                imageCache.delete(key);
            }
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=300',
                'X-Cache': 'MISS',
                'X-Generated-At': new Date().toISOString(),
                'X-Source': 'brendanreed.tech'
            },
            body: imageBuffer.toString('base64'),
            isBase64Encoded: true
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? error.message : 'Dashboard generation failed'
            })
        };
    }
};