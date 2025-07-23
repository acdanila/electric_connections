/**
 * Heart Rate Sync Dashboard
 * Real-time BPM monitoring with sync detection and animations
 */

/**
 * Audio Engine for Heart Rate Sync
 * Creates harmonious sounds when in sync, chaotic when not
 */
class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isEnabled = false;
        this.isPlaying = false;

        // Oscillators for each user
        this.user1Oscillator = null;
        this.user2Oscillator = null;
        this.user1Gain = null;
        this.user2Gain = null;

        // Rhythm system
        this.rhythmInterval = null;
        this.lastBeatTime = 0;

        // Audio parameters
        this.baseFrequency = 220; // A3 note
        this.maxVolume = 0.15; // Lower volume for MacBook speakers
        this.currentDifference = 20; // Start with max difference (no sync)

        this.init();
    }

    async init() {
        try {
            // Create audio context (requires user interaction first)
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Create master gain node
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = 0; // Start muted

            console.log('🎵 Audio engine initialized');
        } catch (error) {
            console.error('❌ Failed to initialize audio:', error);
        }
    }

        async enable() {
        if (!this.audioContext) {
            console.error('❌ Audio context not initialized');
            return false;
        }

        try {
            // Resume audio context if needed (required after user interaction)
            if (this.audioContext.state === 'suspended') {
                console.log('🎵 Resuming suspended audio context...');
                await this.audioContext.resume();
            }

            // Verify audio context is running
            if (this.audioContext.state !== 'running') {
                console.error('❌ Audio context failed to resume:', this.audioContext.state);
                return false;
            }

            this.isEnabled = true;
            console.log('🎵 Audio enabled successfully, context state:', this.audioContext.state);
            return true;
        } catch (error) {
            console.error('❌ Failed to enable audio:', error);
            return false;
        }
    }

    disable() {
        this.isEnabled = false;
        this.stopAudio();
        console.log('🔇 Audio disabled');
    }

    // Test function to verify audio is working
    async testTone() {
        if (!this.isEnabled || !this.audioContext) return false;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.value = 440; // A4 note

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.5);

            console.log('🎵 Test tone played');
            return true;
        } catch (error) {
            console.error('❌ Test tone failed:', error);
            return false;
        }
    }

    startAudio(user1Bpm, user2Bpm, difference) {
        if (!this.isEnabled || !this.audioContext) return;

        this.stopAudio(); // Clean up any existing audio

        // Check if we have valid BPM data
        const user1Valid = user1Bpm !== "--" && user1Bpm > 0;
        const user2Valid = user2Bpm !== "--" && user2Bpm > 0;

        if (!user1Valid && !user2Valid) {
            // No valid data - silence
            return;
        }

        this.currentDifference = difference;
        this.isPlaying = true;

        // Create oscillators for each user (if they have valid data)
        if (user1Valid) {
            this.createUserOscillator(1, user1Bpm);
        }

        if (user2Valid) {
            this.createUserOscillator(2, user2Bpm);
        }

        // Start rhythm based on average BPM
        const avgBpm = user1Valid && user2Valid ? (user1Bpm + user2Bpm) / 2 :
                       user1Valid ? user1Bpm : user2Bpm;
        this.startRhythm(avgBpm);

        // Fade in master volume quickly
        this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        this.masterGain.gain.linearRampToValueAtTime(this.maxVolume, this.audioContext.currentTime + 0.1);

        console.log(`🎵 Audio started: User1=${user1Valid ? user1Bpm.toFixed(1) : '--'}, User2=${user2Valid ? user2Bpm.toFixed(1) : '--'}, Diff=${difference.toFixed(1)}`);
        console.log(`🎵 Created oscillators: User1=${!!this.user1Oscillator}, User2=${!!this.user2Oscillator}, Rhythm=${!!this.rhythmInterval}`);
    }

        createUserOscillator(userId, bpm) {
        if (!this.audioContext || this.audioContext.state !== 'running') {
            console.warn('❌ Audio context not ready for oscillator creation');
            return;
        }

        try {
            // Create oscillator and gain for this user
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            // Calculate frequency based on sync state
            const frequency = this.calculateFrequency(userId, bpm, this.currentDifference);

            // Set oscillator properties with smoother waveforms
            oscillator.type = this.currentDifference <= 4 ? 'sine' : 'triangle'; // Triangle is gentler than sawtooth
            oscillator.frequency.value = frequency;

            // Set initial gain with gentle ramp and sustain
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.4, this.audioContext.currentTime + 0.05);
            // Hold the gain at a steady level
            gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime + 0.1);

            // Connect audio nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            // Store references
            if (userId === 1) {
                this.user1Oscillator = oscillator;
                this.user1Gain = gainNode;
            } else {
                this.user2Oscillator = oscillator;
                this.user2Gain = gainNode;
            }

            // Start the oscillator
            oscillator.start(this.audioContext.currentTime);

            console.log(`🎵 User ${userId} oscillator: ${frequency.toFixed(1)}Hz (${bpm} BPM)`);
        } catch (error) {
            console.error(`❌ Failed to create oscillator for user ${userId}:`, error);
        }
    }

    calculateFrequency(userId, bpm, difference) {
        // Base frequencies for harmony (perfect fifth interval)
        const user1BaseFreq = this.baseFrequency; // A3 = 220Hz
        const user2BaseFreq = this.baseFrequency * 1.5; // E4 = 330Hz (perfect fifth)

        const baseFreq = userId === 1 ? user1BaseFreq : user2BaseFreq;

        if (difference <= 4) {
            // SYNC: Perfect harmony - use pure intervals
            return baseFreq;
        } else {
            // CHAOS: Add dissonance based on BPM difference
            // More difference = more detuning
            const chaosAmount = Math.min(difference / 20, 1); // 0 to 1
            const detuning = chaosAmount * 50; // Up to 50Hz of detuning

            // Randomly detune up or down for each user differently
            const detuneDirection = userId === 1 ? 1 : -1;
            return baseFreq + (detuning * detuneDirection * Math.random());
        }
    }

    startRhythm(avgBpm) {
        if (!this.isEnabled || this.rhythmInterval) return;

        // Calculate beat interval from BPM
        const beatInterval = (60 / avgBpm) * 1000; // Convert to milliseconds

        this.rhythmInterval = setInterval(() => {
            this.triggerBeat(this.currentDifference);
        }, beatInterval);

        console.log(`🥁 Rhythm started: ${avgBpm} BPM (${beatInterval.toFixed(0)}ms intervals)`);
    }

    triggerBeat(difference) {
        if (!this.isEnabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;

        // Calculate rhythm chaos based on difference
        const chaos = Math.min(difference / 20, 1); // 0 to 1

        if (difference <= 4) {
            // SYNC: Steady, rhythmic pulses
            this.createStableRhythmPulse(now);
        } else {
            // CHAOS: Irregular, jittery rhythm
            this.createChaoticRhythmPulse(now, chaos);
        }
    }

        createStableRhythmPulse(time) {
        // Stable rhythm: brief volume boost on beat
        if (this.user1Gain) {
            this.user1Gain.gain.cancelScheduledValues(time);
            this.user1Gain.gain.setValueAtTime(0.4, time);
            this.user1Gain.gain.linearRampToValueAtTime(0.7, time + 0.05);
            this.user1Gain.gain.linearRampToValueAtTime(0.4, time + 0.3);
        }

        if (this.user2Gain) {
            this.user2Gain.gain.cancelScheduledValues(time);
            this.user2Gain.gain.setValueAtTime(0.4, time);
            this.user2Gain.gain.linearRampToValueAtTime(0.7, time + 0.05);
            this.user2Gain.gain.linearRampToValueAtTime(0.4, time + 0.3);
        }
    }

        createChaoticRhythmPulse(time, chaos) {
        // Chaotic rhythm: random timing and volume variations
        const randomDelay1 = Math.random() * chaos * 0.05; // Up to 50ms random delay
        const randomDelay2 = Math.random() * chaos * 0.05;

        const randomVolume1 = 0.3 + (Math.random() * 0.4); // Random volume 0.3-0.7
        const randomVolume2 = 0.3 + (Math.random() * 0.4);

        if (this.user1Gain) {
            this.user1Gain.gain.cancelScheduledValues(time);
            this.user1Gain.gain.setValueAtTime(0.3, time + randomDelay1);
            this.user1Gain.gain.linearRampToValueAtTime(randomVolume1, time + randomDelay1 + 0.05);
            this.user1Gain.gain.linearRampToValueAtTime(0.3, time + randomDelay1 + 0.4);
        }

        if (this.user2Gain) {
            this.user2Gain.gain.cancelScheduledValues(time);
            this.user2Gain.gain.setValueAtTime(0.3, time + randomDelay2);
            this.user2Gain.gain.linearRampToValueAtTime(randomVolume2, time + randomDelay2 + 0.05);
            this.user2Gain.gain.linearRampToValueAtTime(0.3, time + randomDelay2 + 0.4);
        }
    }

        updateSync(user1Bpm, user2Bpm, difference) {
        if (!this.isEnabled) return;

        // Check if we need to restart audio (BPM changed significantly)
        const user1Valid = user1Bpm !== "--" && user1Bpm > 0;
        const user2Valid = user2Bpm !== "--" && user2Bpm > 0;

        // Check if oscillators actually exist
        const hasOscillators = (user1Valid && this.user1Oscillator) ||
                              (user2Valid && this.user2Oscillator);

        const shouldRestart = !this.isPlaying ||
                             !hasOscillators ||  // Restart if oscillators missing
                             (!user1Valid && !user2Valid) ||
                             Math.abs(this.currentDifference - difference) > 2;

        console.log(`🎵 UpdateSync: user1=${user1Valid}, user2=${user2Valid}, hasOsc=${hasOscillators}, shouldRestart=${shouldRestart}`);

        if (shouldRestart) {
            this.startAudio(user1Bpm, user2Bpm, difference);
        } else {
            // Just update the current difference for rhythm
            this.currentDifference = difference;
        }
    }

            stopAudio() {
        console.log('🛑 Stopping audio...');

        if (this.rhythmInterval) {
            clearInterval(this.rhythmInterval);
            this.rhythmInterval = null;
        }

        // Immediately stop and clear oscillators (no timeout!)
        if (this.user1Oscillator) {
            try {
                this.user1Oscillator.stop();
                console.log('🛑 User 1 oscillator stopped');
            } catch (e) {
                console.warn('⚠️ Error stopping user 1 oscillator:', e);
            }
            this.user1Oscillator = null;
            this.user1Gain = null;
        }

        if (this.user2Oscillator) {
            try {
                this.user2Oscillator.stop();
                console.log('🛑 User 2 oscillator stopped');
            } catch (e) {
                console.warn('⚠️ Error stopping user 2 oscillator:', e);
            }
            this.user2Oscillator = null;
            this.user2Gain = null;
        }

        // Reset master gain immediately too
        if (this.masterGain && this.audioContext && this.audioContext.state === 'running') {
            try {
                this.masterGain.gain.cancelScheduledValues(this.audioContext.currentTime);
                this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            } catch (error) {
                console.warn('⚠️ Error resetting master gain:', error);
            }
        }

        this.isPlaying = false;
    }
}

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
                lastDataReceived: null,
                readingCounter: 0 // Track readings to reduce update frequency
            },
            2: {
                bpm: 0,
                lastUpdate: null,
                rawBpm: 0,
                signal: 0,
                name: 'User 2',
                consecutiveNoHeartRate: 0,
                lastValidBpm: 0,
                lastDataReceived: null,
                readingCounter: 0 // Track readings to reduce update frequency
            }
        };
        this.syncThreshold = 1; // BPM difference for sync detection (matches circle conjoining)
        this.syncTime = 0; // Percentage of time in sync
        this.syncHistory = [];
        this.maxSyncHistory = 100;
        this.lastUpdateTimes = { 1: 0, 2: 0 }; // Throttle updates
        this.updateFrequency = 3000; // Max once every 3 seconds (reduced from 2s)
        this.noHeartRateThreshold = 2; // Show "--" after 2 consecutive no-heart-rate readings
        this.dataTimeoutMs = 2000; // Show "--" after 2 seconds of no data (quick response to disconnection)
        this.readingSkipCount = 1; // Process every 2nd reading for stability
        this.lastSyncDifference = undefined; // Track previous sync difference for change detection

        // Initialize audio engine
        this.audioEngine = new AudioEngine();

        this.init();
    }

    async init() {
        console.log('Initializing BPM Dashboard...');

        // Initialize background color to red (no data yet)
        document.documentElement.style.setProperty('--sync-color', '255, 0, 0');

        // Initialize point circles in no-data state with default values
        [1, 2].forEach(userId => {
            this.setPointCircleState(userId, 'no-data');
            const pointCircle = document.getElementById(`pointCircle${userId}`);
            if (pointCircle) {
                // Set default CSS custom properties
                pointCircle.style.setProperty('--chaos-factor', '0'); // No chaos by default
                pointCircle.style.setProperty('--animation-speed', '4s'); // Slow by default
            }
        });

        // Initialize circles at normal position (maximum separation, no sync)
        const container1 = document.getElementById('pointCircleContainer1');
        const container2 = document.getElementById('pointCircleContainer2');
        if (container1 && container2) {
            container1.style.setProperty('--circle-offset', '0px'); // Normal position = max separation
            container2.style.setProperty('--circle-offset', '0px'); // Normal position = max separation
            console.log('🔧 Initialized circles at normal position (0px offset)');
        }

        // Initialize names at normal position too
        const userSection1 = document.getElementById('user1Section');
        const userSection2 = document.getElementById('user2Section');
        if (userSection1 && userSection2) {
            userSection1.style.setProperty('--name-offset', '0px');
            userSection2.style.setProperty('--name-offset', '0px');
            console.log('🔧 Initialized names at normal position (0px offset)');
        }

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

        // Update last data received timestamp
        user.lastDataReceived = now;

        // Increment reading counter for this user
        user.readingCounter++;

        // Skip processing some readings for stability (except for "--" messages)
        if (data.bpm !== "--" && user.readingCounter % this.readingSkipCount !== 0) {
            console.log(`User ${userId}: Skipping reading ${user.readingCounter} for stability`);
            return;
        }

        // Skip throttling for "--" messages to show them immediately
        if (data.bpm !== "--") {
            // Throttle updates - max once every 3 seconds per user for normal BPM data
            if (now - this.lastUpdateTimes[userId] < this.updateFrequency) {
                return;
            }
        }
        this.lastUpdateTimes[userId] = now;

        // Debug: Log data reception
        console.log(`🔄 User ${userId}: Received BPM=${data.bpm} (reading #${user.readingCounter})`);

        // Store previous BPM for change detection
        const previousBpm = user.bpm;

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

        // **CHANGE DETECTION**: Only update visuals if BPM actually changed
        const bpmChanged = previousBpm !== user.bpm;

        if (bpmChanged) {
            console.log(`🔄 User ${userId}: BPM changed from ${previousBpm} to ${user.bpm} - updating visuals`);

            // Update UI immediately (no throttling)
            this.updateUserUI(userId);

            // Update point circle animation based on BPM
            this.updatePointCircleAnimation(userId);

            // Check sync with proper handling of "--" values
            this.checkSync();
        } else {
            console.log(`⏸️ User ${userId}: BPM unchanged (${user.bpm}) - skipping visual updates`);

            // Still update UI for other non-visual changes (like signal strength)
            this.updateUserUI(userId);
        }

        const displayBpm = user.bpm === "--" ? "--" : `${user.bpm} BPM`;
        console.log(`User ${userId}: ${displayBpm} (reading #${user.readingCounter})`);
    }

    updateUserUI(userId) {
        const user = this.users[userId];

        // Update user section state
        const userSection = document.getElementById(`user${userId}Section`);
        if (user.bpm !== "--" && user.bpm > 0) {
            userSection.classList.add('active');
        } else {
            userSection.classList.remove('active');
        }
    }

    updatePointCircleAnimation(userId) {
        const user = this.users[userId];
        const bpm = user.bpm;

        if (bpm === "--" || bpm <= 0) {
            this.setPointCircleState(userId, 'no-data');
            return;
        }

        // Calculate chaos factor based on BPM (60 = stable, 120 = max chaos)
        const clampedBpm = Math.max(60, Math.min(120, bpm));
        const chaosFactor = (clampedBpm - 60) / 60; // 0 to 1

        // Calculate animation speed based on BPM (faster BPM = faster animation)
        const baseSpeed = 2; // seconds
        const speedFactor = Math.max(0.5, Math.min(3, 60 / bpm)); // Inverse relationship
        const animationSpeed = baseSpeed * speedFactor;

        // Apply chaos factor and animation speed to the point circle
        const pointCircle = document.getElementById(`pointCircle${userId}`);
        if (pointCircle) {
            pointCircle.style.setProperty('--chaos-factor', chaosFactor);
            pointCircle.style.setProperty('--animation-speed', `${animationSpeed}s`);

            // Remove no-data class if it exists
            pointCircle.classList.remove('no-data');
        }

        console.log(`🎵 User ${userId}: BPM=${bpm}, chaos=${chaosFactor.toFixed(2)}, speed=${animationSpeed.toFixed(1)}s`);
    }

    checkSync() {
        const user1Bpm = this.users[1].bpm;
        const user2Bpm = this.users[2].bpm;

        // Check if we have valid numeric BPM data for BOTH users
        const user1Valid = user1Bpm !== "--" && user1Bpm > 0;
        const user2Valid = user2Bpm !== "--" && user2Bpm > 0;

        console.log(`🔍 Sync Check: User1=${user1Bpm} (valid=${user1Valid}), User2=${user2Bpm} (valid=${user2Valid})`);

        // **OPTIMIZATION**: Check if sync state would actually change before updating
        let difference;
        let isInSync;

        if (!user1Valid || !user2Valid) {
            difference = 20; // Default to maximum difference (no sync)
            isInSync = false;
        } else {
            difference = Math.abs(user1Bpm - user2Bpm);
            isInSync = difference <= this.syncThreshold;
        }

        // Check if this sync check would result in the same visual state
        if (this.lastSyncDifference !== undefined && Math.abs(this.lastSyncDifference - difference) < 0.01) {
            console.log(`⏸️ Sync state unchanged (diff: ${difference.toFixed(1)}) - skipping visual updates`);
            return;
        }

        // Store the current difference for future comparisons
        this.lastSyncDifference = difference;
        console.log(`🔄 Sync state changed - updating visuals (new diff: ${difference.toFixed(1)})`);

        if (!user1Valid || !user2Valid) {
            // If one or both heart beats drop, meld dots and move back to starting position
            console.log(`💔 No valid data: User1=${user1Valid ? user1Bpm.toFixed(1) : '--'}, User2=${user2Valid ? user2Bpm.toFixed(1) : '--'} → Setting RED`);
            this.setSyncState(false, 20);
            this.updatePointCircleSyncStates(20); // Normal starting position (0 offset)
            if (!user1Valid) this.setPointCircleState(1, 'no-data');
            if (!user2Valid) this.setPointCircleState(2, 'no-data');

            // Update audio for no data state
            this.audioEngine.updateSync(user1Bpm, user2Bpm, 20);
            return;
        }

        console.log(`💓 Sync Check: User1=${user1Bpm.toFixed(1)} BPM, User2=${user2Bpm.toFixed(1)} BPM, Difference=${difference.toFixed(1)} BPM`);

        // Update sync history
        this.syncHistory.push(isInSync);
        if (this.syncHistory.length > this.maxSyncHistory) {
            this.syncHistory.shift();
        }

        // Calculate sync percentage
        const syncCount = this.syncHistory.filter(Boolean).length;
        this.syncTime = (syncCount / this.syncHistory.length) * 100;

        // Update colors and circle positioning based on actual BPM difference
        this.setSyncState(isInSync, difference);
        this.updatePointCircleSyncStates(difference);

        // Update audio based on sync state
        this.audioEngine.updateSync(user1Bpm, user2Bpm, difference);
    }

    updatePointCircleSyncStates(difference) {
        // Calculate circle offset based on BPM difference
        // Circles conjoin at difference <= 4 BPM
        // 0-4 difference = circles come together (full offset - User1 moves right, User2 moves left)
        // 20 difference = circles at normal starting positions (0 offset)
        const clampedDiff = Math.max(0, Math.min(20, difference));

        // If difference <= 4, treat it as perfect sync (circles meet)
        const syncDiff = clampedDiff <= 4 ? 0 : clampedDiff;

        // Get actual positions of circle containers to calculate exact distance needed
        const container1 = document.getElementById('pointCircleContainer1');
        const container2 = document.getElementById('pointCircleContainer2');

        if (container1 && container2) {
            // Calculate the exact distance between circle centers when at default positions
            const rect1 = container1.getBoundingClientRect();
            const rect2 = container2.getBoundingClientRect();

            const center1X = rect1.left + rect1.width / 2;
            const center2X = rect2.left + rect2.width / 2;
            const distanceBetweenCenters = Math.abs(center2X - center1X);

            // Each circle needs to move exactly half the distance to meet in the middle
            const maxMovement = distanceBetweenCenters / 2;

                        // Calculate: 0-4 diff = circles meet (move full distance), 20 diff = 0px (normal position)
            const circleOffset = maxMovement * (1 - syncDiff / 20);

            container1.style.setProperty('--circle-offset', `${circleOffset}px`);
            container2.style.setProperty('--circle-offset', `${circleOffset}px`);

            // Calculate name offset - names stop moving when circles get close to prevent overlap
            // Names move with circles when difference > 6 BPM, but stop when circles get too close
            const nameMovementThreshold = 6; // BPM difference below which names stop moving
            let nameOffset;

            if (clampedDiff > nameMovementThreshold) {
                // Names move normally with circles when they're far apart
                nameOffset = circleOffset;
            } else {
                // Names stop moving when circles get close to prevent name overlap
                // Gradually reduce name movement as circles approach
                const reductionFactor = clampedDiff / nameMovementThreshold; // 0 to 1
                nameOffset = circleOffset * reductionFactor * 0.3; // Reduced movement when close
            }

            // Apply name offsets to both user sections
            const userSection1 = document.getElementById('user1Section');
            const userSection2 = document.getElementById('user2Section');

            if (userSection1 && userSection2) {
                userSection1.style.setProperty('--name-offset', `${nameOffset}px`);
                userSection2.style.setProperty('--name-offset', `${nameOffset}px`);
            }

                        // Debug logging - always show final positions for sync checking
            const finalCenter1X = center1X + circleOffset;
            const finalCenter2X = center2X - circleOffset;
            const finalDistance = Math.abs(finalCenter2X - finalCenter1X);

                        if (difference <= 5) {
                console.log(`🔗 DEBUG: Raw diff: ${difference.toFixed(3)}, Sync diff: ${syncDiff}, Clamped diff: ${clampedDiff.toFixed(1)}`);
                console.log(`🔗 Distance between centers: ${distanceBetweenCenters.toFixed(1)}px, maxMovement: ${maxMovement.toFixed(1)}px, circleOffset: ${circleOffset.toFixed(1)}px`);
                console.log(`🔗 Final Centers: ${finalCenter1X.toFixed(1)}px, ${finalCenter2X.toFixed(1)}px, Final Distance: ${finalDistance.toFixed(1)}px`);

                // Check if they're actually meeting (within 1 pixel is close enough)
                if (finalDistance <= 1) {
                    console.log(`✅ PERFECT SYNC: Circles are meeting in the middle! (Raw diff: ${difference.toFixed(3)})`);
                } else if (difference <= 4) {
                    console.log(`🔗 CONJOINED: Raw diff=${difference.toFixed(3)} <= 4, circles should be together but ${finalDistance.toFixed(1)}px apart`);
                }
            } else {
                console.log(`🔗 Circle offset: ${circleOffset.toFixed(1)}px, Name offset: ${nameOffset.toFixed(1)}px (raw: ${difference.toFixed(1)}, sync: ${syncDiff} BPM difference), Final distance: ${finalDistance.toFixed(1)}px`);
            }
        }
    }

    setSyncState(inSync, difference) {
        // Calculate gradient based on BPM difference (0-20 scale)
        const clampedDiff = Math.min(Math.max(difference, 0), 20);
        const gradientColors = this.calculateGradientColors(clampedDiff);

        // Apply color immediately for more reliable behavior
        // Remove the timeout delay that was causing inconsistency
        document.documentElement.style.setProperty('--sync-color', gradientColors);

        // Enhanced logging to track color changes
        const colorState = clampedDiff <= 4 ? 'GREEN' : clampedDiff <= 12 ? 'GREY' : 'RED';
        console.log(`🎨 Color: ${clampedDiff.toFixed(1)} BPM diff → ${colorState} RGB(${gradientColors})`);
    }

    calculateGradientColors(difference) {
        // Handle invalid values
        if (isNaN(difference) || difference < 0) difference = 20; // Default to red

        // Clamp difference to 0-20 range
        difference = Math.min(difference, 20);

        let red, green, blue;

        if (difference <= 4) {
            // 0-4: Max green (perfect sync)
            red = 0;
            green = 255;
            blue = 0;
        } else if (difference <= 12) {
            // 4-12: Green to Grey transition
            const ratio = (difference - 4) / 8; // 0 to 1
            red = Math.round(180 * ratio);       // 0 → 180 (grey)
            green = Math.round(255 - (75 * ratio)); // 255 → 180 (grey)
            blue = Math.round(180 * ratio);      // 0 → 180 (grey)
        } else {
            // 12-20: Grey to Red transition
            const ratio = (difference - 12) / 8; // 0 to 1
            red = Math.round(180 + (75 * ratio));    // 180 → 255 (red)
            green = Math.round(180 * (1 - ratio));   // 180 → 0
            blue = Math.round(180 * (1 - ratio));    // 180 → 0
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

        // Note: Timestamp updates removed since lastUpdate elements don't exist in HTML
    }

    // updateTimestamps and getTimeAgo removed since timestamp elements don't exist in HTML

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

        // Handle audio toggle button
        const audioToggle = document.getElementById('audioToggle');
        if (audioToggle) {
            audioToggle.addEventListener('click', async () => {
                if (this.audioEngine.isEnabled) {
                    // Disable audio
                    this.audioEngine.disable();
                    audioToggle.textContent = '🔇';
                    audioToggle.classList.remove('enabled');
                    audioToggle.title = 'Enable Sound Effects';
                    console.log('🔇 Audio disabled by user');
                                } else {
                    // Enable audio (requires user interaction)
                    console.log('🎵 Attempting to enable audio...');
                    const success = await this.audioEngine.enable();
                    if (success) {
                        audioToggle.textContent = '🔊';
                        audioToggle.classList.add('enabled');
                        audioToggle.title = 'Disable Sound Effects';
                        console.log('🔊 Audio enabled by user');

                        // Play test tone to verify audio is working
                        setTimeout(async () => {
                            const testResult = await this.audioEngine.testTone();
                            if (testResult) {
                                console.log('✅ Audio test successful');
                            } else {
                                console.warn('⚠️ Audio test failed - check volume/permissions');
                            }
                        }, 100);

                        // Start audio with current sync state if we have data
                        const user1Bpm = this.users[1].bpm;
                        const user2Bpm = this.users[2].bpm;
                        const user1Valid = user1Bpm !== "--" && user1Bpm > 0;
                        const user2Valid = user2Bpm !== "--" && user2Bpm > 0;

                        if (user1Valid || user2Valid) {
                            const difference = user1Valid && user2Valid ?
                                              Math.abs(user1Bpm - user2Bpm) : 20;
                            this.audioEngine.updateSync(user1Bpm, user2Bpm, difference);
                        }
                    } else {
                        console.error('❌ Failed to enable audio');
                        alert('Could not enable audio. Please check your browser settings and ensure you\'re not in a private/incognito window.');
                    }
                }
            });
        }

        // Debug: Log click on point circles for sync status
        [1, 2].forEach(userId => {
            const pointCircle = document.getElementById(`pointCircle${userId}`);
            if (pointCircle) {
                pointCircle.addEventListener('click', () => {
                    const user1Bpm = this.users[1].bpm === "--" ? 0 : this.users[1].bpm;
                    const user2Bpm = this.users[2].bpm === "--" ? 0 : this.users[2].bpm;
                    console.log(`🔗 Sync Status (clicked User ${userId}):`, {
                        user1Bpm: user1Bpm,
                        user2Bpm: user2Bpm,
                        difference: Math.abs(user1Bpm - user2Bpm),
                        syncTime: this.syncTime,
                        threshold: this.syncThreshold
                    });
                });
            }
        });
    }

    checkDataTimeouts() {
        const now = Date.now();
        let timeoutDetected = false;

        Object.keys(this.users).forEach(userId => {
            const user = this.users[userId];

            // Check if we haven't received data for more than 8 seconds
            if (user.lastDataReceived && (now - user.lastDataReceived) > this.dataTimeoutMs) {
                if (user.bpm !== "--") {
                    user.bpm = "--";
                    user.consecutiveNoHeartRate = this.noHeartRateThreshold; // Reset to max so it stays "--"
                    this.updateUserUI(userId);
                    this.setPointCircleState(userId, 'no-data');
                    timeoutDetected = true;
                    console.log(`User ${userId}: Data timeout - no data for ${Math.round((now - user.lastDataReceived) / 1000)}s`);
                }
            }
        });

        // If any user timed out, recheck sync status (which will separate circles)
        if (timeoutDetected) {
            this.checkSync();
        }
    }

    setPointCircleState(userId, state) {
        const pointCircle = document.getElementById(`pointCircle${userId}`);
        if (!pointCircle) return;

        if (state === 'no-data') {
            // Add no-data class for special animation (dots meld into one)
            pointCircle.classList.add('no-data');
            // Reset to default values for gentle pulsing
            pointCircle.style.setProperty('--chaos-factor', '0');
            pointCircle.style.setProperty('--animation-speed', '4s');
        } else {
            // Remove no-data class for normal dynamic animation
            pointCircle.classList.remove('no-data');
        }

        console.log(`🎨 Point circle state: ${state} for User ${userId}`);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 DOM loaded, starting dashboard...');
    window.dashboard = new BPMDashboard();

    // Add debugging functions to global window object
    window.audioDebug = {
        test: () => window.dashboard.audioEngine.testTone(),
        enable: () => window.dashboard.audioEngine.enable(),
        disable: () => window.dashboard.audioEngine.disable(),
        status: () => {
            const engine = window.dashboard.audioEngine;
            console.log('🎵 Audio Status:', {
                enabled: engine.isEnabled,
                playing: engine.isPlaying,
                contextState: engine.audioContext?.state,
                currentDifference: engine.currentDifference
            });
        },
        simulateSync: (bpm1 = 72, bpm2 = 73) => {
            const diff = Math.abs(bpm1 - bpm2);
            console.log(`🎵 Simulating sync: ${bpm1} vs ${bpm2} BPM (difference: ${diff})`);
            window.dashboard.audioEngine.updateSync(bpm1, bpm2, diff);

            // Show what should be happening
            setTimeout(() => {
                const engine = window.dashboard.audioEngine;
                console.log(`🎵 After simulation:`, {
                    enabled: engine.isEnabled,
                    playing: engine.isPlaying,
                    contextState: engine.audioContext?.state,
                    currentDifference: engine.currentDifference,
                    user1Oscillator: !!engine.user1Oscillator,
                    user2Oscillator: !!engine.user2Oscillator,
                    rhythmInterval: !!engine.rhythmInterval
                });
            }, 100);
        }
    };

    // Add simple sustained tone test
    window.audioDebug.sustainedTest = () => {
        const engine = window.dashboard.audioEngine;
        if (!engine.isEnabled || !engine.audioContext) {
            console.log('❌ Audio not enabled');
            return;
        }

        console.log('🎵 Playing sustained test tones...');

        // Create two oscillators that play for 5 seconds
        const osc1 = engine.audioContext.createOscillator();
        const osc2 = engine.audioContext.createOscillator();
        const gain1 = engine.audioContext.createGain();
        const gain2 = engine.audioContext.createGain();

        osc1.frequency.value = 220; // A3
        osc2.frequency.value = 330; // E4
        osc1.type = 'sine';
        osc2.type = 'sine';

        gain1.gain.setValueAtTime(0.1, engine.audioContext.currentTime);
        gain2.gain.setValueAtTime(0.1, engine.audioContext.currentTime);

        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(engine.audioContext.destination);
        gain2.connect(engine.audioContext.destination);

        osc1.start();
        osc2.start();
        osc1.stop(engine.audioContext.currentTime + 5);
        osc2.stop(engine.audioContext.currentTime + 5);

        console.log('🎵 Should hear two sustained tones for 5 seconds');
    };

    console.log('🎵 Audio debug functions available:');
    console.log('  audioDebug.test() - Play test tone');
    console.log('  audioDebug.sustainedTest() - Play 5-second sustained tones');
    console.log('  audioDebug.enable() - Enable audio');
    console.log('  audioDebug.disable() - Disable audio');
    console.log('  audioDebug.status() - Show audio status');
    console.log('  audioDebug.simulateSync(72, 73) - Simulate BPM sync');
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('🚨 Global error:', event.error);
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
});
