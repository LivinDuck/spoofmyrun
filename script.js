class FakeMyRun {
    constructor() {
        // Set your Mapbox access token
        mapboxgl.accessToken = 'YOURTOKENHERE'; 
        
        this.map = null;
        this.routePoints = [];
        this.routeSource = null;
        this.markers = [];
        this.userLocation = null;
        this.elevationData = [];
        this.elevationLoadingStates = []; // Track which elevations are still loading
        this.paceChart = null;

        // New Undo/Redo system
        this.history = [];
        this.historyIndex = -1;
        this.isUndoingOrRedoing = false;

        this.selectedNodeIndex = -1; // Track selected node for editing
        this.isDragging = false; // Track if we're dragging a node
        this.isEditingNodes = false; // Track if we're in node editing mode
        this.markerClickInProgress = false; // Track if a marker click is being processed
        this.autoAlignToRoad = false; // Track if auto-align to road is enabled
        this.titleClickCount = 0; // Track clicks on title for easter egg
        this.is3DEnabled = false; // Track if 3D mode is enabled
        
        // Check if this is first visit and show intro
        this.checkAndShowIntro();
        
        this.initializeMap();
        this.bindEvents();
        this.bindIntroEvents(); // Bind intro modal events
        this.bindTitleClickEvent(); // Bind title click easter egg
        this.setDefaultDate();
        this.updateStats();
        this.initializePaceChart();

        this.saveState(); // Save initial empty state
        this.updateUndoRedoButtons();
    }

    checkAndShowIntro() {
        // Check if user has seen intro before
        const hasSeenIntro = localStorage.getItem('spoofMyRun_hasSeenIntro');
        
        if (!hasSeenIntro) {
            // Show intro immediately on load without animation
            this.showIntro(true);
        } else {
            // For returning users, just ensure modal is hidden and request location
            this.ensureIntroHidden();
            setTimeout(() => {
                this.goToCurrentLocation();
            }, 1000);
        }
    }

    ensureIntroHidden() {
        const introModal = document.getElementById('intro-modal');
        if (introModal) {
            introModal.style.display = 'none';
            introModal.classList.add('hidden');
            introModal.classList.remove('intro-visible');
        }
        // Always ensure body scrolling is enabled
        document.body.style.overflow = '';
    }

    showIntro(isFirstLoad = false) {
        const introModal = document.getElementById('intro-modal');
        if (introModal) {
            // Reset all states first
            introModal.classList.remove('hidden');
            introModal.classList.add('intro-visible');
            
            if (isFirstLoad) {
                introModal.classList.add('first-load');
                introModal.classList.remove('manual-show');
            } else {
                introModal.classList.add('manual-show');
                introModal.classList.remove('first-load');
            }
            
            introModal.style.display = 'flex';
            
            // Only disable scrolling after modal is visible
            setTimeout(() => {
                document.body.style.overflow = 'hidden';
            }, 50);
        }
    }

    hideIntro() {
        const introModal = document.getElementById('intro-modal');
        if (introModal && !introModal.classList.contains('hidden')) {
            introModal.classList.add('hidden');
            document.body.style.overflow = ''; // Restore scrolling
            
            // Request user location after intro is dismissed
            setTimeout(() => {
                this.goToCurrentLocation();
            }, 300);
            
            // Remove from DOM after animation
            setTimeout(() => {
                if (introModal.classList.contains('hidden')) {
                    introModal.style.display = 'none';
                    introModal.classList.remove('intro-visible');
                }
            }, 600);
        }
    }

    bindIntroEvents() {
        // Start creating button - begins interactive tutorial
        const startBtn = document.getElementById('start-creating-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startInteractiveTutorial();
            });
        }

        // Skip intro button - skips tutorial completely
        const skipBtn = document.getElementById('skip-intro-btn');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                localStorage.setItem('spoofMyRun_hasSeenIntro', 'true');
                this.hideIntro();
            });
        }

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const introModal = document.getElementById('intro-modal');
                if (introModal && !introModal.classList.contains('hidden')) {
                    localStorage.setItem('spoofMyRun_hasSeenIntro', 'true');
                    this.hideIntro();
                }
            }
        });
    }

    bindTitleClickEvent() {
        const title = document.getElementById('main-title');
        if (title) {
            title.addEventListener('click', () => {
                this.titleClickCount++;
                
                if (this.titleClickCount === 5) {
                    // Reset counter and show intro
                    this.titleClickCount = 0;
                    localStorage.removeItem('spoofMyRun_hasSeenIntro');
                    // Scroll to top first to ensure intro is visible
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(() => {
                        this.showIntro(false); // Manual show with animation
                    }, 300);
                }
                
                // Reset counter after 2 seconds if not reached 5
                setTimeout(() => {
                    if (this.titleClickCount < 5) {
                        this.titleClickCount = 0;
                    }
                }, 2000);
            });
        }
    }

    startInteractiveTutorial() {
        // Hide the intro modal first
        this.hideIntro();
        
        // Start the tutorial sequence
        setTimeout(() => {
            this.tutorialStep = 1;
            this.showTutorialStep1();
        }, 800);
    }

    showTutorialStep1() {
        // Step 1: Basic route creation
        this.showTutorialOverlay({
            title: "Let's Create Your First Route!",
            message: "Click anywhere on the map to add your first waypoint. Try clicking on a road or path nearby.",
            highlightElement: "#map",
            position: "center",
            nextAction: "waitForFirstClick"
        });
    }

    showTutorialStep2() {
        // Step 2: Add second point
        this.showTutorialOverlay({
            title: "Great! Now Add a Second Point",
            message: "Click somewhere else on the map to create a route between two points. Notice how it draws a line!",
            highlightElement: "#map",
            position: "center",
            nextAction: "waitForSecondClick"
        });
    }

    showTutorialStep3() {
        // Step 3: Introduce Align to Road
        this.showTutorialOverlay({
            title: "Align to Roads",
            message: "Click this button to enable automatic road alignment. When active, your routes will follow actual roads and paths!",
            highlightElement: "#align-to-road-btn",
            position: "bottom",
            nextAction: "waitForAlignClick"
        });
    }

    showTutorialStep4() {
        // Step 4: Test road alignment
        this.showTutorialOverlay({
            title: "Try Road-Aligned Route",
            message: "Now click on the map again. Notice how the route follows roads automatically instead of drawing straight lines!",
            highlightElement: "#map",
            position: "center",
            nextAction: "waitForAlignedClick"
        });
    }

    showTutorialStep5() {
        // Step 5: Edit Nodes feature
        this.showTutorialOverlay({
            title: "Edit Your Route",
            message: "Click this button to enter edit mode. You'll be able to drag points around and insert new points by clicking on the route line.",
            highlightElement: "#edit-nodes-btn",
            position: "bottom",
            nextAction: "waitForEditClick"
        });
    }

    showTutorialStep6() {
        // Step 6: Demonstrate editing
        this.showTutorialOverlay({
            title: "Edit Mode Active",
            message: "Try clicking and dragging one of the orange dots to move a waypoint, or click on the route line to insert a new point!",
            highlightElement: "#map",
            position: "center",
            nextAction: "waitForEdit"
        });
    }

    showTutorialStep7() {
        // Step 7: Final step
        this.showTutorialOverlay({
            title: "Tutorial Complete! 🎉",
            message: "You've learned the basics! Customize your pace, add details, and generate your GPX file when ready. Happy route creating!",
            highlightElement: ".action-buttons",
            position: "top",
            nextAction: "completeTutorial",
            showCompleteButton: true
        });
    }

    showTutorialOverlay({ title, message, highlightElement, position, nextAction, showCompleteButton = false }) {
        // Remove any existing tutorial overlay
        this.removeTutorialOverlay();

        // Create clean tutorial popup without backdrop
        const overlay = document.createElement('div');
        overlay.id = 'tutorial-overlay';
        overlay.innerHTML = `
            <div class="tutorial-popup" id="tutorial-popup">
                <div class="tutorial-content">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    ${showCompleteButton ? `
                        <div class="tutorial-actions">
                            <button id="complete-tutorial-btn" class="tutorial-btn-complete">
                                <i class="fas fa-check"></i> Got it!
                            </button>
                        </div>
                    ` : ''}
                </div>

            </div>
        `;

        document.body.appendChild(overlay);

        // Highlight and position near the target element
        if (highlightElement) {
            const element = document.querySelector(highlightElement);
            if (element) {
                element.classList.add('tutorial-highlight');
                this.positionTutorialPopup(element, position);
            }
        }

        // Set up next action
        this.currentTutorialAction = nextAction;
        
        // Bind complete button if present
        if (showCompleteButton) {
            const completeBtn = document.getElementById('complete-tutorial-btn');
            if (completeBtn) {
                completeBtn.addEventListener('click', () => {
                    this.completeTutorial();
                });
            }
        }
    }

    positionTutorialPopup(targetElement, preferredPosition) {
        const popup = document.getElementById('tutorial-popup');
        
        if (!popup) return;

        // Always position on the right side, out of the way
        let left, top;
        
        if (window.innerWidth <= 768) {
            // Mobile: center horizontally, scroll with page
            left = 20;
            top = window.scrollY + 20;
            popup.style.width = 'calc(100vw - 40px)';
            popup.style.maxWidth = 'none';
            popup.style.position = 'absolute';
        } else {
            // Desktop: right side positioning, scroll with page
            left = window.innerWidth - 380; // 350px popup width + 30px margin
            top = window.scrollY + 120; // Scroll position + offset
            popup.style.width = '';
            popup.style.maxWidth = '350px';
            popup.style.position = 'absolute';
        }

        popup.style.left = left + 'px';
        popup.style.top = top + 'px';
        popup.style.transform = 'none';
        
        // Update position on scroll
        const updatePosition = () => {
            if (document.getElementById('tutorial-popup')) {
                this.positionTutorialPopup(targetElement, preferredPosition);
            }
        };
        
        // Remove old listener and add new one
        window.removeEventListener('scroll', this.tutorialScrollHandler);
        this.tutorialScrollHandler = updatePosition;
        window.addEventListener('scroll', this.tutorialScrollHandler, { passive: true });
    }



    removeTutorialOverlay() {
        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.remove();
        }
        
        // Remove scroll listener
        if (this.tutorialScrollHandler) {
            window.removeEventListener('scroll', this.tutorialScrollHandler);
            this.tutorialScrollHandler = null;
        }
        
        // Remove all highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => {
            el.classList.remove('tutorial-highlight');
        });
    }

    completeTutorial() {
        this.removeTutorialOverlay();
        localStorage.setItem('spoofMyRun_hasSeenIntro', 'true');
        
        // Exit edit mode if active
        if (this.isEditingNodes) {
            this.toggleNodeEditingMode();
        }
        
        // Tutorial is complete - no more popups needed
    }



    showWelcomeHint(customMessage = null) {
        // Create a subtle hint overlay on the map
        const mapElement = document.getElementById('map');
        const hint = document.createElement('div');
        const message = customMessage || "Click anywhere on the map to start creating your route!";
        const icon = customMessage ? "fas fa-check-circle" : "fas fa-mouse-pointer";
        
        hint.innerHTML = `
            <div style="
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 87, 34, 0.9);
                color: white;
                padding: 20px 30px;
                border-radius: 15px;
                font-size: 1.1rem;
                font-weight: 500;
                text-align: center;
                z-index: 1000;
                animation: fadeInOut 4s ease-in-out forwards;
                box-shadow: 0 8px 25px rgba(255, 87, 34, 0.3);
            ">
                <i class="${icon}" style="margin-right: 10px;"></i>
                ${message}
            </div>
        `;
        
        // Add CSS animation for the hint
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
        
        mapElement.style.position = 'relative';
        mapElement.appendChild(hint);
        
        // Remove hint after animation
        setTimeout(() => {
            if (hint.parentNode) {
                hint.parentNode.removeChild(hint);
            }
            document.head.removeChild(style);
        }, 4000);
    }

    saveState() {
        if (this.isUndoingOrRedoing) return;

        // Deep copy of state
        const state = {
            routePoints: JSON.parse(JSON.stringify(this.routePoints)),
            elevationData: [...this.elevationData],
            selectedNodeIndex: this.selectedNodeIndex
        };

        // If we have undone actions, truncate the future history
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(state);
        this.historyIndex++;
        
        // Optional: Limit history size to prevent memory issues
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }

        this.updateUndoRedoButtons();
    }

    restoreState(state) {
        this.isUndoingOrRedoing = true;

        // Restore state from history
        this.routePoints = JSON.parse(JSON.stringify(state.routePoints));
        this.elevationData = [...state.elevationData];
        this.selectedNodeIndex = state.selectedNodeIndex;

        // Update the UI to reflect the restored state
        this.recreateMarkers();
        this.updateRoutePolyline();
        this.updateStats();
        this.updatePaceChart();
        
        this.isUndoingOrRedoing = false;
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = this.history[this.historyIndex];
            this.restoreState(state);
            this.updateUndoRedoButtons();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = this.history[this.historyIndex];
            this.restoreState(state);
            this.updateUndoRedoButtons();
        }
    }

    updateUndoRedoButtons() {
        document.getElementById('undo-btn').disabled = this.historyIndex <= 0;
        document.getElementById('redo-btn').disabled = this.historyIndex >= this.history.length - 1;
    }

    initializeMap() {
        // Initialize Mapbox map
        this.map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [2.3522, 48.8566], // Paris [longitude, latitude]
            zoom: 11,
            antialias: true // Smooth rendering
        });
        
        // Add navigation controls
        this.map.addControl(new mapboxgl.NavigationControl());
        
        // Add custom 3D control
        this.add3DControl();
        
        // Wait for map to load before adding event listeners
        this.map.on('load', () => {
            // Add route source and layer
            this.map.addSource('route', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': []
                    }
                }
            });
            
            this.map.addLayer({
                'id': 'route',
                'type': 'line',
                'source': 'route',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#ff5722',
                    'line-width': 4,
                    'line-opacity': 0.8
                }
            });
        });
        
        // Add click event for route drawing
        this.map.on('click', (e) => {
            // Convert Mapbox event to Leaflet-like format for compatibility
            const mapEvent = {
                latlng: {
                    lat: e.lngLat.lat,
                    lng: e.lngLat.lng
                }
            };
            this.handleMapClick(mapEvent);
        });

        // Don't request location during intro - will be called after intro is dismissed
    }

    bindEvents() {
        // Current location button
        document.getElementById('current-location-btn').addEventListener('click', () => {
            this.goToCurrentLocation();
        });

        // GPX import
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('gpx-import').click();
        });

        document.getElementById('gpx-import').addEventListener('change', (e) => {
            this.handleGPXImport(e);
        });

        // Map controls
        document.getElementById('align-to-road-btn').addEventListener('click', () => {
            this.toggleAutoAlignToRoad();
        });



        document.getElementById('clear-route-btn').addEventListener('click', () => {
            this.clearRoute();
        });

        document.getElementById('undo-btn').addEventListener('click', () => {
            this.undo();
        });

        document.getElementById('redo-btn').addEventListener('click', () => {
            this.redo();
        });

        document.getElementById('edit-nodes-btn').addEventListener('click', () => {
            this.toggleNodeEditingMode();
        });

        // Remove activity toggle as it's no longer needed

        // Pace slider
        document.getElementById('pace-slider').addEventListener('input', (e) => {
            this.updatePaceDisplay(e.target.value);
            this.updateStats();
            this.updatePaceChart();
        });

        // Consistency slider
        document.getElementById('consistency-slider').addEventListener('input', (e) => {
            this.updateConsistencyDisplay(e.target.value);
            this.updatePaceChart();
        });

        // Action buttons
        document.getElementById('generate-gpx-btn').addEventListener('click', () => {
            this.generateGPX();
        });

        document.getElementById('preview-btn').addEventListener('click', () => {
            this.exportToStrava();
        });
    }

    setDefaultDate() {
        const now = new Date();
        const timeString = now.toISOString().slice(0, 16);
        document.getElementById('run-date').value = timeString;
    }

    toggleNodeEditingMode() {
        this.isEditingNodes = !this.isEditingNodes;
        const btn = document.getElementById('edit-nodes-btn');
        
        if (this.isEditingNodes) {
            btn.innerHTML = '<i class="fas fa-times"></i> Exit Edit';
            btn.style.backgroundColor = '#ff5722';
            btn.style.color = 'white';
            // Clear selection when entering edit mode
            this.selectedNodeIndex = -1;
            // Disable auto-align when entering edit mode
            if (this.autoAlignToRoad) {
                this.toggleAutoAlignToRoad();
            }
            // Keep map interactions enabled in edit mode for better UX
        } else {
            btn.innerHTML = '<i class="fas fa-edit"></i> Edit Nodes';
            btn.style.backgroundColor = '';
            btn.style.color = '';
            // Clear selection when exiting edit mode
            this.selectedNodeIndex = -1;
        }
        
        // Recreate markers to show/hide editing features
        this.recreateMarkers();

        // Handle tutorial progression
        if (this.currentTutorialAction === 'waitForEditClick') {
            this.currentTutorialAction = null;
            setTimeout(() => this.showTutorialStep6(), 300);
        }
    }

    add3DControl() {
        class Toggle3DControl {
            onAdd(map) {
                this._map = map;
                this._container = document.createElement('div');
                this._container.className = 'mapboxgl-ctrl mapboxgl-ctrl-group';
                
                this._button = document.createElement('button');
                this._button.className = 'mapboxgl-ctrl-icon';
                this._button.type = 'button';
                this._button.title = 'Toggle 3D terrain and buildings';
                this._button.innerHTML = '<i class="fas fa-cube"></i>';
                this._button.style.fontSize = '14px';
                this._button.style.display = 'flex';
                this._button.style.alignItems = 'center';
                this._button.style.justifyContent = 'center';
                
                this._button.addEventListener('click', () => {
                    window.app.toggle3DView();
                });
                
                this._container.appendChild(this._button);
                return this._container;
            }
            
            onRemove() {
                this._container.parentNode.removeChild(this._container);
                this._map = undefined;
            }
            
            getButton() {
                return this._button;
            }
        }
        
        this.toggle3DControl = new Toggle3DControl();
        this.map.addControl(this.toggle3DControl, 'top-right');
        
        // Store reference globally so button can access toggle function
        window.app = this;
    }

    toggle3DView() {
        const btn = this.toggle3DControl.getButton();
        
        if (!this.is3DEnabled) {
            // Enable 3D
            this.is3DEnabled = true;
            btn.innerHTML = '<i class="fas fa-times"></i>';
            btn.style.backgroundColor = '#ff5722';
            btn.style.color = 'white';
            btn.title = 'Exit 3D view';
            
            // Add 3D terrain
            this.map.addSource('mapbox-dem', {
                'type': 'raster-dem',
                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                'tileSize': 512,
                'maxzoom': 14
            });
            
            this.map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
            
            // Add 3D buildings
            const layers = this.map.getStyle().layers;
            const labelLayerId = layers.find(
                (layer) => layer.type === 'symbol' && layer.layout['text-field']
            ).id;
            
            this.map.addLayer({
                'id': 'add-3d-buildings',
                'source': 'composite',
                'source-layer': 'building',
                'filter': ['==', 'extrude', 'true'],
                'type': 'fill-extrusion',
                'minzoom': 15,
                'paint': {
                    'fill-extrusion-color': '#aaa',
                    'fill-extrusion-height': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        15,
                        0,
                        15.05,
                        ['get', 'height']
                    ],
                    'fill-extrusion-base': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        15,
                        0,
                        15.05,
                        ['get', 'min_height']
                    ],
                    'fill-extrusion-opacity': 0.6
                }
            }, labelLayerId);
            
            // Tilt map for 3D effect
            this.map.easeTo({
                pitch: 45,
                bearing: 0,
                duration: 1000
            });
            
        } else {
            // Disable 3D
            this.is3DEnabled = false;
            btn.innerHTML = '<i class="fas fa-cube"></i>';
            btn.style.backgroundColor = '';
            btn.style.color = '';
            btn.title = 'Toggle 3D terrain and buildings';
            
            // Remove terrain
            this.map.setTerrain(null);
            if (this.map.getSource('mapbox-dem')) {
                this.map.removeSource('mapbox-dem');
            }
            
            // Remove 3D buildings
            if (this.map.getLayer('add-3d-buildings')) {
                this.map.removeLayer('add-3d-buildings');
            }
            
            // Reset camera
            this.map.easeTo({
                pitch: 0,
                bearing: 0,
                duration: 1000
            });
        }
    }

    async handleMapClick(e) {
        // Don't add points if we're dragging or a marker click is in progress
        if (this.isDragging || this.markerClickInProgress) {
            return;
        }

        // Handle tutorial progression
        if (this.currentTutorialAction) {
            this.handleTutorialAction(e);
        }

        if (this.isEditingNodes) {
            // In editing mode, clicking deselects nodes
            this.selectedNodeIndex = -1;
            this.recreateMarkers();
        } else {
            // Normal mode: regular point addition with optional auto-align
            try {
                if (this.autoAlignToRoad && this.routePoints.length > 0) {
                    // Auto-align is enabled and we have existing points - generate routed path
                    await this.addRoutedPoint(e.latlng);
                } else {
                    // Either auto-align is off or this is the first point
                    await this.addRoutePoint(e.latlng);
                }
            } catch (error) {
                console.error('Failed to add route point:', error);
                alert('Unable to fetch elevation data. Please check your internet connection and try again.');
            }
        }
    }

    handleTutorialAction(e) {
        switch (this.currentTutorialAction) {
            case 'waitForFirstClick':
                // Progress immediately after first click
                this.currentTutorialAction = null;
                setTimeout(() => this.showTutorialStep2(), 500);
                break;
            case 'waitForSecondClick':
                // Progress immediately after second click
                this.currentTutorialAction = null;
                setTimeout(() => this.showTutorialStep3(), 500);
                break;
            case 'waitForAlignedClick':
                // Progress after aligned click
                this.currentTutorialAction = null;
                setTimeout(() => this.showTutorialStep5(), 500);
                break;
            case 'waitForEdit':
                // Progress after any edit action
                this.currentTutorialAction = null;
                setTimeout(() => this.showTutorialStep7(), 1000);
                break;
        }
    }







    async addRoutePoint(latlng, skipStatesSave = false) {
        const pointIndex = this.routePoints.length;
        
        // Add point immediately for instant visual feedback
        this.routePoints.push(latlng);
        this.elevationData.push(null); // Placeholder for elevation
        this.elevationLoadingStates.push(true); // Mark as loading

        // Only set selection in editing mode
        if (this.isEditingNodes) {
            this.selectedNodeIndex = this.routePoints.length - 1;
        }
        
        // Immediately update display with loading state
        this.recreateMarkers();
        this.updateRoutePolyline();
        this.updateStats();
        this.updatePaceChart();
        
        // Fetch elevation in background.
        // The background process will handle saving state for undo/redo.
        // We only skip the final state save for intermediate points during auto-routing.
        if (!skipStatesSave) {
            this.fetchElevationInBackground(pointIndex, latlng);
        } else {
            // For routed points, we'll fetch elevation in a batch later,
            // so we just do nothing here. The calling function is responsible.
        }
    }

    async fetchElevationInBackground(pointIndex, latlng) {
        try {
            const elevation = await this.fetchRealElevation(latlng);
            
            // Update elevation data
            this.elevationData[pointIndex] = elevation;
            this.elevationLoadingStates[pointIndex] = false;
            
            // Update display to show elevation is loaded
            this.recreateMarkers();
            this.updateStats();
            this.updatePaceChart();
            
            // Save state after elevation is loaded
            this.saveState();
            
        } catch (error) {
            console.error('Failed to fetch elevation for point:', error);
            
            // Mark as failed but keep the point
            this.elevationData[pointIndex] = 100; // Reasonable default
            this.elevationLoadingStates[pointIndex] = false;
            
            // Update display
            this.recreateMarkers();
            this.updateStats();
            this.updatePaceChart();
            
            // Show user-friendly error message
            this.showElevationError();
        }
    }

    showElevationError() {
        // Only show error once to avoid spam
        if (!this.elevationErrorShown) {
            this.elevationErrorShown = true;
            
            // Create a non-blocking notification
            const notification = document.createElement('div');
            notification.className = 'elevation-error-notification';
            notification.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>Unable to fetch elevation data. Using default values.</span>
                <button class="close-btn" onclick="this.parentElement.remove()">×</button>
            `;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff9800;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                font-size: 14px;
                display: flex;
                align-items: center;
                gap: 8px;
                max-width: 300px;
                animation: slideIn 0.3s ease-out;
            `;
            
            document.body.appendChild(notification);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
                this.elevationErrorShown = false;
            }, 5000);
        }
    }

    recreateMarkers() {
        // Remove all existing markers
        this.markers.forEach(marker => marker.remove());
        this.markers = [];

        // Create new markers with proper styling
        this.routePoints.forEach((point, index) => {
            const isSelected = this.isEditingNodes && index === this.selectedNodeIndex;
            const isNewest = !this.isEditingNodes && index === this.routePoints.length - 1;
            
            let markerColor = '#ff5722';
            let size = 12;
            let borderColor = 'white';
            
            if (isSelected) {
                // Selected node in edit mode: lighter orange with larger size
                markerColor = '#FFB74D';
                size = 16;
            } else if (isNewest) {
                // Newest node in normal mode: amber highlight
                markerColor = '#FF9800';
            }
            
            // Create a custom marker element
            const el = document.createElement('div');
            el.className = 'route-marker';
            el.style.backgroundColor = markerColor;
            el.style.width = size + 'px';
            el.style.height = size + 'px';
            el.style.borderRadius = '50%';
            el.style.border = `2px solid ${borderColor}`;
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            el.style.cursor = this.isEditingNodes ? 'move' : 'default';
            
            const marker = new mapboxgl.Marker({
                element: el,
                draggable: this.isEditingNodes
            })
            .setLngLat([point.lng, point.lat])
            .addTo(this.map);

            // Only add editing functionality in edit mode
            if (this.isEditingNodes) {
                let isDragging = false;
                
                marker.on('dragstart', () => {
                    isDragging = true;
                    this.selectedNodeIndex = index;
                });
                
                marker.on('drag', () => {
                    const lngLat = marker.getLngLat();
                    this.routePoints[index] = { lat: lngLat.lat, lng: lngLat.lng };
                    this.updateRoutePolyline();
                });
                
                marker.on('dragend', () => {
                    setTimeout(() => {
                        isDragging = false;
                        this.updateElevationForMovedNode(index).then(() => {
                            this.updateStats();
                            this.updatePaceChart();
                            this.saveState();
                        });
                    }, 100);
                });
                
                // Handle selection on click
                el.addEventListener('click', (e) => {
                    if (!isDragging) {
                        e.stopPropagation();
                        this.selectedNodeIndex = index;
                        this.recreateMarkers();
                    }
                });
            }

            this.markers.push(marker);
        });
    }

    selectNode(index) {
        this.selectedNodeIndex = index;
        this.recreateMarkers();
    }

    handleNodeMouseDown(nodeIndex, e) {
        // Prevent map interaction during node handling
        this.markerClickInProgress = true;
        
        // First select the node
        this.selectedNodeIndex = nodeIndex;
        this.recreateMarkers();
        
        // Set up drag tracking
        let hasMoved = false;
        let dragStarted = false;
        const startTime = Date.now();
        const startPos = { x: e.originalEvent.clientX, y: e.originalEvent.clientY };
        
        const map = this.map;
        const marker = this.markers[nodeIndex];
        
        const onMouseMove = (e) => {
            const currentPos = { x: e.clientX, y: e.clientY };
            const distance = Math.sqrt(
                Math.pow(currentPos.x - startPos.x, 2) + 
                Math.pow(currentPos.y - startPos.y, 2)
            );
            
            // Start dragging if mouse moved more than 5 pixels or after 100ms
            if (!dragStarted) {
                if (distance > 5 || Date.now() - startTime > 100) {
                    dragStarted = true;
                    this.isDragging = true;
                    // Only disable map dragging when we actually start dragging a node
                    this.map.dragging.disable();
                    
                    // Handle tutorial progression for edit mode
                    if (this.currentTutorialAction === 'waitForEdit') {
                        this.currentTutorialAction = null;
                        setTimeout(() => this.showTutorialStep7(), 1000);
                    }
                } else {
                    return; // Don't start dragging immediately
                }
            }
            
            hasMoved = true;
            const newLatLng = map.mouseEventToLatLng(e);
            this.routePoints[nodeIndex] = newLatLng;
            marker.setLatLng(newLatLng);
            this.updateRoutePolyline();
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            // Re-enable map dragging if we disabled it
            if (dragStarted) {
                this.map.dragging.enable();
            }
            
            // Only process drag if the node actually moved
            if (hasMoved && dragStarted) {
                // Update elevation for moved point
                this.updateElevationForMovedNode(nodeIndex).then(() => {
                    this.updateStats();
                    this.updatePaceChart();
                    this.saveState();
                });
            }
            
            // Clear flags after a short delay
            setTimeout(() => {
                this.isDragging = false;
                this.markerClickInProgress = false;
            }, 50);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    async updateElevationForMovedNode(nodeIndex) {
        try {
            const point = this.routePoints[nodeIndex];
            const elevation = await this.fetchRealElevation(point);
            this.elevationData[nodeIndex] = elevation;
        } catch (error) {
            console.error('Failed to fetch elevation for moved node:', error);
            throw new Error('Unable to fetch elevation data. Please check your internet connection.');
        }
    }

    updateRoutePolyline() {
        if (this.routePoints.length > 1) {
            // Convert route points to GeoJSON LineString coordinates [lng, lat]
            const coordinates = this.routePoints.map(point => [point.lng, point.lat]);
            
            // Update the route source data
            if (this.map.getSource('route')) {
                this.map.getSource('route').setData({
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': coordinates
                    }
                });
            }
        } else {
            // Clear the route if less than 2 points
            if (this.map.getSource('route')) {
                this.map.getSource('route').setData({
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': []
                    }
                });
            }
        }
    }

    calculateDistance() {
        if (this.routePoints.length < 2) return 0;

        let totalDistance = 0;
        for (let i = 1; i < this.routePoints.length; i++) {
            const prev = this.routePoints[i - 1];
            const curr = this.routePoints[i];
            totalDistance += this.getDistanceBetweenPoints(prev, curr);
        }
        return totalDistance / 1000; // Convert to km
    }

    getDistanceBetweenPoints(latlng1, latlng2) {
        const R = 6371000; // Earth's radius in meters
        const lat1Rad = latlng1.lat * Math.PI / 180;
        const lat2Rad = latlng2.lat * Math.PI / 180;
        const deltaLatRad = (latlng2.lat - latlng1.lat) * Math.PI / 180;
        const deltaLngRad = (latlng2.lng - latlng1.lng) * Math.PI / 180;

        const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
                  Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                  Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    calculateDuration() {
        const distance = this.calculateDistance();
        const pace = parseFloat(document.getElementById('pace-slider').value);
        return (distance * pace) / 60; // Convert seconds to minutes
    }

    formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = Math.floor(minutes % 60);
        const secs = Math.floor((minutes % 1) * 60);
        
        if (hours > 0) {
            return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
    }

    updateStats() {
        const distance = this.calculateDistance();
        const duration = this.calculateDuration();
        const paceSeconds = parseFloat(document.getElementById('pace-slider').value);

        document.getElementById('distance-value').textContent = distance.toFixed(2) + ' km';
        document.getElementById('duration-value').textContent = this.formatDuration(duration);
        document.getElementById('pace-value').textContent = this.formatPace(paceSeconds);
        
        // Calculate real elevation gain from elevation data
        const elevationGain = this.calculateElevationGain();
        document.getElementById('elevation-value').textContent = elevationGain + 'm';
        
        // Update GPX button state
        this.updateGPXButtonState();
    }

    updateGPXButtonState() {
        const gpxButton = document.getElementById('generate-gpx-btn');
        if (!gpxButton) return; // Button might not exist yet
        
        const loadingCount = this.elevationLoadingStates.filter(loading => loading).length;
        
        if (loadingCount > 0) {
            gpxButton.classList.add('gpx-btn-disabled');
            gpxButton.title = `Please wait, fetching elevation data...`;
        } else {
            gpxButton.classList.remove('gpx-btn-disabled');
            gpxButton.title = 'Download your route as a GPX file';
        }
    }

    async getElevationForPoint(latlng) {
        try {
            const elevation = await this.fetchRealElevation(latlng);
            this.elevationData.push(elevation);
        } catch (error) {
            console.error('Failed to fetch elevation data:', error);
            throw new Error('Unable to fetch elevation data. Please check your internet connection.');
        }
    }

    async fetchRealElevation(latlng) {
        const lat = latlng.lat.toFixed(6);
        const lng = latlng.lng.toFixed(6);
        
        const response = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.reason || 'Unknown elevation API error');
        }
        
        if (!data.elevation || data.elevation.length === 0) {
            throw new Error('No elevation data returned');
        }
        
        return Math.round(data.elevation[0]);
    }

    async fetchBatchElevations(latlngs) {
        if (!latlngs || latlngs.length === 0) return [];
        
        // Open-Meteo supports up to 100 coordinates at once
        const batchSize = 100;
        const results = [];
        
        for (let i = 0; i < latlngs.length; i += batchSize) {
            const batch = latlngs.slice(i, i + batchSize);
            const latitudes = batch.map(ll => ll.lat.toFixed(6)).join(',');
            const longitudes = batch.map(ll => ll.lng.toFixed(6)).join(',');
            
            const response = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${latitudes}&longitude=${longitudes}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.reason || 'Unknown elevation API error');
            }
            
            if (!data.elevation || data.elevation.length !== batch.length) {
                throw new Error('Elevation data count mismatch');
            }
            
            results.push(...data.elevation.map(elev => Math.round(elev)));
        }
        
        return results;
    }

    calculateElevationGain() {
        if (this.elevationData.length < 2) return 0;
        
        // Filter out null values (still loading)
        const validElevations = [];
        for (let i = 0; i < this.elevationData.length; i++) {
            if (this.elevationData[i] !== null && this.elevationData[i] !== undefined) {
                validElevations.push(this.elevationData[i]);
            }
        }
        
        if (validElevations.length < 2) return 0;
        
        let totalGain = 0;
        const smoothingThreshold = 3; // Count elevation changes > 3m (filter GPS noise)
        
        for (let i = 1; i < validElevations.length; i++) {
            const gain = validElevations[i] - validElevations[i - 1];
            if (gain > smoothingThreshold) {
                totalGain += gain;
            }
        }
        
        return Math.round(totalGain);
    }

    formatPace(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    updatePaceDisplay(value) {
        const paceSeconds = parseFloat(value);
        document.getElementById('pace-display').textContent = this.formatPace(paceSeconds) + ' /km';
    }

    updateConsistencyDisplay(value) {
        document.getElementById('consistency-display').textContent = value + '%';
        const note = document.querySelector('.consistency-note');
        if (value == 0) {
            note.textContent = 'Constant pace throughout the run (most efficient)';
        } else if (value < 20) {
            note.textContent = 'Very consistent pacing';
        } else if (value < 40) {
            note.textContent = 'Moderate pace variation';
        } else {
            note.textContent = 'High pace variation (less efficient)';
        }
    }

    initializePaceChart() {
        const ctx = document.getElementById('pace-chart').getContext('2d');
        this.paceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Pace (min/km)',
                    data: [],
                    borderColor: '#ff5722',
                    backgroundColor: 'rgba(255, 87, 34, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 0,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Distance (km)',
                            color: '#7f8c8d'
                        },
                        grid: {
                            color: 'rgba(127, 140, 141, 0.2)'
                        }
                    },
                    y: {
                        title: {
                            display: false
                        },
                        min: 0,
                        max: 8,
                        grid: {
                            color: 'rgba(127, 140, 141, 0.2)'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    updatePaceChart() {
        if (!this.paceChart || this.routePoints.length < 2) return;

        const distance = this.calculateDistance();
        const basePaceSeconds = parseFloat(document.getElementById('pace-slider').value);
        const consistency = parseInt(document.getElementById('consistency-slider').value);
        
        // Generate pace data points
        const labels = [];
        const paceData = [];
        const numPoints = 50; // Number of points for smooth curve
        
        for (let i = 0; i <= numPoints; i++) {
            const distancePoint = (distance * i) / numPoints;
            labels.push(distancePoint.toFixed(2));
            
            let currentPaceSeconds = basePaceSeconds;
            
            // Only add variation if consistency > 0
            if (consistency > 0) {
                const variation = consistency / 100;
                const paceVariation = 1 + (Math.sin(i * 0.3) * 0.3 + (Math.random() - 0.5)) * variation;
                currentPaceSeconds = Math.max(180, Math.min(720, basePaceSeconds * paceVariation)); // 3:00 to 12:00 range
            }
            
            const currentPaceMinutes = currentPaceSeconds / 60; // Convert to minutes for chart display
            paceData.push(currentPaceMinutes);
        }

        this.paceChart.data.labels = labels;
        this.paceChart.data.datasets[0].data = paceData;
        this.paceChart.update();

        // Update average pace display
        document.getElementById('chart-average-pace').textContent = this.formatPace(basePaceSeconds) + ' /km';
    }

    goToCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                this.userLocation = { lat, lng };
                this.map.jumpTo({
                    center: [lng, lat],
                    zoom: 15
                });
                
                // Add a marker for current location
                const el = document.createElement('div');
                el.innerHTML = '<i class="fas fa-location-dot" style="color: #007bff; font-size: 16px;"></i>';
                el.style.fontSize = '16px';
                
                new mapboxgl.Marker(el)
                    .setLngLat([lng, lat])
                    .addTo(this.map);
            }, (error) => {
                console.warn('Unable to get your location:', error);
                // Silently fail on initialization, don't show alert
            });
        }
    }

    async handleGPXImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const gpxText = await file.text();
            const gpxPoints = this.parseGPX(gpxText);
            
            if (gpxPoints.length === 0) {
                alert('No valid track points found in GPX file');
                return;
            }

            // Clear existing route
            this.clearRoute();

            // Add imported points to route
            const pointsNeedingElevation = [];
            for (const point of gpxPoints) {
                this.routePoints.push({ lat: point.lat, lng: point.lng });
                
                if (point.elevation !== null && point.elevation !== undefined) {
                    this.elevationData.push(Math.round(point.elevation));
                    this.elevationLoadingStates.push(false); // Not loading
                } else {
                    pointsNeedingElevation.push({ lat: point.lat, lng: point.lng, index: this.elevationData.length });
                    this.elevationData.push(null); // Placeholder
                    this.elevationLoadingStates.push(true); // Mark as loading
                }
            }

            // Fetch elevation data for points that don't have it
            if (pointsNeedingElevation.length > 0) {
                try {
                    const elevations = await this.fetchBatchElevations(pointsNeedingElevation);
                    for (let i = 0; i < pointsNeedingElevation.length; i++) {
                        const index = pointsNeedingElevation[i].index;
                        this.elevationData[index] = elevations[i];
                        this.elevationLoadingStates[index] = false; // Mark as loaded
                    }
                } catch (error) {
                    console.error('Failed to fetch elevation data for GPX import:', error);
                    this.showElevationError();
                    // Fill missing elevation data with reasonable defaults
                    for (const point of pointsNeedingElevation) {
                        if (this.elevationData[point.index] === null) {
                            this.elevationData[point.index] = 100; // Default elevation
                            this.elevationLoadingStates[point.index] = false; // Mark as loaded (with default)
                        }
                    }
                }
            }
            
            // Recreate markers with proper styling
            this.selectedNodeIndex = -1; // Clear selection for imported route
            this.recreateMarkers();

            // Update route display
            this.updateRoutePolyline();
            this.updateStats();
            this.updatePaceChart();

            // Fit map to show entire imported route
            if (this.routePoints.length > 0) {
                const bounds = new mapboxgl.LngLatBounds();
                this.routePoints.forEach(point => {
                    bounds.extend([point.lng, point.lat]);
                });
                this.map.fitBounds(bounds, { padding: 50 });
            }

            // Update run name with imported file name
            const fileName = file.name.replace('.gpx', '');
            document.getElementById('run-name').value = fileName;

            this.saveState();

            alert(`Successfully imported ${gpxPoints.length} points from ${file.name}`);
            
        } catch (error) {
            console.error('Error importing GPX:', error);
            alert('Error reading GPX file. Please make sure it\'s a valid GPX file.');
        }

        // Clear file input
        event.target.value = '';
    }

    parseGPX(gpxText) {
        const parser = new DOMParser();
        const gpxDoc = parser.parseFromString(gpxText, 'text/xml');
        
        // Check for parsing errors
        const parserError = gpxDoc.querySelector('parsererror');
        if (parserError) {
            throw new Error('Invalid XML in GPX file');
        }

        const trackPoints = gpxDoc.querySelectorAll('trkpt');
        const points = [];

        trackPoints.forEach(trkpt => {
            const lat = parseFloat(trkpt.getAttribute('lat'));
            const lon = parseFloat(trkpt.getAttribute('lon'));
            
            if (isNaN(lat) || isNaN(lon)) return;

            const eleElement = trkpt.querySelector('ele');
            const elevation = eleElement ? parseFloat(eleElement.textContent) : null;

            points.push({
                lat: lat,
                lng: lon,
                elevation: elevation
            });
        });

        return points;
    }



    async getRoutedPath(points) {
        if (points.length < 2) return null;

        try {
            // Build coordinates string for OSRM
            const coordinates = points.map(p => `${p.lng},${p.lat}`).join(';');
            
            // Use OSRM public API for routing
            const response = await fetch(
                `https://router.project-osrm.org/route/v1/foot/${coordinates}?steps=true&geometries=geojson&overview=full`,
                { timeout: 10000 }
            );

            if (!response.ok) {
                throw new Error(`OSRM API responded with ${response.status}`);
            }

            const data = await response.json();
            
            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const geometry = route.geometry;
                
                if (geometry && geometry.coordinates) {
                    // Convert coordinates to route points
                    const routedPoints = geometry.coordinates.map(coord => ({
                        lat: coord[1],
                        lng: coord[0],
                        elevation: null // Will be fetched later if needed
                    }));

                    // For auto-align, we want more detail to follow roads closely
                    // Simplify route if too many points, but keep more points for road following
                    const maxPoints = 25; // Reduced from 50 for better road following
                    if (routedPoints.length > maxPoints) {
                        const step = Math.floor(routedPoints.length / maxPoints);
                        const simplified = routedPoints.filter((_, index) => index % step === 0);
                        // Always include the last point
                        if (simplified[simplified.length - 1] !== routedPoints[routedPoints.length - 1]) {
                            simplified.push(routedPoints[routedPoints.length - 1]);
                        }
                        return simplified;
                    }

                    return routedPoints;
                }
            }
        } catch (error) {
            console.warn('OSRM routing failed:', error);
            return null;
        }

        return null;
    }



    toggleAutoAlignToRoad() {
        this.autoAlignToRoad = !this.autoAlignToRoad;
        const btn = document.getElementById('align-to-road-btn');
        
        if (this.autoAlignToRoad) {
            btn.innerHTML = '<i class="fas fa-road"></i> Auto-Align: ON';
            btn.style.backgroundColor = '#ff5722';
            btn.style.color = 'white';
        } else {
            btn.innerHTML = '<i class="fas fa-road"></i> Align to Road';
            btn.style.backgroundColor = '';
            btn.style.color = '';
        }

        // Handle tutorial progression
        if (this.currentTutorialAction === 'waitForAlignClick') {
            this.currentTutorialAction = null;
            setTimeout(() => this.showTutorialStep4(), 300);
        }
    }

    async addRoutedPoint(targetPoint) {
        // Show visual feedback that routing is happening
        const alignBtn = document.getElementById('align-to-road-btn');
        const originalText = alignBtn.innerHTML;
        alignBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Routing...';
        alignBtn.disabled = true;
        
        try {
            const lastPoint = this.routePoints[this.routePoints.length - 1];
            const routedPath = await this.getRoutedPath([lastPoint, targetPoint]);
            
            if (routedPath && routedPath.length > 1) {
                // Remove the first point since it's already in our route
                const newPoints = routedPath.slice(1);
                
                // Add all routed points immediately for instant feedback
                // but mark them to be skipped by the individual background fetch
                for (let i = 0; i < newPoints.length; i++) {
                    await this.addRoutePoint({ lat: newPoints[i].lat, lng: newPoints[i].lng }, true);
                }
                
                // Fetch elevation data in a single background batch
                const startIndex = this.routePoints.length - newPoints.length;
                this.fetchBatchElevationsInBackground(newPoints, startIndex);

            } else {
                // Fallback: could not route, add single point with background fetch
                await this.addRoutePoint(targetPoint);
                console.log('Used simulated road alignment for single point');
            }
        } catch (error) {
            console.warn('Routed point addition failed, adding original point:', error);
            // Fallback to adding the original point if routing fails
            await this.addRoutePoint(targetPoint); // This will save state via its background fetch
        } finally {
            // Restore button state
            alignBtn.innerHTML = originalText;
            alignBtn.disabled = false;
        }
    }

    async fetchBatchElevationsInBackground(points, startIndex) {
        try {
            const elevations = await this.fetchBatchElevations(points);
            
            // Update elevation data for all routed points
            for (let i = 0; i < points.length; i++) {
                this.elevationData[startIndex + i] = elevations[i];
                this.elevationLoadingStates[startIndex + i] = false;
            }
        } catch (error) {
            console.error('Failed to fetch elevation data for routed points:', error);
            this.showElevationError();
            
            // Use default elevation for failed points
            for (let i = 0; i < points.length; i++) {
                if (this.elevationData[startIndex + i] === null) {
                    this.elevationData[startIndex + i] = 100; // Default
                    this.elevationLoadingStates[startIndex + i] = false;
                }
            }
        } finally {
            // After batch is complete (success or fail), update UI and save state
            this.recreateMarkers();
            this.updateStats();
            this.updatePaceChart();
            this.saveState();
        }
    }
    
    clearRoute() {
        this.routePoints = [];
        this.elevationData = [];
        this.elevationLoadingStates = [];
        
        // Remove all Mapbox markers
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
        
        // Clear the route source
        this.updateRoutePolyline();
        
        this.updateStats();
        this.updatePaceChart();
        
        this.selectedNodeIndex = -1;
        
        // Exit editing mode and auto-align when clearing
        if (this.isEditingNodes) {
            this.isEditingNodes = false;
            const btn = document.getElementById('edit-nodes-btn');
            btn.innerHTML = '<i class="fas fa-edit"></i> Edit Nodes';
            btn.style.backgroundColor = '';
            btn.style.color = '';
        }
        
        // Turn off auto-align when clearing
        if (this.autoAlignToRoad) {
            this.toggleAutoAlignToRoad();
        }

        this.saveState();
    }

    generateGPX() {
        if (this.routePoints.length < 2) {
            alert('Please add at least 2 points to generate a route');
            return;
        }

        // Check if any elevations are still loading
        const loadingCount = this.elevationLoadingStates.filter(loading => loading).length;
        if (loadingCount > 0) {
            alert(`Please wait for elevation data to load (${loadingCount} points remaining). You can download GPX once all elevations are ready.`);
            return;
        }

        const runName = document.getElementById('run-name').value || 'Generated Run';
        const runDate = new Date(document.getElementById('run-date').value || new Date());
        const pace = parseFloat(document.getElementById('pace-slider').value);
        const consistency = parseInt(document.getElementById('consistency-slider').value);
        const distance = this.calculateDistance();
        
        console.log('GPX Generation Settings:');
        console.log('- Pace:', this.formatPace(pace), `(${pace} seconds)`);
        console.log('- Consistency:', consistency + '%');
        console.log('- Distance:', distance.toFixed(3) + ' km');
        console.log('- Expected Duration:', this.formatDuration(this.calculateDuration()));
        
        const gpxData = this.createGPXData(runName, runDate, pace, consistency);
        this.downloadGPX(gpxData, runName);
    }

    createGPXData(runName, runDate, pace, consistency) {
        const activityType = 'Running'; // Always running now
        const startTime = new Date(runDate);
        
        // Generate detailed track points between route points
        const detailedPoints = this.generateDetailedTrackPoints(pace, consistency);
        
        let trackPoints = '';
        let cumulativeTime = 0; // Track cumulative time in seconds
        
        detailedPoints.forEach((point, index) => {
            // Use interpolated elevation data based on route progress
            const elevation = this.getInterpolatedElevation(index, detailedPoints.length);
            
            // Calculate exact timestamp for this point
            const currentTime = new Date(startTime.getTime() + cumulativeTime * 1000);
            
            trackPoints += `      <trkpt lat="${point.lat.toFixed(6)}" lon="${point.lng.toFixed(6)}">
        <ele>${elevation.toFixed(1)}</ele>
        <time>${currentTime.toISOString()}</time>
      </trkpt>
`;
            
            // Add time increment for next point (but not for the last point)
            if (index < detailedPoints.length - 1) {
                const timeIncrement = this.calculateTimeIncrement(index + 1, detailedPoints, pace, consistency);
                cumulativeTime += timeIncrement;
            }
        });

        return `<?xml version="1.0" encoding="UTF-8"?>
<gpx
  version="1.1"
  creator="Apple Fitness"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns="http://www.topografix.com/GPX/1/1"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"
  xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
  <metadata>
    <name><![CDATA[${runName}]]></name>
    <desc></desc>
    <time>${runDate.toISOString()}</time>
  </metadata>
  <trk>
    <name><![CDATA[${runName}]]></name>
    <desc></desc>
    <type>${activityType}</type>
    <trkseg>
${trackPoints}    </trkseg>
  </trk>
</gpx>`;
    }

    generateDetailedTrackPoints(pace, consistency) {
        const detailedPoints = [];
        
        // Use time-based point generation instead of distance-based
        // This ensures consistent time intervals for smooth pacing
        const totalDistance = this.calculateDistance() * 1000; // Convert to meters
        const totalTimeSeconds = (totalDistance / 1000) * pace;
        
        // Generate a point every 3-5 seconds for optimal GPS tracking simulation
        const timeInterval = 4; // seconds between points
        const numPoints = Math.ceil(totalTimeSeconds / timeInterval);
        
        let cumulativeDistance = 0;
        let segmentIndex = 0;
        let segmentProgress = 0;
        
        for (let i = 0; i < numPoints; i++) {
            // Calculate expected distance at this time point
            const timeProgress = i / (numPoints - 1);
            const targetDistance = timeProgress * totalDistance;
            
            // Find which route segment we should be in
            while (segmentIndex < this.routePoints.length - 1) {
                const segmentStart = this.routePoints[segmentIndex];
                const segmentEnd = this.routePoints[segmentIndex + 1];
                const segmentDistance = this.getDistanceBetweenPoints(segmentStart, segmentEnd);
                
                if (cumulativeDistance + segmentDistance >= targetDistance) {
                    // We're in this segment
                    segmentProgress = (targetDistance - cumulativeDistance) / segmentDistance;
                    break;
                } else {
                    // Move to next segment
                    cumulativeDistance += segmentDistance;
                    segmentIndex++;
                }
            }
            
            // Interpolate position within the current segment
            if (segmentIndex < this.routePoints.length - 1) {
                const segmentStart = this.routePoints[segmentIndex];
                const segmentEnd = this.routePoints[segmentIndex + 1];
                
                const lat = segmentStart.lat + (segmentEnd.lat - segmentStart.lat) * segmentProgress;
                const lng = segmentStart.lng + (segmentEnd.lng - segmentStart.lng) * segmentProgress;
                
                // Add realistic GPS accuracy variation (±3 meters)
                const gpsAccuracy = 0.000027; // ~3 meters
                const actualLat = lat + (Math.random() - 0.5) * gpsAccuracy;
                const actualLng = lng + (Math.random() - 0.5) * gpsAccuracy;
                
                detailedPoints.push({ 
                    lat: actualLat, 
                    lng: actualLng,
                    timeIndex: i,
                    targetTime: i * timeInterval
                });
            }
        }
        
        return detailedPoints;
    }

    calculateTimeIncrement(index, points, pace, consistency) {
        if (index === 0) return 0;
        
        const currPoint = points[index];
        
        // Use the pre-calculated target time from point generation
        if (currPoint.targetTime !== undefined) {
            const prevPoint = points[index - 1];
            const baseTimeInterval = currPoint.targetTime - (prevPoint.targetTime || 0);
            
            // Apply smooth consistency variation if enabled
            let timeInterval = baseTimeInterval;
            if (consistency > 0) {
                // Use sine wave for smooth pace variation instead of random
                const variation = consistency / 100;
                const wavePosition = (index / points.length) * Math.PI * 2; // Full wave across route
                const paceMultiplier = 1 + (Math.sin(wavePosition) * variation * 0.3); // Smooth variation
                timeInterval = baseTimeInterval * paceMultiplier;
            }
            
            // Ensure reasonable bounds (no stopping, no sprinting)
            return Math.max(1, Math.min(10, timeInterval));
        }
        
        // Fallback to distance-based calculation (shouldn't be needed)
        const prevPoint = points[index - 1];
        const distance = this.getDistanceBetweenPoints(prevPoint, currPoint);
        const baseTime = (distance / 1000) * pace;
        
        return Math.max(2, baseTime); // Minimum 2 seconds between points
    }

    getInterpolatedElevation(pointIndex, totalPoints) {
        if (this.elevationData.length === 0) {
            return 100; // Fallback to realistic base elevation
        }
        
        if (this.elevationData.length === 1) {
            // Add minimal GPS noise to single point
            return this.elevationData[0] + (Math.random() - 0.5) * 2;
        }
        
        // Smooth interpolation between route points for GPS simulation
        const progress = Math.max(0, Math.min(1, pointIndex / (totalPoints - 1)));
        const elevationIndex = progress * (this.elevationData.length - 1);
        const lowerIndex = Math.floor(elevationIndex);
        const upperIndex = Math.min(lowerIndex + 1, this.elevationData.length - 1);
        const ratio = elevationIndex - lowerIndex;
        
        // Linear interpolation between elevation points
        const interpolatedElevation = this.elevationData[lowerIndex] + 
            (this.elevationData[upperIndex] - this.elevationData[lowerIndex]) * ratio;
        
        // Add realistic GPS elevation noise (±1-2m)
        const gpsNoise = (Math.random() - 0.5) * 2;
        
        return Math.round(interpolatedElevation + gpsNoise);
    }

    downloadGPX(gpxData, fileName) {
        const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.gpx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    exportToStrava() {
        // Open Strava upload page in new tab
        window.open('https://www.strava.com/upload/select', '_blank');
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.fakeMyRun = new FakeMyRun();
});

