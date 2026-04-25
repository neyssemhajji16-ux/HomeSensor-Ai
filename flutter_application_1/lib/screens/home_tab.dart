import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/sensor_data.dart';
import '../models/device_status.dart';
import '../services/auth_service.dart';
import '../services/database_service.dart';

class HomeTab extends StatelessWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context) {
    final db = DatabaseService();
    final auth = Provider.of<AuthService>(context, listen: false);

    return SafeArea(
      child: CustomScrollView(
        slivers: [
          // ─── Header ─────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Hello, ${auth.displayName} 👋',
                          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Color(0xFF1A1A2E)),
                        ),
                        const SizedBox(height: 4),
                        Text(DateFormat('EEEE, MMMM d').format(DateTime.now()),
                          style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
                        ),
                      ],
                    ),
                  ),
                  // Live indicator
                  StreamBuilder<bool>(
                    stream: db.connectionStream,
                    builder: (context, snap) {
                      final isOnline = snap.data ?? false;
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isOnline ? const Color(0xFF4CAF50).withOpacity(0.1) : Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 8, height: 8,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: isOnline ? const Color(0xFF4CAF50) : Colors.red,
                              ),
                            ),
                            const SizedBox(width: 6),
                            Text(isOnline ? 'LIVE' : 'OFFLINE',
                              style: TextStyle(
                                fontSize: 11, fontWeight: FontWeight.w700,
                                color: isOnline ? const Color(0xFF4CAF50) : Colors.red,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                  const SizedBox(width: 8),
                  // Logout
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white, borderRadius: BorderRadius.circular(14),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.logout_rounded, color: Color(0xFF1A1A2E), size: 22),
                      onPressed: () => auth.signOut(),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ─── System Status Card ─────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: StreamBuilder<SensorData>(
                stream: db.sensorDataStream,
                builder: (context, snap) {
                  final status = snap.data?.systemStatus ?? 'SAFE';
                  final colors = _statusColors(status);
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 500),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(colors: colors),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [BoxShadow(color: colors.first.withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 6))],
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 56, height: 56,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Icon(_statusIcon(status), color: Colors.white, size: 28),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('System Status', style: TextStyle(color: Colors.white70, fontSize: 13)),
                              const SizedBox(height: 4),
                              Text(status, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: 1)),
                            ],
                          ),
                        ),
                        Icon(Icons.shield_rounded, color: Colors.white.withOpacity(0.3), size: 40),
                      ],
                    ),
                  );
                },
              ),
            ),
          ),

          // ─── Quick Sensors ──────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: const Text('Sensor Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF1A1A2E))),
            ),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 130,
              child: StreamBuilder<SensorData>(
                stream: db.sensorDataStream,
                builder: (context, snap) {
                  if (!snap.hasData) return const Center(child: CircularProgressIndicator());
                  final d = snap.data!;
                  return ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                    children: [
                      _MiniSensorCard(label: 'Temp', value: '${d.temperature.toStringAsFixed(1)}°C', icon: Icons.thermostat_rounded, color: const Color(0xFFFF7043), percent: d.tempPercent),
                      _MiniSensorCard(label: 'Humidity', value: '${d.humidity.toStringAsFixed(1)}%', icon: Icons.water_drop_rounded, color: const Color(0xFF42A5F5), percent: d.humidityPercent),
                      _MiniSensorCard(label: 'Gas', value: d.mq2.toStringAsFixed(0), icon: Icons.local_fire_department_rounded, color: const Color(0xFFEF5350), percent: d.mq2Percent),
                      _MiniSensorCard(label: 'Air', value: d.mq135.toStringAsFixed(0), icon: Icons.air_rounded, color: const Color(0xFF66BB6A), percent: d.mq135Percent),
                    ],
                  );
                },
              ),
            ),
          ),

          // ─── Device Controls ────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
              child: const Text('Device Controls', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF1A1A2E))),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            sliver: SliverToBoxAdapter(
              child: Column(
                children: [
                  _DeviceControlTile(db: db, deviceId: 'light'),
                  const SizedBox(height: 12),
                  _DeviceControlTile(db: db, deviceId: 'clim'),
                  const SizedBox(height: 12),
                  _DeviceControlTile(db: db, deviceId: 'door'),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Color> _statusColors(String status) {
    switch (status) {
      case 'DANGER': return [const Color(0xFFE53935), const Color(0xFFFF5252)];
      case 'WARNING': return [const Color(0xFFFFA726), const Color(0xFFFFB74D)];
      default: return [const Color(0xFF43A047), const Color(0xFF66BB6A)];
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'DANGER': return Icons.warning_rounded;
      case 'WARNING': return Icons.info_rounded;
      default: return Icons.check_circle_rounded;
    }
  }
}

// ─── Mini Sensor Card (horizontal scroll) ─────────────
class _MiniSensorCard extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  final double percent;

  const _MiniSensorCard({required this.label, required this.value, required this.icon, required this.color, required this.percent});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 120,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const Spacer(),
              Text(label, style: TextStyle(fontSize: 11, color: Colors.grey.shade500, fontWeight: FontWeight.w500)),
            ],
          ),
          const Spacer(),
          Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: color)),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: percent.clamp(0, 1),
              backgroundColor: color.withOpacity(0.1),
              valueColor: AlwaysStoppedAnimation(color),
              minHeight: 4,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Device Control Tile ──────────────────────────────
class _DeviceControlTile extends StatelessWidget {
  final DatabaseService db;
  final String deviceId;

  const _DeviceControlTile({required this.db, required this.deviceId});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DeviceStatus>(
      stream: db.deviceStatusStream(deviceId),
      builder: (context, snap) {
        final device = snap.data ?? DeviceStatus(id: deviceId, status: false);
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: device.status ? device.activeColor.withOpacity(0.08) : Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: device.status ? device.activeColor.withOpacity(0.3) : Colors.grey.shade100, width: 1.5),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 8)],
          ),
          child: Row(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 48, height: 48,
                decoration: BoxDecoration(
                  color: device.status ? device.activeColor.withOpacity(0.15) : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(device.icon, color: device.status ? device.activeColor : Colors.grey.shade400, size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(device.displayName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: Color(0xFF1A1A2E))),
                    const SizedBox(height: 2),
                    Text(device.statusLabel, style: TextStyle(fontSize: 12, color: device.status ? device.activeColor : Colors.grey.shade400, fontWeight: FontWeight.w500)),
                  ],
                ),
              ),
              Transform.scale(
                scale: 0.9,
                child: Switch.adaptive(
                  value: device.status,
                  activeColor: device.activeColor,
                  onChanged: (val) => db.updateDeviceStatus(deviceId, val),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
