/**
 * World Clock Globe - API Module
 * Open-Meteo (weather) and OSM Nominatim (reverse geocoding)
 */

// ~11km grid cache key — collapses repeated lookups while panning a city
const gridKey = (lat, lng) => `${lat.toFixed(1)},${lng.toFixed(1)}`;

const locationCache = new Map();
const locationInFlight = new Map();

const weatherCache = new Map();
const weatherInFlight = new Map();
const WEATHER_TTL_MS = 10 * 60 * 1000;

// Global throttle — block bursts that could trip provider rate limits
const REQUEST_MIN_INTERVAL_MS = 2000;
let lastLocationCallAt = 0;
let lastWeatherCallAt = 0;

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

export async function getWeather(latitude, longitude) {
    const key = gridKey(latitude, longitude);
    const now = Date.now();
    const cached = weatherCache.get(key);
    if (cached && now - cached.timestamp < WEATHER_TTL_MS) {
        return cached.data;
    }
    if (weatherInFlight.has(key)) {
        return weatherInFlight.get(key);
    }
    if (now - lastWeatherCallAt < REQUEST_MIN_INTERVAL_MS) {
        return cached?.data ?? null;
    }
    lastWeatherCallAt = now;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

    const promise = (async () => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Weather API error');
            }
            const data = await response.json();
            const w = data.current_weather;
            const result = {
                temperature: w.temperature,
                weatherCode: w.weathercode,
                weatherDescription: WEATHER_CODES[w.weathercode] || 'Unknown',
                windSpeed: w.windspeed,
                isDay: w.is_day === 1
            };
            weatherCache.set(key, { data: result, timestamp: Date.now() });
            return result;
        } catch (error) {
            console.error('Error fetching weather:', error);
            return null;
        } finally {
            weatherInFlight.delete(key);
        }
    })();

    weatherInFlight.set(key, promise);
    return promise;
}

const EMPTY_LOCATION = { city: 'Unknown', cityEn: '', country: '', countryCode: '', subdivision: '' };

export async function getLocationInfo(latitude, longitude) {
    const key = gridKey(latitude, longitude);
    if (locationCache.has(key)) {
        return locationCache.get(key);
    }
    if (locationInFlight.has(key)) {
        return locationInFlight.get(key);
    }
    const now = Date.now();
    if (now - lastLocationCallAt < REQUEST_MIN_INTERVAL_MS) {
        return null;  // signal caller to skip UI update rather than overwrite with 'Unknown'
    }
    lastLocationCallAt = now;

    const lat = parseFloat(latitude.toFixed(4));
    const lng = parseFloat(longitude.toFixed(4));

    // Nominatim: omit accept-language → returns names in local language by default,
    // namedetails=1 → includes name:en for english fallback display
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&namedetails=1`;

    const promise = (async () => {
        try {
            const response = await fetch(url, {
                headers: { 'Accept-Language': '' }
            });
            if (!response.ok) {
                throw new Error('Geocoding API error');
            }
            const data = await response.json();
            const address = data.address || {};
            const namedetails = data.namedetails || {};
            // Stop at city/town/village — drop suburb so we don't surface 동/면 units
            const cityLocal = address.city || address.town || address.village
                || address.state || address.country || 'Unknown';
            // namedetails['name:en'] reflects the result element (often a sub-area like 동/면).
            // Only use it when result is the city itself, otherwise we'd show "사천시 / Seopo-myeon" mismatch.
            const isResultCityLevel = data.name && data.name === cityLocal;
            const cityEn = isResultCityLevel ? (namedetails['name:en'] || '') : '';
            const result = {
                city: cityLocal,
                cityEn: (cityEn && cityEn !== cityLocal) ? cityEn : '',
                country: address.country || '',
                countryCode: (address.country_code || '').toUpperCase(),
                subdivision: address.state || address.province || ''
            };
            locationCache.set(key, result);
            return result;
        } catch (error) {
            console.error('Error fetching location:', error);
            return { ...EMPTY_LOCATION };
        } finally {
            locationInFlight.delete(key);
        }
    })();

    locationInFlight.set(key, promise);
    return promise;
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
