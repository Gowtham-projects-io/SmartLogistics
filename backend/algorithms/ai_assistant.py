"""
Mock AI Logistics Assistant
============================

Deterministic rule-based responses for the hackathon demo.
Structured so that a real LLM (Gemini, OpenAI, etc.) can be
plugged in by replacing the `query_ai` function body.

To connect a real LLM:
  1. Set GEMINI_API_KEY (or OPENAI_API_KEY) in .env
  2. Replace the body of `query_ai` with an actual API call
  3. Pass the `context` dict as part of the system prompt
"""
import re
from typing import Dict, Any, Optional

# ---------------------------------------------------------------------------
# Predefined response templates keyed by intent pattern
# ---------------------------------------------------------------------------
_RESPONSES = [
    {
        "patterns": ["best truck", "find truck", "which truck", "recommend truck"],
        "response": (
            "Based on the current shipment, **Truck TN-38-A1234** (Chennai → Coimbatore) "
            "is the best match with a **94% match score**. "
            "It passes through Erode on its existing route, has 5,000 kg spare capacity, "
            "and requires only an 8 km detour. The fair price is ₹2,300 — saving you ₹7,200 "
            "compared to a dedicated truck."
        ),
        "confidence": 0.95,
        "suggestions": [
            "Why was this truck selected?",
            "How much will I save?",
            "Are there other options?",
        ],
    },
    {
        "patterns": ["why.*selected", "why.*chosen", "why this truck", "selection reason"],
        "response": (
            "Truck **TN-38-A1234** was selected for three key reasons:\n\n"
            "1. **Route alignment** — Erode lies directly on the Chennai→Coimbatore highway, "
            "so no significant detour is needed.\n"
            "2. **Sufficient capacity** — The truck has 5,000 kg available; your shipment is 2,000 kg.\n"
            "3. **Cargo compatibility** — General goods and textiles can be safely co-loaded.\n\n"
            "The match score of 94% reflects excellent alignment across all four criteria."
        ),
        "confidence": 0.97,
        "suggestions": [
            "How much will I save?",
            "Can another truck carry this shipment?",
        ],
    },
    {
        "patterns": ["how much.*save", "savings", "cost saving", "save money"],
        "response": (
            "By using shared capacity instead of a dedicated truck, you save approximately **₹7,200**.\n\n"
            "| Item | Amount |\n"
            "|------|--------|\n"
            "| Dedicated truck cost | ₹9,500 |\n"
            "| Shared capacity price | ₹2,300 |\n"
            "| **Your savings** | **₹7,200 (75.8%)** |\n\n"
            "The shared price covers only your proportional route share (20% of the truck) "
            "plus a small detour surcharge."
        ),
        "confidence": 0.99,
        "suggestions": [
            "How is the price calculated?",
            "Find the best truck for this shipment",
        ],
    },
    {
        "patterns": ["another truck", "other truck", "alternative", "other option"],
        "response": (
            "Yes — **Truck TN-33-B5678** (Chennai → Coimbatore via Salem) is also a viable option "
            "with a **78% match score**. It has 3,200 kg spare capacity (sufficient for your 2,000 kg shipment), "
            "but requires a slightly longer detour through Salem before reaching Erode. "
            "The estimated price would be around ₹2,650 with that route."
        ),
        "confidence": 0.88,
        "suggestions": [
            "Compare both trucks",
            "How much will I save with the alternative?",
        ],
    },
    {
        "patterns": ["rejected", "why.*reject", "no match", "no truck"],
        "response": (
            "A shipment may be rejected for one of these reasons:\n\n"
            "• **Route deviation** — Pickup or drop is more than 5 km off any truck's route\n"
            "• **Insufficient capacity** — No truck has enough spare capacity\n"
            "• **Cargo incompatibility** — The cargo types cannot be co-loaded (e.g., food + chemicals)\n"
            "• **Wrong direction** — The drop is before the pickup on the truck's route\n\n"
            "Try adjusting the pickup/drop location or choosing a compatible cargo type."
        ),
        "confidence": 0.92,
        "suggestions": [
            "What cargo types are compatible?",
            "Find the best truck for this shipment",
        ],
    },
    {
        "patterns": ["most.*capacity", "available capacity", "which route.*capacity", "capacity"],
        "response": (
            "The route with the most available capacity right now is **Chennai → Bengaluru** "
            "(Truck TN-02-D3456) with **8,000 kg** free out of 15,000 kg total. "
            "For the Chennai → Coimbatore corridor, Truck TN-38-A1234 has 5,000 kg available. "
            "Use the **Live Routes** page to see real-time capacity for all active trucks."
        ),
        "confidence": 0.90,
        "suggestions": [
            "Show all active trucks",
            "Find the best truck for this shipment",
        ],
    },
    {
        "patterns": ["price.*calculate", "how.*price", "pricing", "cost breakdown", "how.*cost"],
        "response": (
            "The price is calculated in three parts:\n\n"
            "1. **Volume Share** = Base trip cost × (your weight ÷ truck capacity)\n"
            "   = ₹9,500 × (2,000 ÷ 10,000) = **₹1,900**\n\n"
            "2. **Detour Cost** = Detour distance × fuel cost per km\n"
            "   = 8.2 km × ₹35/km = **₹287 ≈ ₹300**\n\n"
            "3. **Platform Fee** = **₹100**\n\n"
            "**Total = ₹2,300**"
        ),
        "confidence": 0.98,
        "suggestions": [
            "How much will I save?",
            "Find the best truck for this shipment",
        ],
    },
    {
        "patterns": ["cargo.*compatible", "what.*cargo", "cargo type"],
        "response": (
            "Here's the compatibility summary:\n\n"
            "✅ **Compatible**: Textiles + Electronics, Textiles + Packaged Goods, "
            "Electronics + Packaged Goods, General + any standard cargo\n\n"
            "⚠️ **Caution**: Food + Textiles (sealed packaging required), "
            "Fragile + Electronics (extra padding needed)\n\n"
            "❌ **Rejected**: Food + Chemicals, Fragile + Heavy Machinery, "
            "Hazardous + any other cargo"
        ),
        "confidence": 0.95,
        "suggestions": [
            "Check my cargo compatibility",
            "Find the best truck for this shipment",
        ],
    },
]

_DEFAULT_RESPONSE = {
    "response": (
        "I can help you with route matching, pricing, and cargo compatibility. "
        "Try asking:\n"
        "• 'Find the best truck for this shipment'\n"
        "• 'How much will I save?'\n"
        "• 'Why was this truck selected?'\n"
        "• 'How is the price calculated?'\n"
        "• 'Which route has the most capacity?'"
    ),
    "confidence": 0.5,
    "suggestions": [
        "Find the best truck for this shipment",
        "How much will I save?",
        "Which route has the most available capacity?",
    ],
}


def query_ai(query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Query the AI assistant.

    Currently deterministic (mock). Replace this function body to connect
    a real LLM API (Gemini, OpenAI, etc.).

    Parameters
    ----------
    query   : user's natural-language question
    context : optional dict with current match/pricing data for richer answers

    Returns
    -------
    {
        "response": str,
        "confidence": float,
        "suggestions": list[str]
    }
    """
    query_lower = query.lower().strip()

    for item in _RESPONSES:
        for pattern in item["patterns"]:
            if re.search(pattern, query_lower):
                return {
                    "response": item["response"],
                    "confidence": item["confidence"],
                    "suggestions": item["suggestions"],
                }

    return dict(_DEFAULT_RESPONSE)
