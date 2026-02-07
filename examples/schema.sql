-- Sample SQL Schema for bitter-sql
-- This is an example schema that demonstrates various SQLite features

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Posts table
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index on user_id and status
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index on post_id
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Post-Tag junction table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name TEXT NOT NULL,
  action TEXT NOT NULL,
  record_id INTEGER,
  user_id INTEGER,
  changes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO users (username, email, password_hash) VALUES
  ('admin', 'admin@example.com', 'hash_placeholder_1'),
  ('john_doe', 'john@example.com', 'hash_placeholder_2'),
  ('jane_smith', 'jane@example.com', 'hash_placeholder_3');

INSERT INTO tags (name) VALUES
  ('technology'),
  ('tutorial'),
  ('news'),
  ('opinion');

INSERT INTO posts (user_id, title, content, status) VALUES
  (1, 'Welcome to Our Blog', 'This is the first post on our blog.', 'published'),
  (2, 'Getting Started with SQLite', 'SQLite is a powerful embedded database.', 'published'),
  (3, 'Database Security Best Practices', 'Learn how to secure your databases.', 'draft');

INSERT INTO post_tags (post_id, tag_id) VALUES
  (1, 3),
  (2, 1),
  (2, 2),
  (3, 1);

INSERT INTO comments (post_id, user_id, content) VALUES
  (1, 2, 'Great post! Looking forward to more content.'),
  (1, 3, 'Thanks for sharing!'),
  (2, 1, 'Very informative tutorial.');

-- Create a view for easy querying
CREATE VIEW IF NOT EXISTS post_summary AS
SELECT 
  p.id,
  p.title,
  u.username as author,
  p.status,
  p.created_at,
  COUNT(DISTINCT c.id) as comment_count
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN comments c ON p.id = c.post_id
GROUP BY p.id;

-- Create a trigger to update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_posts_timestamp 
AFTER UPDATE ON posts
BEGIN
  UPDATE posts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
