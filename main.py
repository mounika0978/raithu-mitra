from pathlib import Path
from datetime import datetime
import json
import re
from typing import Optional

from fastapi import FastAPI, UploadFile, File
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "knowledge_base.json"

app = FastAPI(title="RaithuMitra AI", version="0.1.0")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

class FarmerProfile(BaseModel):
    village: str = ""
    mandal: str = ""
    district: str = ""
    crop: str = "Groundnut"
    sowing_date: str = ""
    growth_stage: str = ""
    soil_type: str = ""
    water_availability: str = "Rain-fed only"

class ChatRequest(BaseModel):
    message: str
    language: str = "en"
    profile: FarmerProfile = FarmerProfile()

def load_knowledge():
    try:
        return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []

KNOWLEDGE = load_knowledge()

def find_sources(message: str, crop: str):
    terms = set(re.findall(r"[a-zA-Z]+", (message + " " + crop).lower()))
    found = []
    for item in KNOWLEDGE:
        keywords = {x.lower() for x in item.get("keywords", [])}
        if terms & keywords:
            found.append(item)
    return found[:3]

def response_for(req: ChatRequest):
    msg = req.message.lower()
    p = req.profile
    is_telugu = req.language == "te"
    place = ", ".join(x for x in [p.village, p.mandal, p.district] if x) or ("మీ ప్రాంతం" if is_telugu else "your area")
    crop = p.crop or ("పంట" if is_telugu else "your crop")
    stage = p.growth_stage or ("తెలియదు" if is_telugu else "not specified")

    if any(k in msg for k in ["rain", "rainfall", "వర్ష", "వాన", "dry spell", "drought"]):
        if is_telugu:
            answer = (
                f"మీ వివరాలు: {place} ప్రాంతం, పంట: {crop}, దశ: {stage}.\\n\\n"
                "ఇది డెమో సలహా మాత్రమే; ప్రస్తుతం లైవ్ వాతావరణ డేటా కనెక్ట్ కాలేదు.\\n"
                "• స్థానిక అధికారిక వాతావరణ సూచనను, అది ఎప్పుడు నవీకరించబడిందో చూసుకోండి.\\n"
                "• పొలంలోని నేల తేమను పరిశీలించండి; వర్షం వస్తుందని మాత్రమే భావించి విత్తనాలు వేయవద్దు.\\n"
                "• మీ పంట దశకు సరిపోయే స్థానిక వ్యవసాయ సలహాను ANGRAU/KVK వ్యవసాయ అధికారితో నిర్ధారించండి.\\n"
                "వర్షపాతం లేదా పంట దిగుబడిని నేను ఖచ్చితంగా చెప్పలేను."
            )
        else:
            answer = (
                f"Your profile: {place}; crop: {crop}; growth stage: {stage}.\\n\\n"
                "Demo guidance only — live weather data is not connected.\\n"
                "• Check the latest official local forecast and its update time.\\n"
                "• Check actual field soil moisture; do not make a sowing decision based only on an assumed rainfall event.\\n"
                "• Confirm crop-stage-specific guidance with an ANGRAU/KVK extension officer.\\n"
                "I cannot guarantee rainfall or crop outcomes."
            )
    elif any(k in msg for k in ["crop problem", "leaf", "disease", "pest", "ఆకు", "తెగులు", "పురుగు"]):
        answer = (
            ("ఫోటో లేదా లక్షణాల ఆధారంగా ఖచ్చితమైన నిర్ధారణ చేయడం సాధ్యం కాకపోవచ్చు. పంట, లక్షణాలు మొదలైన వివరాలు చెప్పండి. "
             "పురుగుమందు వాడే ముందు స్థానిక వ్యవసాయ అధికారితో నిర్ధారించండి.")
            if is_telugu else
            ("A photo or short description may not be enough to identify a crop problem reliably. Tell me the crop, affected plant part, and symptoms. "
             "Please verify with a local agricultural officer before applying any pesticide.")
        )
    elif any(k in msg for k in ["scheme", "insurance", "పథకం", "బీమా"]):
        answer = (
            ("పథకాల అర్హత, గడువులు మారవచ్చు. తాజా వివరాలను అధికారిక ప్రభుత్వ పోర్టల్ లేదా వ్యవసాయ కార్యాలయంలో నిర్ధారించండి. "
             "ఈ డెమో ప్రైవేట్ క్లెయిమ్ స్థితిని చూడదు.")
            if is_telugu else
            ("Scheme eligibility and deadlines can change. Verify current details through the official government portal or agriculture office. "
             "This demo cannot access private claim records.")
        )
    elif any(k in msg for k in ["sow", "sowing", "plant", "విత్త", "నాట"]):
        answer = (
            ("విత్తే ముందు స్థానిక పంట క్యాలెండర్, నేల తేమ, విత్తన నాణ్యత, సీజన్ మరియు అధికారిక స్థానిక సలహాను పరిశీలించండి. "
             "ఈ డెమోలో లైవ్ వాతావరణ డేటా లేదు; తుది నిర్ణయానికి ముందు వ్యవసాయ అధికారితో నిర్ధారించండి.")
            if is_telugu else
            ("Before sowing, check the local crop calendar, actual soil moisture, seed quality, season, and official local recommendations. "
             "This demo has no live weather feed; confirm the decision with an agricultural extension officer.")
        )
    else:
        answer = (
            f"మీ పంట {crop}, ప్రాంతం {place}. మీ ప్రశ్నకు సరైన మార్గదర్శకం ఇవ్వడానికి పంట దశ, విత్తిన తేదీ లేదా సమస్య వివరాలు చెప్పగలరా? "
            "ఈ నమూనాలో లైవ్ వాతావరణం లేదు."
            if is_telugu else
            f"I have your crop as {crop} and location as {place}. To give more relevant guidance, tell me the crop stage, sowing date, or the specific issue. This prototype does not have live weather data."
        )

    sources = find_sources(req.message, p.crop)
    source_list = [{"title": s["title"], "url": s.get("url", ""), "note": s.get("note", "")} for s in sources]
    return {"answer": answer, "sources": source_list, "mode": "Demo mode · no live weather or diagnosis connected"}

@app.get("/", response_class=HTMLResponse)
def home():
    return (BASE_DIR / "static" / "index.html").read_text(encoding="utf-8")

@app.get("/api/health")
def health():
    return {"status": "ok", "app": "RaithuMitra AI", "live_weather_connected": False}

@app.post("/api/chat")
def chat(req: ChatRequest):
    return response_for(req)

@app.post("/api/crop-photo")
async def crop_photo(file: UploadFile = File(...)):
    # Upload endpoint demonstrates the flow but deliberately does not diagnose.
    content = await file.read()
    if not content:
        return {"ok": False, "message": "The uploaded file is empty."}
    return {
        "ok": True,
        "filename": file.filename,
        "message": "Photo received for prototype demonstration. No image diagnosis model is configured; please consult an agricultural expert."
    }
