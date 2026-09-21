"""
Pydantic models / schemas for SmartLogistics API.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class Coordinates(BaseModel):
    lat: float
    lng: float


class TruckRoute(BaseModel):
    truckId: str
    driverName: str
    origin: str
    destination: str
    polyline: List[List[float]]  # [[lat, lng], ...]
    capacityKg: float
    availableCapacityKg: float
    cargoType: str
    departureTime: str
    baseTripCost: float
    status: str = "active"


class ShipmentRequest(BaseModel):
    requestId: Optional[str] = None
    shipperName: str
    pickup: Coordinates
    pickupName: str
    drop: Coordinates
    dropName: str
    weightKg: float
    cargoType: str
    createdAt: Optional[str] = None
    status: str = "pending"


class MatchFindRequest(BaseModel):
    pickup: Coordinates
    pickupName: str = "Pickup"
    drop: Coordinates
    dropName: str = "Drop"
    weightKg: float
    cargoType: str


class MatchResult(BaseModel):
    matchId: str
    truckId: str
    truckRoute: TruckRoute
    requestId: Optional[str] = None
    routeCompatibility: float      # 0-100
    pickupRouteIndex: int
    dropRouteIndex: int
    detourDistanceKm: float
    detourTimeMin: float
    matchScore: float              # 0-100
    matchExplanation: str
    cargoCompatible: bool
    cargoMessage: str
    status: str = "matched"


class PricingRequest(BaseModel):
    baseTripCost: float
    truckCapacityKg: float
    shipmentWeightKg: float
    detourDistanceKm: float
    fuelCostPerKm: float = 35.0
    platformFee: float = 100.0


class PricingResult(BaseModel):
    volumeShare: float
    detourCost: float
    platformFee: float
    finalPrice: float
    dedicatedTruckCost: float
    estimatedSavings: float
    savingsPercent: float
    explanation: str


class CargoCheckRequest(BaseModel):
    truckCargoType: str
    shipmentCargoType: str


class CargoCheckResult(BaseModel):
    compatible: bool
    reason: str
    severity: str   # "ok", "warning", "rejected"


class AIQueryRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None


class AIQueryResponse(BaseModel):
    response: str
    confidence: float
    suggestions: List[str] = []


# ---------------------------------------------------------------------------
# User & Auth Schemas
# ---------------------------------------------------------------------------

class User(BaseModel):
    userId: str
    email: str
    fullName: str
    phone: str = ""
    userType: str = "Shipper"  # "Shipper" or "Truck Owner"
    company: str = ""
    location: str = ""
    totalLoads: int = 0
    completedDeliveries: int = 0
    rating: float = 5.0
    avatarUrl: str = ""
    createdAt: Optional[str] = None


class UserUpdate(BaseModel):
    fullName: Optional[str] = None
    phone: Optional[str] = None
    userType: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    avatarUrl: Optional[str] = None


class ChangePassword(BaseModel):
    oldPassword: str
    newPassword: str


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    fullName: str
    phone: str = ""
    userType: str = "Shipper"
    company: str = ""
    location: str = ""


# ---------------------------------------------------------------------------
# Notification Schemas
# ---------------------------------------------------------------------------

class Notification(BaseModel):
    notificationId: str
    userId: str
    title: str
    message: str
    type: str = "status"  # "match", "request", "status", "truck_update", "delivery"
    relatedRouteId: Optional[str] = None
    isRead: bool = False
    createdAt: str


class NotificationCreate(BaseModel):
    title: str
    message: str
    type: str = "status"
    relatedRouteId: Optional[str] = None
    userId: Optional[str] = None

