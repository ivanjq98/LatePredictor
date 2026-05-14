from flask import Flask, request, jsonify
from prometheus_flask_exporter import PrometheusMetrics
from prometheus_client import Counter, Histogram
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

app = Flask(__name__)
metrics = PrometheusMetrics(app)  # auto-exposes /metrics endpoint

app = FastAPI()
Instrumentator().instrument(app).expose(app)  # adds GET /metrics

# ── Custom metrics ─────────────────────────────────────────────────────────
prediction_counter = Counter(
    "latetracker_predictions_total",
    "Total number of predictions made",
    ["category", "confidence"]   # labels let you filter in Grafana
)

prediction_latency = Histogram(
    "latetracker_prediction_seconds",
    "Time taken to run a prediction",
    buckets=[0.1, 0.5, 1, 2, 5]
)

telegram_counter = Counter(
    "latetracker_telegram_sent_total",
    "Total Telegram notifications sent",
    ["status"]   # "success" or "failure"
)

# ── Your existing predict route ────────────────────────────────────────────
@app.post("/predict")
def predict(data: dict):
    with prediction_latency.time():   # measures how long prediction takes
        data = request.get_json()
        category   = data.get("category", "unknown")
        
        # ... your existing sklearn prediction logic ...
        result = model.predict(...)
        confidence = "High"  # whatever your logic returns

        # Increment counter with labels
        prediction_counter.labels(
            category=category,
            confidence=confidence
        ).inc()

        return jsonify({ "predicted_lateness_minutes": result })

@app.post("/feedback")
def feedback(data: dict):
 with prediction_latency.time():   # measures how long prediction takes
        data = request.get_json()
        category   = data.get("category", "unknown")
        
        # ... your existing sklearn prediction logic ...
        result = model.predict(...)
        confidence = "High"  # whatever your logic returns

        # Increment counter with labels
        prediction_counter.labels(
            category=category,
            confidence=confidence
        ).inc()

        return jsonify({ "predicted_lateness_minutes": result })