import torch
import torchvision.transforms as transforms
from PIL import Image
import torch.nn as nn
import io
import os
import csv
from flask import Flask, request, jsonify
from chatterbot import ChatBot
from chatterbot.trainers import ChatterBotCorpusTrainer, ListTrainer

app = Flask(__name__)

# ==========================
# 🔹 CNN Model for Mastitis Detection
# ==========================
class CNNModel(nn.Module):
    def __init__(self):
        super(CNNModel, self).__init__()
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, stride=1, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, stride=1, padding=1)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, stride=1, padding=1)
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)
        self.fc1 = nn.Linear(128 * 28 * 28, 128)
        self.fc2 = nn.Linear(128, 1)
        self.relu = nn.ReLU()

    def forward(self, x):
        x = self.pool(self.relu(self.conv1(x)))
        x = self.pool(self.relu(self.conv2(x)))
        x = self.pool(self.relu(self.conv3(x)))
        x = x.view(x.shape[0], -1)  # Flatten
        x = self.relu(self.fc1(x))
        x = self.fc2(x)  # No Sigmoid Here!
        return x

# ✅ Load the trained model
model = CNNModel()
model.load_state_dict(torch.load("mastitis_model2.pth", map_location=torch.device("cpu")))
model.eval()  # Set to evaluation mode

# ✅ Define image transformations
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.5], std=[0.5])
])

# ✅ Function to predict mastitis
def predict_image(image):
    image = transform(image)  # Apply transformations
    image = image.unsqueeze(0)  # Add batch dimension

    with torch.no_grad():
        output = model(image)
        prediction = torch.sigmoid(output).item()  # Apply sigmoid

    if prediction >= 0.5:
         response = {
        "status": "Mastitis Detected",
        "prediction_score": round(prediction, 4),
        "message": "❗ Warning! Signs of mastitis detected. Immediate veterinary assessment is required.",
        "recommendations": [
            "Clean the affected udder thoroughly with a mild antiseptic solution before and after milking.",
            "Perform post-milking teat dipping using an iodine-based disinfectant to reduce bacterial load.",
            "Consult a veterinarian to conduct a culture and sensitivity test to choose the most effective antibiotic.",
            "Administer veterinarian-prescribed intramammary antibiotics (e.g., Cephapirin or Ceftiofur) following label directions.",
            "Monitor the cow for systemic signs (fever, reduced appetite) and provide supportive therapy if needed."
        ],
        "suggested_medicine": "Typically, FDA-approved intramammary products like Cephapirin or Ceftiofur are used. Always follow veterinary advice for dosage and duration."
    }
    else:
        response = {
        "status": "Normal Teat",
        "prediction_score": round(prediction, 4),
        "message": "✅ Udder health is normal. No signs of mastitis detected.",
        "recommendations": [
            "Maintain strict udder hygiene by cleaning before and after milking.",
            "Use pre- and post-milking teat disinfectants (iodine-based dips) to prevent infections.",
            "Ensure proper milking procedures to minimize teat trauma and bacterial entry.",
            "Schedule regular veterinary checks to monitor udder health and early signs of infection."
        ],
        "suggested_medicine": "Continue using approved teat dips and udder care products as recommended by your veterinarian."
    }


    return response

# ✅ Mastitis Detection API
@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    try:
        image = Image.open(io.BytesIO(file.read())).convert("RGB")
        result = predict_image(image)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================
# 🔹 Veterinary Chatbot (Load Pretrained)
# ==========================
chatbot = ChatBot(
    "VetBot",
    storage_adapter="chatterbot.storage.SQLStorageAdapter",
    database_uri="sqlite:///vetbott.db",  # Load from saved database
    logic_adapters=[
        {
            "import_path": "chatterbot.logic.BestMatch",
            "default_response": "Sorry, I don’t have an answer for that. Can you rephrase?",
            "maximum_similarity_threshold": 0.85,
        },
        {
            "import_path": "chatterbot.logic.MathematicalEvaluation"
        }
    ]
)

# ✅ Chatbot API
@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "").strip()

    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    bot_response = chatbot.get_response(user_message)

    return jsonify({"response": str(bot_response)})


# ==========================
# 🔹 Run Flask App
# ==========================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
