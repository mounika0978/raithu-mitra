# RaithuMitra AI — prototype

A local, interactive chatbox prototype for rain-fed farmers in Andhra Pradesh.

## Current features

- Earthy green, cream, and white responsive UI with large accessible action icons.
- English/Telugu response toggle.
- Chat messages, quick prompts, new conversation, and current-session farmer profile.
- Browser speech recognition where supported and text-to-speech for answers.
- Crop-photo upload flow with an explicit no-diagnosis warning.
- FastAPI backend with simple rule-based demo responses.
- Knowledge-reference metadata and a health endpoint.

## Important limitations

This is a general working **demo prototype**, not a deployed agricultural advisory service.
- Live weather is not connected.
- No LLM is connected; responses are rule-based.
- No crop disease image model is connected.
- The knowledge base contains illustrative demo records, not validated agronomic prescriptions.
- No official government scheme API is connected.
- Profile data stays in the page and is not saved to a database.

Do not use demo responses as the sole basis for sowing, fertiliser, pesticide, insurance, or other costly decisions. Confirm important advice with a local agricultural extension officer or KVK.

## Architecture

```text
Browser (HTML/CSS/JavaScript)
  ├── Chat UI, voice controls, profile form
  ├── POST /api/chat
  └── POST /api/crop-photo
          |
          v
FastAPI backend (main.py)
  ├── Rule-based response logic
  ├── data/knowledge_base.json (demo reference metadata)
  └── /api/health
```

## Requirements

- Python 3.10 or newer recommended
- Internet is not needed to run the local demo after dependencies are installed.
- A modern browser. Voice input depends on browser support and may require HTTPS or localhost.

## Run locally

### Windows (PowerShell)

```powershell
cd raithumitra_ai
py -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --reload
```

If PowerShell blocks activation, run the venv's Python directly:

```powershell
.\\.venv\\Scripts\\python.exe -m pip install -r requirements.txt
.\\.venv\\Scripts\\python.exe -m uvicorn main:app --reload
```

### macOS / Linux

```bash
cd raithumitra_ai
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
uvicorn main:app --reload
```

Open **http://127.0.0.1:8000** in your browser.

API health check: http://127.0.0.1:8000/api/health  
Interactive API docs: http://127.0.0.1:8000/docs

## Test questions

1. “I grow groundnut in Anantapur, and rainfall has been irregular. What should I do?”
2. “What should I check before sowing groundnut?”
3. “I see spots on my crop leaves. Can you identify the problem?”
4. “How can I verify current government farming schemes?”
5. Switch language to Telugu and ask: “వర్షాలు ఆలస్యం అయితే నేను ఏం చేయాలి?”

## Test checklist

- [ ] Home page opens without errors.
- [ ] Each quick-action button sends a prompt.
- [ ] Sending with Enter works; Shift+Enter creates a new line.
- [ ] Profile can be edited and saved for the current page session.
- [ ] English and Telugu modes change demo response language.
- [ ] Read-aloud works where speech synthesis is available.
- [ ] Voice input works where browser speech recognition is available.
- [ ] Image upload clearly states that no diagnosis model is configured.
- [ ] New conversation clears the visible chat.
- [ ] `/api/health` reports that live weather is not connected.

## Troubleshooting

**`uvicorn` is not recognised**  
Activate the virtual environment and run `python -m uvicorn main:app --reload`.

**Page cannot connect to the assistant**  
Keep the terminal running and open `http://127.0.0.1:8000`; do not open `index.html` directly from your file manager.

**Dependency installation fails**  
Check your Python version and internet connection, then run `python -m pip install --upgrade pip` and reinstall requirements.

**Voice input is unavailable**  
Browser support varies. Use a modern browser on localhost, allow microphone permission if requested, or type your message.

## Next development steps

1. Replace demo knowledge records with reviewed, cited guidance from ANGRAU, ICAR, KVK, and official state sources.
2. Add a documented, authorised weather integration and show its timestamp and location resolution.
3. Implement retrieval over approved documents with source passages shown alongside answers.
4. Add tests for language handling, profile inputs, and safety fallbacks.
5. Pilot with farmers and an agricultural extension officer before real-world use.
