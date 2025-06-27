DROP TABLE IF EXISTS pomodoro_sessions;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS issues;
DROP TABLE IF EXISTS users;

-- 用户表
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- issue 表（可以没有任务）
CREATE TABLE issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- task 表（可独立存在，但若属于 issue，则必须有 step）
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  issue_id INT,  -- 可为 NULL（独立任务）
  step_number INT,  -- 如果有 issue_id，则必须非 NULL
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  CONSTRAINT step_required_if_issue CHECK (
    issue_id IS NULL OR step_number IS NOT NULL
  ),
  UNIQUE (issue_id, step_number)
);

-- pomodoro_sessions 表（修改版）
CREATE TABLE pomodoro_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  task_id INT NOT NULL, -- 必须绑定任务
  start_time DATETIME NOT NULL,
  estimated_end_time DATETIME NOT NULL,
  actual_end_time DATETIME,
  duration_minutes INT NOT NULL,
  break_point INT DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- user
INSERT INTO users (username, email, password) VALUES
('alice', 'alice@example.com', 'pw1'),         -- id = 1
('bob', 'bob@example.com', 'pw2'),             -- id = 2
('charlie', 'charlie@example.com', 'pw3'),     -- id = 3
('diana', 'diana@example.com', 'pw4');         -- id = 4

-- issues
INSERT INTO issues (user_id, title, description) VALUES
(1, 'Frontend Revamp', 'Update UI components and layout'),       -- id = 1
(2, 'Authentication Fixes', 'Resolve login token issues'),       -- id = 2
(1, 'Empty issue', 'Has no tasks yet'),                          -- id = 3
(3, 'Backend Refactoring', 'Optimize API endpoints and DB access'), -- id = 4
(4, 'UX Review', 'Collect feedback and polish onboarding flow');     -- id = 5

-- 属于 issue 的任务
INSERT INTO tasks (user_id, issue_id, step_number, title, description, completed) VALUES
(1, 1, 1, 'Refactor Header', 'Responsive layout', FALSE),         -- id = 1
(1, 1, 2, 'Update Button Style', 'Improve CTA buttons', TRUE),    -- id = 2
(2, 2, 1, 'Fix Token Bug', 'Token not saving', FALSE),            -- id = 3
(3, 4, 1, 'Clean Up Routes', 'Refactor route handlers for better structure', FALSE), -- id = 4
(3, 4, 2, 'Optimize DB Access', 'Add indexes, refactor joins', FALSE),               -- id = 5
(4, 5, 1, 'Conduct User Survey', 'Interview 10 users', TRUE),     -- id = 6
(4, 5, 2, 'Polish UI', 'Improve button size and layout', FALSE);  -- id = 7

-- 独立任务（无 issue_id）
INSERT INTO tasks (user_id, issue_id, step_number, title, description, completed) VALUES
(1, NULL, NULL, 'Write blog post', 'Topic: UI/UX', FALSE),        -- id = 8
(2, NULL, NULL, 'Experiment with animations', 'GSAP trial', TRUE),-- id = 9
(3, NULL, NULL, 'Prepare Sprint Report', 'Summarize progress for sprint 6', TRUE),  -- id = 10
(4, NULL, NULL, 'Study Design Trends', 'Read 3 UX blogs and summarize', FALSE);     -- id = 11

-- Pomodoro sessions（包含 break_point、estimated 和 actual end）
INSERT INTO pomodoro_sessions 
(user_id, task_id, start_time, estimated_end_time, actual_end_time, duration_minutes, break_point, note) VALUES
(1, 1, '2025-06-21 08:00:00', '2025-06-21 08:25:00', '2025-06-21 08:25:00', 25, 0, 'Morning focus'),
(1, 2, '2025-06-21 09:00:00', '2025-06-21 09:30:00', '2025-06-21 09:30:00', 30, 1, 'Finished polishing buttons'),
(2, 3, '2025-06-21 10:00:00', '2025-06-21 10:25:00', '2025-06-21 10:26:00', 25, 2, 'Debugging token logic'),
(3, 6, '2025-06-21 11:00:00', '2025-06-21 11:25:00', '2025-06-21 11:25:00', 25, 0, 'Refactored routes');
