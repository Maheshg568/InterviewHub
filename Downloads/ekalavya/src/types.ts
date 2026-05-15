export interface Student {
  id: string;
  name: string;
  email: string;
  current_level: string;
  dna?: LearningDNA;
  fingerprint?: CognitiveFingerprint;
}

export interface LearningDNA {
  student_id: string;
  concept_strength: number;
  memory_score: number;
  speed_score: number;
  accuracy_score: number;
  confidence_score: number;
  learning_style: string;
  strong_topics: string[];
  weak_topics: string[];
  pace: string;
  exam_readiness: number;
}

export interface CognitiveFingerprint {
  student_id: string;
  topic: string;
  proof_of_thought_score: number;
  socratic_engagement: number;
  teaching_verification: number;
  cognitive_depth: number;
  struggle_points: string[];
  mastery_moments: string[];
  authenticity_status: string;
}

export interface Assignment {
  id: string;
  subject: string;
  topic: string;
  title: string;
  description: string;
  type: string;
}
