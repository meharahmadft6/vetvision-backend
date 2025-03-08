from chatterbot import ChatBot

# Create a chatbot with SQLite database
chatbot = ChatBot(
    "VetBot",
    storage_adapter="chatterbot.storage.SQLStorageAdapter",
    database_uri="sqlite:///dairy_vetbot.sqlite3"  # SQLite database file
)

# The chatbot will automatically load previous knowledge from the database
response = chatbot.get_response("What is the best feed for dairy cows?")
print(response)