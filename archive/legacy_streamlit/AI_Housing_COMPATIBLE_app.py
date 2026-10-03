# =========================================================
# AI HOUSING PLATFORM — PROFESSIONAL UI
# Predictor + Gemini AI Chat + Prediction History
# =========================================================

import os

# Keep TensorFlow CPU-only on Hugging Face Spaces.
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "-1")
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

import streamlit as st
import pandas as pd
import numpy as np
import joblib
import folium
from streamlit_folium import st_folium
from geopy.geocoders import Nominatim
import google.generativeai as genai

# =========================================================
# PAGE CONFIG
# =========================================================
st.set_page_config(
    page_title="AI Housing Intelligence",
    page_icon="🏠",
    layout="wide",
)

# =========================================================
# CSS
# =========================================================
st.markdown(
    """
<style>
body {
    background: #f5f7fb;
}

.main-title {
    font-size: 40px;
    font-weight: 700;
    color: #0b3d91;
}

.card {
    padding: 20px;
    border-radius: 15px;
    background: white;
    color: black;
    box-shadow: 0 4px 15px rgba(0,0,0,.08);
    margin-bottom: 20px;
}

.card * {
    color: black !important;
}

.stButton > button {
    background: #0b3d91;
    color: white;
    border-radius: 8px;
    height: 45px;
    width: 100%;
    font-size: 16px;
}

.metric-box {
    padding: 15px;
    border-radius: 12px;
    background: #f8fbff;
    border-left: 5px solid #0b3d91;
}

/* Prevent white text on a white AI-chat background. */
[data-testid="stChatMessage"] {
    background-color: #f8fafc !important;
    border: 1px solid #dbe4f0 !important;
    border-radius: 12px !important;
    padding: 10px 14px !important;
    margin-bottom: 10px !important;
}

[data-testid="stChatMessage"] p,
[data-testid="stChatMessage"] div,
[data-testid="stChatMessage"] span {
    color: #111827 !important;
    opacity: 1 !important;
}

[data-testid="stChatInput"] textarea {
    color: #111827 !important;
    background: white !important;
}

[data-testid="stChatInput"] textarea::placeholder {
    color: #6b7280 !important;
    opacity: 1 !important;
}

.chat-context {
    padding: 12px 14px;
    border-radius: 10px;
    background: #eef4ff;
    border-left: 5px solid #0b3d91;
    color: #111827 !important;
    margin-bottom: 14px;
}

div[data-testid="stTextInput"] input {
    color: #111827 !important;
    background: #ffffff !important;
}
</style>
""",
    unsafe_allow_html=True,
)

# =========================================================
# LOGIN
# =========================================================
if "logged_in" not in st.session_state:
    st.session_state.logged_in = False


def login_ui() -> None:
    st.markdown("<h2 class='main-title'>🔐 Login</h2>", unsafe_allow_html=True)
    with st.container():
        st.markdown("<div class='card'>", unsafe_allow_html=True)
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")

        if st.button("Login"):
            if username == "California" and password == "Housing123":
                st.session_state.logged_in = True
                st.success("Login successful")
                st.rerun()
            else:
                st.error("Invalid credentials")
        st.markdown("</div>", unsafe_allow_html=True)


if not st.session_state.logged_in:
    login_ui()
    st.stop()

# =========================================================
# GEMINI
# =========================================================
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

GEMINI_MODELS = ("gemini-2.5-flash-lite", "gemini-2.5-flash")


# =========================================================
# LOAD MODEL
# =========================================================
@st.cache_resource(show_spinner="Loading housing prediction model...")
def load_assets():
    try:
        # Import TensorFlow only when the model is loaded. This keeps startup
        # lighter and makes dependency errors visible in the app.
        import tensorflow as tf

        loaded_model = tf.keras.models.load_model(
            "house_model.keras",
            compile=False,
        )
        loaded_preprocessor = joblib.load("preprocessor.pkl")
        return loaded_model, loaded_preprocessor
    except Exception as exc:
        st.error(f"Unable to load prediction assets: {exc}")
        st.info("Confirm that house_model.keras and preprocessor.pkl are present in the Space files.")
        st.stop()


model, preproc = load_assets()

# =========================================================
# SESSION STATE
# =========================================================
defaults = {
    "lat": 37.77,
    "lon": -122.41,
    "income": 4.0,
    "salary": 150000,
    "predictions": [],
    "messages": [],
}

for key, value in defaults.items():
    if key not in st.session_state:
        st.session_state[key] = value

# =========================================================
# GEO LOCATION NAME
# =========================================================
@st.cache_resource
def get_geolocator():
    return Nominatim(user_agent="ai_housing_intelligence_app", timeout=8)


