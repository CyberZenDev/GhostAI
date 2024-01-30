import google.generativeai as genai
from flask import Flask, render_template, request, jsonify
from training_data import convo  # Training data
from model_utils import safety_settings_default, safety_settings_unlocked


# DEFINE VARIABLES

enc_api_key = "AIzaSyABntLwQVD7Ql7GxSHJN1ZPyMpz2yyyFRg"

generation_config = {
    "temperature": 1.0,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 1000,
}



genai.configure(api_key=enc_api_key)
app = Flask(__name__)

# For simplicity, let's assume you have a global variable to store the API key
app.config['API_KEY'] = enc_api_key
app.config['SAFETY_SETTINGS'] = safety_settings_default

def print_current_api_key():
    print(f"Current API key: {app.config['API_KEY']}")
    if app.config['API_KEY'] == "unlock":
        print("AI HAS BEEN UNLOCKED WARNING !!!!!!!!!!!!!!!!!!!!!!!\nAI HAS BEEN UNLOCKED WARNING !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\nAI HAS BEEN UNLOCKED WARNING !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

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

    # Check if the entered API key is "unlock"
    if api_key.lower() == "unlock":
        app.config['API_KEY'] = api_key
        app.config['SAFETY_SETTINGS'] = safety_settings_unlocked
        print_current_api_key()  # Print when the API key changes
        return jsonify({'message': 'AI HAS BEEN UNLOCKED PLEASE USE WITH CAUTION\nPlease note that this will be relayed to the console log so the developers will know about this'})
        
    else:
        # Check if the entered API key is not the default one
        if api_key != app.config['API_KEY']:
            app.config['API_KEY'] = api_key
            app.config['SAFETY_SETTINGS'] = safety_settings_default
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
