from flask import Flask, render_template, request, jsonify
from pathlib import Path
import json

app = Flask(__name__)
DATA_FILE = Path("progress.json")

def load_data():
    if DATA_FILE.exists():
        try:
            return json.loads(DATA_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            pass
    return {"tasks": [], "applications": []}

def save_data(data):
    DATA_FILE.write_text(json.dumps(data, indent=2))

@app.route("/")
def home():
    return render_template("index.html")

@app.get("/api/progress")
def get_progress():
    return jsonify(load_data())

@app.post("/api/progress")
def update_progress():
    payload = request.get_json(silent=True) or {}
    data = load_data()
    if "tasks" in payload:
        data["tasks"] = payload["tasks"]
    if "applications" in payload:
        data["applications"] = payload["applications"]
    save_data(data)
    return jsonify({"ok": True, "data": data})

@app.post("/api/plan")
def create_plan():
    payload = request.get_json(silent=True) or {}
    skills = [s.strip() for s in payload.get("skills", "").split(",") if s.strip()]
    target = payload.get("target", "your target role").strip() or "your target role"
    weeks = [
        ("Week 1 — Foundations", "Review the core concepts and identify the three most important skills for " + target + "."),
        ("Week 2 — Build skills", "Complete focused lessons and small exercises for: " + (", ".join(skills[:3]) or "the role's core skills") + "."),
        ("Week 3 — Apply what you learn", "Build a small practical project and document your decisions."),
        ("Week 4 — Portfolio and interview", "Polish your project, update your resume, and practise explaining your work.")
    ]
    return jsonify({"target": target, "weeks": weeks})

if __name__ == "__main__":
    app.run(debug=True)