def get_place(lat: float, lon: float) -> str:
    try:
        location = get_geolocator().reverse((lat, lon), language="en")
        return location.address if location else "Location name unavailable"
    except Exception:
        return "Location name unavailable"

# =========================================================
# FEATURE BUILDER
# =========================================================
def build_features(lat: float, lon: float, income: float) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "longitude": lon,
                "latitude": lat,
                "housing_median_age": 29,
                "total_rooms": 2635,
                "total_bedrooms": 537,
                "population": 1425,
                "households": 499,
                "median_income": income,
                "ocean_proximity": "INLAND",
            }
        ]
    )

# =========================================================
# PREDICTION
# =========================================================
def predict_price(lat: float, lon: float, income: float, salary: float):
    try:
        features = build_features(lat, lon, income)
        transformed = preproc.transform(features)
        raw_prediction = model.predict(transformed, verbose=0)
        price = int(np.expm1(float(raw_prediction[0][0])))

        monthly = int(
            price * 0.8 * 0.0055 / (1 - (1 + 0.0055) ** -360) + 280
        )
        afford = (
            "Affordable ✅"
            if monthly < float(salary) / 12 * 0.3
            else "Not Affordable ❌"
        )
        return price, monthly, afford
    except Exception as exc:
        raise RuntimeError(f"Prediction failed: {exc}") from exc

# =========================================================
# GEMINI AI CHAT
# =========================================================
def ai_reply(question: str, last: dict) -> str:
    if not GEMINI_API_KEY:
        return (
            "❌ Gemini is not configured. Add a Hugging Face Space secret named "
            "`GEMINI_API_KEY`, then restart the Space."
        )

    prompt = f"""
You are the Gemini AI housing assistant inside a California housing
decision-support application.

Prediction context:
- Location: {last.get('location', 'Location unavailable')}
- Latitude: {last['lat']}
- Longitude: {last['lon']}
- Estimated house price: USD {last['price']:,}
- Estimated monthly EMI: USD {last['monthly']:,}
- Affordability result: {last['afford']}

User question:
{question}

Give a clear, professional, easy-to-understand and concise answer.
Relate the answer directly to the supplied prediction.
Mention that the price is an ML estimate when relevant.
Do not invent precise local facts that were not supplied.
"""

    errors = []

    for model_name in GEMINI_MODELS:
        try:
            gemini_model = genai.GenerativeModel(model_name)
            response = gemini_model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.4,
                    max_output_tokens=500,
                ),
                request_options={"timeout": 30},
            )

            answer = ""
            try:
                answer = (response.text or "").strip()
            except Exception:
                answer = ""

            if answer:
                return answer

            errors.append(f"{model_name}: Gemini returned an empty response.")

        except Exception as exc:
            errors.append(f"{model_name}: {exc}")

    combined = " | ".join(errors)
    lower_error = combined.lower()

    if "429" in combined or "resource_exhausted" in lower_error or "quota" in lower_error:
        return (
            "❌ Gemini rejected the request because this Google AI project has "
            "no available API quota. Open Google AI Studio → Rate Limit and "
            "enable billing or use a project with a non-zero limit."
        )

    if "api key" in lower_error or "api_key_invalid" in lower_error or "permission_denied" in lower_error:
        return (
            "❌ Gemini rejected the API key. Replace the `GEMINI_API_KEY` "
            "Hugging Face secret with a valid key and restart the Space."
        )

    return f"❌ Gemini request failed: {combined}"


# =========================================================
# HEADER AND TABS
# =========================================================
st.markdown(
    "<h1 class='main-title'>🏠 AI Housing Intelligence</h1>",
    unsafe_allow_html=True,
)

tab1, tab2, tab3 = st.tabs(["🏷 Predictor", "💬 AI Chat", "📊 History"])

