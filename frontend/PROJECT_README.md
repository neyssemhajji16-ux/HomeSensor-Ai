# IoT Monitoring System Dashboard

## Overview
This is a comprehensive web dashboard for monitoring an IoT intelligent building system with ESP32 sensors. The system tracks temperature, humidity, and gas levels across different zones in real-time.

## Features

### 📊 Dashboard Overview
- Real-time sensor data display with auto-refresh every 3 seconds
- Key performance indicators (KPIs) showing active sensors, alerts, system health, and AI predictions
- Historical data visualization with line and area charts
- Recent alerts panel with acknowledge/dismiss functionality
- AI prediction summaries

### 📡 Sensor Management
- Complete sensor inventory with detailed metrics
- Search and filter capabilities by zone or status
- Status indicators: Normal (green), Warning (orange), Critical (red)
- Individual sensor cards with temperature, humidity, and gas readings

### 🗺️ Interactive Floor Map
- Visual building layout with sensor positions
- Color-coded sensor markers based on status
- Zoom controls for detailed viewing
- Click sensors for detailed information
- Animated pulse effects for warning/critical sensors

### 📈 Analytics & Insights
- Advanced data visualization with multiple chart types
- Time range selection (24 hours, 7 days, 30 days)
- Zone-specific filtering
- Performance radar chart for system metrics
- Temperature, humidity, and gas trend analysis

### 🚨 Alerts & Predictions
- Real-time alert management system
- Alert severity classification (Critical, Warning)
- Acknowledge and dismiss functionality
- AI-powered anomaly predictions with:
  - Probability scores
  - Predicted timeframes
  - Actionable recommendations
- Tabbed interface for active, acknowledged alerts, and predictions

### 📄 PDF Report Generation
- Generate comprehensive PDF reports from any page
- Includes system overview, sensor data, alerts, and predictions
- Timestamped for record-keeping

## Technology Stack

- **React** - UI framework
- **React Router** - Multi-page navigation
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **Motion (Framer Motion)** - Animations
- **jsPDF** - PDF generation
- **Sonner** - Toast notifications

## File Structure

```
/src/app/
├── App.tsx                          # Main application entry
├── routes.ts                        # Route configuration
├── lib/
│   └── mockData.ts                  # Mock sensor data and types
├── components/
│   ├── Sidebar.tsx                  # Navigation sidebar
│   ├── Header.tsx                   # Page header with user profile
│   ├── SensorCard.tsx               # Sensor data display card
│   ├── AIPredictionCard.tsx         # AI prediction display
│   ├── AlertItem.tsx                # Alert notification item
│   └── ui/                          # Reusable UI components
└── pages/
    ├── Dashboard.tsx                # Main dashboard page
    ├── Sensors.tsx                  # Sensor management page
    ├── FloorMap.tsx                 # Interactive floor map page
    ├── Analytics.tsx                # Analytics and charts page
    └── Alerts.tsx                   # Alerts and predictions page
```

## Design System

### Color Palette
- **Primary**: Cyan to Blue gradient (#06b6d4 → #2563eb)
- **Sidebar**: Deep slate gradient (#0f172a → #1e293b)
- **Alerts/Critical**: Red to Orange (#ef4444 → #f97316)
- **AI/Predictions**: Purple to Pink (#a855f7 → #ec4899)
- **Success**: Green (#22c55e)
- **Background**: Light slate (#f8fafc)

### Typography
- Clean, professional sans-serif font
- Font sizes follow a consistent scale
- Proper hierarchy for headings and body text

## Data Structure

### Sensor Data
Each sensor includes:
- `id`: Unique identifier (e.g., ESP32-001)
- `zone`: Location in building
- `temperature`: Current temperature in °C
- `humidity`: Current humidity percentage
- `gasLevel`: Gas concentration in ppm
- `status`: Normal, Warning, or Critical
- `lastUpdate`: Timestamp of last reading
- `position`: X/Y coordinates for floor map

### Alerts
- `id`: Unique alert identifier
- `sensorId`: Associated sensor
- `zone`: Location
- `type`: Temperature, Humidity, or Gas
- `severity`: Warning or Critical
- `message`: Descriptive alert text
- `timestamp`: When alert was triggered
- `acknowledged`: Acknowledgment status

### AI Predictions
- `sensorId`: Sensor being analyzed
- `zone`: Location
- `predictedAnomaly`: Description of potential issue
- `probability`: Confidence score (0-100%)
- `timeframe`: When anomaly may occur
- `recommendation`: Suggested actions

## Customization

### Adding New Sensors
Edit `/src/app/lib/mockData.ts` and add new sensor objects to the `mockSensors` array.

### Modifying Thresholds
Adjust status conditions in the sensor data generation logic.

### Changing Colors
Update the gradient classes in component files or modify the theme in `/src/styles/theme.css`.

### Adding New Pages
1. Create new page component in `/src/app/pages/`
2. Add route in `/src/app/routes.ts`
3. Add navigation link in `/src/app/components/Sidebar.tsx`

## Real-Time Features

The dashboard simulates real-time updates by:
- Updating sensor readings every 3 seconds
- Generating realistic fluctuations in temperature, humidity, and gas levels
- Maintaining sensor status based on threshold values

## PDF Export

PDF reports can be generated from:
- Dashboard: Complete system overview
- Analytics: Performance metrics and trends
- Alerts: Current alerts and predictions

Reports include timestamps, sensor data, and relevant visualizations.

## Future Enhancements

Potential improvements for production use:
- Connect to real ESP32 sensors via WebSocket or REST API
- Add user authentication and role-based access
- Implement historical data storage with database
- Add email/SMS notifications for critical alerts
- Create custom alert rules and thresholds
- Add sensor calibration and maintenance tracking
- Implement data export in multiple formats (CSV, Excel)
- Add multi-building/multi-floor support

## Notes

This is a frontend demonstration using mock data. In a production environment, you would:
- Replace mock data with real API calls to your backend
- Implement proper authentication and security
- Add data persistence with a database (e.g., PostgreSQL, MongoDB)
- Set up WebSocket connections for true real-time updates
- Deploy the AI model for actual anomaly prediction
- Add proper error handling and loading states

---

**Developed for Final Year Engineering Project (PFE)**
**IoT Intelligent Monitoring System**
