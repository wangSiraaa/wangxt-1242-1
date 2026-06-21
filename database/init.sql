-- 古籍修复排程系统数据库初始化脚本

-- 枚举类型定义
CREATE TYPE user_role AS ENUM ('librarian', 'restorer', 'expert', 'admin');
CREATE TYPE rarity_level AS ENUM ('common', 'rare', 'precious', 'national_treasure');
CREATE TYPE request_status AS ENUM ('draft', 'submitted', 'approved', 'in_progress', 'review_pending', 'review_approved', 'review_rejected', 'completed', 'cancelled', 'steps_completed');
CREATE TYPE step_type AS ENUM ('deacidification', 'paper_mending', 'binding');
CREATE TYPE step_status AS ENUM ('pending', 'in_progress', 'completed');
CREATE TYPE review_decision AS ENUM ('approved', 'rejected', 'needs_revision');
CREATE TYPE image_type AS ENUM ('cover', 'inside_page', 'before_restoration', 'after_restoration', 'detail');
CREATE TYPE material_type AS ENUM ('paper', 'adhesive', 'thread', 'consumable', 'tool');
CREATE TYPE material_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock', 'expired');
CREATE TYPE restriction_type AS ENUM ('full', 'reading_room_only', 'supervised', 'digital_only');
CREATE TYPE borrowing_status AS ENUM ('available', 'restricted', 'under_restoration', 'permanently_restricted');

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 古籍档案表
CREATE TABLE IF NOT EXISTS ancient_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100),
    dynasty VARCHAR(50),
    publication_year VARCHAR(20),
    rarity_level rarity_level NOT NULL DEFAULT 'common',
    description TEXT,
    current_status borrowing_status NOT NULL DEFAULT 'available',
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 修复材料表
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    supplier VARCHAR(100),
    expiration_date DATE,
    quantity INTEGER DEFAULT 0,
    unit VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 修复申请表
CREATE TABLE IF NOT EXISTS restoration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_no VARCHAR(50) UNIQUE NOT NULL,
    book_id UUID NOT NULL REFERENCES ancient_books(id),
    requested_by UUID NOT NULL REFERENCES users(id),
    request_reason TEXT NOT NULL,
    urgency_level INTEGER DEFAULT 3,
    status request_status NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by UUID REFERENCES users(id),
    estimated_completion_date DATE,
    actual_completion_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 修复工序表
CREATE TABLE IF NOT EXISTS restoration_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES restoration_requests(id) ON DELETE CASCADE,
    step_type step_type NOT NULL,
    step_order INTEGER NOT NULL,
    status step_status NOT NULL DEFAULT 'pending',
    performed_by UUID REFERENCES users(id),
    material_id UUID REFERENCES materials(id),
    material_batch VARCHAR(100),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(request_id, step_type)
);

-- 图片索引表
CREATE TABLE IF NOT EXISTS book_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES ancient_books(id),
    request_id UUID REFERENCES restoration_requests(id),
    image_type image_type NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    file_path VARCHAR(500),
    thumbnail_url VARCHAR(500),
    taken_at TIMESTAMP,
    taken_by UUID REFERENCES users(id),
    description TEXT,
    file_size INTEGER,
    file_format VARCHAR(20),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 专家评审表
