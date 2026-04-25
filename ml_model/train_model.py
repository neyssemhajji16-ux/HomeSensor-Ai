"""
Modèle IA — Prédiction d'anomalies IoT
Utilise Random Forest + IsolationForest pour détecter les dangers
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report
import joblib
import json

# ── Génération de données d'entraînement (remplacer par vraies données MongoDB) ──
def generate_training_data(n=2000):
    np.random.seed(42)
    data = []
    for _ in range(n):
        # Données normales
        temp = np.random.normal(25, 5)
        hum  = np.random.normal(50, 10)
        gas  = np.random.normal(100, 30)
        label = 0  # safe

        # Injecter des anomalies
        if np.random.random() < 0.2:
            scenario = np.random.choice(['gas_leak', 'fire_risk', 'high_humidity'])
            if scenario == 'gas_leak':
                gas   = np.random.uniform(350, 500)
                temp  = np.random.normal(27, 3)
                label = 2  # critical
            elif scenario == 'fire_risk':
                temp  = np.random.uniform(38, 50)
                gas   = np.random.uniform(200, 400)
                label = 2  # critical
            elif scenario == 'high_humidity':
                hum   = np.random.uniform(82, 100)
                label = 1  # warning

        data.append({
            'temperature': round(np.clip(temp, 0, 60), 2),
            'humidity':    round(np.clip(hum, 0, 100), 2),
            'gas':         round(np.clip(gas, 0, 500), 2),
            'label': label
        })
    return pd.DataFrame(data)

# ── Entraînement ──
def train_model():
    print("Génération des données d'entraînement...")
    df = generate_training_data(2000)

    X = df[['temperature', 'humidity', 'gas']].values
    y = df['label'].values

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    print("Entraînement Random Forest...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train_scaled, y_train)

    y_pred = clf.predict(X_test_scaled)
    print("\nRapport de classification:")
    print(classification_report(y_test, y_pred, target_names=['Safe', 'Warning', 'Critical']))

    # Isolation Forest pour détection d'anomalies non supervisée
    iso = IsolationForest(contamination=0.1, random_state=42)
    iso.fit(X_train_scaled)

    # Sauvegarder les modèles
    joblib.dump(clf,    'random_forest_model.pkl')
    joblib.dump(iso,    'isolation_forest_model.pkl')
    joblib.dump(scaler, 'scaler.pkl')
    print("\nModèles sauvegardés!")
    return clf, iso, scaler

# ── Prédiction ──
def predict(temperature, humidity, gas, clf=None, iso=None, scaler=None):
    if clf is None:
        clf    = joblib.load('random_forest_model.pkl')
        iso    = joblib.load('isolation_forest_model.pkl')
        scaler = joblib.load('scaler.pkl')

    features = np.array([[temperature, humidity, gas]])
    features_scaled = scaler.transform(features)

    label_pred  = clf.predict(features_scaled)[0]
    label_proba = clf.predict_proba(features_scaled)[0]
    anomaly     = iso.predict(features_scaled)[0]  # -1 = anomalie

    labels = {0: 'safe', 1: 'warning', 2: 'critical'}
    result = {
        'level':         labels[label_pred],
        'risk_score':    round(float(max(label_proba)) * 100, 1),
        'is_anomaly':    bool(anomaly == -1),
        'probabilities': {
            'safe':     round(float(label_proba[0]) * 100, 1),
            'warning':  round(float(label_proba[1]) * 100, 1),
            'critical': round(float(label_proba[2]) * 100, 1)
        },
        'input': { 'temperature': temperature, 'humidity': humidity, 'gas': gas }
    }
    return result

if __name__ == '__main__':
    clf, iso, scaler = train_model()
    # Test
    print("\nTest prédiction:")
    print(json.dumps(predict(42, 65, 420, clf, iso, scaler), indent=2))
    print(json.dumps(predict(23, 50, 100, clf, iso, scaler), indent=2))
