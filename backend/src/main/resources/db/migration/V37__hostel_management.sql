CREATE TABLE dbo.hostels (
    id NVARCHAR(64) NOT NULL PRIMARY KEY,
    institution_id NVARCHAR(64) NOT NULL,
    name NVARCHAR(150) NOT NULL,
    photo_url NVARCHAR(500) NULL,
    created_at DATETIME2 NOT NULL
);

CREATE INDEX IX_hostels_institution ON dbo.hostels (institution_id);

CREATE TABLE dbo.hostel_rooms (
    id NVARCHAR(64) NOT NULL PRIMARY KEY,
    hostel_id NVARCHAR(64) NOT NULL,
    room_number NVARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    created_at DATETIME2 NOT NULL
);

CREATE INDEX IX_hostel_rooms_hostel ON dbo.hostel_rooms (hostel_id);

CREATE TABLE dbo.hostel_allocations (
    id NVARCHAR(64) NOT NULL PRIMARY KEY,
    institution_id NVARCHAR(64) NOT NULL,
    student_id NVARCHAR(64) NOT NULL,
    hostel_id NVARCHAR(64) NULL,
    room_id NVARCHAR(64) NULL,
    status NVARCHAR(30) NOT NULL,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL
);

CREATE INDEX IX_hostel_allocations_institution ON dbo.hostel_allocations (institution_id);
CREATE UNIQUE INDEX UX_hostel_allocations_student ON dbo.hostel_allocations (institution_id, student_id);
