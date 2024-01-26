from saftey import safety_settings
import google.generativeai as genai
from gen_config import generation_config


model = genai.GenerativeModel(
    model_name="gemini-pro",
    generation_config=generation_config,
    safety_settings=safety_settings
)