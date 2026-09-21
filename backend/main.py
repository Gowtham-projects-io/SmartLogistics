"""
SmartLogistics FastAPI Backend
================================
Run with:  uvicorn main:app --reload --port 8000
"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from models.schemas import (
    ShipmentRequest, MatchFindRequest, PricingRequest,
    CargoCheckRequest, AIQueryRequest,
    User, UserUpdate, LoginRequest, SignupRequest, ChangePassword,
    Notification, NotificationCreate
)
from algorithms.route_matching import find_matching_trucks
from algorithms.pricing import calculate_price
from algorithms.cargo_compatibility import check_cargo_compatibility
from algorithms.ai_assistant import query_ai
from services.firebase_service import (
    get_all_routes, get_route_by_truck_id,
    get_all_requests, create_request, update_request_status,
    get_all_matches, save_match, seed_demo_data,
    get_user_by_id, get_user_by_email, verify_credentials,
    create_user, update_user, change_password,
    get_notifications_by_user, create_notification,
    mark_notification_read, mark_all_notifications_read,
    clear_user_notifications, delete_single_notification,
)
from demo_data import ANALYTICS_DATA

app = FastAPI(
    title="SmartLogistics API",
    description="AI-powered shared truck capacity and route-matching platform",
    version="1.0.0",
)

# Allow all origins in dev; restrict in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    seed_demo_data()


# ---------------------------------------------------------------------------
# Auth Helper Dependency
# ---------------------------------------------------------------------------

def get_current_user(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
) -> dict:
    """
    Extract authenticated user from Authorization header (Bearer <token>)
    or X-User-Id header. Defaults to demo user if unspecified.
    """
    user_id = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
            if token.startswith("token_"):
                user_id = token.replace("token_", "")
            else:
                user_id = token

    if not user_id and x_user_id:
        user_id = x_user_id

    # Fallback to demo shipper if not provided
    if not user_id:
        user_id = "usr-shipper-01"

    user = get_user_by_id(user_id)
    if not user:
        # If user_id wasn't in db, fallback to first seed user
        user = get_user_by_id("usr-shipper-01")
    return user or {
        "userId": "usr-shipper-01",
        "email": "shipper@smartlogistics.com",
        "fullName": "Ramesh Varma",
        "userType": "Shipper",
    }


def require_auth_user(
    authorization: Optional[str] = Header(None),
    x_user_id: Optional[str] = Header(None),
) -> dict:
    """Strict auth check that requires a valid token/header."""
    user_id = None
    if authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            token = parts[1]
            if token.startswith("token_"):
                user_id = token.replace("token_", "")
            else:
                user_id = token

    if not user_id and x_user_id:
        user_id = x_user_id

    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication token required.")

    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid authentication token or user not found.")
    return user


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok", "service": "SmartLogistics API"}


# ---------------------------------------------------------------------------
# Authentication Endpoints
# ---------------------------------------------------------------------------

@app.post("/auth/login")
def login(req: LoginRequest):
    """Log in with email and password."""
    user = verify_credentials(req.email, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = f"token_{user['userId']}"
    return {
        "token": token,
        "user": user,
        "message": "Login successful.",
    }


@app.post("/auth/signup", status_code=201)
def signup(req: SignupRequest):
    """Register a new user account."""
    existing = get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    user_dict = {
        "email": req.email,
        "fullName": req.fullName,
        "phone": req.phone,
        "userType": req.userType,
        "company": req.company,
        "location": req.location,
    }
    new_user = create_user(user_dict, req.password)
    token = f"token_{new_user['userId']}"
    return {
        "token": token,
        "user": new_user,
        "message": "User registered successfully.",
    }


@app.get("/auth/me")
def get_me(user: dict = Depends(get_current_user)):
    """Return currently authenticated user profile."""
    return {"user": user}


@app.post("/auth/logout")
def logout():
    """Sign out the current session."""
    return {"message": "Signed out successfully."}


@app.post("/auth/change-password")
def handle_change_password(req: ChangePassword, user: dict = Depends(require_auth_user)):
    """Change the user's password."""
    success = change_password(user["userId"], req.oldPassword, req.newPassword)
    if not success:
        raise HTTPException(status_code=400, detail="Incorrect current password.")
    return {"message": "Password updated successfully."}


# ---------------------------------------------------------------------------
# User Profile Endpoints
# ---------------------------------------------------------------------------

