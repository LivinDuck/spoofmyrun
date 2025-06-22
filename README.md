# 🏃‍♂️ [SpoofMy.Run](https://spoofmy.run/)

**Open source alternative to Fakemy.run** - Generate GPS data for any route or run :D

Spoof My Run is a web-based tool designed for creating fake GPS running data and generating  GPX files designed to look like real runs. 


## ✨ Features

### 🗺️ Interactive Route Creation
- **Point-and-click mapping**: Simply click on the map to create custom routes
- **Road alignment**: Automatically snap routes to actual roads and paths
- **Real-time visualization**: See your route update instantly as you add points
- **GPX import**: Import existing GPX files to modify or extend routes

### 🎯 Advanced Route Editing
- **Node editing mode**: Drag waypoints to fine-tune your route
- **Insert points**: Click on route lines to add intermediate waypoints
- **Undo/Redo system**: Full history tracking for easy route modifications
- **Visual feedback**: Clear markers and highlighting for easy editing

### 📊 Realistic Data Generation
- **Customizable pacing**: Set average pace from 3:00 to 12:00 per kilometer
- **Pace variation**: Add realistic inconsistency to simulate human running patterns
- **Elevation profiles**: Automatic elevation data generation based on geography
- **GPS accuracy simulation**: Realistic GPS drift and accuracy variations

### 📈 Data Visualization
- **Pace charts**: Visual representation of pace variations throughout the run
- **Real-time statistics**: Distance, duration, elevation gain, and average pace
- **Professional presentation**: Clean, modern interface with detailed metrics

### 💾 Export & Integration
- **Professional GPX files**: Generate high-quality GPX files with proper metadata
- **Apple Fitness compatibility**: GPX files appear as created by Apple Fitness
- **Strava integration**: Direct export button to Strava upload page
- **Realistic timestamps**: Proper time progression based on pace and distance

## 🚀 Getting Started

### Quick Start
Use the publically accessable version of the website [here](https://spoofmy.run/), or run it locally
1. Open the application in your web browser
2. Click "Get Started" to begin the interactive tutorial
3. Click on the map to create your first route
4. Customize pace and run details in the right panel
5. Generate and download your GPX file



## 🔧 Installation & Setup

### Local Development
1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/spoof-my-run.git
   cd spoof-my-run
   ```

2. Open `index.html` in your web browser or serve with a local server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   ```

3. Navigate to `http://localhost:8000` in your browser

### Dependencies
All dependencies are loaded via CDN:
- **Leaflet.js** - Interactive mapping
- **Chart.js** - Data visualization
- **Font Awesome** - Icons
- **OpenStreetMap** - Map tiles
- **OSRM** - Routing service

No build process or package installation required!

## 🎨 Customization

### Modifying Pace Ranges
Edit the pace slider ranges in `script.js`:
```javascript
// Current range: 3:00 to 12:00 per km
<input type="range" id="pace-slider" min="180" max="720" step="5" value="330">
```

### Changing Map Providers
Replace the tile layer in `script.js`:
```javascript
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(this.map);
```

### GPX Metadata
Modify the creator tag and other metadata in the `createGPXData` function.

## 🤝 Contributing

Contributions are welcome! This is an open source alternative to commercial fake running tools.

### Feature Ideas
- Additional map providers (Google Maps, Mapbox)
- More activity types (cycling, hiking, walking)
- Advanced elevation profile editing
- Route sharing and saving
- Batch GPX generation
- Integration with more fitness platforms

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

