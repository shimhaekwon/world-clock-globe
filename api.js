/**
 * World Clock Globe - API Module
 * Open-Meteo and BigDataCloud API functions
 */

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
 * Get location information from BigDataCloud API (Reverse Geocoding)
 * @param {number} latitude - Latitude of the location
 * @param {number} longitude - Longitude of the location
 * @returns {Promise<Object>} Location data
 */
export async function getLocationInfo(latitude, longitude) {
    // Get browser language (default to English)
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    const lang = browserLang.startsWith('ko') ? 'ko' : 'en';
    
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=${lang}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Geocoding API error');
        }
        const data = await response.json();
        
        // Build location name from available data
        let locationName = data.city || data.locality || data.principalSubdivision || data.countryName || 'Unknown';
        
        return {
            city: locationName,
            country: data.countryName || '',
            countryCode: data.countryCode || '',
            subdivision: data.principalSubdivision || ''
        };
    } catch (error) {
        console.error('Error fetching location:', error);
        return { city: 'Unknown', country: '', countryCode: '' };
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
