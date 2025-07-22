/**
 * Heart Rate Sync Dashboard
 * Real-time BPM monitoring with sync detection and animations
 */

class BPMDashboard {
    constructor() {
        this.websocket = null;
        this.reconnectInterval = null;
        this.users = {
            1: {
                bpm: 0,
                lastUpdate: null,
                rawBpm: 0,
                signal: 0,
                name: 'User 1',
                consecutiveNoHeartRate: 0,
                lastValidBpm: 0,
                lastDataReceived: null
            },
            2: {
                bpm: 0,
                lastUpdate: null,
                rawBpm: 0,
                signal: 0,
                name: 'User 2',
                consecutiveNoHeartRate: 0,
                lastValidBpm: 0,
                lastDataReceived: null
            }
        };
        this.syncThreshold = 8; // BPM difference for sync detection
        this.syncTime = 0; // Percentage of time in sync
        this.syncHistory = [];
        this.maxSyncHistory = 100;
        this.lastUpdateTimes = { 1: 0, 2: 0 }; // Throttle updates
        this.updateFrequency = 2000; // Max once every 2 seconds
        this.noHeartRateThreshold = 2; // Show "--" after 2 consecutive no-heart-rate readings
        this.dataTimeoutMs = 5000; // Show "--" after 5 seconds of no data

        this.init();
    }

    async init() {
        console.log('Initializing BPM Dashboard...');

        // Initialize background color to red (no data yet)
        document.documentElement.style.setProperty('--sync-color', '255, 0, 0');

        // Load user names
        await this.loadUserNames();

        // Connect to WebSocket
        this.connectWebSocket();

        // Start periodic updates
        this.startPeriodicUpdates();

        // Setup event listeners
        this.setupEventListeners();

        console.log('Dashboard initialized');
    }

    async loadUserNames() {
        try {
            const response = await fetch('./user_names.json');
            if (response.ok) {
                const config = await response.json();
                this.users[1].name = config.user1 || 'User 1';
                this.users[2].name = config.user2 || 'User 2';
                this.updateUserNames();
                console.log('User names loaded:', this.users[1].name, this.users[2].name);
            }
        } catch (error) {
            console.log('Using default user names (user_names.json not found)');
        }
    }

    updateUserNames() {
        document.getElementById('user1Name').textContent = this.users[1].name;
        document.getElementById('user2Name').textContent = this.users[2].name;
    }

