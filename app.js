/**
 * World Clock Globe - Main Application
 */

// globe.gl loaded via script tag - use global Globe variable
import { getWeather, getLocationInfo } from './api.js';

// State
let globe = null;
let autoRotate = false;
let debounceTimer = null;
let autoRotateUpdateTimer = null;
let currentLocation = { lat: 37.5, lng: 127.0, timezone: 'Asia/Seoul' };
let timeUpdateInterval = null;

// DOM Elements
const globeContainer = document.getElementById('globe-container');
const infoCard = document.getElementById('info-card');
const autoRotateBtn = document.getElementById('auto-rotate-btn');

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

// Toggle auto-rotate
function toggleAutoRotate() {
    autoRotate = !autoRotate;
    globe.controls().autoRotate = autoRotate;
    
    if (autoRotate) {
        autoRotateBtn.textContent = 'Auto Rotate: ON';
        autoRotateBtn.classList.add('active');
        
        // Start auto-rotate updates every 5 seconds
        startAutoRotateUpdates();
    } else {
        autoRotateBtn.textContent = 'Auto Rotate: OFF';
        autoRotateBtn.classList.remove('active');
        
        // Stop auto-rotate updates
        stopAutoRotateUpdates();
    }
}

// Start auto-rotate location updates (every 5 seconds)
function startAutoRotateUpdates() {
    stopAutoRotateUpdates();
    
    // Update immediately
    updateLocationForAutoRotate();
    
    // Then every 5 seconds
    autoRotateUpdateTimer = setInterval(() => {
        updateLocationForAutoRotate();
    }, 5000);
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
    // Auto rotate button
    autoRotateBtn.addEventListener('click', toggleAutoRotate);
    
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
    
    // Initial location info (Seoul)
    updateLocationInfo(37.5, 127.0);
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
