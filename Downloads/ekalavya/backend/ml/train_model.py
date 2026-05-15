import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib

BASE = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE, 'data', 'student_learning_data.csv')
MODELS_DIR = os.path.join(BASE, 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

print('Loading data...')
df = pd.read_csv(DATA_PATH)
print('Rows:', len(df))

# target columns
support_y = df['needs_support']
difficulty_y = df['recommended_difficulty']
pace_y = df['learning_pace']

# categorical columns
cat_cols = ['student_id', 'topic', 'mood', 'mistake_type', 'learning_style']
num_cols = [c for c in df.columns if c not in cat_cols + ['needs_support','recommended_difficulty','learning_pace']]

# encode categorical via get_dummies for features
X = pd.get_dummies(df[cat_cols + num_cols].fillna(''))

# Save feature columns for later use
feature_columns = list(X.columns)
joblib.dump(feature_columns, os.path.join(MODELS_DIR, 'feature_columns.pkl'))
print('Feature columns saved:', len(feature_columns))

# Support model
X_train, X_test, y_train, y_test = train_test_split(X, support_y, test_size=0.2, random_state=42)
print('Training support model...')
support_model = RandomForestClassifier(n_estimators=100, random_state=42)
support_model.fit(X_train, y_train)

pred = support_model.predict(X_test)
print('Support model accuracy:', accuracy_score(y_test, pred))
print(classification_report(y_test, pred))
joblib.dump(support_model, os.path.join(MODELS_DIR, 'support_model.pkl'))

# Difficulty model (categorical)
# Encode difficulty labels
le_diff = LabelEncoder()
y_diff = le_diff.fit_transform(difficulty_y)
X_train, X_test, y_train, y_test = train_test_split(X, y_diff, test_size=0.2, random_state=42)
print('Training difficulty model...')
diff_model = RandomForestClassifier(n_estimators=100, random_state=42)
diff_model.fit(X_train, y_train)
pred = diff_model.predict(X_test)
print('Difficulty model accuracy:', accuracy_score(y_test, pred))
print(classification_report(y_test, pred, target_names=le_diff.classes_))
joblib.dump(diff_model, os.path.join(MODELS_DIR, 'difficulty_model.pkl'))
joblib.dump(le_diff, os.path.join(MODELS_DIR, 'le_difficulty.pkl'))

# Pace model
le_pace = LabelEncoder()
y_pace = le_pace.fit_transform(pace_y)
X_train, X_test, y_train, y_test = train_test_split(X, y_pace, test_size=0.2, random_state=42)
print('Training pace model...')
pace_model = RandomForestClassifier(n_estimators=100, random_state=42)
pace_model.fit(X_train, y_train)
pred = pace_model.predict(X_test)
print('Pace model accuracy:', accuracy_score(y_test, pred))
print(classification_report(y_test, pred, target_names=le_pace.classes_))
joblib.dump(pace_model, os.path.join(MODELS_DIR, 'pace_model.pkl'))
joblib.dump(le_pace, os.path.join(MODELS_DIR, 'le_pace.pkl'))

print('All models saved to', MODELS_DIR)
