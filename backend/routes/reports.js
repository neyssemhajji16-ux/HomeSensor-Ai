const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const SensorData = require('../models/SensorData');
const Alert = require('../models/Alert');

// GET /api/reports/generate — Télécharger rapport PDF
router.get('/generate', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sensorData = await SensorData.find({ timestamp: { $gte: today } }).sort({ timestamp: -1 });
    const alerts = await Alert.find({ timestamp: { $gte: today } }).sort({ timestamp: -1 });

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=rapport-iot-${new Date().toISOString().split('T')[0]}.pdf`);
    doc.pipe(res);

    // Titre
    doc.fontSize(20).text('Rapport IoT — Surveillance Intelligente', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' });
    doc.moveDown(2);

    // Statistiques
    doc.fontSize(16).text('Statistiques du jour');
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Nombre de mesures: ${sensorData.length}`);

    if (sensorData.length > 0) {
      const avgTemp = (sensorData.reduce((s, d) => s + d.temperature, 0) / sensorData.length).toFixed(1);
      const avgHum  = (sensorData.reduce((s, d) => s + d.humidity, 0)    / sensorData.length).toFixed(1);
      const avgGas  = (sensorData.reduce((s, d) => s + d.gas, 0)         / sensorData.length).toFixed(1);
      doc.text(`Température moyenne: ${avgTemp}°C`);
      doc.text(`Humidité moyenne: ${avgHum}%`);
      doc.text(`Gaz moyen: ${avgGas} ppm`);
    }

    doc.moveDown();

    // Alertes
    doc.fontSize(16).text('Alertes du jour');
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Nombre d'alertes: ${alerts.length}`);
    alerts.slice(0, 20).forEach(a => {
      doc.text(`• [${a.level.toUpperCase()}] ${a.type} = ${a.value} (${a.device_id}) — ${a.resolved ? 'Résolue' : 'Active'}`);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
