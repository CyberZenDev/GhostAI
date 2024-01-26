import google.generativeai as genai
from flask import Flask, render_template, request, jsonify
from google.generativeai.types.safety_types import HarmBlockThreshold
from convo import convo
from api_key_a import enc_api_key

genai.configure(api_key=enc_api_key)
app = Flask(__name__)

# For simplicity, let's assume you have a global variable to store the API key
app.config['API_KEY'] = enc_api_key

def print_current_api_key():
    print(f"Current API key: {app.config['API_KEY']}")

print_current_api_key()  # Initial print

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

    # Check if the entered API key is not the default one
    if api_key != app.config['API_KEY']:
        app.config['API_KEY'] = api_key
        print_current_api_key()  # Print when the API key changes
        return jsonify({'message': 'API Key saved successfully'})
    else:
        return jsonify({'message': 'Please enter a different API Key'})

@app.route('/send_message', methods=['POST'])
def send_message():
    user_input = request.form.get('user_input')
    response = generate_response(user_input)
    return jsonify({'response': response})

def generate_response(user_input):
    response = convo.send_message(user_input).text
    return response

if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=True, port=5001)
    print_current_api_key()  # Print when the script is run
