/**
 * World Clock Globe - Main Application
 */

// globe.gl loaded via script tag - use global Globe variable
import { getWeather, getLocationInfo } from './api.js';

// State
let globe = null;
let autoRotate = false;
let autoRotateSpeed = 0;  // 0-20, default 0 (0 = off)
let debounceTimer = null;
let autoRotateUpdateTimer = null;
let currentLocation = { lat: 0, lng: 0, timezone: 'UTC' };  // initialized in initGlobe()
let timeUpdateInterval = null;
let countriesGeoJSON = null;  // For country boundaries
let admin1GeoJSON = null;     // States / provinces / metropolitan areas
let citiesGeoJSON = null;     // Major populated places
let countryLabels = [];
let admin1Labels = [];
let cityLabels = [];
let currentZoomLevel = 'country';  // country, region, city
let isDragging = false;  // For drag end detection (Feature 3)

// Open the globe near the user's region by mapping their browser timezone to a representative city.
// If we don't know the timezone, fall back to longitude derived from UTC offset.
const TIMEZONE_TO_COORDS = {
    // Asia
    'Asia/Seoul': { lat: 37.5665, lng: 126.9780 },
    'Asia/Tokyo': { lat: 35.6762, lng: 139.6503 },
    'Asia/Shanghai': { lat: 31.2304, lng: 121.4737 },
    'Asia/Hong_Kong': { lat: 22.3193, lng: 114.1694 },
    'Asia/Taipei': { lat: 25.0330, lng: 121.5654 },
    'Asia/Singapore': { lat: 1.3521, lng: 103.8198 },
    'Asia/Bangkok': { lat: 13.7563, lng: 100.5018 },
    'Asia/Manila': { lat: 14.5995, lng: 120.9842 },
    'Asia/Jakarta': { lat: -6.2088, lng: 106.8456 },
    'Asia/Kolkata': { lat: 28.6139, lng: 77.2090 },
    'Asia/Calcutta': { lat: 28.6139, lng: 77.2090 },
    'Asia/Dubai': { lat: 25.2048, lng: 55.2708 },
    'Asia/Riyadh': { lat: 24.7136, lng: 46.6753 },
    'Asia/Tehran': { lat: 35.6892, lng: 51.3890 },
    'Asia/Karachi': { lat: 24.8607, lng: 67.0011 },
    'Asia/Dhaka': { lat: 23.8103, lng: 90.4125 },
    'Asia/Ho_Chi_Minh': { lat: 10.8231, lng: 106.6297 },
    'Asia/Kuala_Lumpur': { lat: 3.1390, lng: 101.6869 },
    'Asia/Vladivostok': { lat: 43.1198, lng: 131.8869 },
    'Asia/Yekaterinburg': { lat: 56.8389, lng: 60.6057 },
    // Europe
    'Europe/London': { lat: 51.5074, lng: -0.1278 },
    'Europe/Paris': { lat: 48.8566, lng: 2.3522 },
    'Europe/Berlin': { lat: 52.5200, lng: 13.4050 },
    'Europe/Madrid': { lat: 40.4168, lng: -3.7038 },
    'Europe/Rome': { lat: 41.9028, lng: 12.4964 },
    'Europe/Amsterdam': { lat: 52.3676, lng: 4.9041 },
    'Europe/Brussels': { lat: 50.8503, lng: 4.3517 },
    'Europe/Vienna': { lat: 48.2082, lng: 16.3738 },
    'Europe/Zurich': { lat: 47.3769, lng: 8.5417 },
    'Europe/Stockholm': { lat: 59.3293, lng: 18.0686 },
    'Europe/Oslo': { lat: 59.9139, lng: 10.7522 },
    'Europe/Copenhagen': { lat: 55.6761, lng: 12.5683 },
    'Europe/Helsinki': { lat: 60.1699, lng: 24.9384 },
    'Europe/Warsaw': { lat: 52.2297, lng: 21.0122 },
    'Europe/Prague': { lat: 50.0755, lng: 14.4378 },
    'Europe/Athens': { lat: 37.9838, lng: 23.7275 },
    'Europe/Lisbon': { lat: 38.7223, lng: -9.1393 },
    'Europe/Dublin': { lat: 53.3498, lng: -6.2603 },
    'Europe/Moscow': { lat: 55.7558, lng: 37.6173 },
    'Europe/Istanbul': { lat: 41.0082, lng: 28.9784 },
    // Americas
    'America/New_York': { lat: 40.7128, lng: -74.0060 },
    'America/Chicago': { lat: 41.8781, lng: -87.6298 },
    'America/Denver': { lat: 39.7392, lng: -104.9903 },
    'America/Los_Angeles': { lat: 34.0522, lng: -118.2437 },
    'America/Phoenix': { lat: 33.4484, lng: -112.0740 },
    'America/Anchorage': { lat: 61.2181, lng: -149.9003 },
    'America/Honolulu': { lat: 21.3069, lng: -157.8583 },
    'America/Toronto': { lat: 43.6532, lng: -79.3832 },
    'America/Vancouver': { lat: 49.2827, lng: -123.1207 },
    'America/Mexico_City': { lat: 19.4326, lng: -99.1332 },
    'America/Sao_Paulo': { lat: -23.5505, lng: -46.6333 },
    'America/Argentina/Buenos_Aires': { lat: -34.6037, lng: -58.3816 },
    'America/Buenos_Aires': { lat: -34.6037, lng: -58.3816 },
    'America/Lima': { lat: -12.0464, lng: -77.0428 },
    'America/Bogota': { lat: 4.7110, lng: -74.0721 },
    'America/Santiago': { lat: -33.4489, lng: -70.6693 },
    // Africa
    'Africa/Cairo': { lat: 30.0444, lng: 31.2357 },
    'Africa/Lagos': { lat: 6.5244, lng: 3.3792 },
    'Africa/Johannesburg': { lat: -26.2041, lng: 28.0473 },
    'Africa/Nairobi': { lat: -1.2921, lng: 36.8219 },
    'Africa/Casablanca': { lat: 33.5731, lng: -7.5898 },
    // Pacific / Oceania
    'Australia/Sydney': { lat: -33.8688, lng: 151.2093 },
    'Australia/Melbourne': { lat: -37.8136, lng: 144.9631 },
    'Australia/Brisbane': { lat: -27.4698, lng: 153.0251 },
    'Australia/Perth': { lat: -31.9505, lng: 115.8605 },
    'Pacific/Auckland': { lat: -36.8485, lng: 174.7633 },
    'Pacific/Fiji': { lat: -18.1248, lng: 178.4501 },
    // UTC fallback
    'UTC': { lat: 0, lng: 0 },
    'Etc/UTC': { lat: 0, lng: 0 },
};

