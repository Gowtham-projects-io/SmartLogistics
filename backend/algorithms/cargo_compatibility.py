"""
Cargo Compatibility Rules Engine
==================================

A transparent rule-based matrix — no ML needed.
Rules are defined as a list of (cargo_a, cargo_b, compatible, reason).
Lookup is symmetric: (A, B) == (B, A).
"""
from typing import Dict

# Each rule: (typeA, typeB, compatible, severity, reason)
# severity: "ok", "warning", "rejected"
_RULES = [
    # ✅ Compatible pairs
    ("textiles",        "electronics",      True,  "ok",       "Electronics and textiles can share space safely."),
    ("textiles",        "packaged_goods",   True,  "ok",       "Packaged goods and textiles are fully compatible."),
    ("electronics",     "packaged_goods",   True,  "ok",       "Electronics and packaged goods can be co-loaded."),
    ("general",         "textiles",         True,  "ok",       "General goods and textiles are compatible."),
    ("general",         "packaged_goods",   True,  "ok",       "General goods and packaged goods are compatible."),
    ("general",         "electronics",      True,  "ok",       "General goods and electronics are compatible."),
    ("general",         "general",          True,  "ok",       "Same cargo type — fully compatible."),
    ("textiles",        "textiles",         True,  "ok",       "Same cargo type — fully compatible."),
    ("electronics",     "electronics",      True,  "ok",       "Same cargo type — fully compatible."),
    ("packaged_goods",  "packaged_goods",   True,  "ok",       "Same cargo type — fully compatible."),

    # ⚠️ Warnings (allowed but flagged)
    ("food",            "textiles",         True,  "warning",  "Food and textiles can co-exist but ensure sealed packaging."),
    ("food",            "packaged_goods",   True,  "warning",  "Food-grade packaging required for co-loading with packaged goods."),
    ("fragile",         "electronics",      True,  "warning",  "Both fragile — ensure adequate padding and vibration protection."),

    # ❌ Rejected pairs
    ("food",            "chemicals",        False, "rejected", "Food and chemicals cannot be co-loaded — contamination risk."),
    ("chemicals",       "food",             False, "rejected", "Chemicals and food cannot be co-loaded — contamination risk."),
    ("fragile",         "heavy_machinery",  False, "rejected", "Fragile goods cannot be co-loaded with heavy machinery."),
    ("heavy_machinery", "fragile",          False, "rejected", "Heavy machinery cannot be co-loaded with fragile goods."),
    ("hazardous",       "general",          False, "rejected", "Hazardous goods require a dedicated truck."),
    ("general",         "hazardous",        False, "rejected", "Hazardous goods require a dedicated truck."),
    ("hazardous",       "textiles",         False, "rejected", "Hazardous goods cannot be co-loaded with textiles."),
    ("hazardous",       "electronics",      False, "rejected", "Hazardous goods cannot be co-loaded with electronics."),
    ("hazardous",       "food",             False, "rejected", "Hazardous goods cannot be co-loaded with food."),
    ("food",            "hazardous",        False, "rejected", "Food cannot be co-loaded with hazardous materials."),
    ("chemicals",       "electronics",      False, "rejected", "Chemical fumes may damage electronics."),
    ("electronics",     "chemicals",        False, "rejected", "Chemical fumes may damage electronics."),
]


def _normalize(cargo_type: str) -> str:
    return cargo_type.strip().lower().replace(" ", "_").replace("-", "_")


def check_cargo_compatibility(truck_cargo: str, shipment_cargo: str) -> Dict:
    """
    Check whether a truck's existing cargo and the new shipment cargo are compatible.

    Returns:
        {
            "compatible": bool,
            "reason": str,
            "severity": "ok" | "warning" | "rejected"
        }
    """
    a = _normalize(truck_cargo)
    b = _normalize(shipment_cargo)

    # Check exact match first (same type is always ok unless explicitly ruled out)
    if a == b:
        return {
            "compatible": True,
            "reason": f"Same cargo type ({a}) — fully compatible.",
            "severity": "ok",
        }

    # Search rules (symmetric lookup)
    for rule_a, rule_b, compatible, severity, reason in _RULES:
        if (rule_a == a and rule_b == b) or (rule_a == b and rule_b == a):
            return {
                "compatible": compatible,
                "reason": reason,
                "severity": severity,
            }

    # Unknown combination — allow with a generic warning
    return {
        "compatible": True,
        "reason": f"Cargo types '{truck_cargo}' and '{shipment_cargo}' have no specific restriction. Verify with the driver.",
        "severity": "warning",
    }
