"""
Firebase Firestore Service & Persistent Storage
================================================

Provides read/write helpers for all Firestore collections:
  - routes
  - requests
  - matches
  - users
  - notifications

Falls back gracefully to a persistent local JSON store if Firebase
is not configured (i.e. FIREBASE_CREDENTIALS env var is not set).
"""
import os
import json
import uuid
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from demo_data import DEMO_ROUTES, DEMO_SHIPMENTS

# Path for persistent local fallback store
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
LOCAL_STORE_PATH = os.path.join(DATA_DIR, "store.json")

def _hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()

# Initial seed users
INITIAL_USERS = [
    {
        "userId": "usr-shipper-01",
        "email": "shipper@smartlogistics.com",
        "passwordHash": _hash_password("password123"),
        "fullName": "Ramesh Varma",
        "phone": "+91 98765 43210",
        "userType": "Shipper",
        "company": "Varma Freight & Logistics",
        "location": "Chennai, Tamil Nadu",
        "totalLoads": 28,
        "completedDeliveries": 24,
        "rating": 4.9,
        "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
        "createdAt": "2026-08-15T10:00:00Z",
    },
    {
        "userId": "usr-owner-01",
        "email": "owner@smartlogistics.com",
        "passwordHash": _hash_password("password123"),
        "fullName": "Rajesh Kumar",
        "phone": "+91 94432 12345",
        "userType": "Truck Owner",
        "company": "Kumar Transport Fleet",
        "location": "Coimbatore, Tamil Nadu",
        "totalLoads": 45,
        "completedDeliveries": 42,
        "rating": 4.8,
        "avatarUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        "createdAt": "2026-08-10T09:00:00Z",
    },
]

# Initial seed notifications
INITIAL_NOTIFICATIONS = [
    {
        "notificationId": "notif-001",
        "userId": "usr-shipper-01",
        "title": "New Truck Match Found!",
        "message": "Truck TN-38-A1234 has 5,000 kg capacity available on Chennai → Coimbatore route. Save up to 75% on freight.",
        "type": "match",
        "relatedRouteId": "TN-38-A1234",
        "isRead": False,
        "createdAt": "2026-09-20T17:30:00Z",
    },
    {
        "notificationId": "notif-002",
        "userId": "usr-shipper-01",
        "title": "Load-Sharing Request Submitted",
        "message": "Your request for 2,000 kg Textiles from Chennai to Erode was submitted and assigned REQ-001.",
        "type": "request",
        "relatedRouteId": "REQ-001",
        "isRead": False,
        "createdAt": "2026-09-20T16:15:00Z",
    },
    {
        "notificationId": "notif-003",
        "userId": "usr-shipper-01",
        "title": "Request Accepted by Truck Owner",
        "message": "Driver Murugan Selvam (TN-33-B5678) accepted your 500 kg shipment request to Salem.",
        "type": "status",
        "relatedRouteId": "TN-33-B5678",
        "isRead": True,
        "createdAt": "2026-09-20T14:00:00Z",
    },
    {
        "notificationId": "notif-004",
        "userId": "usr-shipper-01",
        "title": "Truck Schedule Update",
        "message": "Truck TN-45-C9012 departure updated to 07:30 AM from Madurai hub due to highway maintenance.",
        "type": "truck_update",
        "relatedRouteId": "TN-45-C9012",
        "isRead": False,
        "createdAt": "2026-09-20T13:45:00Z",
    },
    {
        "notificationId": "notif-005",
        "userId": "usr-shipper-01",
        "title": "Delivery Completed Successfully",
        "message": "Delivery completed for 1,200 kg Packaged Goods to Tiruchirappalli. Rating requested.",
        "type": "delivery",
        "relatedRouteId": "REQ-003",
        "isRead": True,
        "createdAt": "2026-09-19T18:00:00Z",
    },
    # Notifications for owner
    {
        "notificationId": "notif-101",
        "userId": "usr-owner-01",
        "title": "New Load-Sharing Request",
        "message": "Lakshmi Textiles requested 2,000 kg capacity on your Chennai → Coimbatore trip.",
        "type": "request",
        "relatedRouteId": "TN-38-A1234",
        "isRead": False,
        "createdAt": "2026-09-20T17:00:00Z",
    },
    {
        "notificationId": "notif-102",
        "userId": "usr-owner-01",
        "title": "Capacity Utilization Alert",
        "message": "Your truck TN-38-A1234 reached 90% capacity after matching Erode drop.",
        "type": "truck_update",
        "relatedRouteId": "TN-38-A1234",
        "isRead": True,
        "createdAt": "2026-09-20T15:20:00Z",
    },
]

