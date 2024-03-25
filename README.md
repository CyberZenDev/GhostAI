# GhostAI - Versatile Trainable Model

This is the last version of GhostAI to be supported on the web. As we have now added image generation capabilities locally, you can no longer use Cyclic as a provider unless you are using the Limewire API. Check out the local project at: [GhostAI Server](https://github.com/The-UnknownHacker/GhostAI-Server)

GhostAI is a versatile, trainable model based on Google Gemini.

## Training Your Own AI

### Steps:

1. **Fork or Clone Repository:**
   - Fork this repository into your account or clone it to your desktop using:
     ```bash
     git clone https://github.com/CyberZenDev/GhostAI/
     ```

2. **Update API Key:**
   - Access the files and navigate to `app.py`.
   - Find the `api_key_enc` variable.
   - Change the API key to your own, which is obtainable at [Google Makersuite](https://makersuite.google.com/app/apikey).

3. **Create and Train in Google Studio:**
   - In Google Studio, create a new project and a text model (Google Gemini Pro).
   - Train the AI until you are satisfied and then click the "Get Code" button on the top right.

4. **Copy and Replace `convo` Variable:**
   - Click on Python and scroll down to find the `convo` variable.
   - Copy the `convo` variable and go to `training_data.py`. Replace the existing `convo` variable with the one you copied.

5. **Deploy Your AI:**
   - Congratulations! Your AI is now trained.
   - Head over to [Cyclic.sh](https://cyclic.sh/) or click the button below to deploy it!

## Deploy to Cyclic

[![Deploy to Cyclic](https://deploy.cyclic.sh/button.svg)](https://deploy.cyclic.sh/)
