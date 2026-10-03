import os
import re
import time
from typing import Dict, Any
from fastapi import APIRouter, HTTPException
from backend.app.config import settings
from backend.app.schemas import AIQuestionRequest, AIQuestionResponse

router = APIRouter(prefix="/ai", tags=["AI Intelligence Assistant"])

# Initialize Gemini Client if key exists
gemini_client = None
if settings.GEMINI_API_KEY:
    try:
        from google import genai
        gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        print("[AI Service] Operating mode: Live Google Gemini API Integration")
    except Exception as e:
        print(f"[AI Service] Gemini initialization failed: {e}. Operating in Calibrated Local Analytical Baseline mode.")
else:
    print("[AI Service] Operating mode: Calibrated Local Analytical Baseline mode (GEMINI_API_KEY not configured)")

FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash"]

SYSTEM_PROMPT = """You are the AI Housing Intelligence Assistant for the California Housing Intelligence Platform.
Your purpose is to provide transparent, analytical explanations of machine-learning housing estimates and historical California Census data.

CRITICAL RULES:
1. Base your answer strictly on the provided context (model estimates, census features, location).
2. DO NOT fabricate current live MLS listings, active homes for sale, property addresses, or agent names.
3. Clearly state that property values are machine-learning statistical estimates derived from historical California census block groups.
4. DO NOT provide legal, tax, or binding mortgage/financial approval advice.
5. If the user asks about facts not in the context (like recent crime rates, school ratings, or current property condition), explicitly state: "I don't have verified data for that in the current dataset."
6. Maintain a helpful, objective, and analytical tone.
"""

