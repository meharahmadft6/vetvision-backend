
from flask import Flask, request, jsonify
from chatterbot import ChatBot

app = Flask(__name__)

# ==========================
# 🔹 Veterinary Chatbot (Load Pretrained)
# ==========================
chatbot = ChatBot(
    "VetBot",
    storage_adapter="chatterbot.storage.SQLStorageAdapter",
    database_uri="sqlite:///chat.db",  # Load from saved database
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
