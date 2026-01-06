from flask import Flask, Response, jsonify
from flask_cors import CORS
from ultralytics import YOLO
import cv2

app = Flask(__name__)
CORS(app) # Crucial: Allows the React/Node apps to access this data
model = YOLO('best.pt')

# Endpoint 1: Direct Video Stream for React
@app.route('/video_feed')
def video_feed():
    def gen():
        cap = cv2.VideoCapture(0)
        while True:
            success, frame = cap.read()
            if not success: break
            results = model.predict(frame, conf=0.5, save=False)
            annotated_frame = results[0].plot()
            _, buffer = cv2.imencode('.jpg', annotated_frame)
            yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')

# Endpoint 2: JSON Prediction for Node.js Backend
@app.route('/predict', methods=['GET'])
def predict():
    cap = cv2.VideoCapture(0)
    success, frame = cap.read()
    cap.release()
    if success:
        results = model.predict(frame, conf=0.5)
        # Check if any boxes (falls) were detected
        is_fall = len(results[0].boxes) > 0
        return jsonify({"fall_detected": is_fall})
    return jsonify({"error": "Camera error"}), 500

if __name__ == "__main__":
    app.run(port=5000) # Running on Port 5000