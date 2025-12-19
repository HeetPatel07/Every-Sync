from flask import Blueprint, request, jsonify, render_template
from datetime import datetime, timezone
from .db import connect

bp = Blueprint("routes", __name__)

def now():
    return datetime.now(timezone.utc).isoformat(timespec="seconds")

@bp.get("/")
def index():
    return render_template("index.html")

@bp.get("/api/logs")
def get_logs():
    # incremental fetch
    since = request.args.get("since", "0")
    try:
        since_id = int(since)
    except ValueError:
        return jsonify({"error": "since must be an integer"}), 400

    conn = connect()
    rows = conn.execute("""
        SELECT id, category, message, created_at
        FROM test_logs
        WHERE id > ?
        ORDER BY id ASC
    """, (since_id,)).fetchall()
    conn.close()

    # explicit mapping => category is ALWAYS present
    return jsonify([
        {
            "id": r["id"],
            "category": r["category"],
            "message": r["message"],
            "created_at": r["created_at"],
        }
        for r in rows
    ])

@bp.post("/internal/log")
def internal_log():
    """
    Producer endpoint (bash script / server processes).
    Expected JSON:
      { "category": "TEST.FILE", "code": "MISSING", "message": "..." }
    """
    data = request.get_json(silent=True) or {}

    category = (data.get("category") or "").strip()
    code = (data.get("code") or "").strip()
    message = (data.get("message") or "").strip()

    if not category or not message:
        return jsonify({"error": "category and message required"}), 400

    full_category = category if not code else f"{category}.{code}"

    conn = connect()
    conn.execute(
        "INSERT INTO test_logs (category, message, created_at) VALUES (?, ?, ?)",
        (full_category, message, now())
    )
    conn.commit()
    conn.close()

    return jsonify({"ok": True})