function detectInitialLocation() {
    let tz = 'UTC';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (_) {}
    const mapped = TIMEZONE_TO_COORDS[tz];
    if (mapped) return { lat: mapped.lat, lng: mapped.lng, timezone: tz };
    // Fallback: derive longitude from UTC offset (15° per hour), pick a temperate-ish latitude
    const offsetMinutes = -new Date().getTimezoneOffset();
    const lng = Math.max(-180, Math.min(180, (offsetMinutes / 60) * 15));
    return { lat: 30, lng, timezone: tz };
}

// DOM Elements
const globeContainer = document.getElementById('globe-container');
const infoCard = document.getElementById('info-card');
const speedSlider = document.getElementById('rotate-speed');
const speedValue = document.getElementById('speed-value');

// Initialize Globe
function initGlobe() {
    currentLocation = detectInitialLocation();
    globe = new Globe(globeContainer, { rendererConfig: { antialias: true } })
        // Self-hosted 8K daymap (Solar System Scope, 8192×4096) — sharper at close zoom
        .globeImageUrl('img/earth-8k-daymap.jpg')
        .bumpImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
        .width(globeContainer.clientWidth)
        .height(globeContainer.clientHeight)
        .enablePointerInteraction(true)
        
        // Graticules (lat/lng grid lines)
        .showGraticules(true);

    // Match renderer to the device's actual pixel density so polygon strokes don't alias on HiDPI/mobile
    const renderer = globe.renderer();
    if (renderer?.setPixelRatio) {
        renderer.setPixelRatio(window.devicePixelRatio || 1);
    }

    // Set autoRotate via controls
    globe.controls().autoRotate = autoRotate;
    globe.controls().autoRotateSpeed = 0.1;  // 1/5 of original (0.5 → 0.1)

    // Limit zoom: minDistance just above globe radius (100) for closest comfortable view,
    // maxDistance to avoid the globe shrinking to a dot
    globe.controls().minDistance = 105;
    globe.controls().maxDistance = 600;

    // Open near the user's region (timezone-derived)
    globe.pointOfView({ lat: currentLocation.lat, lng: currentLocation.lng }, 1000);

    // [diag] expose for browser console inspection
    window.globe = globe;

    // Handle resize
    window.addEventListener('resize', () => {
        globe
            .width(globeContainer.clientWidth)
            .height(globeContainer.clientHeight);
    });
}

