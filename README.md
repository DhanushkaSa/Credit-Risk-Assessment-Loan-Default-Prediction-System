# Credit Risk Assessment & Loan Default Prediction System

[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.12-blue?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.2+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![XGBoost](https://img.shields.io/badge/XGBoost-Ensemble-orange?logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io/)
[![SHAP](https://img.shields.io/badge/XAI-SHAP%20Explainer-purple)](https://shap.readthedocs.io/)
[![MLflow](https://img.shields.io/badge/MLflow-Tracking-0194E2?logo=mlflow&logoColor=white)](https://mlflow.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An end-to-end, production-grade Credit Risk Assessment and Loan Default Prediction intelligence platform. This system combines **XGBoost classification**, **SMOTE class imbalance mitigation**, and **SHAP Explainable AI (XAI)** with a containerized **FastAPI** inference backend and a modern **React 19 / Tailwind CSS** underwriting dashboard featuring real-time sensitivity analysis and interactive counter-offer simulation.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Dataset](#dataset)
- [Model Development & Evaluation](#model-development--evaluation)
  - [Preprocessing & Feature Engineering](#preprocessing--feature-engineering)
  - [Model Training & Tuning](#model-training--tuning)
  - [Validation Results & Benchmarks](#validation-results--benchmarks)
- [Explainable AI (SHAP)](#explainable-ai-shap)
- [Interactive Frontend Cockpit](#interactive-frontend-cockpit)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-repository)
  - [2. Model Training & MLflow](#2-model-training--mlflow-optional)
  - [3. Backend Setup (FastAPI)](#3-backend-setup-fastapi)
  - [4. Frontend Setup (React + Vite)](#4-frontend-setup-react--vite)
  - [5. Running with Docker](#5-running-with-docker-backend)
- [Technologies Used](#technologies-used)
- [License](#license)

---

## Overview

Accurate loan default prediction is critical for banking and lending institutions to balance portfolio expansion against credit risk exposure. Black-box ML models often face significant adoption barriers in heavily regulated financial environments where regulatory compliance, auditability, and transparent decision-making are mandatory.

This system addresses both challenges:
1. **Accurate Default Forecasting**: Leverages a tuned XGBoost classifier trained on historical credit records to predict borrower default (`loan_status = 1` vs `loan_status = 0`).
2. **Transparent Explainability (XAI)**: Embeds SHAP (SHapley Additive exPlanations) directly into the inference pipeline, quantifying exactly how each financial and demographic feature shifts an applicant's default probability.
3. **Decision Cockpit**: Provides underwriters with an interactive web platform to evaluate loan applications, visualize risk drivers, and simulate "What-If" policy changes or counter-offers dynamically.

---

## Key Features

- **High-Accuracy Classification**: 93.3% accuracy and 0.947 ROC-AUC achieved via Bayesian/Randomized hyperparameter search and SMOTE resampling.
- **Explainable AI (XAI) Integration**: SHAP TreeExplainer generates localized feature attributions for every prediction, pinpointing the top risk amplifiers and mitigating factors.
- **Production REST API**: Built with FastAPI, providing sub-second inference, strict Pydantic payload validation, CORS handling, and automatic OpenAPI/Swagger documentation.
- **Interactive Risk Dashboard**:
  - **Dynamic Intake Form**: Multi-field applicant profile configuration with preset financial scenarios.
  - **Animated Risk Speedometer**: Radial gauge with animated needle, credit risk tiering (Prime / Near-Prime / Subprime), and real-time default probability.
  - **Diverging SHAP Waterfall Chart**: Visual and card-mode breakdown displaying directional feature impacts on default probability.
  - **Live "What-If" Sensitivity Simulator**: Adjust loan amount, interest rate, income, and grade with debounced recalculation to find viable counter-offer terms.
- **MLflow Experiment Tracking**: Reproducible model runs logging parameters, cross-validation metrics, confusion matrices, and serialized model artifacts.
- **Containerization**: Fully containerized backend using Docker (`python:3.10-slim`).

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA & MODEL PIPELINE                      │
│                                                                 │
│   Credit Risk Dataset ──► Preprocessing & EDA ──► SMOTE & CV    │
│                                                          │      │
│   MLflow Experiment Tracking ◄── Hyperparameter Tuning ──┘      │
│                                          │                      │
│                                  Exported Artifacts             │
│                                          ▼                      │
│                     (XGBoost Model, Scaler, Feature Names)      │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND SERVICE                      │
│                                                                 │
│   Client Request ──► Pydantic Validation ──► Feature Alignment │
│                                                     │           │
│   SHAP Explainer ◄── Scaler Transformation ◄────────┤           │
│         │                                           ▼           │
│         ▼                                    XGBoost Inference  │
│   Attribution Factors                               │           │
│         │                                           ▼           │
│         └──────────────► JSON Response ◄────────────┘           │
│                         (Probability, Risk Level, Factors)      │
└─────────────────────────────────▲───────────────────────────────┘
                                  │  HTTP / REST
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   REACT 19 + VITE FRONTEND                      │
│                                                                 │
│  - Application Form & Scenario Presets                          │
│  - Radial Risk Gauge / Speedometer (Tier A / B / D)             │
│  - SHAP Waterfall & Diverging Feature Breakdown                 │
│  - Interactive "What-If" Sensitivity & Counter-Offer Engine     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
Credit Risk Assessment & Loan Default Prediction System/
│
├── backend/                                # FastAPI inference backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py                       # Configuration & paths
│   │   ├── main.py                         # FastAPI routes & CORS
│   │   ├── ml_service.py                   # Preprocessing, XGBoost inference & SHAP
│   │   └── schemas.py                      # Pydantic input/output validation models
│   ├── ml_artifacts/                       # Active model artifacts loaded by API
│   │   ├── feature_names.joblib
│   │   ├── model_metadata.joblib
│   │   ├── scaler.joblib
│   │   └── xgboost_credit_risk_model.joblib
│   ├── Dockerfile                          # Backend container definition
│   ├── .dockerignore
│   └── requirements.txt                    # Backend Python dependencies
│
├── frontend/                               # React 19 + Tailwind CSS web cockpit
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── RiskSpeedometer.jsx         # Radial SVG gauge with risk tiers
│   │   │   ├── ShapWaterfallChart.jsx      # Diverging SHAP impact waterfall
│   │   │   └── WhatIfSimulator.jsx         # Live slider sensitivity engine
│   │   ├── App.jsx                         # Main dashboard & loan form layout
│   │   ├── index.css                       # Tailwind design system tokens
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts                      # Vite build configuration
│
├── ml_service/                             # Master saved model artifacts
│   ├── feature_names.joblib
│   ├── model_metadata.joblib
│   ├── scaler.joblib
│   └── xgboost_credit_risk_model.joblib
│
├── notebooks/                              # Jupyter research & training notebooks
│   ├── 01_data_preprocessing_and_eda.ipynb # Cleaning, imputation, encoding, EDA
│   ├── 02_xgboost_model_training.ipynb     # Tuning, SMOTE, MLflow tracking
│   ├── mlflow.db                           # Local MLflow SQLite backend
│   └── mlruns/                             # MLflow logged runs and artifacts
│
├── data/
│   ├── raw/                                # Original source data
│   │   └── credit_risk_dataset.csv
│   └── processed/                          # Preprocessed and cleaned dataset
│       └── credit_risk_cleaned.csv
│
├── .gitignore
├── LICENSE
└── README.md
```

---

## Dataset

- **Source**: Credit Risk Dataset (`credit_risk_dataset.csv`)
- **Records**: 32,581 (raw) → 32,409 (after missing value treatment and deduplication)
- **Features**: 11 predictor features (expanded to 17 aligned features post-encoding)
- **Target Variable**: `loan_status` (0 = Non-Default, 1 = Default)
- **Class Balance**: 78.1% Non-Default vs. 21.9% Default (~3.6 : 1 class imbalance ratio)

### Feature Descriptions

| Feature | Type | Description |
|---|---|---|
| `person_age` | Numeric | Age of the borrower (18 – 100) |
| `person_income` | Numeric | Annual income in USD |
| `person_home_ownership` | Categorical | Home status (`RENT`, `OWN`, `MORTGAGE`, `OTHER`) |
| `person_emp_length` | Numeric | Employment length in years |
| `loan_intent` | Categorical | Purpose (`EDUCATION`, `MEDICAL`, `PERSONAL`, `VENTURE`, `DEBTCONSOLIDATION`, `HOMEIMPROVEMENT`) |
| `loan_grade` | Categorical | Credit risk sub-grade assigned (`A` through `G`) |
| `loan_amnt` | Numeric | Requested loan principal amount in USD |
| `loan_int_rate` | Numeric | Annual interest rate percentage |
| `loan_percent_income` | Numeric | Ratio of loan amount to borrower annual income |
| `cb_person_default_on_file` | Categorical | Historical default recorded by credit bureau (`Y` / `N`) |
| `cb_person_cred_hist_length` | Numeric | Credit history length in years |

---

## Model Development & Evaluation

### Preprocessing & Feature Engineering
- **Missing Value Handling**: Median imputation for missing interest rates and employment durations, with removal of invalid outlier records.
- **Categorical Encoding**: One-hot encoding for nominal categories (`person_home_ownership`, `loan_intent`) and ordinal mapping for risk-ordered categories (`loan_grade`, `cb_person_default_on_file`).
- **Feature Scaling**: `StandardScaler` fitted strictly on training data to prevent data leakage across splits.
- **Splits**: Stratified 60% Train / 20% Validation / 20% Test partition.

### Model Training & Tuning
- **Baseline Model**: XGBoost with `scale_pos_weight` to address baseline class imbalance.
- **Hyperparameter Optimization**: `RandomizedSearchCV` across 50 iterations with 5-fold stratified cross-validation optimizing for minority class F1-Score.
- **Resampling Strategy**: SMOTE (Synthetic Minority Over-sampling Technique) applied to the training set post-tuning.
- **Experiment Tracking**: Tracked via **MLflow**, capturing parameters (`max_depth`, `learning_rate`, `n_estimators`, `subsample`, `colsample_bytree`), PR-AUC curves, and confusion matrices.

### Validation Results & Benchmarks

#### Tuned XGBoost + SMOTE Performance (Validation Set)

| Metric | Baseline XGBoost | Tuned XGBoost + SMOTE | Delta |
|---|:---:|:---:|:---:|
| **Accuracy** | 92.21% | **93.27%** | **+1.06%** |
| **F1-Score** | 0.8172 | **0.8263** | **+0.0091** |
| **ROC-AUC** | 0.9494 | **0.9466** | -0.0028 |
| **PR-AUC** | 0.9062 | **0.9003** | -0.0059 |

#### Detailed Classification Report

| Class | Precision | Recall | F1-Score | Support |
|---|:---:|:---:|:---:|:---:|
| **No Default (0)** | 0.93 | 0.99 | 0.96 | 5,064 |
| **Default (1)** | 0.95 | 0.73 | 0.83 | 1,418 |
| **Weighted Avg** | **0.93** | **0.93** | **0.93** | 6,482 |

---

## Explainable AI (SHAP)

To satisfy regulatory explainability requirements (such as FCRA and ECOA adverse action notices), the backend utilizes `shap.TreeExplainer` on the trained XGBoost model.

For every loan evaluated:
1. **Attribution Quantification**: SHAP computes marginal game-theoretic feature contributions relative to the base credit population.
2. **Top Risk Drivers**: Identifies top factors increasing default risk (e.g., high loan-to-income ratio, low credit grade, prior default history).
3. **Top Mitigating Drivers**: Identifies protective factors lowering default risk (e.g., substantial annual income, low interest rate, home ownership).
4. **Transparent Visualization**: Rendered in the frontend via an interactive diverging waterfall chart and granular feature impact cards.

---

## Interactive Frontend Cockpit

The web frontend (`frontend/`) delivers an intuitive underwriting console:

1. **Intake Console**:
   - Comprehensive borrower input form with validation.
   - Scenario quick-load buttons for rapid testing (e.g., *Prime Borrower*, *Borderline Applicant*, *High-Risk Case*).
2. **Radial Risk Speedometer (`RiskSpeedometer.jsx`)**:
   - Dynamic needle animation calibrated to calculated default probability.
   - Tier categorization:
     - **Tier A • Prime Quality** (`< 35%` probability)
     - **Tier B • Moderate / Near-Prime** (`35% – 65%` probability)
     - **Tier D • High Risk / Subprime** (`> 65%` probability)
3. **SHAP Waterfall & Feature Impact (`ShapWaterfallChart.jsx`)**:
   - Diverging horizontal bars showing directional pull (+ risk vs. - risk).
   - Filter toggles for *All Factors*, *Risk Amplifiers*, and *Mitigating Strengths*.
   - View mode switcher between Visual Waterfall and Detailed Metric Cards.
4. **What-If Sensitivity Engine (`WhatIfSimulator.jsx`)**:
   - Interactive sliders for **Loan Amount**, **Interest Rate**, **Annual Income**, and **Credit Grade**.
   - Real-time delta indicators showing how terms adjustments impact probability.
   - Counter-offer generation module enabling underwriters to discover terms that bring an applicant into an acceptable risk tier.

---

## API Reference

The backend runs on **FastAPI** with automatic Swagger documentation at `http://127.0.0.1:8000/docs`.

### Health Check
```http
GET /
```
**Response:**
```json
{
  "status": "Online",
  "message": "Credit Risk ML Model and SHAP Explainer are active!"
}
```

### Predict Loan Default Risk
```http
POST /predict
Content-Type: application/json
```

**Request Body (`LoanApplication`):**
```json
{
  "person_age": 28,
  "person_income": 65000.0,
  "person_home_ownership": "RENT",
  "person_emp_length": 4.0,
  "loan_intent": "EDUCATION",
  "loan_grade": "B",
  "loan_amnt": 12000.0,
  "loan_int_rate": 10.5,
  "loan_percent_income": 0.18,
  "cb_person_default_on_file": "N",
  "cb_person_cred_hist_length": 5
}
```

**Response (`CreditRiskResponse`):**
```json
{
  "prediction": "No Default",
  "default_probability": "14.28%",
  "risk_level": "Low",
  "explanation": {
    "top_risk_factors": [
      {
        "feature": "person_home_ownership_RENT",
        "impact_value": 0.384,
        "description": "Increased Default Risk"
      },
      {
        "feature": "loan_percent_income",
        "impact_value": 0.215,
        "description": "Increased Default Risk"
      }
    ],
    "top_positive_factors": [
      {
        "feature": "loan_grade_B",
        "impact_value": -0.562,
        "description": "Decreased Default Risk"
      },
      {
        "feature": "person_income",
        "impact_value": -0.418,
        "description": "Decreased Default Risk"
      }
    ]
  }
}
```

---

## Getting Started

### Prerequisites
- **Python**: 3.10 to 3.12
- **Node.js**: v18.0.0 or higher & **npm**
- **Docker** *(optional, for containerized deployment)*

---

### 1. Clone Repository

```bash
git clone https://github.com/DhanushkaSa/Credit-Risk-Assessment-Loan-Default-Prediction-System.git
cd Credit-Risk-Assessment-Loan-Default-Prediction-System
```

---

### 2. Model Training & MLflow *(Optional)*

If you wish to re-train the models or inspect experiment runs:

```bash
# Activate virtual environment
python -m venv .venv
source .venv/bin/activate        # On Windows: .venv\Scripts\activate

# Install training dependencies
pip install pandas numpy scikit-learn xgboost imbalanced-learn matplotlib seaborn mlflow joblib

# Run the Jupyter notebooks in /notebooks
# Then start the MLflow tracking UI:
cd notebooks
mlflow ui
```
Open [http://localhost:5000](http://localhost:5000) in your browser.

---

### 3. Backend Setup (FastAPI)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Base: `http://127.0.0.1:8000`
- Swagger UI Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

### 4. Frontend Setup (React + Vite)

In a new terminal window:

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to access the Underwriting Decision Cockpit.

---

### 5. Running with Docker (Backend)

You can containerize and run the backend independently with Docker:

```bash
cd backend

# Build Docker image
docker build -t credit-risk-backend .

# Run container
docker run -p 8000:8000 credit-risk-backend
```

The containerized API is accessible at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

---

## Technologies Used

| Domain | Technologies / Libraries |
|---|---|
| **Machine Learning** | XGBoost, scikit-learn, imbalanced-learn (SMOTE), NumPy, pandas |
| **Explainable AI (XAI)** | SHAP (TreeExplainer) |
| **Experiment Tracking** | MLflow |
| **Model Serialization** | joblib |
| **Backend Framework** | FastAPI, Uvicorn, Pydantic |
| **Frontend Framework** | React 19, TypeScript, Vite |
| **Styling & Icons** | Tailwind CSS v4, Lucide React |
| **HTTP Client** | Axios |
| **Containerization** | Docker (`python:3.10-slim`) |
| **Environment** | Jupyter Notebook, Python 3.10 / 3.12 |

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
