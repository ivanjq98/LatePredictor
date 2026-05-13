import { register, Counter, Histogram } from 'prom-client';
import { NextResponse } from 'next/server';

// 1. Define your custom metrics
const predictionCounter = new Counter({
  name: 'latetracker_predictions_total',
  help: 'Total number of lateness predictions generated',
  labelNames: ['transport_type', 'confidence_level'],
});

const responseTime = new Histogram({
  name: 'latetracker_prediction_duration_seconds',
  help: 'Time taken to generate prediction',
});

export async function GET() {
  return new NextResponse(await register.metrics(), {
    headers: { 'Content-Type': register.contentType },
  });
}

// Export a function to record data
export function recordPrediction(transport: string, confidence: string) {
  predictionCounter.inc({ transport_type: transport, confidence_level: confidence });
}