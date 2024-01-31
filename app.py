import google.generativeai as genai # pip install google-generative-ai
from flask import Flask, render_template, request, jsonify # pip install flask
from training_data import convo  # Training data can be found in the training_data.py file
from model_utils import safety_settings_default, safety_settings_unlocked # Import the safety settings from the model_utils.py file


# DEFINE VARIABLES

enc_api_key = "AIzaSyABntLwQVD7Ql7GxSHJN1ZPyMpz2yyyFRg" # Define the API key needs to be changed if you want to use it


generation_config = { # Redefine the generation config
    "temperature": 1.0,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 1000,
}


genai.configure(api_key=enc_api_key) # Configure the api key to be used as enc_api_key
app = Flask(__name__)

app.config['API_KEY'] = enc_api_key # Set a global variable to asign api key
app.config['SAFETY_SETTINGS'] = safety_settings_default # Set the safety settings to the default ones

def print_current_api_key(): # Define a function to print the current api key to the console if changed
    print(f"Current API key: {app.config['API_KEY']}") # Print the current api key
    if app.config['API_KEY'] == "unlock":
        print("AI HAS BEEN UNLOCKED WARNING !!!!!!!!!!!!!!!!!!!!!!!\nAI HAS BEEN UNLOCKED WARNING !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\nAI HAS BEEN UNLOCKED WARNING !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

print_current_api_key()  # Initial print

@app.route('/') # Define the main route
def home():
    return render_template('index.html')

@app.route('/privacy') # Define the privacy policy route for google play
def Privacy():
    return render_template('Privacy.html')

@app.route('/settings') # Set a settings route
def settings():
    return render_template('settings.html', default_api_key=app.config['API_KEY']) # Render the settings page and pass the default api key to the html

@app.route('/save_api_key', methods=['POST']) # Save the custom api key
def save_api_key(): # Define the save_api_key function
    api_key = request.form.get('api_key')

    # Check if the entered API key is "unlock"
    if api_key.lower() == "unlock":
        app.config['API_KEY'] = api_key
        app.config['SAFETY_SETTINGS'] = safety_settings_unlocked
        print_current_api_key()  # Print when the API key changes
        return jsonify({'message': 'AI HAS BEEN UNLOCKED PLEASE USE WITH CAUTION\nPlease note that this will be relayed to the console log so the developers will know about this'})
        
    else:
        if api_key != app.config['API_KEY']: # CHeck if the api key is not the default one
            app.config['API_KEY'] = api_key # Set the api key to the entered one
            app.config['SAFETY_SETTINGS'] = safety_settings_default # Set the safety settings to the default ones
            print_current_api_key()  # Print when the API key changes
            return jsonify({'message': 'API Key saved successfully'}) # Send a message to the website saying the key has been saved
        else:
            return jsonify({'message': 'Please enter a different API Key'}) # Send a message to the website saying the key has not been saved

@app.route('/send_message', methods=['POST']) # Send a message to the AI and get the response from generate_response() to send to the html
def send_message():
    user_input = request.form.get('user_input')
    response = generate_response(user_input)
    return jsonify({'response': response})

def generate_response(user_input): # Generate a response from the AI
    response = convo.send_message(user_input).text
    return response

if __name__ == '__main__': # Start the app
    app.run(host="0.0.0.0", debug=True, port=5001) # Set the app to run on port 5001 and have debugging active and bind the app to all ip addresses
    print_current_api_key()  # Inform the console about the changed api key
