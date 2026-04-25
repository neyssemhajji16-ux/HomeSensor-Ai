class PredictionData {
  final String status;
  final String message;
  final double confidence;
  final String riskLevel;
  final List<String> recommendations;
  final DateTime lastUpdated;

  PredictionData({
    required this.status,
    required this.message,
    required this.confidence,
    required this.riskLevel,
    required this.recommendations,
    required this.lastUpdated,
  });

  factory PredictionData.fromMap(dynamic data) {
    if (data == null || data is! Map) {
      return PredictionData(
        status: 'Unknown',
        message: data?.toString() ?? 'No prediction data',
        confidence: 0.0,
        riskLevel: 'LOW',
        recommendations: ['Waiting for data...'],
        lastUpdated: DateTime.now(),
      );
    }

    final map = data;
    List<String> recs = [];
    if (map['recommendations'] is List) {
      recs = (map['recommendations'] as List).map((e) => e.toString()).toList();
    } else if (map['recommendations'] is String) {
      recs = [map['recommendations'].toString()];
    }

    return PredictionData(
      status: map['status']?.toString() ?? 'Unknown',
      message: map['message']?.toString() ?? map.toString(),
      confidence: (map['confidence'] ?? 0.0).toDouble(),
      riskLevel: map['risk_level']?.toString() ?? 'LOW',
      recommendations: recs.isEmpty ? ['System normal'] : recs,
      lastUpdated: map['timestamp'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['timestamp'])
          : DateTime.now(),
    );
  }

  /// Simple factory for when predictions is just a string
  factory PredictionData.fromString(String data) {
    String risk = 'LOW';
    if (data.toLowerCase().contains('danger') || data.toLowerCase().contains('critical')) {
      risk = 'HIGH';
    } else if (data.toLowerCase().contains('warning') || data.toLowerCase().contains('caution')) {
      risk = 'MEDIUM';
    }
    return PredictionData(
      status: risk == 'HIGH' ? 'Alert' : risk == 'MEDIUM' ? 'Caution' : 'Normal',
      message: data,
      confidence: 0.85,
      riskLevel: risk,
      recommendations: [data],
      lastUpdated: DateTime.now(),
    );
  }
}