    connectWebSocket() {
        const wsUrl = 'ws://localhost:6789';
                    console.log(`Connecting to ${wsUrl}...`);

        try {
            this.websocket = new WebSocket(wsUrl);

            this.websocket.onopen = () => {
                console.log('WebSocket connected');
                this.updateConnectionStatus(true);
                this.clearReconnectInterval();
            };

            this.websocket.onmessage = (event) => {
                this.handleWebSocketMessage(event.data);
            };

            this.websocket.onclose = () => {
                console.log('WebSocket disconnected');
                this.updateConnectionStatus(false);
                this.scheduleReconnect();
            };

            this.websocket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus(false);
            };

        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            this.updateConnectionStatus(false);
            this.scheduleReconnect();
        }
    }

    handleWebSocketMessage(data) {
        try {
            const heartData = JSON.parse(data);

            // Skip status messages
            if (heartData.type === 'status') {
                console.log('📊 Status:', heartData);
                return;
            }

            // Process heart rate data
            if (heartData.user && heartData.bpm !== undefined) {
                this.updateUserData(heartData);
            }

        } catch (error) {
            console.error('🚨 Error parsing WebSocket data:', error);
        }
    }

    updateUserData(data) {
        const userId = data.user;
        if (!this.users[userId]) return;

        const user = this.users[userId];
        const now = Date.now();

        // Skip throttling for "--" messages to show them immediately
        if (data.bpm !== "--") {
            // Throttle updates - max once every 2 seconds per user for normal BPM data
            if (now - this.lastUpdateTimes[userId] < this.updateFrequency) {
                return;
            }
        }
        this.lastUpdateTimes[userId] = now;

        // Update last data received timestamp
        user.lastDataReceived = now;

        // Trust the broker completely - if it sends "--", show it immediately
        if (data.bpm === "--") {
            user.bpm = "--";
            user.consecutiveNoHeartRate = this.noHeartRateThreshold; // Set to max so timeout logic works
            user.rawBpm = data.bpm_raw || 0;
            console.log(`User ${userId}: Broker sent "--" - displaying immediately`);
        } else if (data.no_heart_rate === true || data.bpm <= 0) {
            // Broker detected no heart rate but didn't send "--" yet
            user.consecutiveNoHeartRate++;
            user.rawBpm = data.bpm_raw || 0;

            // If we've had enough consecutive no-heart-rate readings, show "--"
            if (user.consecutiveNoHeartRate >= this.noHeartRateThreshold) {
                user.bpm = "--";
            } else {
                // Keep showing last valid BPM
                user.bpm = user.lastValidBpm;
            }

            console.log(`User ${userId}: No heart rate detected (${user.consecutiveNoHeartRate}/${this.noHeartRateThreshold})`);
        } else {
            // Valid heart rate detected
            user.consecutiveNoHeartRate = 0;
            user.bpm = Math.round(data.bpm * 10) / 10; // Round to 1 decimal
            user.lastValidBpm = user.bpm;
            user.rawBpm = data.bpm_raw || data.bpm;
        }

        user.signal = data.signal_strength || 0;
        user.lastUpdate = new Date();

        // Update UI immediately (no throttling)
        this.updateUserUI(userId);

        // Update heart animation only if we have a valid BPM
        if (user.bpm !== "--" && user.bpm > 0) {
            this.updateHeartAnimation(userId);
        }

        // Check sync with proper handling of "--" values
        this.checkSync();

        const displayBpm = user.bpm === "--" ? "--" : `${user.bpm} BPM`;
        console.log(`User ${userId}: ${displayBpm}`);
    }

    updateUserUI(userId) {
        const user = this.users[userId];

        // Update BPM display
        const bpmElement = document.getElementById(`bpm${userId}`);
        if (user.bpm === "--") {
            bpmElement.textContent = "--";
        } else {
            bpmElement.textContent = user.bpm ? Math.round(user.bpm) : '--';
        }

        // Update user section state
        const userSection = document.getElementById(`user${userId}Section`);
        if (user.bpm !== "--" && user.bpm > 0) {
            userSection.classList.add('active');
        } else {
            userSection.classList.remove('active');
        }
    }

    updateHeartAnimation(userId) {
        const heart = document.getElementById(`heart${userId}`);
        const bpm = this.users[userId].bpm;

        if (!bpm || bpm <= 0 || bpm === "--") return;

        // Remove existing animation classes
        heart.classList.remove('slow', 'normal', 'fast');

        // Add appropriate class based on BPM
        if (bpm < 60) {
            heart.classList.add('slow');
        } else if (bpm > 100) {
            heart.classList.add('fast');
        } else {
            heart.classList.add('normal');
        }

        // Set custom animation duration based on exact BPM
        const duration = 60 / bpm; // seconds per beat
        heart.style.setProperty('--heartbeat-duration', `${duration}s`);

        // Update CSS animation duration
        const heartShape = heart.querySelector('.heart-shape');
        const pulseRings = heart.querySelectorAll('.pulse-ring');

        if (heartShape) {
            heartShape.style.animationDuration = `${duration}s`;
        }
        pulseRings.forEach(ring => {
            ring.style.animationDuration = `${duration * 2}s`;
        });
    }

    checkSync() {
        const user1Bpm = this.users[1].bpm;
        const user2Bpm = this.users[2].bpm;

        // Check if we have valid numeric BPM data for BOTH users
        const user1Valid = user1Bpm !== "--" && user1Bpm > 0;
        const user2Valid = user2Bpm !== "--" && user2Bpm > 0;

        if (!user1Valid || !user2Valid) {
            // No valid data for both users - set to max difference (red)
            this.setSyncState(false, 20);
            return;
        }

        const difference = Math.abs(user1Bpm - user2Bpm);
        const isInSync = difference <= this.syncThreshold;

        console.log(`💓 Sync Check: User1=${user1Bpm.toFixed(1)} BPM, User2=${user2Bpm.toFixed(1)} BPM, Difference=${difference.toFixed(1)} BPM`);

        // Update sync history
        this.syncHistory.push(isInSync);
        if (this.syncHistory.length > this.maxSyncHistory) {
            this.syncHistory.shift();
        }

        // Calculate sync percentage
        const syncCount = this.syncHistory.filter(Boolean).length;
        this.syncTime = (syncCount / this.syncHistory.length) * 100;

        // Update colors based on actual BPM difference
        this.setSyncState(isInSync, difference);
    }

    setSyncState(inSync, difference) {
        // Calculate gradient based on BPM difference (0-20 scale)
        const clampedDiff = Math.min(Math.max(difference, 0), 20);
        const gradientColors = this.calculateGradientColors(clampedDiff);

        // Set CSS custom properties for dynamic colors
        document.documentElement.style.setProperty('--sync-color', gradientColors);

        // Simplified logging - only show color when difference changes significantly
        console.log(`🎨 Color: ${clampedDiff.toFixed(1)} BPM diff → RGB(${gradientColors})`);
    }

    calculateGradientColors(difference) {
        // Handle invalid values
        if (isNaN(difference) || difference < 0) difference = 20; // Default to red

        // Clamp difference to 0-20 range
        difference = Math.min(difference, 20);

        let red, green, blue;

        if (difference <= 10) {
            // 0-10: Green (0,255,0) to Neutral (200,200,200)
            const ratio = difference / 10; // 0 to 1
            red = Math.round(200 * ratio);       // 0 → 200
            green = Math.round(255 - (55 * ratio)); // 255 → 200
            blue = Math.round(200 * ratio);      // 0 → 200
        } else {
            // 10-20: Neutral (200,200,200) to Red (255,0,0)
            const ratio = (difference - 10) / 10; // 0 to 1
            red = Math.round(200 + (55 * ratio));    // 200 → 255
            green = Math.round(200 * (1 - ratio));   // 200 → 0
            blue = Math.round(200 * (1 - ratio));    // 200 → 0
        }

        return `${red}, ${green}, ${blue}`;
    }

    updateConnectionStatus(connected) {
        const statusDot = document.querySelector('.status-dot');

        if (connected) {
            statusDot.classList.add('connected');
            statusDot.classList.remove('disconnected');
        } else {
            statusDot.classList.remove('connected');
            statusDot.classList.add('disconnected');
        }
    }

    scheduleReconnect() {
        if (this.reconnectInterval) return;

        console.log('🔄 Scheduling reconnect in 3 seconds...');
        this.reconnectInterval = setTimeout(() => {
            this.connectWebSocket();
            this.reconnectInterval = null;
        }, 3000);
    }

    clearReconnectInterval() {
        if (this.reconnectInterval) {
            clearTimeout(this.reconnectInterval);
            this.reconnectInterval = null;
        }
    }

    startPeriodicUpdates() {
        // Check for data timeouts every second
        setInterval(() => {
            this.checkDataTimeouts();
        }, 1000);

        // Reload user names every 5 seconds
        setInterval(() => {
            this.loadUserNames();
        }, 5000);

        // Update timestamps every second
        setInterval(() => {
            this.updateTimestamps();
        }, 1000);
    }

    updateTimestamps() {
        Object.keys(this.users).forEach(userId => {
            const user = this.users[userId];
            if (user.lastUpdate) {
                const timeAgo = this.getTimeAgo(user.lastUpdate);
                document.getElementById(`lastUpdate${userId}`).textContent = timeAgo;
            }
        });
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);

        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    }

    setupEventListeners() {
        // Handle window visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // Reconnect if needed when tab becomes visible
                if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
                    this.connectWebSocket();
                }
            }
        });

        // Handle window beforeunload
        window.addEventListener('beforeunload', () => {
            if (this.websocket) {
                this.websocket.close();
            }
        });

        // Debug: Log click on sync indicator
        document.getElementById('syncIndicator').addEventListener('click', () => {
            const user1Bpm = this.users[1].bpm === "--" ? 0 : this.users[1].bpm;
            const user2Bpm = this.users[2].bpm === "--" ? 0 : this.users[2].bpm;
            console.log('🔗 Sync Status:', {
                user1Bpm: user1Bpm,
                user2Bpm: user2Bpm,
                difference: Math.abs(user1Bpm - user2Bpm),
                syncTime: this.syncTime,
                threshold: this.syncThreshold
            });
        });
    }

    checkDataTimeouts() {
        const now = Date.now();
        let timeoutDetected = false;

        Object.keys(this.users).forEach(userId => {
            const user = this.users[userId];

            // Check if we haven't received data for more than 5 seconds
            if (user.lastDataReceived && (now - user.lastDataReceived) > this.dataTimeoutMs) {
                if (user.bpm !== "--") {
                    user.bpm = "--";
                    user.consecutiveNoHeartRate = this.noHeartRateThreshold; // Reset to max so it stays "--"
                    this.updateUserUI(userId);
                    timeoutDetected = true;
                    console.log(`User ${userId}: Data timeout - no data for ${Math.round((now - user.lastDataReceived) / 1000)}s`);
                }
            }
        });

        // If any user timed out, recheck sync status
        if (timeoutDetected) {
            this.checkSync();
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM loaded, starting dashboard...');
    window.dashboard = new BPMDashboard();
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('🚨 Global error:', event.error);
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
});
