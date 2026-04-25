import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/sensor_data.dart';
import '../services/database_service.dart';

class AlertsTab extends StatelessWidget {
  const AlertsTab({super.key});

  @override
  Widget build(BuildContext context) {
    final db = DatabaseService();

    return SafeArea(
      child: StreamBuilder<SensorData>(
        stream: db.sensorDataStream,
        builder: (context, snap) {
          final alerts = <_AlertItem>[];
          if (snap.hasData) {
            final d = snap.data!;
            if (d.mq2 > 700) {
              alerts.add(_AlertItem(title: 'Critical Gas Level', message: 'MQ2 reading: ${d.mq2.toStringAsFixed(0)} — Dangerous levels detected!', severity: 'CRITICAL', icon: Icons.local_fire_department_rounded, time: d.timestamp));
            } else if (d.mq2 > 400) {
              alerts.add(_AlertItem(title: 'Elevated Gas Level', message: 'MQ2 reading: ${d.mq2.toStringAsFixed(0)} — Monitor closely.', severity: 'WARNING', icon: Icons.local_fire_department_rounded, time: d.timestamp));
            }
            if (d.mq135 > 300) {
              alerts.add(_AlertItem(title: 'Poor Air Quality', message: 'MQ135 reading: ${d.mq135.toStringAsFixed(0)} — Open windows for ventilation.', severity: 'CRITICAL', icon: Icons.air_rounded, time: d.timestamp));
            } else if (d.mq135 > 200) {
              alerts.add(_AlertItem(title: 'Degraded Air Quality', message: 'MQ135 reading: ${d.mq135.toStringAsFixed(0)} — Consider ventilation.', severity: 'WARNING', icon: Icons.air_rounded, time: d.timestamp));
            }
            if (d.temperature > 50) {
              alerts.add(_AlertItem(title: 'Extreme Temperature', message: 'Temperature: ${d.temperature.toStringAsFixed(1)}°C — Critical heat level!', severity: 'CRITICAL', icon: Icons.thermostat_rounded, time: d.timestamp));
            } else if (d.temperature > 40) {
              alerts.add(_AlertItem(title: 'High Temperature', message: 'Temperature: ${d.temperature.toStringAsFixed(1)}°C — Above normal range.', severity: 'WARNING', icon: Icons.thermostat_rounded, time: d.timestamp));
            }
            if (d.humidity > 80) {
              alerts.add(_AlertItem(title: 'High Humidity', message: 'Humidity: ${d.humidity.toStringAsFixed(1)}% — May cause discomfort.', severity: 'INFO', icon: Icons.water_drop_rounded, time: d.timestamp));
            }
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Alerts', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Color(0xFF1A1A2E))),
                const SizedBox(height: 4),
                Text('Real-time notifications', style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
                const SizedBox(height: 24),

                if (!snap.hasData)
                  const Center(child: Padding(
                    padding: EdgeInsets.all(40),
                    child: CircularProgressIndicator(color: Color(0xFF1A73E8)),
                  ))
                else if (alerts.isEmpty)
                  _buildEmptyState()
                else
                  ...alerts.map((a) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _buildAlertCard(a),
                  )),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
      ),
      child: Column(
        children: [
          Container(
            width: 72, height: 72,
            decoration: BoxDecoration(
              color: const Color(0xFF43A047).withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Icon(Icons.check_circle_rounded, color: Color(0xFF43A047), size: 36),
          ),
          const SizedBox(height: 20),
          const Text('All Clear!', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFF1A1A2E))),
          const SizedBox(height: 8),
          Text('No alerts at this time. All sensor readings are within normal range.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Colors.grey.shade500, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _buildAlertCard(_AlertItem alert) {
    final colors = _severityColors(alert.severity);
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: colors.$1.withOpacity(0.3), width: 1),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8)],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
              color: colors.$1.withOpacity(0.1),
              borderRadius: BorderRadius.circular(13),
            ),
            child: Icon(alert.icon, color: colors.$1, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(child: Text(alert.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Color(0xFF1A1A2E)))),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: colors.$1.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(alert.severity, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: colors.$1)),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(alert.message, style: TextStyle(fontSize: 13, color: Colors.grey.shade600, height: 1.3)),
                const SizedBox(height: 6),
                Text(DateFormat('HH:mm:ss').format(alert.time), style: TextStyle(fontSize: 11, color: Colors.grey.shade400)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  (Color, Color) _severityColors(String severity) {
    switch (severity) {
      case 'CRITICAL': return (const Color(0xFFE53935), const Color(0xFFFFCDD2));
      case 'WARNING': return (const Color(0xFFFFA726), const Color(0xFFFFE0B2));
      default: return (const Color(0xFF42A5F5), const Color(0xFFBBDEFB));
    }
  }
}

class _AlertItem {
  final String title, message, severity;
  final IconData icon;
  final DateTime time;

  _AlertItem({required this.title, required this.message, required this.severity, required this.icon, required this.time});
}
