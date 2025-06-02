from google.cloud import storage
import tensorflow as tf
from PIL import Image
import numpy as np
import functions_framework  # Needed for GCP Functions
from flask import jsonify, Request

model = None
class_names = ["Early Blight", "Late Blight", "Healthy"]
BUCKET_NAME = "potato-leaf-bucket"

def download_blob(bucket_name, source_blob_name, destination_file_name):
    storage_client = storage.Client()
    bucket = storage_client.get_bucket(bucket_name)
    blob = bucket.blob(source_blob_name)
    blob.download_to_filename(destination_file_name)
    print(f"Blob {source_blob_name} downloaded to {destination_file_name}.")

@functions_framework.http
def predict(request: Request):
    global model
    if model is None:
        download_blob(BUCKET_NAME, "models/potatoes.h5", "/tmp/potatoes.h5")
        model = tf.keras.models.load_model("/tmp/potatoes.h5")

    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        image = np.array(
            Image.open(file).convert("RGB").resize((256, 256))
        ) / 255.0

        img_array = tf.expand_dims(image, 0)
        predictions = model.predict(img_array)

        predicted_class = class_names[np.argmax(predictions[0])]
        confidence = round(100 * (np.max(predictions[0])), 2)

        return jsonify({
            "class": predicted_class,
            "confidence": confidence
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
