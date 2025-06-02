from google.cloud import storage
import tensorflow as tf
from PIL import Image
import numpy as np
import functions_framework  # Needed for GCP Functions
from flask import jsonify, Request, make_response

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
    # Handle preflight OPTIONS request for CORS
    if request.method == 'OPTIONS':
        response = make_response('', 204)
        response.headers['Access-Control-Allow-Origin'] = 'https://potato-disease-one.vercel.app'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return response

    global model
    if model is None:
        download_blob(BUCKET_NAME, "models/potatoes.h5", "/tmp/potatoes.h5")
        model = tf.keras.models.load_model("/tmp/potatoes.h5")

    if 'file' not in request.files:
        response = jsonify({'error': 'No file part in the request'})
        response.headers['Access-Control-Allow-Origin'] = 'https://potato-disease-one.vercel.app'
        return response, 400

    file = request.files['file']
    if file.filename == '':
        response = jsonify({'error': 'No file selected'})
        response.headers['Access-Control-Allow-Origin'] = 'https://potato-disease-one.vercel.app'
        return response, 400

    try:
        image = np.array(
            Image.open(file).convert("RGB").resize((256, 256))
        ) / 255.0

        img_array = tf.expand_dims(image, 0)
        predictions = model.predict(img_array)

        predicted_class = class_names[np.argmax(predictions[0])]
        confidence = round(100 * (np.max(predictions[0])), 2)

        response = jsonify({
            "class": predicted_class,
            "confidence": confidence
        })
        response.headers['Access-Control-Allow-Origin'] = 'https://potato-disease-one.vercel.app'
        return response

    except Exception as e:
        response = jsonify({"error": str(e)})
        response.headers['Access-Control-Allow-Origin'] = 'https://potato-disease-one.vercel.app'
        return response, 500