@app.get("/users/profile")
def get_profile(user: dict = Depends(get_current_user)):
    """Get the current user's profile."""
    return {"user": user}


@app.put("/users/profile")
def update_profile(updates: UserUpdate, user: dict = Depends(require_auth_user)):
    """Update editable profile information for the authenticated user."""
    update_data = updates.model_dump(exclude_unset=True)
    updated_user = update_user(user["userId"], update_data)
    if not updated_user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"user": updated_user, "message": "Profile updated successfully."}


@app.get("/users/{user_id}")
def get_user_by_id_endpoint(user_id: str):
    """Get public profile for a user ID."""
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"user": user}


# ---------------------------------------------------------------------------
# Notification Endpoints
# ---------------------------------------------------------------------------

@app.get("/notifications")
def list_notifications(user: dict = Depends(get_current_user)):
    """Get all notifications for the authenticated user, newest first."""
    user_id = user["userId"]
    items = get_notifications_by_user(user_id)
    unread_count = sum(1 for n in items if not n.get("isRead", False))
    return {
        "notifications": items,
        "unreadCount": unread_count,
        "total": len(items),
    }


@app.post("/notifications", status_code=201)
def add_notification(req: NotificationCreate, user: dict = Depends(get_current_user)):
    """Create a new notification for the user."""
    target_user_id = req.userId or user["userId"]
    notif_data = req.model_dump()
    notif_data["userId"] = target_user_id
    created = create_notification(notif_data)
    return {"notification": created, "message": "Notification created."}


@app.patch("/notifications/{notification_id}/read")
def mark_read(notification_id: str, user: dict = Depends(get_current_user)):
    """Mark a specific notification as read."""
    success = mark_notification_read(notification_id, user["userId"])
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return {"success": True, "message": "Notification marked as read."}


@app.post("/notifications/mark-all-read")
def mark_all_read(user: dict = Depends(get_current_user)):
    """Mark all notifications for the authenticated user as read."""
    count = mark_all_notifications_read(user["userId"])
    return {"success": True, "count": count, "message": f"{count} notifications marked as read."}


@app.delete("/notifications/clear")
def clear_notifications(user: dict = Depends(get_current_user)):
    """Clear/delete all notifications for the current user."""
    count = clear_user_notifications(user["userId"])
    return {"success": True, "count": count, "message": "All notifications cleared."}


@app.delete("/notifications/{notification_id}")
def delete_notification(notification_id: str, user: dict = Depends(get_current_user)):
    """Delete a single notification."""
    success = delete_single_notification(notification_id, user["userId"])
    if not success:
        raise HTTPException(status_code=404, detail="Notification not found.")
    return {"success": True, "message": "Notification removed."}


@app.post("/notifications/trigger-demo-event")
def trigger_demo_notification(event_type: str = "match", user: dict = Depends(get_current_user)):
    """Helper to simulate real-time notification events in the demo."""
    user_id = user["userId"]
    event_templates = {
        "match": {
            "title": "New Truck Capacity Matched!",
            "message": "Truck TN-02-D3456 has 8,000 kg available along Chennai → Bengaluru. Match score: 91%.",
            "type": "match",
            "relatedRouteId": "TN-02-D3456",
        },
        "request": {
            "title": "Load-Sharing Request",
            "message": "A shipper requested 1,500 kg capacity on your active Salem corridor trip.",
            "type": "request",
            "relatedRouteId": "REQ-002",
        },
        "status": {
            "title": "Load Request Accepted",
            "message": "Truck owner approved your shared space booking for ₹2,300. Truck is en route.",
            "type": "status",
            "relatedRouteId": "TN-38-A1234",
        },
        "truck_update": {
            "title": "Truck Approaching Pickup",
            "message": "Driver Rajesh Kumar is 15 minutes away from your Chennai warehouse.",
            "type": "truck_update",
            "relatedRouteId": "TN-38-A1234",
        },
        "delivery": {
            "title": "Shipment Delivered!",
            "message": "Your load was delivered safely in Coimbatore and verified by recipient OTP.",
            "type": "delivery",
            "relatedRouteId": "REQ-001",
        },
    }

    template = event_templates.get(event_type, event_templates["match"])
    created = create_notification({
        **template,
        "userId": user_id,
        "isRead": False,
    })
    return {"notification": created, "message": f"Demo event '{event_type}' triggered."}


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/routes")
def list_routes():
    """Return all active truck routes."""
    return {"routes": get_all_routes()}


