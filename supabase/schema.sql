-- KTCC Thalassemia Care Center - Database Schema

CREATE TABLE donors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    fathers_name TEXT,
    age INT CHECK (age >= 18 AND age <= 65),
    gender TEXT,
    contact_no TEXT,
    cnic TEXT,
    address TEXT,
    blood_group TEXT,
    weight NUMERIC CHECK (weight >= 50),
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Available', 'In Cooldown', 'Unavailable')),
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

CREATE TABLE donation_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    donor_id UUID REFERENCES donors(id) ON DELETE CASCADE,
    donation_date DATE,
    blood_bag_id TEXT,
    vitals_hb NUMERIC,
    vitals_bp TEXT,
    vitals_pulse TEXT,
    vitals_temp TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE transfusion_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    transfusion_date DATE,
    blood_bag_id TEXT,
    donor_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
