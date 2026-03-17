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
let currentLocation = { lat: 37.5, lng: 127.0, timezone: 'Asia/Seoul' };
let timeUpdateInterval = null;
let countriesGeoJSON = null;  // For country boundaries
let currentZoomLevel = 'country';  // country, region, city
let isDragging = false;  // For drag end detection (Feature 3)

// DOM Elements
const globeContainer = document.getElementById('globe-container');
const infoCard = document.getElementById('info-card');
const speedSlider = document.getElementById('rotate-speed');
const speedValue = document.getElementById('speed-value');

// Initialize Globe
function initGlobe() {
    globe = new Globe(globeContainer)
        .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-blue-marble.jpg')
        .bumpImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-topology.png')
        .backgroundImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/night-sky.png')
        .width(globeContainer.clientWidth)
        .height(globeContainer.clientHeight)
        .enablePointerInteraction(true)
        
        // Graticules (lat/lng grid lines)
        .showGraticules(true);

    // Set autoRotate via controls
    globe.controls().autoRotate = autoRotate;
    globe.controls().autoRotateSpeed = 0.1;  // 1/5 of original (0.5 → 0.1)

    // Set initial view (Korea)
    globe.pointOfView({ lat: 37.5, lng: 127.0 }, 1000);

    // Handle resize
    window.addEventListener('resize', () => {
        globe
            .width(globeContainer.clientWidth)
            .height(globeContainer.clientHeight);
    });
}

// ========== NEW FEATURES A & B ==========

// Feature A: Initialize Country Boundaries and Labels
// (New function - does not modify existing initGlobe)
async function initCountryLayer() {
    try {
        // Load countries GeoJSON (using datasets/geo-boundaries-world-110m)
        const response = await fetch('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson');
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        countriesGeoJSON = await response.json();
        
        // Add polygon layer (country boundaries)
        globe
            .polygonsData(countriesGeoJSON.features)
            .polygonCapColor(() => 'rgba(255, 255, 255, 0.05)')
            .polygonSideColor(() => 'rgba(255, 255, 255, 0.08)')
            .polygonStrokeColor(() => 'rgba(100, 200, 255, 0.4)')
            .polygonAltitude(0.002)
            .polygonLabel(null);  // Disable hover tooltip
        
        // Add labels for country names (always visible on globe)
        // Calculate centroid for each country
        const labelData = countriesGeoJSON.features.map(f => {
            const coords = f.geometry.coordinates;
            let lng, lat;
            
            if (f.geometry.type === 'Polygon') {
                // Use first ring's centroid
                const ring = coords[0];
                lng = ring.reduce((sum, c) => sum + c[0], 0) / ring.length;
                lat = ring.reduce((sum, c) => sum + c[1], 0) / ring.length;
            } else if (f.geometry.type === 'MultiPolygon') {
                // Use first polygon's centroid
                const ring = coords[0][0];
                lng = ring.reduce((sum, c) => sum + c[0], 0) / ring.length;
                lat = ring.reduce((sum, c) => sum + c[1], 0) / ring.length;
            }
            
            return {
                ...f,
                lat,
                lng,
                name: f.properties.name || f.properties.NAME || 'Unknown'
            };
        });
        
        globe
            .labelsData(labelData)
            .labelLat(d => d.lat)
            .labelLng(d => d.lng)
            .labelText(d => d.name)
            .labelSize(2)
            .labelAltitude(0.05)
            .labelDotRadius(0)
            .labelColor(() => 'rgba(255, 255, 255, 0.8)')
            .labelResolution(0);
        
        console.log('Country layer initialized');
        
        // Setup zoom-based label switching (Feature B)
        setupZoomBasedLabels();
        
    } catch (error) {
        console.error('Error loading country data:', error);
    }
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

// Update labels based on zoom level (altitude)
function updateLabelsByZoom() {
    const pov = globe.pointOfView();
    if (!pov) return;
    
    const altitude = pov.altitude || 1;
    
    // Determine zoom level based on altitude
    // Lower altitude = more zoomed in
    let newZoomLevel;
    if (altitude > 1.5) {
        newZoomLevel = 'city';      // Very zoomed in
    } else if (altitude > 0.8) {
        newZoomLevel = 'region';    // Zoomed in
    } else {
        newZoomLevel = 'country';   // Zoomed out
    }
    
    // Only update if zoom level changed
    if (newZoomLevel !== currentZoomLevel) {
        currentZoomLevel = newZoomLevel;
        console.log('Zoom level changed to:', newZoomLevel);
        
        // Adjust label properties based on zoom level
        if (newZoomLevel === 'country') {
            // Show country names only
            globe.labelSize(0.8);
            globe.labelResolution(1);
        } else if (newZoomLevel === 'region') {
            // Show larger labels
            globe.labelSize(1.0);
            globe.labelResolution(2);
        } else {
            // city - show detailed labels
            globe.labelSize(1.2);
            globe.labelResolution(3);
        }
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

        // Update card with data
        const cityName = locationData.city || 'Unknown Location';
        
        updateCardData({
            city: cityName,
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
// Start auto-rotate location updates (every 5 seconds)
function startAutoRotateUpdates() {
    startAutoRotateUpdatesV2(5000);  // 5초 (기존 호환)
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
    // Speed slider (Rotation: 0 = off, 1-20 = speed)
    const slider = document.getElementById('rotate-speed');
    const speedDisplay = document.getElementById('speed-value');
    
    if (slider) {
        slider.addEventListener('input', function() {
            const speed = parseInt(this.value);
            speedDisplay.textContent = speed;
            
            if (speed === 0) {
                // Turn off auto-rotate
                autoRotate = false;
                globe.controls().autoRotate = false;
                stopAutoRotateUpdates();
            } else {
                // Turn on auto-rotate with selected speed
                autoRotate = true;
                globe.controls().autoRotate = true;
                globe.controls().autoRotateSpeed = speed * 0.1;
                
                // Start auto-rotate updates
                startAutoRotateUpdates();
            }
        });
    }
    
    // Toggle card button (expand/collapse)
    const toggleCardBtn = document.getElementById('toggle-card');
    if (toggleCardBtn) {
        toggleCardBtn.addEventListener('click', toggleCard);
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
