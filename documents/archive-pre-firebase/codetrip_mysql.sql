-- 데이터베이스 생성 (먼저 실행)

CREATE DATABASE IF NOT EXISTS codetrip;
USE codetrip;

select * from users;
select * from wishlists;

-- 전체 테이블 생성 스크립트
-- 아래 내용을 한꺼번에 복사해서 실행하시면 됩니다.
-- 1. 사용자 테이블 (회원가입/로그인용)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    profile_img VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 게시판 테이블 (게시글 저장용)
CREATE TABLE IF NOT EXISTS board_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    view_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2.1 게시판 게시글 태그
CREATE TABLE IF NOT EXISTS board_post_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    content_id VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    firstimage TEXT,
    INDEX idx_board_post_tags_post_id (post_id)
);

-- 2.2 게시판 게시글 좋아요
CREATE TABLE IF NOT EXISTS board_post_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_board_post_user (post_id, user_id)
);

-- 2.3 게시판 댓글
CREATE TABLE IF NOT EXISTS board_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    nickname VARCHAR(100) NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_board_comments_post_id (post_id)
);

-- 2.4 게시판 댓글 좋아요
CREATE TABLE IF NOT EXISTS board_comment_likes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comment_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_board_comment_user (comment_id, user_id)
);

-- 3. 코멘트 테이블 (여행 상세 페이지 댓글용)
CREATE TABLE IF NOT EXISTS travel_comments (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    content_id VARCHAR(50) NOT NULL, 
    user_id INT, 
    nickname VARCHAR(100) NOT NULL DEFAULT "익명", 
    body TEXT NOT NULL, 
    likes INT NOT NULL DEFAULT 0, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    INDEX idx_content_id (content_id)
);

-- 3.1 코멘트 좋아요 테이블
CREATE TABLE IF NOT EXISTS travel_comment_likes (
    id INT AUTO_INCREMENT PRIMARY KEY, 
    comment_id INT NOT NULL, 
    user_id INT NOT NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
    UNIQUE KEY uq_comment_user (comment_id, user_id)
);

-- 4. 위시리스트 테이블
CREATE TABLE IF NOT EXISTS wishlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content_id VARCHAR(50) NOT NULL,
    folder_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_content (user_id , content_id),
    FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
);

-- 5. 위시리스트 폴더 테이블
CREATE TABLE IF NOT EXISTS wishlist_folders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)
        REFERENCES users (id)
        ON DELETE CASCADE
);

-- 6. 사용자 관심지역 테이블
CREATE TABLE IF NOT EXISTS user_favorite_regions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    region_code VARCHAR(10) NOT NULL,
    UNIQUE KEY uq_user_region (user_id, region_code),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)