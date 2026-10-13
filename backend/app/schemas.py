from pydantic import BaseModel, Field
from typing import List, Dict, Any

class LoanApplication(BaseModel):
    person_age: int = Field(..., gt=17, le=100, description="Age must be between 18 and 100")
    person_income: float = Field(..., gt=0, description="Annual income must be positive")
    person_home_ownership: str = Field(..., description="RENT, OWN, MORTGAGE, or OTHER")
    person_emp_length: float = Field(..., ge=0, description="Employment length in years")
    loan_intent: str = Field(..., description="Purpose of the loan (e.g., EDUCATION, MEDICAL)")
    loan_grade: str = Field(..., description="Loan grade (A, B, C, D, E, F, G)")
    loan_amnt: float = Field(..., gt=0, description="Loan amount requested")
    loan_int_rate: float = Field(..., gt=0, description="Interest rate")
    loan_percent_income: float = Field(..., gt=0, le=1, description="Loan amount as a percentage of income")
    cb_person_default_on_file: str = Field(..., description="Y or N")
    cb_person_cred_hist_length: int = Field(..., ge=0, description="Credit history length in years")


class FeatureImpact(BaseModel):
    feature: str
    impact_value: float
    description: str


class CreditRiskResponse(BaseModel):
    prediction: str
    default_probability: str
    risk_level: str
    explanation: Dict[str, List[FeatureImpact]]