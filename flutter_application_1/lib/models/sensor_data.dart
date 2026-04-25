class SensorData {
  final double temperature;
  final double humidity;
  final double mq2;
  final double mq135;
  final DateTime timestamp;

  SensorData({
    required this.temperature,
    required this.humidity,
    required this.mq2,
    required this.mq135,
    required this.timestamp,
  });

  factory SensorData.fromMap(Map<dynamic, dynamic> map) {
    return SensorData(
      temperature: (map['temperature'] ?? 0.0).toDouble(),
      humidity: (map['humidity'] ?? 0.0).toDouble(),
      mq2: (map['mq2'] ?? 0.0).toDouble(),
      mq135: (map['mq135'] ?? 0.0).toDouble(),
      timestamp: map['timestamp'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['timestamp'])
          : DateTime.now(),
    );
  }

  /// Overall safety status: SAFE, WARNING, or DANGER
  String get systemStatus {
    if (mq2 > 700 || mq135 > 300 || temperature > 50) return 'DANGER';
    if (mq2 > 400 || mq135 > 200 || temperature > 40 || humidity > 80) return 'WARNING';
    return 'SAFE';
  }

  /// Temperature description
  String get tempLabel {
    if (temperature > 40) return 'Critical';
    if (temperature > 35) return 'Hot';
    if (temperature > 20) return 'Normal';
    return 'Cold';
  }

  /// Humidity description
  String get humidityLabel {
    if (humidity > 80) return 'Very High';
    if (humidity > 60) return 'High';
    if (humidity > 30) return 'Normal';
    return 'Low';
  }

  /// Normalized percentage for gauges (0-1 range)
  double get tempPercent => (temperature.clamp(0, 60) / 60);
  double get humidityPercent => (humidity.clamp(0, 100) / 100);
  double get mq2Percent => (mq2.clamp(0, 1000) / 1000);
  double get mq135Percent => (mq135.clamp(0, 500) / 500);
}
