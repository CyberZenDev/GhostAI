import google.generativeai as genai
from flask import Flask, render_template, request, jsonify
from training_data import convo
from model_utils import safety_settings_default  # Import the safety settings from the model_utils.py file

enc_api_key = "AIzaSyABntLwQVD7Ql7GxSHJN1ZPyMpz2yyyFRg"
genai.configure(api_key=enc_api_key)
app = Flask(__name__)

app.config['API_KEY'] = enc_api_key
app.config['SAFETY_SETTINGS'] = safety_settings_default

def print_current_api_key():
    print(f"Current API key: {app.config['API_KEY']}")
    # Removed the section related to "unlock"

print_current_api_key()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/privacy')
def Privacy():
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
    return response

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=5001)
    print_current_api_key()