# Persistent / In-memory store
_STORE: Dict[str, List[Dict[str, Any]]] = {
    "routes": [dict(r) for r in DEMO_ROUTES],
    "requests": [dict(s) for s in DEMO_SHIPMENTS],
    "matches": [],
    "users": [dict(u) for u in INITIAL_USERS],
    "notifications": [dict(n) for n in INITIAL_NOTIFICATIONS],
}

def _save_local_store():
    """Save in-memory store to disk for persistence across restarts."""
    try:
        os.makedirs(DATA_DIR, exist_ok=True)
        with open(LOCAL_STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(_STORE, f, indent=2, default=str)
    except Exception as exc:
        print(f"[WARN] Could not persist local store: {exc}")

def _load_local_store():
    """Load store from disk if present."""
    if os.path.exists(LOCAL_STORE_PATH):
        try:
            with open(LOCAL_STORE_PATH, "r", encoding="utf-8") as f:
                saved = json.load(f)
                for k in ["routes", "requests", "matches", "users", "notifications"]:
                    if k in saved and isinstance(saved[k], list) and saved[k]:
                        _STORE[k] = saved[k]
            print(f"[OK] Loaded persisted local store ({len(_STORE['users'])} users, {len(_STORE['notifications'])} notifications).")
        except Exception as exc:
            print(f"[WARN] Could not read local store: {exc}")

_load_local_store()

# Firebase availability flag
_firebase_available = False
_db = None

def _try_init_firebase():
    """Attempt to initialise Firebase Admin SDK. Silently fails if not configured."""
    global _firebase_available, _db
    cred_path = os.getenv("FIREBASE_CREDENTIALS", "")
    project_id = os.getenv("FIREBASE_PROJECT_ID", "")

    if not cred_path or not project_id:
        return

    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        if not firebase_admin._apps:
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred, {"projectId": project_id})

        _db = firestore.client()
        _firebase_available = True
        print("[OK] Firebase Firestore connected successfully.")
    except Exception as exc:
        print(f"[WARN] Firebase unavailable ({exc}). Using persistent local store.")

_try_init_firebase()

def _col(name: str):
    """Return Firestore collection reference (only call when Firebase available)."""
    return _db.collection(name)

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

def get_all_routes() -> List[Dict[str, Any]]:
    if _firebase_available:
        try:
            docs = _col("routes").stream()
            return [{"id": d.id, **d.to_dict()} for d in docs]
        except Exception as e:
            print(f"[WARN] Firestore error get_all_routes: {e}")
    return _STORE["routes"]

def get_route_by_truck_id(truck_id: str) -> Optional[Dict[str, Any]]:
    routes = get_all_routes()
    return next((r for r in routes if r.get("truckId") == truck_id), None)

def upsert_route(route: Dict[str, Any]) -> str:
    truck_id = route.get("truckId", str(uuid.uuid4()))
    if _firebase_available:
        try:
            _col("routes").document(truck_id).set(route)
        except Exception as e:
            print(f"[WARN] Firestore error upsert_route: {e}")
    existing = next((r for r in _STORE["routes"] if r.get("truckId") == truck_id), None)
    if existing:
        existing.update(route)
    else:
        _STORE["routes"].append(route)
    _save_local_store()
    return truck_id


