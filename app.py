from flask import Flask, render_template, request, jsonify, send_file, Response, redirect, url_for
from flask_login import LoginManager, UserMixin, login_user, login_required, current_user, logout_user
from io import BytesIO
from training_data import convo
from model_utils import safety_settings_default
import google.generativeai as genai
from flask_pymongo import PyMongo
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi

api_key = "AIzaSyABntLwQVD7Ql7GxSHJN1ZPyMpz2yyyFRg"  # Define the API key; needs to be changed if you want to use it

generation_config = {  # Redefine the generation config
    "temperature": 1.0,
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 1000,
}


app = Flask(__name__)
genai.configure(api_key=api_key)
app.config['API_KEY'] = api_key  # Set a global variable to assign API key
app.config['SAFETY_SETTINGS'] = safety_settings_default  # Set the safety settings to the default ones
app.secret_key = 'secret_key'
app.lazy_loading = False
mongo_url = 'mongodb+srv://ghostai:ghostai@ghostai.4bni5mt.mongodb.net/your_database_name?retryWrites=true&w=majority&appName=GhostAI'
app.config['MONGO_URI'] = mongo_url
mongo = PyMongo(app)  # Move this line to the global scope
client = MongoClient(mongo_url, server_api=ServerApi('1'))



with app.app_context():
    mongo.init_app(app)


class User(UserMixin):
    pass

# Flask-Login setup
login_manager = LoginManager(app)
login_manager.login_view = 'login'
invalid_request = 0

@login_manager.user_loader
def load_user(user_id):
    user_data = mongo.db.users.find_one({'username': user_id})

    if user_data:
        user = User()
        user.id = user_id

        # Check if the user is pro
        if user_data.get('pro', 'false') == 'true':
            user.pro = True
        else:
            user.pro = False

        return user

    return None



app.config['API_KEY'] = "AIzaSyABntLwQVD7Ql7GxSHJN1ZPyMpz2yyyFRg"  # Replace with Your Own API Key
app.config['SAFETY_SETTINGS'] = safety_settings_default



@app.route('/')
def home():
    return render_template('index.html') # Change to site_down.html for maintenance mode


@app.route('/talk')
def talk():
    return render_template('page_down.html')

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
    return response


@app.route('/success')
def succes():
    return render_template('success.html')

# New login route
@app.route('/login', methods=['POST', 'GET'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        # Check if the username and password match an existing user in MongoDB
        user = mongo.db.users.find_one({'username': username, 'password': password})
        if user:
            user_obj = User()
            user_obj.id = username

            # Check if the user is pro
            if user.get('pro', 'false') == 'true':
                user_obj.pro = True
            else:
                user_obj.pro = False

            login_user(user_obj)
            return redirect(url_for('succes'))
        else:
            return render_template('login.html', error='Incorrect Username Or Password', invalid_request=invalid_request + 1)

    return render_template('login.html')




@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        # Check if the username is already taken in MongoDB
        existing_user = mongo.db.users.find_one({'username': username})
        if existing_user:
            return render_template('signup.html', error='Username already taken')

        # Store the user data in MongoDB
        mongo.db.users.insert_one({'username': username, 'password': password, 'pro': 'false'})

        # Redirect to the success page
        return redirect(url_for('signup_success'))

    # Render the signup form template for GET requests
    return render_template('signup.html')




@app.route('/signup_success')
def signup_success():
    return render_template('signup_success.html')

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/upgrade')
def upgrade():
    return render_template('upgrade.html')


# Protected img route
"""
@app.route('/img', methods=['GET', 'POST'])
def generate_image():
    # Check if the user is authenticated and has "pro" status
    if current_user.is_authenticated and current_user.pro:
        if request.method == 'POST':
            prompt = request.form['prompt']

            url = "https://api.limewire.com/api/image/generation"
            payload = {
                "prompt": prompt,
                "aspect_ratio": "1:1"
            }
            headers = {
                "Content-Type": "application/json",
                "X-Api-Version": "v1",
                "Accept": "application/json",
                "Authorization": "Bearer lmwr_sk_yaQATuIAeP_EZqcKhaDVxdT2qlu7fBP4k0OFzzUW4u1nMIol"
            }

            response = requests.post(url, json=payload, headers=headers)
            try:
                data = response.json()
                # Debugging: Print the entire response
                print(f"API Response: {data}")

                # Check if 'data' key exists
                if 'data' in data:
                    media_link = data['data'][0]['asset_url']

                    # Debugging: Print the generated image link
                    print(f"Generated Image Link: {media_link}")

                    # Render img.html with the media link
                    return render_template('img.html', media_link=media_link)
                else:
                    # Debugging: Print the entire response in case of 'data' key missing
                    print(f"Invalid API Response: {data}")
                    return render_template('img.html', error="Invalid API response")

            except ValueError as e:
                # Debugging: Print the exception if the response is not valid JSON
                print(f"JSON Parsing Error: {e}")
                return render_template('img.html', error="Invalid JSON response")

        # If it's a GET request, just render the form
        return render_template('img.html')
    else:
        # Handle non-pro user access (optional: redirect to a different page)
        return render_template('upgrade.html', error="You need to be a pro user to access this feature.")
"""

@app.route('/img', methods=['GET', 'POST'])
def img():
    return render_template('page_work.html')



if __name__ == '__main__':
    app.run(host="0.0.0.0", debug=False, port=5000)
