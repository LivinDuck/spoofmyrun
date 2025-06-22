# 🏃‍♂️ [SpoofMy.Run](https://spoofmy.run/)

**Open source alternative to Fakemy.run** - Generate GPS data for any route or run :D

Spoof My Run is a web-based tool designed for creating fake GPS running data and generating  GPX files designed to look like real runs. 

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

No build process or package installation required

### GPX Metadata
Modify the creator tag and other metadata in the `createGPXData` function.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

