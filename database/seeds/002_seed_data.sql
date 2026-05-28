-- DriveWise AI — Seed Data (demo / development only)
USE drivewise;

-- Demo admin user (Google OAuth — google_id is a placeholder)
INSERT IGNORE INTO users (google_id, email, name, role, whatsapp_number) VALUES
  ('google-admin-001',      'admin@drivewise.ai',       'Admin User',        'admin',      '+447700900001'),
  ('google-instructor-001', 'sarah.jones@drivewise.ai', 'Sarah Jones',       'instructor', '+447700900002'),
  ('google-instructor-002', 'mark.smith@drivewise.ai',  'Mark Smith',        'instructor', '+447700900003'),
  ('google-student-001',    'alice@example.com',         'Alice Brown',       'student',    '+447700900004'),
  ('google-student-002',    'bob@example.com',           'Bob Wilson',        'student',    '+447700900005');

-- Instructor profiles
INSERT IGNORE INTO instructors (user_id, bio, specialisations, vehicle_type, rating)
SELECT id, 'Experienced instructor with 10 years teaching.', '["motorway","roundabouts","parallel parking"]', 'manual', 4.8
FROM users WHERE email = 'sarah.jones@drivewise.ai';

INSERT IGNORE INTO instructors (user_id, bio, specialisations, vehicle_type, rating)
SELECT id, 'Patient and thorough instructor specialising in nervous drivers.', '["town driving","manoeuvres","test preparation"]', 'automatic', 4.6
FROM users WHERE email = 'mark.smith@drivewise.ai';

-- Student profiles
INSERT IGNORE INTO students (user_id, test_date, skill_level, learning_pace)
SELECT id, DATE_ADD(NOW(), INTERVAL 60 DAY), 'beginner', 'average'
FROM users WHERE email = 'alice@example.com';

INSERT IGNORE INTO students (user_id, test_date, skill_level, learning_pace)
SELECT id, DATE_ADD(NOW(), INTERVAL 30 DAY), 'intermediate', 'fast'
FROM users WHERE email = 'bob@example.com';

-- Instructor availability (Sarah: Mon–Fri 09:00–17:00)
INSERT IGNORE INTO availability (instructor_id, day_of_week, start_time, end_time)
SELECT i.id, d.day, '09:00:00', '17:00:00'
FROM instructors i
JOIN users u ON i.user_id = u.id
CROSS JOIN (SELECT 1 AS day UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) d
WHERE u.email = 'sarah.jones@drivewise.ai';

-- Sample route
INSERT IGNORE INTO routes (name, topic, waypoints, distance_km, created_by)
SELECT
  'City Centre Practice',
  'roundabouts',
  '[{"lat":51.5074,"lon":-0.1278,"label":"Start - Oxford St"},{"lat":51.5100,"lon":-0.1350,"label":"Marble Arch"},{"lat":51.5050,"lon":-0.1400,"label":"Hyde Park Corner"}]',
  3.2,
  u.id
FROM users u WHERE u.email = 'sarah.jones@drivewise.ai';
