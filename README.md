# Credit Risk Assessment & Loan Default Prediction System

A machine learning system that predicts loan default risk using XGBoost classification. The project covers end-to-end data preprocessing, exploratory data analysis, model training with hyperparameter tuning, and evaluation on a credit risk dataset containing 32,581 loan records.


## Table of Contents

- [Overview](#overview)
- [Dataset](#dataset)
- [Project Structure](#project-structure)
- [Methodology](#methodology)
- [Results](#results)
- [Getting Started](#getting-started)
- [Technologies Used](#technologies-used)
- [License](#license)


## Overview

Loan default prediction is a critical task in the financial industry. Accurately identifying borrowers who are likely to default enables lenders to make informed decisions, reduce financial losses, and manage portfolio risk effectively.

This project builds a binary classification model that predicts whether a borrower will default on a loan (`loan_status = 1`) or not (`loan_status = 0`), using demographic, financial, and credit history features.


## Dataset

- **Source**: `credit_risk_dataset.csv`
- **Records**: 32,581 (raw), 32,409 (after cleaning)
- **Features**: 12 (raw), 17 (after preprocessing)
- **Target Variable**: `loan_status` (0 = No Default, 1 = Default)
- **Class Distribution**: 78.1% Non-Default, 21.9% Default (imbalanced)

### Feature Descriptions

| Feature | Description |
|---|---|
| `person_age` | Age of the borrower |
| `person_income` | Annual income |
| `person_home_ownership` | Home ownership status (RENT, OWN, MORTGAGE, OTHER) |
| `person_emp_length` | Employment length in years |
| `loan_intent` | Purpose of the loan (EDUCATION, MEDICAL, PERSONAL, VENTURE, etc.) |
| `loan_grade` | Loan grade (A through G) |
| `loan_amnt` | Loan amount |
| `loan_int_rate` | Interest rate |
| `loan_percent_income` | Loan amount as a percentage of income |
| `cb_person_default_on_file` | Historical default on file (Y/N) |
| `cb_person_cred_hist_length` | Credit history length in years |


## Project Structure

```
Credit Risk Assessment & Loan Default Prediction System/
│
├── data/
│   ├── raw/                        # Original dataset
│   │   └── credit_risk_dataset.csv
│   └── processed/                  # Cleaned dataset
│       └── credit_risk_cleaned.csv
│
├── notebooks/
│   ├── 01_data_preprocessing_and_eda.ipynb   # Data cleaning & EDA
│   └── 02_xgboost_model_training.ipynb       # Model training & evaluation
│
├── ml_service/                     # Saved model artifacts
│   ├── xgboost_credit_risk_model.joblib
│   ├── scaler.joblib
│   ├── feature_names.joblib
│   └── model_metadata.joblib
│
├── backend/                        # Backend service (planned)
├── frontend/                       # Frontend application (planned)
├── .gitignore
└── README.md
```


## Methodology

### 1. Data Preprocessing

- **Missing value treatment**: Imputation and removal of records with missing data.
- **Duplicate removal**: Identified and removed duplicate rows.
- **Outlier treatment**: Addressed outliers in numerical features.
- **Feature engineering**: Encoded categorical variables using one-hot encoding (`person_home_ownership`, `loan_intent`) and ordinal encoding (`loan_grade`, `cb_person_default_on_file`).
- **Output**: Cleaned dataset saved to `data/processed/credit_risk_cleaned.csv`.

### 2. Exploratory Data Analysis

- Distribution analysis of all features.
- Correlation analysis between features and the target variable.
- Class imbalance assessment (3.6:1 ratio).

### 3. Model Training

- **Data Split**: 60% Train / 20% Validation / 20% Test with stratification to preserve class distribution.
- **Feature Scaling**: `StandardScaler` fitted exclusively on training data and applied to all splits.
- **Baseline Model**: XGBoost classifier with `scale_pos_weight` to handle class imbalance.
- **Hyperparameter Tuning**: `RandomizedSearchCV` with 50 iterations, 5-fold stratified cross-validation, optimizing for F1-score.
- **Class Imbalance Handling**: SMOTE (Synthetic Minority Over-sampling Technique) applied to the training set after tuning.
- **Final Model**: XGBoost trained on SMOTE-balanced data with tuned hyperparameters.

### 4. Evaluation

Model evaluated on a held-out test set using multiple metrics to provide an unbiased performance estimate. Evaluation includes confusion matrix, ROC curve, and precision-recall curve analysis.


## Results

### Validation Set Performance (Tuned XGBoost + SMOTE)

| Metric | Score |
|---|---|
| Accuracy | 0.9327 |
| F1-Score | 0.8263 |
| ROC-AUC | 0.9466 |
| PR-AUC | 0.9003 |

### Classification Report (Validation Set)

| Class | Precision | Recall | F1-Score | Support |
|---|---|---|---|---|
| No Default | 0.93 | 0.99 | 0.96 | 5,064 |
| Default | 0.95 | 0.73 | 0.83 | 1,418 |

### Baseline vs. Tuned Model Comparison

| Metric | Baseline | Tuned + SMOTE | Improvement |
|---|---|---|---|
| Accuracy | 0.9221 | 0.9327 | +0.0106 |
| F1-Score | 0.8172 | 0.8263 | +0.0091 |
| ROC-AUC | 0.9494 | 0.9466 | -0.0028 |
| PR-AUC | 0.9062 | 0.9003 | -0.0058 |


## Getting Started

### Prerequisites

- Python 3.12 or higher
- pip (Python package manager)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/<your-username>/credit-risk-assessment.git
cd credit-risk-assessment
```

2. Create and activate a virtual environment:

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Place the dataset file `credit_risk_dataset.csv` in the `data/raw/` directory.

5. Run the notebooks in order:
   - `01_data_preprocessing_and_eda.ipynb` — Cleans raw data and performs EDA.
   - `02_xgboost_model_training.ipynb` — Trains and evaluates the XGBoost model.


## Technologies Used

| Category | Tools |
|---|---|
| Language | Python 3.12 |
| Data Manipulation | pandas, NumPy |
| Visualization | Matplotlib, Seaborn |
| Machine Learning | XGBoost, scikit-learn |
| Imbalanced Learning | imbalanced-learn (SMOTE) |
| Model Persistence | joblib |
| Environment | Jupyter Notebook |


## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