CREATE TABLE IF NOT EXISTS expert_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES restoration_requests(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    decision review_decision NOT NULL,
    review_comments TEXT,
    can_open_for_reading BOOLEAN DEFAULT false,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 借阅限制表
CREATE TABLE IF NOT EXISTS borrowing_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES ancient_books(id),
    restriction_type restriction_type NOT NULL,
    reason TEXT,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    imposed_by UUID REFERENCES users(id),
    require_expert_review BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 借阅记录表
CREATE TABLE IF NOT EXISTS borrowing_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES ancient_books(id),
    borrower VARCHAR(100) NOT NULL,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE,
    purpose TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_books_rarity ON ancient_books(rarity_level);
CREATE INDEX IF NOT EXISTS idx_books_status ON ancient_books(current_status);
CREATE INDEX IF NOT EXISTS idx_requests_book ON restoration_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON restoration_requests(status);
CREATE INDEX IF NOT EXISTS idx_steps_request ON restoration_steps(request_id);
CREATE INDEX IF NOT EXISTS idx_images_book ON book_images(book_id);
CREATE INDEX IF NOT EXISTS idx_images_request ON book_images(request_id);
CREATE INDEX IF NOT EXISTS idx_reviews_request ON expert_reviews(request_id);

-- 触发函数：更新updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON ancient_books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON restoration_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_steps_updated_at BEFORE UPDATE ON restoration_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON expert_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 触发函数：修复完成后自动更新书籍状态
CREATE OR REPLACE FUNCTION update_book_status_on_completion()
RETURNS TRIGGER AS $$
DECLARE
    book_rarity rarity_level;
    has_approved_review BOOLEAN;
    has_before_images BOOLEAN;
    has_after_images BOOLEAN;
BEGIN
    IF NEW.status = 'completed' THEN
        SELECT rarity_level INTO book_rarity FROM ancient_books WHERE id = NEW.book_id;
        
        IF book_rarity IN ('precious', 'national_treasure') THEN
            SELECT EXISTS(
                SELECT 1 FROM expert_reviews 
                WHERE request_id = NEW.id AND decision = 'approved'
            ) INTO has_approved_review;
            
            IF NOT has_approved_review THEN
                RAISE EXCEPTION '珍贵古籍必须通过专家评审才能完成修复流程';
            END IF;
        END IF;
        
        SELECT EXISTS(
            SELECT 1 FROM book_images 
            WHERE request_id = NEW.id AND image_type = 'before_restoration'
        ) INTO has_before_images;
        
        SELECT EXISTS(
            SELECT 1 FROM book_images 
            WHERE request_id = NEW.id AND image_type = 'after_restoration'
        ) INTO has_after_images;
        
        IF NOT has_before_images OR NOT has_after_images THEN
            RAISE EXCEPTION '修复完成前必须上传修复前后的照片';
        END IF;
        
        SELECT EXISTS(
            SELECT 1 FROM expert_reviews 
            WHERE request_id = NEW.id AND decision = 'approved' AND can_open_for_reading = true
        ) INTO has_approved_review;
        
        UPDATE ancient_books 
        SET current_status = CASE 
            WHEN has_approved_review THEN 'available'::borrowing_status
            ELSE 'restricted'::borrowing_status
        END
        WHERE id = NEW.book_id;
    END IF;
    
    IF NEW.status = 'in_progress' THEN
        UPDATE ancient_books 
        SET current_status = 'under_restoration'::borrowing_status
        WHERE id = NEW.book_id;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_and_update_book_status BEFORE UPDATE ON restoration_requests
    FOR EACH ROW EXECUTE FUNCTION update_book_status_on_completion();

-- 触发函数：工序完成时检查材料批号
CREATE OR REPLACE FUNCTION check_material_batch_on_step_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' THEN
        IF NEW.material_batch IS NULL OR NEW.material_batch = '' THEN
            RAISE EXCEPTION '工序完成时必须提供修复材料批号';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_material_batch BEFORE UPDATE ON restoration_steps
    FOR EACH ROW EXECUTE FUNCTION check_material_batch_on_step_complete();

-- 触发函数：自动生成申请编号
CREATE OR REPLACE FUNCTION generate_request_no()
RETURNS TRIGGER AS $$
DECLARE
    date_str VARCHAR(8);
    seq_num INTEGER;
    new_no VARCHAR(50);
BEGIN
    IF NEW.request_no IS NULL OR NEW.request_no = '' THEN
        date_str := to_char(CURRENT_DATE, 'YYYYMMDD');
        SELECT COALESCE(MAX(CAST(SUBSTRING(request_no FROM 14 FOR 4) AS INTEGER)), 0) + 1
        INTO seq_num
        FROM restoration_requests
        WHERE request_no LIKE 'RES-' || date_str || '-%';
        
        new_no := 'RES-' || date_str || '-' || LPAD(seq_num::TEXT, 4, '0');
        NEW.request_no := new_no;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_request_no_trigger BEFORE INSERT ON restoration_requests
    FOR EACH ROW EXECUTE FUNCTION generate_request_no();

-- 触发函数：自动创建三道修复工序
CREATE OR REPLACE FUNCTION create_restoration_steps()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'submitted' OR NEW.status = 'approved' OR NEW.status = 'in_progress' THEN
        INSERT INTO restoration_steps (request_id, step_type, step_order, status)
        VALUES 
            (NEW.id, 'deacidification', 1, 'pending'),
            (NEW.id, 'paper_mending', 2, 'pending'),
            (NEW.id, 'binding', 3, 'pending')
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_steps_trigger AFTER INSERT OR UPDATE ON restoration_requests
    FOR EACH ROW EXECUTE FUNCTION create_restoration_steps();

-- 触发函数：检查所有工序完成后更新申请状态
CREATE OR REPLACE FUNCTION check_all_steps_completed()
RETURNS TRIGGER AS $$
DECLARE
    total_steps INTEGER;
    completed_steps INTEGER;
    req_status request_status;
BEGIN
    IF NEW.status = 'completed' THEN
        SELECT COUNT(*), COUNT(CASE WHEN status = 'completed' THEN 1 END)
        INTO total_steps, completed_steps
        FROM restoration_steps
        WHERE request_id = NEW.request_id;
        
        IF total_steps > 0 AND total_steps = completed_steps THEN
            SELECT status INTO req_status FROM restoration_requests WHERE id = NEW.request_id;
            IF req_status = 'in_progress' THEN
                UPDATE restoration_requests 
                SET status = 'steps_completed' 
                WHERE id = NEW.request_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_steps_completed_trigger AFTER UPDATE ON restoration_steps
    FOR EACH ROW EXECUTE FUNCTION check_all_steps_completed();

-- 初始数据
INSERT INTO users (username, name, role, email) VALUES
('admin', '系统管理员', 'admin', 'admin@library.com'),
('librarian1', '张馆员', 'librarian', 'zhang@library.com'),
('restorer1', '李修复师', 'restorer', 'li@library.com'),
('restorer2', '王修复师', 'restorer', 'wang@library.com'),
('expert1', '陈专家', 'expert', 'chen@library.com'),
('expert2', '刘专家', 'expert', 'liu@library.com')
ON CONFLICT (username) DO NOTHING;

INSERT INTO materials (material_code, name, batch_number, type, supplier, quantity, unit) VALUES
('MAT001', '脱酸剂', 'BATCH-2024-001', 'chemical', '化学试剂厂', 50, 'L'),
('MAT002', '宣纸', 'BATCH-2024-002', 'paper', '宣纸厂', 200, 'sheet'),
('MAT003', '糨糊', 'BATCH-2024-003', 'adhesive', '手工坊', 30, 'kg'),
('MAT004', '棉线', 'BATCH-2024-004', 'binding', '纺织厂', 100, 'spool')
ON CONFLICT (material_code) DO NOTHING;

INSERT INTO ancient_books (book_code, title, author, dynasty, publication_year, rarity_level, description, location) VALUES
('BOOK001', '永乐大典', '解缙', '明', '1408', 'national_treasure', '明代类书，珍贵馆藏', '特藏室A-01'),
('BOOK002', '四库全书', '纪昀', '清', '1782', 'precious', '清代丛书', '特藏室A-02'),
('BOOK003', '本草纲目', '李时珍', '明', '1596', 'rare', '医学名著', '古籍室B-03'),
('BOOK004', '红楼梦', '曹雪芹', '清', '1791', 'rare', '古典文学名著', '古籍室B-05'),
('BOOK005', '唐诗三百首', '蘅塘退士', '清', '1763', 'common', '唐诗选集', '阅览区C-01'),
('BOOK006', '资治通鉴', '司马光', '宋', '1084', 'precious', '编年体史书', '特藏室A-03')
ON CONFLICT (book_code) DO NOTHING;
