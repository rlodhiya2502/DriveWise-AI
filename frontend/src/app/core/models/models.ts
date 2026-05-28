export interface User {
  id: number;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'instructor' | 'student';
  whatsapp_number?: string;
  created_at: string;
}

export interface Student {
  id: number;
  user_id: number;
  name: string;
  email: string;
  avatar?: string;
  test_date?: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced';
  learning_pace: 'slow' | 'average' | 'fast';
  preferred_instructor_id?: number;
  whatsapp_number?: string;
}

export interface Instructor {
  id: number;
  user_id: number;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  specialisations?: string[];
  vehicle_type?: string;
  rating: number;
  completed_lessons?: number;
}

export interface Availability {
  id: number;
  instructor_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface Lesson {
  id: number;
  student_id: number;
  instructor_id: number;
  scheduled_at: string;
  duration_mins: number;
  topic: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  route_id?: number;
  notes?: string;
  student_name?: string;
  instructor_name?: string;
  created_at: string;
}

export interface LessonFeedback {
  id: number;
  lesson_id: number;
  instructor_notes?: string;
  ai_summary?: string;
  skills_data?: Record<string, number>;
  score?: number;
}

export interface LearningPlan {
  totalLessons: number;
  weeklyFrequency: number;
  focusAreas: string[];
  notes: string;
  milestones: {
    title: string;
    lessonsRequired: number;
    topics: string[];
  }[];
}

export interface Route {
  id: number;
  name: string;
  topic: string;
  waypoints: { lat: number; lon: number; label: string }[];
  geometry?: any;
  distance_km?: number;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  message: string;
  channel: string;
  sent_at: string;
  read_at?: string;
}

export interface Insights {
  summary: string;
  weakAreas: string[];
  strengths: string[];
  passProbability: number;
  recommendations: string[];
}

export interface InstructorMatch {
  id: number;
  reason: string;
}
