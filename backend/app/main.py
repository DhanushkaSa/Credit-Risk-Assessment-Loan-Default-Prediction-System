from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


from .schemas import LoanApplication, CreditRiskResponse
from .ml_service import predict_credit_risk


app = FastAPI(
    title="Credit Risk Assessment API with XAI",
    description="Production-ready API for predicting loan default risk using XGBoost and SHAP explanations.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {
        "status": "Online", 
        "message": "Credit Risk ML Model and SHAP Explainer are active!"
    }


@app.post("/predict", response_model=CreditRiskResponse)
def predict_risk(application: LoanApplication):
    try:

        result = predict_credit_risk(application)
        return result
    except Exception as e:
        
        raise HTTPException(status_code=500, detail=str(e))