def generate_local_analytical_reply(question: str, context: Dict[str, Any]) -> str:
    """
    Deterministic, question-aware, record-grounded local analytical engine
    active when external Gemini API is unreachable or unconfigured.
    """
    raw_q = question.strip()
    q_norm = raw_q.lower().replace('²', '2').replace('^2', '2')

    # Extract verified record attributes from supplied context (no arbitrary default numbers)
    price_val = context.get('predicted_value') or context.get('estimated_value')
    price = float(price_val) if price_val is not None else None

    income_val = context.get('median_income')
    income = float(income_val) if income_val is not None else None

    region = context.get('region_name')
    county = context.get('county_name')
    ocean = context.get('ocean_proximity')

    age_val = context.get('housing_median_age')
    age = float(age_val) if age_val is not None else None

    lat_val = context.get('latitude')
    lat = float(lat_val) if lat_val is not None else None

    lon_val = context.get('longitude')
    lon = float(lon_val) if lon_val is not None else None

    district_code = context.get('district_code')
    pop_val = context.get('population')
    pop = float(pop_val) if pop_val is not None else None

    state_avg_val = context.get('statewide_average') or context.get('state_average_valuation') or context.get('california_average')
    state_avg = float(state_avg_val) if state_avg_val is not None else None

    record_ref = f"record {district_code}" if district_code else "this housing record"

    # =========================================================================
    # 1. CONVERSATIONAL / POLITENESS INTENT
    # =========================================================================
    if re.search(r'\b(thank\s*you|thanks|thx|ok\s*thank|okay\s*thank)\b', q_norm) or re.match(r'^(ok(ay)?|cool|great|got\s*it|understood)[\s!.]*$', q_norm):
        return "You're welcome! Let me know if you would like to explore other details or characteristics of this housing record."

    if re.match(r'^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening))[\s!.,]*$', q_norm):
        region_str = f" in the {region} region" if region else ""
        return (
            f"Hello! I am your Housing Intelligence Assistant. I can provide grounded insights into {record_ref}{region_str}, "
            f"including its model-estimated valuation, demographics, coastal context, and Census features. What would you like to know?"
        )

    if re.match(r'^(bye|goodbye|see\s*you|farewell)[\s!.]*$', q_norm):
        return "Goodbye! Feel free to return whenever you need to explore California housing intelligence."

    # =========================================================================
    # 2. OUT-OF-SCOPE INTENT (Zero Hallucination Policy)
    # =========================================================================
    if re.search(r'\b(crime|safety|police|theft|murder|safe|violent|arrest)\b', q_norm):
        return (
            "I don't have verified crime or safety data for this record. The platform's dataset is strictly focused on "
            "historical 1990 U.S. Census geographic, demographic, structural, and model-estimated valuation metrics."
        )

    if re.search(r'\b(schools?|education|district\s*ratings?|elementary|high\s*school|kindergarten|university|college)\b', q_norm):
        return (
            "I don't have verified school ratings or educational directory data in this dataset. The available Census records "
            "cover structural counts, room averages, population density, and model-estimated valuations."
        )

    if re.search(r'\b(buy|purchase|homes?\s*for\s*sale|for\s*sale|active\s*listings?|live\s*listings?|mls|current\s*inventory)\b', q_norm):
        return (
            "I don't have verified live market inventory or active homes for sale. This platform provides historical California Census "
            "records and machine-learning valuation estimates for decision support, not live MLS real-estate listings or properties available for purchase."
        )

    if re.search(r'\b(hoa|hoa\s*fees?|property\s*tax(es)?|tax\s*assessment)\b', q_norm):
        return (
            "I don't have verified HOA fee or actual property tax assessment records for this Census block group. For estimated monthly "
            "mortgage and budgeting scenarios, please visit our dedicated Affordability & EMI Planner tool."
        )

    if re.search(r'\b(earthquake|fault\s*lines?|flood\s*zones?|wildfires?|fire\s*hazard)\b', q_norm):
        return (
            "I don't have verified natural hazard, fault line, or flood zone data in this dataset. The platform focuses on "
            "historical Census demographics, structural characteristics, and model estimations."
        )

    # =========================================================================
    # 3. DIRECT FACTUAL ATTRIBUTE LOOKUPS
    # =========================================================================
    if re.search(r'\b(what\s*(is|are)|tell\s*me|how\s*much)\b.*\b(estimated\s*value|estimated\s*valuation|valuation|price|worth|estimate)\b', q_norm) or q_norm in ['what is the estimated value?', 'what is the valuation?', 'what is the price?']:
        if price is not None:
            return (
                f"The model-estimated median housing value for this record is ${price:,.0f}. This is a statistical estimate "
                f"produced by the trained deep neural network model from Census features, rather than a live transaction appraisal "
                f"or guaranteed market price."
            )
        return "A model-estimated valuation is not available in the current record context."

    if re.search(r'\b(what\s*is|tell\s*me|how\s*much)\b.*\b(median\s*income|income|household\s*income|salary|earnings)\b', q_norm) or 'median income' in q_norm:
        if income is not None:
            return (
                f"The median household income metric for this record is {income:.2f} (which corresponds to approximately "
                f"${income * 10000:,.0f} per year in historical 1990 Census units of $10,000 USD)."
            )
        return "The median income metric is not available in the current record context."

    if re.search(r'\b(how\s*old|what\s*is\s*the\s*age|structure\s*age|housing\s*age)\b', q_norm) or ('age' in q_norm and any(k in q_norm for k in ['house', 'housing', 'structure', 'building'])):
        if age is not None:
            return f"The median structure age for residential buildings in this record is {age:.0f} years."
        return "The structure age for this record is not available in the current record context."

    if re.search(r'\b(what\s*is\s*the\s*(ocean|coastal)\s*(proximity|category)|what\s*is\s*the\s*proximity)\b', q_norm) or 'ocean proximity' in q_norm:
        if ocean:
            return f"The ocean proximity category for this record is '{ocean}'."
        return "The ocean proximity category is not available in the current record context."

    if re.search(r'\b(coordinates?|lat(itude)?\s*(and|&)\s*long(itude)?|lat\s*lon|gps)\b', q_norm):
        if lat is not None and lon is not None:
            return f"The geographic coordinates for this record are Latitude {lat:.4f} and Longitude {lon:.4f}."
        return "Geographic coordinates are not available in the current record context."

    if re.search(r'\b(what\s*county|which\s*county)\b', q_norm) or q_norm == 'what county is this in?':
        if county:
            return f"This housing record is located in {county} County, California."
        if region:
            return f"The specific county name is not available in the current context (Region: {region})."
        return "County information is not available in the current record context."

    if re.search(r'\b(what\s*region|which\s*region)\b', q_norm) or q_norm == 'what region is this in?':
        if region:
            return f"This housing record is situated within the {region} region of California."
        return "Region information is not available in the current record context."

    if re.search(r'\b(where\s*is\s*(this|it)|what\s*is\s*the\s*location)\b', q_norm) or q_norm in ['what is the location?', 'location?']:
        loc_parts = []
        if county:
            loc_parts.append(f"{county} County")
        if region:
            loc_parts.append(f"within the {region} region of California")
        if lat is not None and lon is not None:
            loc_parts.append(f"(Coordinates: Latitude {lat:.4f}, Longitude {lon:.4f})")
        if loc_parts:
            return f"This housing record is located in {' '.join(loc_parts)}."
        return "Location information is not available in the current record context."

    if re.search(r'\b(district\s*code|district\s*id|record\s*id)\b', q_norm):
        if district_code:
            return f"The identifier for this housing record is {district_code}."
        return "A record identifier was not provided in the current record context."

    if 'population' in q_norm or 'how many people' in q_norm:
        if pop is not None:
            return f"The recorded population headcount for this Census block group is {float(pop):,.0f} residents."
        return "Population headcount is one of the 9 California Census features in the platform dataset, representing the resident count of the block group."

    # =========================================================================
    # 4. COASTAL / OCEAN PROXIMITY ANALYTICAL INTENT
    # =========================================================================
    if re.search(r'\b(coastal|coast|ocean|bay|beach|water)\b', q_norm):
        if ocean:
            return (
                f"For this housing record, ocean proximity is categorized as '{ocean}'. In the historical California Housing dataset, "
                f"coastal positioning ('NEAR BAY', 'NEAR OCEAN', or '<1H OCEAN') is associated with higher median property valuations "
                f"compared to 'INLAND' records. The machine learning model uses this categorical feature alongside geographic coordinates "
                f"as input features, reflecting historical associative patterns rather than a causal relationship."
            )
        return "Ocean proximity information is not available in the current record context."

    # =========================================================================
    # 5. STRUCTURAL AGE ANALYTICAL INTENT
    # =========================================================================
    if re.search(r'\b(age|old|older|new|newer|built|structure|architectural)\b', q_norm):
        if age is not None:
            return (
                f"The median structure age for this record is {age:.0f} years. In the California Housing dataset, residential structure age "
                f"is one of the features used by the model to capture neighborhood development era and housing characteristics alongside room "
                f"counts and geographic coordinates."
            )
        return "Structure age information is not available in the current record context."

    # =========================================================================
    # 6. INCOME ANALYTICAL INTENT
    # =========================================================================
    if re.search(r'\b(income|salary|earnings|wealth|purchasing\s*power)\b', q_norm):
        if income is not None:
            return (
                f"This record has an area median income metric of {income:.2f} (~${income * 10000:,.0f}/yr). In the California Housing dataset, "
                f"area median household income is one of the key features used by the model and is positively associated with residential "
                f"property valuations. The model incorporates area income as a demographic feature reflecting local household purchasing levels."
            )
        return "Median income information is not available in the current record context."

    # =========================================================================
    # 7. LOCATION / GEOGRAPHY ANALYTICAL INTENT
    # =========================================================================
    if re.search(r'\b(location|geograph(y|ic)|county|region)\b', q_norm):
        loc_desc = f"{county} County ({region})" if county and region else (region or 'California')
        coord_desc = f" at Latitude {lat:.4f}, Longitude {lon:.4f}" if lat is not None and lon is not None else ""
        return (
            f"This record is situated in {loc_desc}{coord_desc}. In the machine-learning pipeline, normalized latitude and longitude "
            f"coordinates help the neural network account for spatial patterns across California."
        )

    # =========================================================================
    # 8. "WHY IS THIS VALUE HIGH/LOW?" & COMPARISON TO AVERAGE INTENT
    # =========================================================================
    if ('why' in q_norm and any(k in q_norm for k in ['high', 'expensive', 'low', 'cheap', 'cost', 'value', 'valuation', 'level', 'estimate', 'price'])) or 'higher or lower' in q_norm or ('average' in q_norm and any(k in q_norm for k in ['valuation', 'value', 'price', 'estimate'])):
        parts = []
        if price is not None:
            parts.append(f"The model-estimated median housing value for this record is ${price:,.0f}.")
        else:
            parts.append("A model-estimated valuation is not available in the current record context.")

        if state_avg is not None:
            diff = price - state_avg if price is not None else 0
            rel = "higher than" if diff > 0 else ("lower than" if diff < 0 else "equal to")
            parts.append(f"A verified statewide average of ${state_avg:,.0f} is available in context; this record's estimate is {rel} the statewide benchmark by approximately ${abs(diff):,.0f}.")
        else:
            parts.append("A verified statewide California average is not available in the current AI context, so a numerical comparison to the state average cannot be computed directly.")

        present_factors = []
        if income is not None:
            present_factors.append(f"a median household income metric of {income:.2f} (~${income * 10000:,.0f}/yr)")
        if ocean:
            present_factors.append(f"ocean proximity category of '{ocean}'")
        if age is not None:
            present_factors.append(f"a median structure age of {age:.0f} years")
        if region:
            present_factors.append(f"regional location in the {region} area")

        if present_factors:
            factors_str = "; ".join(present_factors)
            parts.append(f"Characteristics present in this record that the model uses as input features include: {factors_str}.")

        parts.append("In the historical California Census dataset, features like area income and coastal placement are statistically associated with valuation patterns. These represent machine-learning feature associations rather than direct causal claims, and the estimate reflects the interaction of all 12 preprocessed inputs.")
        return " ".join(parts)

    # =========================================================================
    # 9. DATA PROVENANCE INTENT
    # =========================================================================
    if re.search(r'\b(data|dataset|source|census|provenance|records?|where\s*did\s*this\s*come\s*from|historical\s*data)\b', q_norm):
        return (
            "This intelligence is grounded in the historical 1990 U.S. Census California housing dataset, comprising 20,640 verified "
            "block-group records. The platform does not use synthetic inventory or live MLS listings; every data point represents "
            "historical geographic, structural, and demographic observations from California census block groups."
        )

    # =========================================================================
    # 10. MODEL METHODOLOGY & ACCURACY METRICS (R2, MAE, RMSE) INTENT
    # =========================================================================
    if re.search(r'\b(r2|r-squared|mae|rmse|loss|accuracy|metrics?|neural\s*network|deep\s*learning|architecture|how\s*(does\s*the\s*model|was\s*it\s*trained)|algorithm)\b', q_norm):
        return (
            "The platform utilizes a 4-layer sequential deep neural network with dropout regularization "
            "(Dense 128 -> Dropout 0.3 -> Dense 64 -> Dropout 0.2 -> Dense 32 -> Dense 1). "
            "The model takes 9 raw input features which preprocessing transforms into 12 model inputs "
            "(StandardScaler for 8 continuous numeric features and OneHotEncoder(drop='first') for ocean proximity). "
            "It was trained on natural log-transformed target values ln(1 + value) to stabilize variance. "
            "On the verified test evaluation, the model achieves a Coefficient of Determination (R²) of 0.6276, "
            "a Mean Absolute Error (MAE) of $46,171.85, and a Root Mean Squared Error (RMSE) of $70,446.65. "
            "Predictions are statistical decision-support estimates rather than formal real-estate appraisals."
        )

    # =========================================================================
    # 11. AFFORDABILITY & MORTGAGE INTENT
    # =========================================================================
    if re.search(r'\b(afford|affordability|mortgage|emi|monthly\s*(payment|obligation|cost)|down\s*payment|loan)\b', q_norm):
        if price is not None:
            est_down = price * 0.20
            est_monthly = (price * 0.80) * 0.00632
            return (
                f"For a model-estimated valuation of ${price:,.0f}, a typical 30-year fixed mortgage with 20% down (~${est_down:,.0f}) "
                f"at an assumed 6.5% interest rate yields an estimated monthly principal and interest payment of roughly ${est_monthly:,.0f}/mo "
                f"(excluding property taxes and insurance). Standard budgeting guidelines recommend keeping total housing commitments below "
                f"28% to 36% of gross monthly household income."
            )
        return "An estimated monthly payment cannot be computed because a model-estimated valuation is not available in the current record context."

    # =========================================================================
    # 12. GENERAL UNKNOWN QUESTION (RECORD-GROUNDED CONCISE SUMMARY)
    # =========================================================================
    summary_parts = []
    if price is not None:
        summary_parts.append(f"a model-estimated median housing value of ${price:,.0f}")
    if ocean:
        summary_parts.append(f"an ocean proximity of '{ocean}'")
    if income is not None:
        summary_parts.append(f"median income metric of {income:.2f} (~${income * 10000:,.0f}/yr)")
    if age is not None:
        summary_parts.append(f"median structure age of {age:.0f} years")

    if summary_parts:
        summary_str = ", ".join(summary_parts)
        return f"For {record_ref}, the available context reflects {summary_str}. You can ask specific questions about these characteristics, coastal influence, affordability, or model methodology."
    return f"For {record_ref}, specific characteristics are not available in the current query context. You can ask general questions about the dataset, methodology, or affordability calculations."

