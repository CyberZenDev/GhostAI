# model_utils.py

import google.generativeai as genai
from google.generativeai.types.safety_types import HarmBlockThreshold

safety_settings_default = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": HarmBlockThreshold.BLOCK_NONE,
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": HarmBlockThreshold.BLOCK_NONE,
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": HarmBlockThreshold.BLOCK_NONE,
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": HarmBlockThreshold.BLOCK_NONE,
    },
]

safety_settings_unlocked = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
]

generation_config = {
    "temperature": 1.0,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 1000,
}

model = genai.GenerativeModel(
    model_name="gemini-pro",
    generation_config=generation_config,
    safety_settings=safety_settings_default
)