# ---------------------------------------------------------------------------
# Shipment Requests
# ---------------------------------------------------------------------------

def get_all_requests() -> List[Dict[str, Any]]:
    if _firebase_available:
        try:
            docs = _col("requests").stream()
            return [{"id": d.id, **d.to_dict()} for d in docs]
        except Exception as e:
            print(f"[WARN] Firestore error get_all_requests: {e}")
    return _STORE["requests"]

def create_request(request: Dict[str, Any]) -> str:
    request_id = request.get("requestId") or f"REQ-{str(uuid.uuid4())[:8].upper()}"
    request["requestId"] = request_id
    request.setdefault("createdAt", _now_iso())
    request.setdefault("status", "pending")

    if _firebase_available:
        try:
            _col("requests").document(request_id).set(request)
        except Exception as e:
            print(f"[WARN] Firestore error create_request: {e}")
    _STORE["requests"].append(request)
    _save_local_store()
    return request_id

def update_request_status(request_id: str, status: str):
    if _firebase_available:
        try:
            _col("requests").document(request_id).update({"status": status})
        except Exception as e:
            print(f"[WARN] Firestore error update_request_status: {e}")
    for r in _STORE["requests"]:
        if r.get("requestId") == request_id:
            r["status"] = status
            break
    _save_local_store()


# ---------------------------------------------------------------------------
# Matches
# ---------------------------------------------------------------------------

def get_all_matches() -> List[Dict[str, Any]]:
    if _firebase_available:
        try:
            docs = _col("matches").stream()
            return [{"id": d.id, **d.to_dict()} for d in docs]
        except Exception as e:
            print(f"[WARN] Firestore error get_all_matches: {e}")
    return _STORE["matches"]

def save_match(match: Dict[str, Any]) -> str:
    match_id = match.get("matchId") or f"MATCH-{str(uuid.uuid4())[:8].upper()}"
    match["matchId"] = match_id
    match.setdefault("createdAt", _now_iso())

    if _firebase_available:
        try:
            _col("matches").document(match_id).set(match)
        except Exception as e:
            print(f"[WARN] Firestore error save_match: {e}")
    _STORE["matches"].append(match)
    _save_local_store()
    return match_id


# ---------------------------------------------------------------------------
# Users & Authentication
# ---------------------------------------------------------------------------

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve user by userId, stripping sensitive passwordHash."""
    if _firebase_available:
        try:
            doc = _col("users").document(user_id).get()
            if doc.exists:
                data = doc.to_dict()
                data["userId"] = doc.id
                data.pop("passwordHash", None)
                return data
        except Exception as e:
            print(f"[WARN] Firestore error get_user_by_id: {e}")
    for u in _STORE["users"]:
        if u.get("userId") == user_id:
            res = dict(u)
            res.pop("passwordHash", None)
            return res
    return None

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Find user by email, returns full record including passwordHash."""
    norm_email = email.strip().lower()
    if _firebase_available:
        try:
            docs = _col("users").where("email", "==", norm_email).limit(1).stream()
            for d in docs:
                data = d.to_dict()
                data["userId"] = d.id
                return data
        except Exception as e:
            print(f"[WARN] Firestore error get_user_by_email: {e}")
    for u in _STORE["users"]:
        if u.get("email", "").strip().lower() == norm_email:
            return dict(u)
    return None

