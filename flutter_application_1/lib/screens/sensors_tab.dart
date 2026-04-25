import 'package:flutter/material.dart';
import '../models/sensor_data.dart';
import '../services/database_service.dart';

class SensorsTab extends StatelessWidget {
  const SensorsTab({super.key});

  @override
  Widget build(BuildContext context) {
    final db = DatabaseService();

    return SafeArea(
      child: StreamBuilder<SensorData>(
        stream: db.sensorDataStream,
        builder: (context, snap) {
          if (!snap.hasData) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFF1A73E8)));
          }
          final d = snap.data!;
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Sensors', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Color(0xFF1A1A2E))),
                const SizedBox(height: 4),
                Text('Real-time environment data', style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
                const SizedBox(height: 24),
                _SensorDetailCard(
                  title: 'Temperature',
                  value: '${d.temperature.toStringAsFixed(1)}°C',
                  subtitle: d.tempLabel,
                  icon: Icons.thermostat_rounded,
                  color: const Color(0xFFFF7043),
                  percent: d.tempPercent,
                  description: d.temperature > 35 ? 'Above normal! Check ventilation.' : 'Temperature is within safe range.',
                ),
                const SizedBox(height: 16),
                _SensorDetailCard(
                  title: 'Humidity',
                  value: '${d.humidity.toStringAsFixed(1)}%',
                  subtitle: d.humidityLabel,
                  icon: Icons.water_drop_rounded,
                  color: const Color(0xFF42A5F5),
                  percent: d.humidityPercent,
                  description: d.humidity > 70 ? 'High humidity detected.' : 'Humidity levels are comfortable.',
                ),
                const SizedBox(height: 16),
                _SensorDetailCard(
                  title: 'Gas Level (MQ2)',
                  value: d.mq2.toStringAsFixed(0),
                  subtitle: d.mq2 > 400 ? 'Warning' : 'Normal',
                  icon: Icons.local_fire_department_rounded,
                  color: const Color(0xFFEF5350),
                  percent: d.mq2Percent,
                  description: d.mq2 > 400 ? '⚠️ Elevated gas levels detected!' : 'Gas levels are safe.',
                ),
                const SizedBox(height: 16),
                _SensorDetailCard(
                  title: 'Air Quality (MQ135)',
                  value: d.mq135.toStringAsFixed(0),
                  subtitle: d.mq135 > 200 ? 'Poor' : 'Good',
                  icon: Icons.air_rounded,
                  color: const Color(0xFF66BB6A),
                  percent: d.mq135Percent,
                  description: d.mq135 > 200 ? 'Air quality is degraded.' : 'Air quality is good.',
                ),
                const SizedBox(height: 24),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _SensorDetailCard extends StatelessWidget {
  final String title, value, subtitle, description;
  final IconData icon;
  final Color color;
  final double percent;

  const _SensorDetailCard({
    required this.title, required this.value, required this.subtitle,
    required this.icon, required this.color, required this.percent, required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 52, height: 52,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: color, size: 26),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: Color(0xFF1A1A2E))),
                    const SizedBox(height: 2),
                    Text(subtitle, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
              Text(value, style: TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: color)),
            ],
          ),
          const SizedBox(height: 16),
          // Progress bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: percent.clamp(0, 1),
              backgroundColor: color.withOpacity(0.08),
              valueColor: AlwaysStoppedAnimation(color),
              minHeight: 8,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.info_outline_rounded, size: 16, color: Colors.grey.shade400),
              const SizedBox(width: 6),
              Expanded(child: Text(description, style: TextStyle(fontSize: 12, color: Colors.grey.shade500))),
            ],
          ),
        ],
      ),
    );
  }
}