@app.get("/routes/{truck_id}")
def get_route(truck_id: str):
    """Return a single truck route by truckId."""
    route = get_route_by_truck_id(truck_id)
    if not route:
        raise HTTPException(status_code=404, detail=f"Truck '{truck_id}' not found.")
    return route


# ---------------------------------------------------------------------------
# Shipment Requests
# ---------------------------------------------------------------------------

@app.post("/requests", status_code=201)
def create_shipment_request(req: ShipmentRequest, user: dict = Depends(get_current_user)):
    """Create a new shipment request and trigger corresponding notification."""
    data = req.model_dump()
    data["requestId"] = f"REQ-{str(uuid.uuid4())[:8].upper()}"
    data["createdAt"] = datetime.now(timezone.utc).isoformat()
    request_id = create_request(data)

    # Automatically create a persistent notification for the user
    create_notification({
        "userId": user["userId"],
        "title": "Shipment Request Created",
        "message": f"Request {request_id} for {req.pickupName} → {req.dropName} ({req.weightKg:,.0f} kg {req.cargoType}) is now active.",
        "type": "request",
        "relatedRouteId": request_id,
        "isRead": False,
    })

    return {"requestId": request_id, "message": "Shipment request created successfully."}


@app.get("/requests")
def list_requests():
    """Return all shipment requests."""
    return {"requests": get_all_requests()}


# ---------------------------------------------------------------------------
# Matching
# ---------------------------------------------------------------------------

@app.post("/matches/find")
def find_matches(req: MatchFindRequest):
    """
    Find all trucks that can carry this shipment.
    Returns matches sorted by match score (best first).
    """
    trucks = get_all_routes()

    def cargo_fn(truck_cargo: str, shipment_cargo: str) -> dict:
        return check_cargo_compatibility(truck_cargo, shipment_cargo)

    matches = find_matching_trucks(
        trucks=trucks,
        pickup={"lat": req.pickup.lat, "lng": req.pickup.lng},
        drop={"lat": req.drop.lat, "lng": req.drop.lng},
        weight_kg=req.weightKg,
        cargo_type=req.cargoType,
        cargo_compatible_fn=cargo_fn,
    )

    return {
        "matches": matches,
        "total": len(matches),
        "bestMatch": matches[0] if matches else None,
    }


@app.get("/matches")
def list_matches():
    """Return all saved matches."""
    return {"matches": get_all_matches()}


# ---------------------------------------------------------------------------
# Pricing
# ---------------------------------------------------------------------------

@app.post("/pricing/calculate")
def calculate_pricing(req: PricingRequest):
    """Calculate shared-capacity price for a shipment."""
    result = calculate_price(
        base_trip_cost=req.baseTripCost,
        truck_capacity_kg=req.truckCapacityKg,
        shipment_weight_kg=req.shipmentWeightKg,
        detour_distance_km=req.detourDistanceKm,
        fuel_cost_per_km=req.fuelCostPerKm,
        platform_fee=req.platformFee,
    )
    return result


# ---------------------------------------------------------------------------
# Cargo Compatibility
# ---------------------------------------------------------------------------

@app.post("/cargo/check")
def check_cargo(req: CargoCheckRequest):
    """Check if two cargo types are compatible for co-loading."""
    return check_cargo_compatibility(req.truckCargoType, req.shipmentCargoType)


# ---------------------------------------------------------------------------
# AI Assistant
# ---------------------------------------------------------------------------

@app.post("/ai/query")
def ai_query(req: AIQueryRequest):
    """Query the AI logistics assistant."""
    result = query_ai(req.query, req.context)
    return result


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------

@app.get("/analytics")
def get_analytics():
    """Return aggregated analytics/dashboard metrics."""
    routes = get_all_routes()
    requests = get_all_requests()
    matches = get_all_matches()

    total_capacity = sum(r.get("capacityKg", 0) for r in routes)
    available_capacity = sum(r.get("availableCapacityKg", 0) for r in routes)

    return {
        **ANALYTICS_DATA,
        "activeTrucks": len([r for r in routes if r.get("status") == "active"]),
        "totalCapacityKg": total_capacity,
        "availableCapacityKg": available_capacity,
        "pendingShipments": len([r for r in requests if r.get("status") == "pending"]),
        "successfulMatches": len(matches) + 12,
    }
