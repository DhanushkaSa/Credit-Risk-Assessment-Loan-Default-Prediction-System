import os
import joblib
import pandas as pd
import numpy as np
import shap
from .schemas import LoanApplication


BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARTIFACTS_DIR = os.path.join(BASE_DIR, 'ml_artifacts')


# Compatibility patch for SHAP with XGBoost (handling '[5E-1]' base_score formatting)
try:
    import shap.explainers._tree as tree_mod
    _orig_loader_init = tree_mod.XGBTreeModelLoader.__init__

    def _patched_xgb_loader_init(self, xgb_model):
        _orig_decode = tree_mod.decode_ubjson_buffer
        def _patched_decode(fd):
            res = _orig_decode(fd)
            try:
                bs = res['learner']['learner_model_param']['base_score']
                if isinstance(bs, str) and bs.startswith('['):
                    res['learner']['learner_model_param']['base_score'] = bs.strip('[]')
            except Exception:
                pass
            return res
        tree_mod.decode_ubjson_buffer = _patched_decode
        try:
            _orig_loader_init(self, xgb_model)
        finally:
            tree_mod.decode_ubjson_buffer = _orig_decode

    tree_mod.XGBTreeModelLoader.__init__ = _patched_xgb_loader_init
except Exception as patch_e:
    print(f"SHAP patch notice: {patch_e}")

try:
    model = joblib.load(os.path.join(ARTIFACTS_DIR, 'xgboost_credit_risk_model.joblib'))
    scaler = joblib.load(os.path.join(ARTIFACTS_DIR, 'scaler.joblib'))
    feature_names = joblib.load(os.path.join(ARTIFACTS_DIR, 'feature_names.joblib'))
    
    explainer = shap.TreeExplainer(model)
    print("Models and SHAP Explainer loaded successfully!")
except Exception as e:
    print(f"Error loading artifacts: {e}")
    explainer = None

def preprocess_data(data: LoanApplication) -> pd.DataFrame:
    
    df = pd.DataFrame([data.dict()])
    
    df_encoded = pd.get_dummies(df)
    
    df_aligned = df_encoded.reindex(columns=feature_names, fill_value=0)
    
    
    scaled_array = scaler.transform(df_aligned)
    scaled_df = pd.DataFrame(scaled_array, columns=feature_names)
    
    return scaled_df


def predict_credit_risk(application: LoanApplication):
    
    processed_df = preprocess_data(application)
    
    
    probability = model.predict_proba(processed_df)[0][1]
    prediction = int(model.predict(processed_df)[0])
    
    risk_status = "Default" if prediction == 1 else "No Default"
    risk_level = "High" if probability > 0.7 else "Medium" if probability > 0.4 else "Low"

    
    shap_values = explainer.shap_values(processed_df)
    
    
    feature_importance = pd.DataFrame({
        'feature': feature_names,
        'impact': shap_values[0]
    })
    
    
    risk_factors = feature_importance[feature_importance['impact'] > 0].sort_values(by='impact', ascending=False).head(3)
    
    positive_factors = feature_importance[feature_importance['impact'] < 0].sort_values(by='impact').head(3)
    
    explanation = {
        "top_risk_factors": [
            {"feature": row['feature'], "impact_value": float(row['impact']), "description": "Increased Default Risk"} 
            for _, row in risk_factors.iterrows()
        ],
        "top_positive_factors": [
            {"feature": row['feature'], "impact_value": float(row['impact']), "description": "Decreased Default Risk"} 
            for _, row in positive_factors.iterrows()
        ]
    }


    return {
        "prediction": risk_status,
        "default_probability": f"{probability * 100:.2f}%",
        "risk_level": risk_level,
        "explanation": explanation
    }