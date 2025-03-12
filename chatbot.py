from chatterbot import ChatBot
from chatterbot.trainers import ListTrainer
import os
import csv

chatbot = ChatBot(
    "VetBot",
    storage_adapter="chatterbot.storage.SQLStorageAdapter",
    database_uri="sqlite:///chat.db",  # Save chatbot data to a database
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

# ✅ Train chatbot ONLY with veterinary-specific data
if os.path.exists("veterinary_data.csv"):
    with open("veterinary_data.csv", "r", encoding="utf-8") as file:
        csv_reader = csv.reader(file)
        next(csv_reader)  # Skip header row if exists

        vet_data = []
        for row in csv_reader:
            if len(row) == 2:  # Ensure correct format ["Question", "Answer"]
                question, answer = row
                vet_data.append(question.strip())  # Add question
                vet_data.append(answer.strip())    # Add corresponding answer

        if vet_data:  # Only train if there's valid data
            vet_trainer = ListTrainer(chatbot)
            vet_trainer.train(vet_data)

print("✅ Training Complete! Chatbot is now saved in 'chat.db'.")