def verify_credentials(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Verify email and password, returning public user dict on success."""
    user = get_user_by_email(email)
    if not user:
        return None
    hashed = _hash_password(password)
    if user.get("passwordHash") == hashed:
        user_copy = dict(user)
        user_copy.pop("passwordHash", None)
        return user_copy
    return None

def create_user(user_data: Dict[str, Any], raw_password: str) -> Dict[str, Any]:
    """Create a new user document in Firestore/local store."""
    user_id = user_data.get("userId") or f"usr-{str(uuid.uuid4())[:8]}"
    record = {
        **user_data,
        "userId": user_id,
        "email": user_data["email"].strip().lower(),
        "passwordHash": _hash_password(raw_password),
        "totalLoads": user_data.get("totalLoads", 0),
        "completedDeliveries": user_data.get("completedDeliveries", 0),
        "rating": user_data.get("rating", 5.0),
        "avatarUrl": user_data.get("avatarUrl", ""),
        "createdAt": _now_iso(),
    }
    if _firebase_available:
        try:
            _col("users").document(user_id).set(record)
        except Exception as e:
            print(f"[WARN] Firestore error create_user: {e}")
    _STORE["users"].append(record)
    _save_local_store()

    # Create initial welcome notifications for the newly registered user
    create_notification({
        "userId": user_id,
        "title": "Welcome to SmartLogistics!",
        "message": f"Welcome aboard, {record.get('fullName', 'Partner')}! Start searching for shared truck capacity or post your freight requests.",
        "type": "status",
        "isRead": False,
    })

    public_user = dict(record)
    public_user.pop("passwordHash", None)
    return public_user

def update_user(user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update editable profile fields for a user."""
    # Prevent overwriting critical system fields
    safe_updates = {
        k: v for k, v in updates.items()
        if k in ["fullName", "phone", "userType", "company", "location", "avatarUrl", "totalLoads", "completedDeliveries", "rating"] and v is not None
    }
    if not safe_updates:
        return get_user_by_id(user_id)

    if _firebase_available:
        try:
            _col("users").document(user_id).update(safe_updates)
        except Exception as e:
            print(f"[WARN] Firestore error update_user: {e}")

    for u in _STORE["users"]:
        if u.get("userId") == user_id:
            u.update(safe_updates)
            _save_local_store()
            res = dict(u)
            res.pop("passwordHash", None)
            return res
    return None

def change_password(user_id: str, old_password: str, new_password: str) -> bool:
    """Validate old password and update to new password hash."""
    hashed_old = _hash_password(old_password)
    hashed_new = _hash_password(new_password)

    target_user = None
    for u in _STORE["users"]:
        if u.get("userId") == user_id:
            target_user = u
            break

    if not target_user and _firebase_available:
        try:
            doc = _col("users").document(user_id).get()
            if doc.exists:
                target_user = doc.to_dict()
        except Exception as e:
            print(f"[WARN] Firestore error change_password get: {e}")

    if not target_user:
        return False

    if target_user.get("passwordHash") != hashed_old:
        return False

    target_user["passwordHash"] = hashed_new
    if _firebase_available:
        try:
            _col("users").document(user_id).update({"passwordHash": hashed_new})
        except Exception as e:
            print(f"[WARN] Firestore error change_password update: {e}")
    _save_local_store()
    return True


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

def get_notifications_by_user(user_id: str) -> List[Dict[str, Any]]:
    """Retrieve all notifications for a specific user, newest first."""
    if _firebase_available:
        try:
            docs = (
                _col("notifications")
                .where("userId", "==", user_id)
                .stream()
            )
            items = [{"notificationId": d.id, **d.to_dict()} for d in docs]
            items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
            return items
        except Exception as e:
            print(f"[WARN] Firestore error get_notifications_by_user: {e}")

    user_notifs = [n for n in _STORE["notifications"] if n.get("userId") == user_id]
    user_notifs.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    return user_notifs

def create_notification(notif: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new notification document for a user."""
    notif_id = notif.get("notificationId") or f"notif-{str(uuid.uuid4())[:8]}"
    item = {
        "notificationId": notif_id,
        "userId": notif.get("userId", "usr-shipper-01"),
        "title": notif.get("title", "Notification"),
        "message": notif.get("message", ""),
        "type": notif.get("type", "status"),
        "relatedRouteId": notif.get("relatedRouteId"),
        "isRead": bool(notif.get("isRead", False)),
        "createdAt": notif.get("createdAt") or _now_iso(),
    }

    if _firebase_available:
        try:
            _col("notifications").document(notif_id).set(item)
        except Exception as e:
            print(f"[WARN] Firestore error create_notification: {e}")

    _STORE["notifications"].insert(0, item)
    _save_local_store()
    return item

def mark_notification_read(notification_id: str, user_id: str) -> bool:
    """Mark a notification as read."""
    if _firebase_available:
        try:
            doc_ref = _col("notifications").document(notification_id)
            doc = doc_ref.get()
            if doc.exists and doc.to_dict().get("userId") == user_id:
                doc_ref.update({"isRead": True})
        except Exception as e:
            print(f"[WARN] Firestore error mark_notification_read: {e}")

    found = False
    for n in _STORE["notifications"]:
        if n.get("notificationId") == notification_id and n.get("userId") == user_id:
            n["isRead"] = True
            found = True
            break
    if found:
        _save_local_store()
    return found

def mark_all_notifications_read(user_id: str) -> int:
    """Mark all notifications for a user as read."""
    count = 0
    if _firebase_available:
        try:
            docs = _col("notifications").where("userId", "==", user_id).stream()
            for d in docs:
                if not d.to_dict().get("isRead", False):
                    d.reference.update({"isRead": True})
                    count += 1
        except Exception as e:
            print(f"[WARN] Firestore error mark_all_notifications_read: {e}")

    for n in _STORE["notifications"]:
        if n.get("userId") == user_id and not n.get("isRead", False):
            n["isRead"] = True
            count += 1
    _save_local_store()
    return count

def clear_user_notifications(user_id: str) -> int:
    """Delete all notifications for a given user."""
    count = 0
    if _firebase_available:
        try:
            docs = _col("notifications").where("userId", "==", user_id).stream()
            for d in docs:
                d.reference.delete()
                count += 1
        except Exception as e:
            print(f"[WARN] Firestore error clear_user_notifications: {e}")

    before_len = len(_STORE["notifications"])
    _STORE["notifications"] = [n for n in _STORE["notifications"] if n.get("userId") != user_id]
    count = max(count, before_len - len(_STORE["notifications"]))
    _save_local_store()
    return count

def delete_single_notification(notification_id: str, user_id: str) -> bool:
    """Delete a single notification by id."""
    if _firebase_available:
        try:
            doc_ref = _col("notifications").document(notification_id)
            doc = doc_ref.get()
            if doc.exists and doc.to_dict().get("userId") == user_id:
                doc_ref.delete()
        except Exception as e:
            print(f"[WARN] Firestore error delete_single_notification: {e}")

    before = len(_STORE["notifications"])
    _STORE["notifications"] = [
        n for n in _STORE["notifications"]
        if not (n.get("notificationId") == notification_id and n.get("userId") == user_id)
    ]
    changed = len(_STORE["notifications"]) < before
    if changed:
        _save_local_store()
    return changed


# ---------------------------------------------------------------------------
# Seed data loader
# ---------------------------------------------------------------------------

def seed_demo_data():
    """Load demo routes and seed data into Firestore (or local store). Safe to run multiple times."""
    if _firebase_available:
        try:
            for route in DEMO_ROUTES:
                upsert_route(dict(route))
            for u in INITIAL_USERS:
                _col("users").document(u["userId"]).set(u)
            for n in INITIAL_NOTIFICATIONS:
                _col("notifications").document(n["notificationId"]).set(n)
            print(f"[OK] Seeded demo data to Firestore.")
        except Exception as e:
            print(f"[WARN] Firestore seeding warning: {e}")
    else:
        _save_local_store()
        print(f"[INFO] Using persistent local data store ({len(_STORE['routes'])} routes, {len(_STORE['users'])} users, {len(_STORE['notifications'])} notifications).")
