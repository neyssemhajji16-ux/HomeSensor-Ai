import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/prediction_data.dart';
import '../services/database_service.dart';

class AnalyticsTab extends StatelessWidget {
  const AnalyticsTab({super.key});

  @override
  Widget build(BuildContext context) {
    final db = DatabaseService();

    return SafeArea(
      child: StreamBuilder<PredictionData>(
        stream: db.predictionStream,
        builder: (context, snap) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Analytics', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Color(0xFF1A1A2E))),
                const SizedBox(height: 4),
                Text('AI Predictions & Insights', style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
                const SizedBox(height: 24),

                // ─── AI Status ──────────────────────────────
                if (!snap.hasData)
                  const Center(child: Padding(
                    padding: EdgeInsets.all(40),
                    child: CircularProgressIndicator(color: Color(0xFF1A73E8)),
                  ))
                else ...[
                  _buildRiskCard(snap.data!),
                  const SizedBox(height: 20),
                  _buildPredictionMessage(snap.data!),
                  const SizedBox(height: 20),
                  _buildConfidenceCard(snap.data!),
                  const SizedBox(height: 20),
                  _buildRecommendations(snap.data!),
                  const SizedBox(height: 24),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildRiskCard(PredictionData pred) {
    final colors = _riskColors(pred.riskLevel);
    return Container(
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
            child: const Icon(Icons.psychology_rounded, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Risk Assessment', style: TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 4),
                Text(pred.riskLevel, style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: 1)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(pred.status, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildPredictionMessage(PredictionData pred) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.auto_awesome_rounded, color: Color(0xFF7C4DFF), size: 22),
              const SizedBox(width: 8),
              const Text('AI Analysis', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: Color(0xFF1A1A2E))),
              const Spacer(),
              Text(DateFormat('HH:mm').format(pred.lastUpdated),
                style: TextStyle(fontSize: 12, color: Colors.grey.shade400),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(pred.message, style: const TextStyle(fontSize: 14, height: 1.5, color: Color(0xFF424242))),
        ],
      ),
    );
  }

  Widget _buildConfidenceCard(PredictionData pred) {
    final pct = (pred.confidence * 100).toInt();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Prediction Confidence', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: Color(0xFF1A1A2E))),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: LinearProgressIndicator(
                    value: pred.confidence.clamp(0, 1),
                    backgroundColor: const Color(0xFF7C4DFF).withOpacity(0.1),
                    valueColor: const AlwaysStoppedAnimation(Color(0xFF7C4DFF)),
                    minHeight: 12,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Text('$pct%', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFF7C4DFF))),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'Last updated: ${DateFormat('MMM d, HH:mm').format(pred.lastUpdated)}',
            style: TextStyle(fontSize: 12, color: Colors.grey.shade400),
          ),
        ],
      ),
    );
  }

  Widget _buildRecommendations(PredictionData pred) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.lightbulb_outline_rounded, color: Color(0xFFFFA726), size: 22),
              SizedBox(width: 8),
              Text('Recommendations', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: Color(0xFF1A1A2E))),
            ],
          ),
          const SizedBox(height: 14),
          ...pred.recommendations.map((rec) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  margin: const EdgeInsets.only(top: 6),
                  width: 6, height: 6,
                  decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF1A73E8)),
                ),
                const SizedBox(width: 10),
                Expanded(child: Text(rec, style: const TextStyle(fontSize: 14, height: 1.4, color: Color(0xFF424242)))),
              ],
            ),
          )),
        ],
      ),
    );
  }

  List<Color> _riskColors(String risk) {
    switch (risk.toUpperCase()) {
      case 'HIGH': return [const Color(0xFFE53935), const Color(0xFFFF5252)];
      case 'MEDIUM': return [const Color(0xFFFFA726), const Color(0xFFFFB74D)];
      default: return [const Color(0xFF43A047), const Color(0xFF66BB6A)];
    }
  }
}
