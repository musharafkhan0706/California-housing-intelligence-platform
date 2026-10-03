from fastapi import APIRouter
from backend.app.schemas import AffordabilityRequest, AffordabilityResponse

router = APIRouter(prefix="/affordability", tags=["Affordability Planner"])

@router.post("/calculate", response_model=AffordabilityResponse)
def calculate_affordability(req: AffordabilityRequest):
    down_payment = min(req.down_payment, req.property_value)
    loan_amount = max(0.0, req.property_value - down_payment)
    down_payment_pct = round((down_payment / req.property_value) * 100.0, 1)

    # Monthly interest and payments
    monthly_interest_rate = (req.interest_rate / 100.0) / 12.0
    num_payments = req.loan_term_years * 12

    if monthly_interest_rate > 0 and loan_amount > 0:
        monthly_pi = loan_amount * (monthly_interest_rate * ((1 + monthly_interest_rate) ** num_payments)) / (
            ((1 + monthly_interest_rate) ** num_payments) - 1
        )
    else:
        monthly_pi = loan_amount / max(1, num_payments)

    # California property tax estimate (~1.1% annually)
    estimated_monthly_tax = (req.property_value * 0.011) / 12.0
    # Homeowner's hazard insurance estimate (~0.35% annually)
    estimated_monthly_insurance = (req.property_value * 0.0035) / 12.0

    total_monthly_housing = monthly_pi + estimated_monthly_tax + estimated_monthly_insurance
    monthly_gross_income = req.annual_income / 12.0

    # Debt to Income ratios
    front_end_dti = (total_monthly_housing / max(1.0, monthly_gross_income)) * 100.0
    back_end_dti = ((total_monthly_housing + req.monthly_debts) / max(1.0, monthly_gross_income)) * 100.0

    # Status classification based on standard lending benchmarks (28/36 rule)
    if back_end_dti <= 30.0:
        status = "Comfortable"
        rec = "Monthly housing commitment is well within standard conservative budgeting thresholds (under 30% back-end DTI)."
    elif back_end_dti <= 38.0:
        status = "Moderate"
        rec = "Housing costs fall within the displayed budgeting thresholds for this example."
    elif back_end_dti <= 45.0:
        status = "Budget Stretch"
        rec = "Debt-to-income is elevated (38%–45%). May require excellent credit score, reserves, and tight discretionary spending."
    else:
        status = "High Risk / Heavy Burden"
        rec = "Debt-to-income exceeds 45%. Exceeds conventional conforming limits; significant financial strain risk."

    return {
        "property_value": req.property_value,
        "down_payment": down_payment,
        "down_payment_pct": down_payment_pct,
        "loan_amount": round(loan_amount, 2),
        "monthly_principal_interest": round(monthly_pi, 2),
        "estimated_property_tax": round(estimated_monthly_tax, 2),
        "estimated_insurance": round(estimated_monthly_insurance, 2),
        "total_monthly_payment": round(total_monthly_housing, 2),
        "monthly_gross_income": round(monthly_gross_income, 2),
        "front_end_dti": round(front_end_dti, 1),
        "back_end_dti": round(back_end_dti, 1),
        "affordability_status": status,
        "recommendation": rec
    }
