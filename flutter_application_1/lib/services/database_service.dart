import 'package:firebase_database/firebase_database.dart';
import '../models/sensor_data.dart';
import '../models/device_status.dart';
import '../models/prediction_data.dart';

class DatabaseService {
  final FirebaseDatabase _db = FirebaseDatabase.instance;

  // ─── Sensors ───────────────────────────────────────────
  Stream<SensorData> get sensorDataStream {
    return _db.ref('sensors_data').onValue.map((event) {
      final data = event.snapshot.value as Map<dynamic, dynamic>?;
      if (data == null) {
        return SensorData(
          temperature: 0, humidity: 0, mq2: 0, mq135: 0, timestamp: DateTime.now(),
        );
      }
      return SensorData.fromMap(data);
    });
  }

  // ─── Predictions ───────────────────────────────────────
  Stream<PredictionData> get predictionStream {
    return _db.ref('predictions').onValue.map((event) {
      final val = event.snapshot.value;
      if (val is Map) {
        return PredictionData.fromMap(val);
      }
      return PredictionData.fromString(val?.toString() ?? 'No data');
    });
  }

  // ─── Device Status (individual) ────────────────────────
  Stream<DeviceStatus> deviceStatusStream(String devicePath) {
    return _db.ref('devices/$devicePath/status').onValue.map((event) {
      return DeviceStatus.fromMap(devicePath, event.snapshot.value);
    });
  }

  // ─── All Devices Status ────────────────────────────────
  Stream<Map<String, DeviceStatus>> get allDevicesStream {
    return _db.ref('devices').onValue.map((event) {
      final data = event.snapshot.value as Map<dynamic, dynamic>?;
      if (data == null) return {};
      final result = <String, DeviceStatus>{};
      data.forEach((key, value) {
        final status = value is Map ? value['status'] : value;
        result[key.toString()] = DeviceStatus.fromMap(key.toString(), status);
      });
      return result;
    });
  }

  // ─── Update Device Status ──────────────────────────────
  Future<void> updateDeviceStatus(String devicePath, bool status) async {
    await _db.ref('devices/$devicePath/status').set(status);
  }

  // ─── Connection State ──────────────────────────────────
  Stream<bool> get connectionStream {
    return _db.ref('.info/connected').onValue.map((event) {
      return event.snapshot.value == true;
    });
  }
}
