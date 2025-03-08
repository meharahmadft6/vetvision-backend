const chatbotResponses = {
  // Greetings
  hello: "Hello! How can I assist you with your cow's health?",
  hi: "Hi there! What would you like to know about cow care?",
  hey: "Hey! Need any help with your cow?",
  "good morning": "Good morning! How can I assist you today?",
  "good evening": "Good evening! Let me know how I can help with your cows.",
  asalam: "Walikum Salam How can I assist you today?",
  salam: "Walikum Salam",
  buddy: "You Bro what'sapp?",

  // General Queries
  help: "I'm here to assist with cow health and management. Ask me anything!",
  "who are you":
    "I'm a veterinary AI assistant specialized in cow health and disease management.",
  "thank you": "You're welcome! Let me know if you need further assistance.",
  bye: "Goodbye! Take care of your cows!",
  "what do you do":
    "I provide information on dairy cow health, diseases, nutrition, and management.",

  // Common Diseases
  "what are common diseases in dairy cows":
    "Common diseases include mastitis, foot rot, ketosis, and milk fever.",
  "how can I prevent mastitis in dairy cows":
    "Maintain proper hygiene, ensure clean bedding, and regularly check for udder infections.",
  "what is the treatment for foot rot in cows":
    "Treatment includes antibiotics, foot trimming, and keeping the environment dry.",
  "what are the symptoms of milk fever":
    "Symptoms include weakness, tremors, and inability to stand. Provide calcium therapy immediately.",
  "what causes ketosis in dairy cows":
    "Ketosis is caused by an energy imbalance due to low glucose levels. Proper nutrition is key to prevention.",
  "how to prevent ketosis in cows":
    "Provide high-energy diets before and after calving to prevent ketosis.",
  "what is brucellosis in cows":
    "Brucellosis is a bacterial disease causing abortion. It spreads through infected fluids and milk.",
  "how to control brucellosis in cows":
    "Vaccination and biosecurity measures help control the spread of brucellosis.",
  "what are the symptoms of pneumonia in cows":
    "Symptoms include fever, coughing, nasal discharge, and difficulty breathing.",
  "how is pneumonia treated in cows":
    "Isolate the cow, provide antibiotics as prescribed by a vet, and ensure proper ventilation.",
  "what is blackleg in cows":
    "Blackleg is a fatal bacterial disease affecting young cattle. Vaccination is the best prevention.",
  "what is anaplasmosis in cows":
    "Anaplasmosis is a tick-borne disease causing fever, anemia, and weakness. Tick control is essential.",
  "what are the symptoms of lumpy skin disease":
    "Symptoms include nodules on the skin, fever, and loss of appetite.",
  "how do I treat lumpy skin disease":
    "Vaccination and insect control are key to preventing LSD outbreaks.",
  "what causes bloating in cows":
    "Bloating is caused by excessive gas buildup due to sudden diet changes or lush pasture grazing.",
  "how to treat bloating in cows":
    "Walk the cow, provide anti-bloat medication, and call a vet if severe.",

  // Vaccination & Preventive Care
  "how often should dairy cows be vaccinated":
    "Dairy cows should be vaccinated annually or as recommended by your vet.",
  "what vaccines do dairy cows need":
    "Key vaccines include those for FMD, brucellosis, blackleg, and lumpy skin disease.",
  "when to deworm dairy cows":
    "Deworm your cows every 3 to 6 months depending on parasite load and vet advice.",
  "what is the best feed for dairy cows":
    "A balanced diet of hay, silage, grains, and protein supplements is ideal.",
  "how to prevent parasites in cows":
    "Use regular deworming, insect control, and clean pasture rotation to manage parasites.",

  // Nutrition & Management
  "how can I increase milk production in cows":
    "Ensure proper nutrition, regular milking, and a stress-free environment.",
  "how much water does a dairy cow need per day":
    "A dairy cow requires 30-50 liters of water per day depending on temperature and milk yield.",
  "what are the signs of a healthy dairy cow":
    "A healthy cow has a shiny coat, clear eyes, good appetite, and normal milk production.",
  "what should I do if my cow stops eating":
    "Check for signs of illness, provide fresh water and feed, and consult a vet if the issue persists.",
  "how do I treat dehydration in dairy cows":
    "Provide electrolyte solutions and ensure access to clean water.",
  "how to care for a sick cow":
    "Isolate the sick cow, monitor symptoms, and consult a veterinarian immediately.",
  "how to detect heat in dairy cows":
    "Signs include restlessness, mounting other cows, and clear mucus discharge.",
  "how to manage calving in dairy cows":
    "Prepare a clean, quiet area, watch for signs of labor, and assist if necessary.",

  // Emergency Cases
  "my cow is not standing":
    "This could be due to milk fever, injury, or weakness. Consult a vet immediately.",
  "my cow is coughing a lot":
    "Persistent coughing may indicate pneumonia or lung infection. Seek veterinary advice.",
  "my cow has a swollen udder":
    "A swollen udder may indicate mastitis. Keep it clean and consult a vet.",
  "my cow is bleeding":
    "Apply pressure to stop bleeding and contact a veterinarian immediately.",
  "my cow is having difficulty breathing":
    "This is an emergency. Ensure proper ventilation and call a vet immediately.",
  "my cow had a miscarriage":
    "Possible causes include brucellosis or other infections. Consult a vet for testing and treatment.",
  "what to do if my cow is not giving birth":
    "If labor lasts more than an hour without progress, seek veterinary assistance.",
  "my cow has diarrhea":
    "Ensure hydration and check for infections. Provide electrolytes and consult a vet.",
  "my cow's milk has blood in it":
    "This may be due to mastitis. Stop milking the affected quarter and seek veterinary help.",

  // Other
  "why is my cow not gaining weight":
    "Poor nutrition, parasites, or illness could be the cause. Adjust diet and consult a vet.",
  "how do I trim my cow’s hooves":
    "Trim hooves every 6 months to prevent lameness. Use proper tools or consult a professional.",
  "why is my cow losing hair":
    "Hair loss may be due to lice, ringworm, or mineral deficiency. Check for external parasites and adjust diet.",
  "how to transport cows safely":
    "Ensure proper ventilation, minimize stress, and allow enough space in the vehicle.",
  "how to control flies around dairy cows":
    "Use fly traps, insecticides, and proper manure management to reduce fly populations.",
  "what are the causes of sudden death in cows":
    "Possible causes include poisoning, blackleg, anthrax, or heart failure. Conduct a post-mortem exam with a vet.",
};

const getBotResponse = (message) => {
  const lowerCaseMessage = message.toLowerCase();
  return (
    chatbotResponses[lowerCaseMessage] ||
    "I'm not sure about that. Could you provide more details?"
  );
};

module.exports = { getBotResponse };
