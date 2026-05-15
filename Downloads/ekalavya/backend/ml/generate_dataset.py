import os
import random
import pandas as pd
import numpy as np

random.seed(42)
np.random.seed(42)

os.makedirs(os.path.join(os.path.dirname(__file__), 'data'), exist_ok=True)

n = 500
students = [f'S{str(i).zfill(3)}' for i in range(1, 101)]
topics = ['Fractions', 'Algebra', 'Geometry', 'Photosynthesis', 'Essay Writing']
moods = ['confident', 'confused', 'stressed', 'need_revision', 'want_challenge']
mistakes = ['concept_confusion', 'calculation_mistake', 'reading_mistake', 'careless_mistake', 'time_pressure', 'repeated_topic_weakness']
styles = ['visual', 'audio', 'text', 'practice', 'step_by_step']

def choose_topic():
    return random.choice(topics)

rows = []
for i in range(n):
    student_id = random.choice(students)
    topic = choose_topic()
    quiz_score = int(np.clip(np.random.normal(loc=65, scale=20), 0, 100))
    reading_time_seconds = int(np.clip(np.random.exponential(scale=300) + (50 if quiz_score<50 else 0), 10, 3600))
    quiz_time_seconds = int(np.clip(np.random.normal(loc=300, scale=100), 10, 3600))
    attempts = int(np.clip(np.random.poisson(1) + (1 if quiz_score<60 else 0), 1, 10))
    hints_used = int(np.clip(np.random.poisson(1) + (2 if quiz_score<50 else 0), 0, 10))
    wrong_answers = int(np.clip(np.round((100-quiz_score)/10 + np.random.poisson(0.5)), 0, 10))
    correct_answers = max(0, int(np.clip(np.round(quiz_score/10 + np.random.poisson(0.5)), 0, 10)))
    mood = random.choices(moods, weights=[0.35,0.2,0.15,0.15,0.15])[0]
    ease_rating = int(np.clip(int(np.random.normal(loc=3, scale=1)), 1, 5))
    confidence_score = int(np.clip(int(np.random.normal(loc=quiz_score, scale=15)), 0, 100))
    previous_score = int(np.clip(quiz_score + np.random.randint(-15,15), 0, 100))
    improvement_rate = quiz_score - previous_score
    mistake_type = random.choice(mistakes)
    learning_style = random.choice(styles)
    proof_of_thought_score = int(np.clip(np.random.normal(loc=70, scale=20), 0, 100))
    socratic_engagement = int(np.clip(np.random.normal(loc=60, scale=20), 0, 100))
    teaching_verification = int(np.clip(np.random.normal(loc=65, scale=20), 0, 100))
    cognitive_depth = int(np.clip(np.random.normal(loc=60, scale=20), 0, 100))
    effort_consistency = int(np.clip(np.random.normal(loc=70, scale=15), 0, 100))

    # rules
    needs_support = 0
    if quiz_score < 40: needs_support = 1
    if mood in ['confused', 'stressed'] and random.random() < 0.9: needs_support = 1
    if hints_used >= 3 and random.random() < 0.8: needs_support = 1
    if proof_of_thought_score < 50 and random.random() < 0.8: needs_support = 1
    if quiz_score >= 80 and confidence_score > 70 and random.random() < 0.9: needs_support = 0

    # difficulty
    if quiz_score >= 80:
        recommended_difficulty = 'hard'
    elif 50 <= quiz_score < 80:
        recommended_difficulty = 'medium'
    else:
        recommended_difficulty = 'easy'

    # pace
    if reading_time_seconds > 1200 and quiz_score < 60:
        learning_pace = 'slow'
    elif quiz_score >= 80:
        learning_pace = 'fast'
    else:
        learning_pace = random.choice(['normal', 'slow']) if quiz_score < 60 else 'normal'

    rows.append({
        'student_id': student_id,
        'topic': topic,
        'quiz_score': quiz_score,
        'reading_time_seconds': reading_time_seconds,
        'quiz_time_seconds': quiz_time_seconds,
        'attempts': attempts,
        'hints_used': hints_used,
        'wrong_answers': wrong_answers,
        'correct_answers': correct_answers,
        'mood': mood,
        'ease_rating': ease_rating,
        'confidence_score': confidence_score,
        'previous_score': previous_score,
        'improvement_rate': improvement_rate,
        'mistake_type': mistake_type,
        'learning_style': learning_style,
        'proof_of_thought_score': proof_of_thought_score,
        'socratic_engagement': socratic_engagement,
        'teaching_verification': teaching_verification,
        'cognitive_depth': cognitive_depth,
        'effort_consistency': effort_consistency,
        'needs_support': needs_support,
        'recommended_difficulty': recommended_difficulty,
        'learning_pace': learning_pace
    })

df = pd.DataFrame(rows)
out_path = os.path.join(os.path.dirname(__file__), 'data', 'student_learning_data.csv')
df.to_csv(out_path, index=False)
print(f"Wrote dataset to {out_path} with {len(df)} rows")