// ========== NEW FEATURES A & B ==========

// Globe-surface labels must stay in latin script — globe.gl's bundled font lacks CJK glyphs
// (renders as "???" otherwise). UI card shows native localized names instead.
// caseHint: 'lower' for admin-1 (name_en), 'upper' for populated_places (NAME_EN).
function pickLocalizedName(props, caseHint) {
    if (caseHint === 'upper') {
        return props.NAME_EN || props.NAME || props.name || 'Unknown';
    }
    return props.name_en || props.name || props.NAME || 'Unknown';
}

function isValidGeometry(g) {
    if (!g?.coordinates) return false;
    const validPair = c => Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1])
        && Math.abs(c[0]) <= 180 && Math.abs(c[1]) <= 90;
    const checkRing = ring => Array.isArray(ring) && ring.length > 0 && ring.every(validPair);
    if (g.type === 'Polygon') return g.coordinates.every(checkRing);
    if (g.type === 'MultiPolygon') return g.coordinates.every(poly => Array.isArray(poly) && poly.every(checkRing));
    if (g.type === 'Point') return validPair(g.coordinates);
    return false;
}

function geometryCentroid(geometry) {
    const coords = geometry?.coordinates;
    if (!coords) return null;
    if (geometry.type === 'Point') {
        const [lng, lat] = coords;
        return Number.isFinite(lng) && Number.isFinite(lat) ? { lng, lat } : null;
    }
    let ring;
    if (geometry.type === 'Polygon') ring = coords[0];
    else if (geometry.type === 'MultiPolygon') ring = coords[0]?.[0];
    if (!ring || !ring.length) return null;
    const lng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
    const lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    return { lng, lat };
}

// Feature A: Initialize Country Boundaries and Labels
// (New function - does not modify existing initGlobe)
async function initCountryLayer() {
    const COUNTRIES_URL = 'https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson';
    const ADMIN1_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson';
    const CITIES_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_populated_places.geojson';

    try {
        const [countriesRes, admin1Res, citiesRes] = await Promise.all([
            fetch(COUNTRIES_URL),
            fetch(ADMIN1_URL),
            fetch(CITIES_URL),
        ]);
        if (!countriesRes.ok) {
            throw new Error(`countries HTTP ${countriesRes.status}`);
        }
        countriesGeoJSON = await countriesRes.json();
        if (admin1Res.ok) admin1GeoJSON = await admin1Res.json();
        else console.warn('admin-1 layer unavailable:', admin1Res.status);
        if (citiesRes.ok) citiesGeoJSON = await citiesRes.json();
        else console.warn('cities layer unavailable:', citiesRes.status);

        // Polygon layer (country boundaries)
        globe
            .polygonsData(countriesGeoJSON.features)
            .polygonCapColor(() => 'rgba(255, 255, 255, 0.05)')
            .polygonSideColor(() => 'rgba(255, 255, 255, 0.08)')
            .polygonStrokeColor(() => 'rgba(100, 200, 255, 0.4)')
            .polygonAltitude(0.002)
            .polygonLabel(null);

        // Pre-compute label datasets once. Skip features with degenerate geometry
        // (some Natural Earth features have empty rings → centroid would be NaN).
        const buildLabel = (f, props) => {
            const c = geometryCentroid(f.geometry);
            if (!c) return null;
            return { lat: c.lat, lng: c.lng, ...props };
        };

        countryLabels = countriesGeoJSON.features
            .map(f => buildLabel(f, {
                name: f.properties.name || f.properties.NAME || 'Unknown',
                size: 1.0,
                color: 'rgba(255, 255, 255, 0.9)',
            }))
            .filter(Boolean);

        // Aggressive scalerank filter — Europe especially gets crowded at city level.
        admin1Labels = (admin1GeoJSON?.features || [])
            .filter(f => (f.properties?.scalerank ?? 99) <= 2)
            .map(f => buildLabel(f, {
                name: pickLocalizedName(f.properties, 'lower'),
                size: 0.35,
                color: 'rgba(180, 220, 255, 0.85)',
            }))
            .filter(Boolean);

        cityLabels = (citiesGeoJSON?.features || [])
            .filter(f => (f.properties?.SCALERANK ?? 99) <= 3)
            .map(f => buildLabel(f, {
                name: pickLocalizedName(f.properties, 'upper'),
                size: 0.28,
                color: 'rgba(255, 230, 150, 0.9)',
            }))
            .filter(Boolean);

        applyLabelsForLevel(currentZoomLevel);

        console.log('Country layer initialized', {
            countries: countryLabels.length,
            admin1: admin1Labels.length,
            cities: cityLabels.length,
        });

        // Setup zoom-based label switching (Feature B)
        setupZoomBasedLabels();

    } catch (error) {
        console.error('Error loading map data:', error);
    }
}

