from google.generativeai.types.safety_types import HarmBlockThreshold

safety_settings = [
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
