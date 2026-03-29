-- 1. PROFILES TABLE ENHANCEMENTS & CONSTRAINTS
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;

-- Enforce Username constraints (3-30 chars, alphanumeric + underscore)
ALTER TABLE profiles 
ADD CONSTRAINT username_validation 
CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$');

-- 2. POSTS TABLE ENHANCEMENTS
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS comment_count integer DEFAULT 0 NOT NULL;

-- Enforce post content length (Max 280 chars)
ALTER TABLE posts 
ADD CONSTRAINT post_length_check 
CHECK (char_length(content) <= 280);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_user_created 
ON posts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_follows_relations 
ON follows(follower_id, following_id);

CREATE INDEX IF NOT EXISTS idx_likes_post_user 
ON likes(post_id, user_id);

CREATE INDEX IF NOT EXISTS idx_comments_post 
ON comments(post_id);

-- 3. TRIGGERS FOR DENORMALIZATION (LIKE_COUNT)
CREATE OR REPLACE FUNCTION increment_like_count() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_like_count() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET like_count = like_count - 1 WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_likes ON likes;
CREATE TRIGGER trg_increment_likes
AFTER INSERT ON likes
FOR EACH ROW EXECUTE FUNCTION increment_like_count();

DROP TRIGGER IF EXISTS trg_decrement_likes ON likes;
CREATE TRIGGER trg_decrement_likes
AFTER DELETE ON likes
FOR EACH ROW EXECUTE FUNCTION decrement_like_count();

-- 4. TRIGGERS FOR DENORMALIZATION (COMMENT_COUNT)
CREATE OR REPLACE FUNCTION increment_comment_count() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_comment_count() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comment_count = comment_count - 1 WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_comments ON comments;
CREATE TRIGGER trg_increment_comments
AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION increment_comment_count();

DROP TRIGGER IF EXISTS trg_decrement_comments ON comments;
CREATE TRIGGER trg_decrement_comments
AFTER DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION decrement_comment_count();

-- 5. SOFT DELETE & FOLLOWERS COUNT ENHANCEMENT
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0 NOT NULL;

-- 6. TRIGGERS FOR DENORMALIZATION (FOLLOWERS_COUNT)
CREATE OR REPLACE FUNCTION increment_followers_count() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_followers_count() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET followers_count = followers_count - 1 WHERE id = OLD.following_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_increment_followers ON follows;
CREATE TRIGGER trg_increment_followers
AFTER INSERT ON follows
FOR EACH ROW EXECUTE FUNCTION increment_followers_count();

DROP TRIGGER IF EXISTS trg_decrement_followers ON follows;
CREATE TRIGGER trg_decrement_followers
AFTER DELETE ON follows
FOR EACH ROW EXECUTE FUNCTION decrement_followers_count();