@router.post("/explain", response_model=AIQuestionResponse)
def ask_ai_assistant(req: AIQuestionRequest):
    question = req.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    context_summary = f"""
District Context:
- Region: {req.context.get('region_name', 'California')}
- Coordinates: Lat {req.context.get('latitude')}, Lon {req.context.get('longitude')}
- Estimated Median Valuation: ${req.context.get('predicted_value') or req.context.get('estimated_value', 0):,.0f}
- Median Income: ${float(req.context.get('median_income', 3.5)) * 10000:,.0f}
- Housing Median Age: {req.context.get('housing_median_age', 'N/A')} years
- Ocean Proximity: {req.context.get('ocean_proximity', 'N/A')}
- Model Version: {req.context.get('model_version', 'housing_model_v1.0')}
"""

    prompt = f"{SYSTEM_PROMPT}\n\n{context_summary}\nUser Question:\n{question}\n\nAnswer concisely and objectively:"

    # If Gemini client configured, try calling it
    if gemini_client and settings.GEMINI_API_KEY:
        for model_name in FALLBACK_MODELS:
            try:
                from google.genai import types
                response = gemini_client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.3,
                        max_output_tokens=600,
                    )
                )
                text = (response.text or "").strip()
                if text:
                    return {
                        "answer": text,
                        "source": f"Google Gemini ({model_name})",
                        "grounded": True
                    }
            except Exception as e:
                print(f"[AI Service] Gemini call error on {model_name}: {e}")
                continue

    # Graceful fallback: return calibrated local analytical explanation
    fallback_text = generate_local_analytical_reply(question, req.context)
    return {
        "answer": fallback_text,
        "source": "Platform Housing Intelligence Engine (Verified Analytical Baseline)",
        "grounded": True
    }


