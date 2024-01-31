# model_utils.py

import google.generativeai as genai # pip install google-generative-ai
from google.generativeai.types.safety_types import HarmBlockThreshold # We are importing this to specify a custom threshold instead of the default one

safety_settings_default = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": HarmBlockThreshold.BLOCK_NONE, # Block none of the harassment category
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": HarmBlockThreshold.BLOCK_NONE, # Block none of the hate speech category
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", # Block none of the sexually explicit category
        "threshold": HarmBlockThreshold.BLOCK_NONE,
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT", # Block none of the dangerous content category
        "threshold": HarmBlockThreshold.BLOCK_NONE,
    },
]

safety_settings_unlocked = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": HarmBlockThreshold.BLOCK_ONLY_HIGH, # Block only high harassment
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": HarmBlockThreshold.BLOCK_ONLY_HIGH, # Block only high hate speech
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": HarmBlockThreshold.BLOCK_ONLY_HIGH, # Block only high sexually explicit
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": HarmBlockThreshold.BLOCK_ONLY_HIGH, # Block only high dangerous content
    },
]

generation_config = {   # Config the ai settings
    "temperature": 1.0,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 1000,
}

model = genai.GenerativeModel(
    model_name="gemini-pro", # Set the model
    generation_config=generation_config, # Set the gen config Variable
    safety_settings=safety_settings_default # Set the saftery settings
)
