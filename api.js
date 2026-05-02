/**
 * World Clock Globe - API Module
 * Open-Meteo and BigDataCloud API functions
 */

// ===========================================
// Rate Limiting for BigDataCloud API
// Minimum 5-second interval between calls to prevent 400 Bad Request errors
// ===========================================
let lastCallTime = 0;
let isCalling = false;
const API_RATE_LIMIT_MS = 5000; // 5 seconds

// Weather code to description mapping
const WEATHER_CODES = {
    0: 'Clear',
    1: 'Mainly Clear',
    2: 'Partly Cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing Rime Fog',
    51: 'Light Drizzle',
    53: 'Moderate Drizzle',
    55: 'Dense Drizzle',
    56: 'Light Freezing Drizzle',
    57: 'Dense Freezing Drizzle',
    61: 'Slight Rain',
    63: 'Moderate Rain',
    65: 'Heavy Rain',
    66: 'Light Freezing Rain',
    67: 'Heavy Freezing Rain',
    71: 'Slight Snow',
    73: 'Moderate Snow',
    75: 'Heavy Snow',
    77: 'Snow Grains',
    80: 'Slight Rain Showers',
    81: 'Moderate Rain Showers',
    82: 'Violent Rain Showers',
    85: 'Slight Snow Showers',
    86: 'Heavy Snow Showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with Hail',
    99: 'Thunderstorm with Heavy Hail'
};

/**
 * Get weather information from Open-Meteo API
 * @param {number} latitude - Latitude of the location
 * @param {number} longitude - Longitude of the location
 * @returns {Promise<Object>} Weather data
 */
export async function getWeather(latitude, longitude) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Weather API error');
        }
        const data = await response.json();
        
        const weather = data.current_weather;
        return {
            temperature: weather.temperature,
            weatherCode: weather.weathercode,
            weatherDescription: WEATHER_CODES[weather.weathercode] || 'Unknown',
            windSpeed: weather.windspeed,
            isDay: weather.is_day === 1
        };
    } catch (error) {
        console.error('Error fetching weather:', error);
        return null;
    }
}

/**
 * Get location information from OpenStreetMap Nominatim API (Reverse Geocoding)
 * No GPS restriction - works on both mobile and PC
 * @param {number} latitude - Latitude of the location
 * @param {number} longitude - Longitude of the location
 * @returns {Promise<Object>} Location data
 */
export async function getLocationInfo(latitude, longitude) {
    // Round coordinates to avoid precision issues
    const lat = parseFloat(latitude.toFixed(4));
    const lng = parseFloat(longitude.toFixed(4));
    
    const now = Date.now();
    
    // Rate limiting: skip if called within 5 seconds
    if (now - lastCallTime < API_RATE_LIMIT_MS) {
        console.log('Rate limited - skipping API call (5s interval)');
        return { city: 'Unknown', country: '', countryCode: '' };
    }
    
    // Prevent concurrent in-flight requests
    if (isCalling) {
        console.log('Concurrent request - skipping');
        return { city: 'Unknown', country: '', countryCode: '' };
    }
    
    isCalling = true;
    lastCallTime = now;
    
    // Get browser language (default to English)
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    const lang = browserLang.startsWith('ko') ? 'ko' : 'en';
    
    // OpenStreetMap Nominatim API (no GPS restriction)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=${lang}`;
    
    // Get browser language (default to English)
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    const lang = browserLang.startsWith('ko') ? 'ko' : 'en';
    
<<<<<<< HEAD
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${lang}`;
=======
    // OpenStreetMap Nominatim API (no GPS restriction)
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1&accept-language=${lang}`;
>>>>>>> e61c5e4 (Fix: Replace BigDataCloud with OSM Nominatim + reduce auto-rotate API calls to 5s)
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'WorldClockGlobe/1.0'  // OSM requires User-Agent
            }
        });
        
        if (!response.ok) {
            throw new Error('Geocoding API error');
        }
        
        const data = await response.json();
        
        // Parse Nominatim response
        const address = data.address || {};
        const city = address.city || address.town || address.village || address.suburb || 'Unknown';
        
        return {
            city: city,
            country: address.country || '',
            countryCode: address.country_code || '',
            subdivision: address.state || address.province || ''
        };
    } catch (error) {
        console.error('Error fetching location:', error);
        return { city: 'Unknown', country: '', countryCode: '' };
    } finally {
        isCalling = false;
    }
}

/**
 * Format time for a specific timezone
 * @param {string} timezone - IANA timezone string
 * @returns {Object} Formatted date and time
 */
export function getTimeForTimezone(timezone) {
    try {
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        const parts = formatter.formatToParts(now);
        const getPart = (type) => parts.find(p => p.type === type)?.value || '';
        
        return {
            date: `${getPart('year')}.${getPart('month')}.${getPart('day')}`,
            time: `${getPart('hour')}:${getPart('minute')}:${getPart('second')}`
        };
    } catch (error) {
        // Fallback to UTC if timezone is invalid
        const now = new Date();
        return {
            date: now.toISOString().split('T')[0].replace(/-/g, '.'),
            time: now.toTimeString().split(' ')[0]
        };
    }
}