# =========================================================
# PREDICTOR TAB
# =========================================================
with tab1:
    col1, col2 = st.columns([1.5, 1])

    with col1:
        st.markdown("<div class='card'>", unsafe_allow_html=True)
        housing_map = folium.Map(
            location=[st.session_state.lat, st.session_state.lon],
            zoom_start=9,
        )
        folium.Marker(
            [st.session_state.lat, st.session_state.lon],
            tooltip="Selected location",
        ).add_to(housing_map)

        map_data = st_folium(
            housing_map,
            height=420,
            use_container_width=True,
            key="housing_map",
        )

        if map_data and map_data.get("last_clicked"):
            clicked_lat = float(map_data["last_clicked"]["lat"])
            clicked_lon = float(map_data["last_clicked"]["lng"])
            if (
                clicked_lat != st.session_state.lat
                or clicked_lon != st.session_state.lon
            ):
                st.session_state.lat = clicked_lat
                st.session_state.lon = clicked_lon
                st.rerun()
        st.markdown("</div>", unsafe_allow_html=True)

    with col2:
        st.markdown("<div class='card'>", unsafe_allow_html=True)
        st.write("Selected location")
        st.text_input("Latitude", value=f"{st.session_state.lat:.6f}", disabled=True)
        st.text_input("Longitude", value=f"{st.session_state.lon:.6f}", disabled=True)

        income = st.slider(
            "Median income",
            min_value=0.5,
            max_value=15.0,
            value=float(st.session_state.income),
            step=0.1,
        )
        salary = st.number_input(
            "Annual salary",
            min_value=0,
            value=int(st.session_state.salary),
            step=1000,
        )

        st.session_state.income = income
        st.session_state.salary = salary

        if st.button("Predict price", key="predict_price_button"):
            try:
                price, monthly, afford = predict_price(
                    st.session_state.lat,
                    st.session_state.lon,
                    income,
                    salary,
                )

                location_name = get_place(
                    st.session_state.lat,
                    st.session_state.lon,
                )

                prediction = {
                    "lat": st.session_state.lat,
                    "lon": st.session_state.lon,
                    "price": price,
                    "monthly": monthly,
                    "afford": afford,
                    "location": location_name,
                }
                st.session_state.predictions.append(prediction)

                st.success(location_name)
                c1, c2, c3 = st.columns(3)
                c1.metric("Price", f"${price:,}")
                c2.metric("Monthly EMI", f"${monthly:,}")
                c3.metric("Status", afford)
            except Exception as exc:
                st.error(str(exc))

        # Keep the latest prediction visible after Streamlit reruns.
        if st.session_state.predictions:
            latest = st.session_state.predictions[-1]
            st.divider()
            st.caption("Latest prediction")
            c1, c2, c3 = st.columns(3)
            c1.metric("Price", f"${latest['price']:,}")
            c2.metric("Monthly EMI", f"${latest['monthly']:,}")
            c3.metric("Status", latest["afford"])

        st.markdown("</div>", unsafe_allow_html=True)

# =========================================================
# CHAT TAB
# =========================================================
with tab2:
    st.subheader("Ask Gemini about the latest prediction")

    if not st.session_state.predictions:
        st.info("Make a prediction first, then ask Gemini about the result.")
    else:
        latest = st.session_state.predictions[-1]

        st.markdown(
            f"""
            <div class="chat-context">
                <b>Current context</b><br>
                Price: USD {latest['price']:,}<br>
                Monthly EMI: USD {latest['monthly']:,}<br>
                Status: {latest['afford']}
            </div>
            """,
            unsafe_allow_html=True,
        )

        if GEMINI_API_KEY:
            st.success("Gemini API key detected.")
        else:
            st.error("GEMINI_API_KEY is missing from Hugging Face Space secrets.")

        for user_msg, ai_msg in st.session_state.messages:
            with st.chat_message("user"):
                st.markdown(user_msg)
            with st.chat_message("assistant"):
                st.markdown(ai_msg)

        with st.form("gemini_question_form", clear_on_submit=True):
            question = st.text_input(
                "Your question",
                placeholder="Example: Why is this house expensive?",
            )
            ask_button = st.form_submit_button("Ask Gemini")

        if ask_button:
            cleaned_question = question.strip()

            if not cleaned_question:
                st.warning("Please enter a question.")
            else:
                with st.chat_message("user"):
                    st.markdown(cleaned_question)

                with st.chat_message("assistant"):
                    with st.spinner("Gemini is thinking..."):
                        answer = ai_reply(cleaned_question, latest)
                    st.markdown(answer)

                st.session_state.messages.append((cleaned_question, answer))

        if st.button("Clear chat", key="clear_chat_button"):
            st.session_state.messages.clear()
            st.rerun()


# =========================================================
# HISTORY TAB
# =========================================================
with tab3:
    if st.session_state.predictions:
        history_df = pd.DataFrame(st.session_state.predictions)
        st.dataframe(history_df, use_container_width=True, hide_index=True)

        csv = history_df.to_csv(index=False)
        st.download_button(
            "Download history",
            data=csv,
            file_name="history.csv",
            mime="text/csv",
        )
    else:
        st.info("No predictions yet")

# =========================================================
# CLEAR ALL
# =========================================================
if st.button("Clear history", key="clear_history_button"):
    st.session_state.predictions.clear()
    st.session_state.messages.clear()
    st.rerun()

st.caption("AI Housing Intelligence • TensorFlow • Gemini • Streamlit")
