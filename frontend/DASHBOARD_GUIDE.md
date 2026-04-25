# 🏢 IoT Smart Building Monitoring Dashboard

A modern, professional web dashboard for monitoring ESP32 sensor networks in intelligent buildings.

## 🎯 Project Overview

This dashboard was created for a **Final Year Engineering Project (PFE)** to monitor and analyze IoT sensor data in real-time. It provides comprehensive monitoring of:
- 🌡️ Temperature sensors
- 💧 Humidity sensors  
- 🌫️ Gas level sensors

## ✨ Key Features

### 🏠 Dashboard Overview
- **Real-time monitoring** of all sensors with auto-refresh
- **KPI cards** showing system health at a glance
- **Historical charts** for temperature, humidity, and gas trends
- **Recent alerts** with quick acknowledgment
- **AI prediction summaries** for proactive maintenance

### 📡 Sensor Management
- View all **5 ESP32 sensors** across different zones
- **Search** by sensor ID or zone name
- **Filter** by status (Normal, Warning, Critical)
- Color-coded status indicators
- Live data updates every 3 seconds

### 🗺️ Interactive Floor Map
- **Visual building layout** with sensor positions
- **Clickable sensors** for detailed information
- **Zoom controls** for closer inspection
- **Animated alerts** on critical sensors
- Room labels and color-coded zones

### 📊 Analytics & Insights
- **Multiple chart types**: Line, Area, Bar, Radar
- **Time range selection**: 24h, 7 days, 30 days
- **Zone filtering** for specific areas
- **Performance metrics** visualization
- **Trend analysis** for predictive maintenance

### 🚨 Alerts & AI Predictions
- **Real-time alert notifications**
- **Severity classification**: Critical / Warning
- **Acknowledge and dismiss** capabilities
- **AI-powered predictions** with:
  - Probability scores (0-100%)
  - Predicted timeframes
  - Actionable recommendations
- **Tabbed organization** for easy navigation

### 📄 PDF Report Generation
- **One-click export** from any page
- Includes sensor data, alerts, and predictions
- Timestamped for documentation
- Professional formatting

## 🎨 Design Highlights

### Color Scheme
- **Primary**: Cyan to Blue gradients - Modern and tech-forward
- **Sidebar**: Deep Slate - Professional and sleek
- **Alerts**: Red/Orange - High visibility for critical states
- **AI**: Purple/Pink - Distinctive for machine learning features
- **Success**: Green - Clear positive indicators

### User Experience
- **Smooth animations** using Motion (Framer Motion)
- **Responsive design** for all screen sizes
- **Custom scrollbars** for polish
- **Toast notifications** for user feedback
- **Hover effects** for interactivity

## 🏗️ Technical Architecture

### Frontend Stack
```
React 18.3           - UI Framework
TypeScript           - Type Safety
React Router 7       - Navigation
Tailwind CSS 4       - Styling
Recharts            - Data Visualization
Motion              - Animations
jsPDF               - PDF Generation
Lucide React        - Icons
Sonner              - Notifications
```

### Project Structure
```
src/app/
├── pages/           # Main application pages
├── components/      # Reusable components
├── lib/            # Data and utilities
└── routes.ts       # Navigation configuration
```

## 🚀 Getting Started

The dashboard is ready to use with mock data that simulates real ESP32 sensors. All features are fully functional out of the box.

### Navigation
- **Dashboard** - System overview and KPIs
- **Sensors** - Detailed sensor management
- **Floor Map** - Visual layout with sensor positions
- **Analytics** - Advanced data visualization
- **Alerts** - Alert and prediction management

### Zones Monitored
1. **Server Room** - Critical infrastructure
2. **Laboratory** - Research area
3. **Storage Area** - Inventory management
4. **Production Floor** - Manufacturing zone
5. **Office Area** - Work environment

## 📈 Data Visualization

### Chart Types
- **Line Charts** - Temperature and humidity trends over time
- **Area Charts** - Gas level monitoring with filled areas
- **Bar Charts** - Humidity distribution analysis
- **Radar Charts** - System performance metrics
- **Combined Charts** - Multi-metric comparisons

### Metrics Tracked
- Temperature (°C)
- Humidity (%)
- Gas Level (ppm)
- System Health (%)
- Response Time
- Accuracy
- Uptime

## 🤖 AI Predictions

The AI prediction system analyzes:
- **Historical patterns** from sensor data
- **Current readings** and trends
- **Environmental factors** and correlations

It provides:
- **Anomaly predictions** before they occur
- **Confidence scores** (0-100%)
- **Time estimates** for potential issues
- **Recommended actions** to prevent problems

## 🔔 Alert System

### Alert Types
- **Temperature Alerts** - High/low temperature warnings
- **Humidity Alerts** - Moisture level notifications
- **Gas Alerts** - Air quality warnings

### Severity Levels
- **Critical** (Red) - Immediate action required
- **Warning** (Orange) - Attention needed

### Actions
- **Acknowledge** - Mark as seen
- **Dismiss** - Remove from list
- **Auto-resolve** - After issue is fixed

## 📱 Responsive Design

The dashboard adapts to different screen sizes:
- **Desktop** - Full feature set with optimal layout
- **Tablet** - Adjusted grid layouts
- **Mobile** - Stacked components for easy viewing

## 🔧 Customization

### For Real Deployment
Replace mock data in `/src/app/lib/mockData.ts` with:
- WebSocket connections to ESP32 sensors
- REST API calls to your backend
- Database queries for historical data

### Threshold Configuration
Adjust alert thresholds based on your requirements:
- Temperature limits
- Humidity ranges
- Gas level warnings

## 📝 Notes

- This is a **frontend demonstration** with simulated data
- Real ESP32 integration requires backend API
- AI predictions use mock probability calculations
- PDF exports are client-side generated

## 🎓 Academic Context

This dashboard demonstrates:
- Modern web development practices
- Real-time data visualization
- User experience design
- IoT system integration concepts
- AI/ML application in monitoring

Perfect for demonstrating in your **PFE presentation**!

## 📦 Included Components

- ✅ 5 fully functional pages
- ✅ 7+ reusable components
- ✅ Mock data generator
- ✅ PDF export functionality
- ✅ Real-time updates simulation
- ✅ Interactive visualizations
- ✅ Professional UI/UX

---

**Ready to impress your PFE committee!** 🎉
