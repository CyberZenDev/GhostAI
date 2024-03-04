import pyttsx3
from flask import Flask, render_template, request, jsonify, send_file, Response
from io import BytesIO
from training_data import convo
from model_utils import safety_settings_default
import google.generativeai as genai
import os
 
enc_api_key = "AIzaSyABntLwQVD7Ql7GxSHJN1ZPyMpz2yyyFRg" # Replace with Your Own API Key
genai.configure(api_key=enc_api_key)
app = Flask(__name__)

app.config['API_KEY'] = enc_api_key
app.config['SAFETY_SETTINGS'] = safety_settings_default

def print_current_api_key():
    print(f"Current API key: {app.config['API_KEY']}")

print_current_api_key()

@app.route('/')
def home():
    return render_template('index.html') # Change to site_down.html for maintence mode

@app.route('/talk', methods=['GET', 'POST'])
def talk():
    if request.method == 'GET':
        return render_template('talk.html')
    elif request.method == 'POST':
        user_input = request.form.get('user_input')
        response_text, audio_content = generate_response(user_input)
        return Response(audio_content, mimetype="audio/wav")


@app.route('/privacy')
def privacy():
    return render_template('Privacy.html')

@app.route('/settings')
def settings():
    return render_template('settings.html', default_api_key=app.config['API_KEY'])

@app.route('/save_api_key', methods=['POST'])
def save_api_key():
    api_key = request.form.get('api_key')

    if api_key != app.config['API_KEY']:
        app.config['API_KEY'] = api_key
        app.config['SAFETY_SETTINGS'] = safety_settings_default
        print_current_api_key()
        return jsonify({'message': 'API Key saved successfully'})
    else:
        return jsonify({'message': 'Please enter a different API Key'})

@app.route('/send_message', methods=['POST'])
def send_message():
    user_input = request.form.get('user_input')
    response = generate_response(user_input)
    return jsonify({'response': response})

@app.route('/download')
def download_page():
    return render_template('downloads.html')

def generate_response(user_input):
    response = convo.send_message(user_input).text

    # Initialize the TTS engine
    engine = pyttsx3.init()

    # Set properties (optional)
    engine.setProperty('rate', 170)  # Speed of speech

    # Save the response as a temporary audio file
    audio_path = 'temp_audio.wav'
    engine.save_to_file(response, audio_path)

    # Wait for the speech to finish
    engine.runAndWait()

    # Read the saved audio file
    with open(audio_path, 'rb') as audio_file:
        audio_content = audio_file.read()

    return response, audio_content
    
    # Delete the temporary audio file
    os.remove(audio_path)

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=5001)
    print_current_api_key()