function applyLabelsForLevel(level) {
    // Country labels shrink as the camera zooms in so they stay context, not clutter
    const COUNTRY_SCALE = { country: 1.0, region: 0.5, city: 0.3 };
    const scaledCountry = countryLabels.map(l => ({ ...l, size: l.size * COUNTRY_SCALE[level] }));
    let data;
    if (level === 'country') {
        data = scaledCountry;
    } else if (level === 'region') {
        data = scaledCountry.concat(admin1Labels);
    } else {
        // city level: drop admin-1 to reduce overlap, keep country (small) + cities only
        data = scaledCountry.concat(cityLabels);
    }
    const before = data.length;
    data = data.filter(d =>
        Number.isFinite(d.lat) && Number.isFinite(d.lng) &&
        Math.abs(d.lat) <= 90 && Math.abs(d.lng) <= 180 &&
        typeof d.name === 'string' && d.name.length > 0
    );
    console.log(`Labels[${level}]: ${data.length} (filtered ${before - data.length})`);
    globe
        .labelsData(data)
        .labelLat(d => d.lat)
        .labelLng(d => d.lng)
        .labelText(d => d.name)
        .labelSize(d => d.size)
        .labelColor(d => d.color)
        .labelAltitude(0.05)
        .labelDotRadius(0)
        .labelResolution(1);
}

// Feature B: Zoom-based Label Switching
// (New function - does not modify existing event handlers)
function setupZoomBasedLabels() {
    // Create a debounced zoom handler
    let zoomDebounceTimer = null;
    
    const handleZoomChange = () => {
        clearTimeout(zoomDebounceTimer);
        zoomDebounceTimer = setTimeout(() => {
            updateLabelsByZoom();
        }, 300);
    };
    
    // Attach zoom listener
    globe.onZoom(handleZoomChange);
    
    // Initial label setup
    updateLabelsByZoom();
}

// Update labels based on zoom level (altitude).
// globe.gl altitude: larger = camera farther (zoomed out), smaller = closer (zoomed in)
function updateLabelsByZoom() {
    const pov = globe.pointOfView();
    if (!pov) return;

    const altitude = pov.altitude || 1;

    let newZoomLevel;
    if (altitude > 1.5) {
        newZoomLevel = 'country';
    } else if (altitude > 0.5) {
        newZoomLevel = 'region';
    } else {
        newZoomLevel = 'city';
    }

    if (newZoomLevel !== currentZoomLevel) {
        currentZoomLevel = newZoomLevel;
        console.log('Zoom level changed to:', newZoomLevel);
        applyLabelsForLevel(newZoomLevel);
    }
}

// ========== END NEW FEATURES ==========

// Handle rotation/drag - Real-time coordinates + Debounced API
function handleGlobeChange() {
    const center = globe.pointOfView();
    if (center) {
        // Update coordinates immediately (real-time)
        document.getElementById('latitude').textContent = center.lat.toFixed(4);
        document.getElementById('longitude').textContent = center.lng.toFixed(4);
        
        // Debounced API call for city/weather (when drag stops)
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentLocation.lat = center.lat;
            currentLocation.lng = center.lng;
            updateLocationInfo(center.lat, center.lng);
        }, 800);
    }
}

// Attach event listeners for rotation detection
function attachGlobeEvents() {
    // Use the globe's controls to detect when rotation stops
    const controls = globe.controls();
    if (controls) {
        controls.addEventListener('change', handleGlobeChange);
    }
    
    // Also use onZoom if available
    globe.onZoom(handleGlobeChange);
}

// Update location information
async function updateLocationInfo(lat, lng) {
    // Update coordinates
    document.getElementById('latitude').textContent = lat.toFixed(4);
    document.getElementById('longitude').textContent = lng.toFixed(4);

    // Keep time updating during rotation
    startTimeUpdates();

    try {
        // Fetch location and weather in parallel
        const [locationData, weatherData] = await Promise.all([
            getLocationInfo(lat, lng),
            getWeather(lat, lng)
        ]);

        // locationData === null → throttled, keep prior city label intact
        const cityName = locationData
            ? (locationData.cityEn
                ? `${locationData.city} / ${locationData.cityEn}`
                : (locationData.city || 'Unknown Location'))
            : null;

        updateCardData({
            ...(cityName != null ? { city: cityName } : {}),
            temperature: weatherData ? `${weatherData.temperature}°C` : '--',
            weather: weatherData ? weatherData.weatherDescription : '--',
            latitude: lat.toFixed(4),
            longitude: lng.toFixed(4)
        });

    } catch (error) {
        console.error('Error updating location:', error);
    }
}

