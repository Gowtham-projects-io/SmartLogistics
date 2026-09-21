"""
Demo seed data for SmartLogistics.
4 realistic Tamil Nadu truck routes with coordinates sourced from OpenStreetMap.
"""

DEMO_ROUTES = [
    {
        "truckId": "TN-38-A1234",
        "driverName": "Rajesh Kumar",
        "origin": "Chennai",
        "destination": "Coimbatore",
        "originCoords": [13.0827, 80.2707],
        "destinationCoords": [11.0168, 76.9558],
        # Realistic road waypoints: Chennai → Vellore → Salem → Erode → Coimbatore
        "polyline": [
            [13.0827, 80.2707],  # Chennai
            [13.0524, 80.2141],
            [13.0105, 79.9679],
            [12.9368, 79.7253],
            [12.9165, 79.1325],  # Near Vellore
            [12.8406, 78.9999],
            [12.6934, 78.8206],
            [12.5165, 78.5538],
            [11.6834, 78.1588],  # Near Salem
            [11.4755, 77.9629],
            [11.3410, 77.7172],  # Erode
            [11.1085, 77.3411],
            [11.0168, 76.9558],  # Coimbatore
        ],
        "capacityKg": 10000,
        "availableCapacityKg": 5000,
        "cargoType": "general",
        "departureTime": "2026-09-21T06:00:00",
        "baseTripCost": 9500,
        "status": "active",
    },
    {
        "truckId": "TN-33-B5678",
        "driverName": "Murugan Selvam",
        "origin": "Chennai",
        "destination": "Coimbatore",
        "originCoords": [13.0827, 80.2707],
        "destinationCoords": [11.0168, 76.9558],
        # Via Salem bypass
        "polyline": [
            [13.0827, 80.2707],  # Chennai
            [12.9716, 80.1951],
            [12.8342, 79.7023],
            [12.7219, 79.1200],
            [12.5510, 78.8200],
            [11.9102, 78.3800],
            [11.6634, 78.1488],  # Salem
            [11.4000, 77.8800],
            [11.0168, 76.9558],  # Coimbatore
        ],
        "capacityKg": 8000,
        "availableCapacityKg": 3200,
        "cargoType": "packaged_goods",
        "departureTime": "2026-09-21T08:00:00",
        "baseTripCost": 8800,
        "status": "active",
    },
    {
        "truckId": "TN-45-C9012",
        "driverName": "Senthil Arumugam",
        "origin": "Chennai",
        "destination": "Madurai",
        "originCoords": [13.0827, 80.2707],
        "destinationCoords": [9.9252, 78.1198],
        # Via Tiruchirappalli
        "polyline": [
            [13.0827, 80.2707],  # Chennai
            [12.8254, 80.0365],
            [12.5604, 79.8500],
            [12.3400, 79.6800],
            [11.9400, 79.5200],
            [11.7480, 79.2500],
            [10.9305, 78.6177],  # Trichy
            [10.4500, 78.4000],
            [10.1000, 78.2000],
            [9.9252, 78.1198],   # Madurai
        ],
        "capacityKg": 12000,
        "availableCapacityKg": 6000,
        "cargoType": "textiles",
        "departureTime": "2026-09-21T07:00:00",
        "baseTripCost": 11000,
        "status": "active",
    },
    {
        "truckId": "TN-02-D3456",
        "driverName": "Karthik Venkatesh",
        "origin": "Chennai",
        "destination": "Bengaluru",
        "originCoords": [13.0827, 80.2707],
        "destinationCoords": [12.9716, 77.5946],
        # Via Vellore
        "polyline": [
            [13.0827, 80.2707],  # Chennai
            [12.9800, 80.0800],
            [12.9165, 79.1325],  # Vellore
            [12.8500, 78.5000],
            [13.1700, 78.2500],
            [13.0000, 77.8000],
            [12.9716, 77.5946],  # Bengaluru
        ],
        "capacityKg": 15000,
        "availableCapacityKg": 8000,
        "cargoType": "electronics",
        "departureTime": "2026-09-21T05:00:00",
        "baseTripCost": 7500,
        "status": "active",
    },
]

DEMO_SHIPMENTS = [
    {
        "requestId": "REQ-001",
        "shipperName": "Lakshmi Textiles Pvt Ltd",
        "pickup": {"lat": 13.0827, "lng": 80.2707},
        "pickupName": "Chennai",
        "drop": {"lat": 11.3410, "lng": 77.7172},
        "dropName": "Erode",
        "weightKg": 2000,
        "cargoType": "textiles",
        "status": "matched",
    },
    {
        "requestId": "REQ-002",
        "shipperName": "Sri Ganesh Electronics",
        "pickup": {"lat": 13.0827, "lng": 80.2707},
        "pickupName": "Chennai",
        "drop": {"lat": 11.6634, "lng": 78.1488},
        "dropName": "Salem",
        "weightKg": 500,
        "cargoType": "electronics",
        "status": "pending",
    },
    {
        "requestId": "REQ-003",
        "shipperName": "Meena Stores",
        "pickup": {"lat": 13.0827, "lng": 80.2707},
        "pickupName": "Chennai",
        "drop": {"lat": 10.9305, "lng": 78.6177},
        "dropName": "Tiruchirappalli",
        "weightKg": 1200,
        "cargoType": "packaged_goods",
        "status": "pending",
    },
]

ANALYTICS_DATA = {
    "activeTrucks": 4,
    "totalCapacityKg": 45000,
    "availableCapacityKg": 22200,
    "pendingShipments": 3,
    "successfulMatches": 12,
    "totalSavingsInr": 87400,
    "capacityUtilizationPercent": 50.7,
    "dailyMatches": [
        {"day": "Mon", "matches": 3},
        {"day": "Tue", "matches": 5},
        {"day": "Wed", "matches": 4},
        {"day": "Thu", "matches": 7},
        {"day": "Fri", "matches": 6},
        {"day": "Sat", "matches": 8},
        {"day": "Sun", "matches": 12},
    ],
    "dailySavings": [
        {"day": "Mon", "savings": 12000},
        {"day": "Tue", "savings": 18500},
        {"day": "Wed", "savings": 14200},
        {"day": "Thu", "savings": 22000},
        {"day": "Fri", "savings": 19800},
        {"day": "Sat", "savings": 25600},
        {"day": "Sun", "savings": 31200},
    ],
    "capacityByRoute": [
        {"route": "CHN→CBE", "total": 10000, "available": 5000},
        {"route": "CHN→CBE2", "total": 8000, "available": 3200},
        {"route": "CHN→MDU", "total": 12000, "available": 6000},
        {"route": "CHN→BLR", "total": 15000, "available": 8000},
    ],
}
