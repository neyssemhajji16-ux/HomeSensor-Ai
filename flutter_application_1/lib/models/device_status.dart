import 'package:flutter/material.dart';

class DeviceStatus {
  final String id;
  final bool status;

  DeviceStatus({
    required this.id,
    required this.status,
  });

  factory DeviceStatus.fromMap(String id, dynamic value) {
    return DeviceStatus(
      id: id,
     status: value == true || value.toString().toUpperCase() == 'ON' || value == 1,
    );
  }

  String get displayName {
    switch (id) {
      case 'light': return 'Smart Light';
      case 'clim': return 'Air Conditioner';
      case 'door': return 'Door Lock';
      default: return id;
    }
  }

  IconData get icon {
    switch (id) {
      case 'light': return Icons.lightbulb_rounded;
      case 'clim': return Icons.ac_unit_rounded;
      case 'door': return Icons.door_front_door_rounded;
      default: return Icons.device_unknown;
    }
  }

  Color get activeColor {
    switch (id) {
      case 'light': return const Color(0xFFFFA726);
      case 'clim': return const Color(0xFF42A5F5);
      case 'door': return const Color(0xFF66BB6A);
      default: return Colors.blueGrey;
    }
  }

  String get statusLabel => status ? 'ON' : 'OFF';
}