// Update card UI
function updateCardData(data) {
    if (data.city) {
        document.getElementById('location-name').textContent = data.city;
    }
    if (data.temperature) {
        document.getElementById('temperature').textContent = data.temperature;
    }
    if (data.weather) {
        document.getElementById('weather').textContent = data.weather;
    }
    if (data.latitude) {
        document.getElementById('latitude').textContent = data.latitude;
    }
    if (data.longitude) {
        document.getElementById('longitude').textContent = data.longitude;
    }
    if (data.date) {
        document.getElementById('current-date').textContent = data.date;
    }
    if (data.time) {
        document.getElementById('current-time').textContent = data.time;
    }
}

// Show info card
function showInfoCard() {
    infoCard.classList.remove('hidden');
}

// Hide info card
function hideInfoCard() {
    infoCard.classList.add('hidden');
    stopTimeUpdates();
}

// Start time updates
function startTimeUpdates() {
    stopTimeUpdates(); // Clear existing
    
    const updateTime = () => {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '.');
        const timeStr = now.toTimeString().split(' ')[0];
        
        document.getElementById('current-date').textContent = dateStr;
        document.getElementById('current-time').textContent = timeStr;
    };
    
    updateTime(); // Initial update
    timeUpdateInterval = setInterval(updateTime, 1000);
}

// Stop time updates
function stopTimeUpdates() {
    if (timeUpdateInterval) {
        clearInterval(timeUpdateInterval);
        timeUpdateInterval = null;
    }
}

// Toggle auto-rotate (using 1 second interval - new feature)
function toggleAutoRotate() {
    autoRotate = !autoRotate;
    globe.controls().autoRotate = autoRotate;
    
    if (autoRotate) {
        autoRotateBtn.textContent = 'Auto Rotate: ON';
        autoRotateBtn.classList.add('active');
        
        // Start auto-rotate updates every 1 second
        startAutoRotateUpdatesV2(1000);
    } else {
        autoRotateBtn.textContent = 'Auto Rotate: OFF';
        autoRotateBtn.classList.remove('active');
        
        // Stop auto-rotate updates
        stopAutoRotateUpdates();
    }
}

// ========== FEATURE 2: Speed Control ==========

// Set auto-rotate speed (1-10)
// (New function - does not modify existing toggleAutoRotate)
function setAutoRotateSpeed(speed) {
    // Clamp speed between 1 and 10
    autoRotateSpeed = Math.max(1, Math.min(10, parseInt(speed)));
    
    // Convert 1-10 to globe.gl speed (0.05 - 0.5)
    const globeSpeed = autoRotateSpeed * 0.05;
    globe.controls().autoRotateSpeed = globeSpeed;
    
    // Update display
    const speedValueEl = document.getElementById('speed-value');
    if (speedValueEl) {
        speedValueEl.textContent = autoRotateSpeed;
    }
    
    console.log('Auto-rotate speed set to:', autoRotateSpeed, '(globe speed:', globeSpeed + ')');
}

// Setup speed control slider
// (New function - does not modify existing setupEventListeners)
function setupSpeedControl() {
    const speedSlider = document.getElementById('rotate-speed');
    if (speedSlider) {
        // Set initial value
        setAutoRotateSpeed(autoRotateSpeed);
        
        // Add listener
        speedSlider.addEventListener('input', (e) => {
            setAutoRotateSpeed(e.target.value);
        });
        
        console.log('Speed control initialized');
    }
}

// ========== FEATURE 3: Drag End Detection ==========

