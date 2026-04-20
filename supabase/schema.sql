-- KTCC Thalassemia Care Center - Database Schema

CREATE TABLE donors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    fathers_name TEXT,
    age INT,
    gender TEXT,
    contact_no TEXT,
    cnic TEXT,
    address TEXT,
    blood_group TEXT,
    weight NUMERIC,
    last_donation_date DATE,
    next_eligible_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    s_no SERIAL, -- Auto-generated Sequence Number
    name TEXT NOT NULL,
    fathers_name TEXT,
    cnic TEXT,
    fathers_cnic TEXT,
    contact_no TEXT,
    address TEXT,
    blood_group TEXT,
    issue_date DATE,
    last_transfusion_date DATE,
    next_transfusion_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
