import os
import sys
import json
import joblib
import pandas as pd

BASE = os.path.dirname(__file__)
MODELS_DIR = os.path.join(BASE, 'models')

# Load artifacts
feature_columns_path = os.path.join(MODELS_DIR, 'feature_columns.pkl')
support_model_path = os.path.join(MODELS_DIR, 'support_model.pkl')
diff_model_path = os.path.join(MODELS_DIR, 'difficulty_model.pkl')
pace_model_path = os.path.join(MODELS_DIR, 'pace_model.pkl')
le_diff_path = os.path.join(MODELS_DIR, 'le_difficulty.pkl')
le_pace_path = os.path.join(MODELS_DIR, 'le_pace.pkl')

if not os.path.exists(support_model_path):
    print(json.dumps({'error':'models not found'}))
    sys.exit(0)

feature_columns = joblib.load(feature_columns_path)
support_model = joblib.load(support_model_path)
diff_model = joblib.load(diff_model_path)
pace_model = joblib.load(pace_model_path)
le_diff = joblib.load(le_diff_path)
le_pace = joblib.load(le_pace_path)

# Read input JSON from stdin or arg
if len(sys.argv) > 1:
    payload = json.loads(sys.argv[1])
else:
    payload = json.load(sys.stdin)

# Build DataFrame
row = {k: payload.get(k, None) for k in payload}
df = pd.DataFrame([row])
# Ensure categorical columns are present
# Use get_dummies then reindex to feature_columns
X = pd.get_dummies(df).reindex(columns=feature_columns, fill_value=0)

# Predict support
needs_support_pred = int(support_model.predict(X)[0])
needs_support_prob = float(max(support_model.predict_proba(X)[0]))

# Predict difficulty
diff_idx = int(diff_model.predict(X)[0])
recommended_difficulty = str(le_diff.inverse_transform([diff_idx])[0])

# Predict pace
pace_idx = int(pace_model.predict(X)[0])
learning_pace = str(le_pace.inverse_transform([pace_idx])[0])

# Simple reason builder
reasons = []
if payload.get('quiz_score', 100) < 50:
    reasons.append('Low quiz score')
if payload.get('mood') in ['confused','stressed']:
    reasons.append('Confused or stressed mood')
if payload.get('hints_used',0) >= 3:
    reasons.append('High hint usage')
if payload.get('proof_of_thought_score',100) < 50:
    reasons.append('Weak Proof of Thought score')

reason = ', '.join(reasons) if reasons else 'Model-based recommendation.'

out = {
    'needs_support': bool(needs_support_pred),
    'recommended_difficulty': recommended_difficulty,
    'learning_pace': learning_pace,
    'confidence_of_prediction': needs_support_prob,
    'reason': reason
}
print(json.dumps(out))