// Setup drag end detection (trigger on mouse/touch release)
// (New function - improved version)
function setupDragEndDetection() {
    const container = document.getElementById('globe-container');
    if (!container) return;
    
    let isDragging = false;
    let dragCheckTimer = null;
    
    // Mouse down - start tracking
    container.addEventListener('mousedown', () => {
        isDragging = true;
    });
    
    // Mouse up - immediately update location
    container.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            
            // Get current center and update immediately
            const center = globe.pointOfView();
            if (center) {
                // Clear any pending debounce
                clearTimeout(debounceTimer);
                // Update immediately (no debounce)
                currentLocation.lat = center.lat;
                currentLocation.lng = center.lng;
                updateLocationInfo(center.lat, center.lng);
                console.log('Drag ended - immediate update');
            }
        }
    });
    
    // Touch start
    container.addEventListener('touchstart', () => {
        isDragging = true;
    });
    
    // Touch end
    container.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            
            // Get current center and update immediately
            const center = globe.pointOfView();
            if (center) {
                clearTimeout(debounceTimer);
                currentLocation.lat = center.lat;
                currentLocation.lng = center.lng;
                updateLocationInfo(center.lat, center.lng);
                console.log('Touch ended - immediate update');
            }
        }
    });
    
    console.log('Drag end detection initialized (mouse/touch)');
}

// Start auto-rotate location updates (configurable interval)
// intervalMs: 업데이트 주기 (기본 1000ms = 1초)
function startAutoRotateUpdatesV2(intervalMs = 1000) {
    stopAutoRotateUpdates();
    
    // Update immediately
    updateLocationForAutoRotate();
    
    // Then at specified interval
    autoRotateUpdateTimer = setInterval(() => {
        updateLocationForAutoRotate();
    }, intervalMs);
}

// Original function preserved for backward compatibility
// Start auto-rotate location updates (every 2 seconds)
function startAutoRotateUpdates() {
    startAutoRotateUpdatesV2(2000);  // 2초
}

// Stop auto-rotate location updates
function stopAutoRotateUpdates() {
    if (autoRotateUpdateTimer) {
        clearInterval(autoRotateUpdateTimer);
        autoRotateUpdateTimer = null;
    }
}

// Update location during auto-rotate
function updateLocationForAutoRotate() {
    const center = globe.pointOfView();
    if (center) {
        currentLocation.lat = center.lat;
        currentLocation.lng = center.lng;
        updateLocationInfo(center.lat, center.lng);
    }
}

// Event Listeners
function setupEventListeners() {
    // Speed slider (Rotation: 0 = off, 1-10 = speed)
    const slider = document.getElementById('rotate-speed');
    const speedDisplay = document.getElementById('speed-value');
    
    if (slider) {
        slider.addEventListener('input', function() {
            const speed = parseInt(this.value);
            speedDisplay.textContent = speed;
            const card = document.getElementById('info-card');
            const toggleBtn = document.getElementById('toggle-card');

            if (speed === 0) {
                // Stop rotating: expand card and refresh once for the current center
                autoRotate = false;
                globe.controls().autoRotate = false;
                stopAutoRotateUpdates();
                card.classList.remove('collapsed');
                if (toggleBtn) toggleBtn.textContent = '▼';
                const center = globe.pointOfView();
                if (center) {
                    updateLocationInfo(center.lat, center.lng);
                }
            } else {
                // Rotate: skip API polling (avoids hammering Nominatim) and collapse card to "Rotating"
                autoRotate = true;
                globe.controls().autoRotate = true;
                globe.controls().autoRotateSpeed = speed * 0.5;
                stopAutoRotateUpdates();
                card.classList.add('collapsed');
                if (toggleBtn) toggleBtn.textContent = '▶';
                document.getElementById('location-name').textContent = 'Rotating';
            }
        });
    }
    
    // Toggle card button (expand/collapse)
    const toggleCardBtn = document.getElementById('toggle-card');
    if (toggleCardBtn) {
        toggleCardBtn.addEventListener('click', toggleCard);
    }
    
    // Initialize speed display to match slider value
    if (speedSlider && speedValue) {
        speedValue.textContent = speedSlider.value;
    }
}

// Toggle card expand/collapse
function toggleCard() {
    const infoCard = document.getElementById('info-card');
    const toggleBtn = document.getElementById('toggle-card');
    
    infoCard.classList.toggle('collapsed');
    
    if (infoCard.classList.contains('collapsed')) {
        toggleBtn.textContent = '▶';
    } else {
        toggleBtn.textContent = '▼';
    }
}

// Initialize application
function init() {
    initGlobe();
    attachGlobeEvents();
    setupEventListeners();
    
    // Load country boundaries and labels (Feature A & B)
    initCountryLayer();
    
    // Feature 2: Speed control slider
    setupSpeedControl();
    
    // Feature 3: Drag end detection
    setupDragEndDetection();
    
    // Initial location info (Seoul)
    updateLocationInfo(37.5, 127.0);
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
