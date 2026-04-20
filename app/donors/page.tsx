'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Calendar, Edit2, Download, Trash2, Upload, Filter, X } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DonorsList() {
  const router = useRouter();
  const [donors, setDonors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Filters
  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  const handleDeleteDonor = async (id: string, name: string) => {
    if (!window.confirm(`CRITICAL ALERT:\nAre you sure you want to permanently delete donor "${name}"?\nThis action cannot be undone.`)) return;
    
    // Optimistic UI update or refresh
    const { error } = await supabase.from('donors').delete().eq('id', id);
    if (error) {
      alert(`Error deleting donor: ${error.message}`);
    } else {
      setDonors(prev => prev.filter(d => d.id !== id));
    }
  };

  const fetchDonors = async () => {
    const { data, error } = await supabase.from('donors').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('DB schema might not match yet. Proceeding strictly.', error);
    }
    if (data) setDonors(data);
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const filtered = donors.filter(d => {
    const safeName = d.name || '';
    const safeBlood = d.blood_group || '';
    const safeContact = d.contact_no || d.phone || '';
    const safeCnic = d.cnic || '';

    const matchesSearch = 
      safeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      safeBlood.toLowerCase().includes(searchQuery.toLowerCase()) ||
      safeContact.includes(searchQuery) ||
      safeCnic.includes(searchQuery);
    
    const matchesBlood = filterBloodGroup ? safeBlood === filterBloodGroup : true;
    const matchesGender = filterGender ? d.gender === filterGender : true;
    const matchesStatus = filterStatus ? d.status === filterStatus : true;
    const matchesFrom = filterFromDate ? (d.last_donation_date && d.last_donation_date >= filterFromDate) : true;
    const matchesTo = filterToDate ? (d.last_donation_date && d.last_donation_date <= filterToDate) : true;

    return matchesSearch && matchesBlood && matchesGender && matchesStatus && matchesFrom && matchesTo;
  });

  const exportCSV = () => {
    // ... logic remains
    const escapeCSV = (str: any) => {
      if (str === null || str === undefined) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };

    const headers = ["ID", "Name", "Father's Name", "Age", "Gender", "Contact No", "CNIC", "Blood Group", "Weight", "Status", "Last Donation Date", "Next Eligible Date", "Address"];
    const csvRows = [headers.join(",")];
    
    for (const d of filtered) {
      const row = [
        d.id, d.name, d.fathers_name, d.age, d.gender, d.contact_no || d.phone, d.cnic, d.blood_group, d.weight, d.status || 'Pending', d.last_donation_date, d.next_eligible_date, d.address
      ].map(escapeCSV);
      csvRows.push(row.join(","));
    }

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ktcc_donors_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const dataBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(dataBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

      if (!jsonData || jsonData.length === 0) {
        throw new Error("No data found in the file.");
      }

      const mappedData = jsonData.map(row => ({
        name: row['Name'] || '',
        fathers_name: row["Father's Name"] || row['fathers_name'] || '',
        age: parseInt(row['Age'] || row['age']) || null,
        gender: row['Gender'] || row['gender'] || 'Male',
        contact_no: row['Contact No'] || row['contact_no'] || '',
        cnic: row['CNIC'] || row['cnic'] || '',
        blood_group: row['Blood Group'] || row['blood_group'] || 'O+',
        weight: parseFloat(row['Weight'] || row['weight']) || null,
        status: row['Status'] || row['status'] || 'Pending',
        last_donation_date: row['Last Donation Date'] || row['last_donation_date'] || null,
        next_eligible_date: row['Next Eligible Date'] || row['next_eligible_date'] || null,
        address: row['Address'] || row['address'] || '',
      })).filter(d => d.name);

      if (mappedData.length === 0) throw new Error("No valid entries with names found.");

      const { error } = await supabase.from('donors').insert(mappedData);
      if (error) throw error;
      
      alert(`Successfully imported ${mappedData.length} donors!`);
      fetchDonors();
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-6 pt-12">
      <Link href="/" className="inline-flex items-center gap-2 text-secondary mb-8 hover:text-primary transition-colors font-medium">
        <ArrowLeft size={20} /> Back to Dashboard
      </Link>

      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-display-sm md:text-5xl font-display font-medium text-on-surfacemain">
            Donor Directory
          </h1>
          <p className="text-secondary mt-2">Search and manage exact blood donor records</p>
        </div>
        <Link href="/donors/new" className="bg-gradient-to-r from-primary to-primary-container text-white px-8 py-3 rounded-full font-semibold text-center w-full md:w-auto shadow-sm hover:opacity-90 transition-opacity">
          + Add Donor
        </Link>
      </header>

      {/* Search Bar & Mobile Filter Toggle */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-surface-lowest shadow-[0_4px_24px_rgba(26,28,28,0.04)] rounded-tl-2xl rounded-r-lg rounded-bl-lg p-3 flex items-center gap-3">
          <Search className="text-secondary ml-3 shrink-0" size={24} />
          <input 
            type="text" 
            placeholder="Search by Name, Contact, or CNIC..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 w-full bg-transparent border-none outline-none focus:ring-0 text-lg p-2 font-medium placeholder:text-secondary/50 text-on-surfacemain"
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`md:hidden shrink-0 shadow-[0_4px_24px_rgba(26,28,28,0.04)] w-[60px] rounded-xl flex items-center justify-center transition-colors border ${showFilters ? 'bg-primary-container text-primary border-primary/20' : 'bg-surface-lowest text-secondary border-transparent hover:bg-surface-container'}`}
        >
          {showFilters ? <X size={24} /> : <Filter size={24} />}
        </button>
      </div>

      {/* Filters & Export */}
      <div className={`bg-surface-lowest shadow-[0_4px_24px_rgba(26,28,28,0.04)] rounded-2xl p-4 mb-10 border border-surface-container ${showFilters ? 'flex flex-col' : 'hidden md:flex flex-col'} items-end gap-4`}>
        
        <div className="flex flex-col md:flex-row w-full gap-4">
          <div className="flex-1 w-full space-y-1">
             <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Blood Group</label>
             <select 
               value={filterBloodGroup} onChange={e => setFilterBloodGroup(e.target.value)}
               className="w-full bg-surface-container rounded-lg p-3 text-sm focus:outline-none focus:ring-2 ring-primary/20 border-transparent text-on-surfacemain"
             >
               <option value="">All Groups</option>
               <option>A+</option><option>A-</option>
               <option>B+</option><option>B-</option>
               <option>O+</option><option>O-</option>
               <option>AB+</option><option>AB-</option>
             </select>
          </div>
          <div className="flex-1 w-full space-y-1">
             <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Gender</label>
             <select 
               value={filterGender} onChange={e => setFilterGender(e.target.value)}
               className="w-full bg-surface-container rounded-lg p-3 text-sm focus:outline-none focus:ring-2 ring-primary/20 border-transparent text-on-surfacemain"
             >
               <option value="">All Genders</option>
               <option>Male</option>
               <option>Female</option>
             </select>
          </div>
          <div className="flex-1 w-full space-y-1">
             <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Status</label>
             <select 
               value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
               className="w-full bg-surface-container rounded-lg p-3 text-sm focus:outline-none focus:ring-2 ring-primary/20 border-transparent text-on-surfacemain"
             >
               <option value="">All Statuses</option>
               <option>Available</option>
               <option>Pending</option>
               <option>In Cooldown</option>
               <option>Unavailable</option>
             </select>
          </div>
          <div className="flex-1 w-full space-y-1 md:col-span-2 lg:col-span-1">
             <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Date Range (Last Donation)</label>
             <div className="flex items-center gap-2">
               <input type="date" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} title="From Date"
                 className="w-full bg-surface-container rounded-lg p-3 text-sm focus:outline-none focus:ring-2 ring-primary/20 border-transparent text-on-surfacemain" />
               <span className="text-secondary font-medium">to</span>
               <input type="date" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} title="To Date"
                 className="w-full bg-surface-container rounded-lg p-3 text-sm focus:outline-none focus:ring-2 ring-primary/20 border-transparent text-on-surfacemain" />
             </div>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
          />
          <button 
            disabled={importing} 
            onClick={() => fileInputRef.current?.click()} 
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-surface-high hover:bg-[#e0e0e0] text-secondary font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
          >
            <Upload size={18} /> {importing ? 'Importing...' : 'Import Excel'}
          </button>
          <button onClick={exportCSV} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-surface-high hover:bg-[#e0e0e0] text-secondary font-semibold py-3 px-6 rounded-lg transition-colors">
            <Download size={18} /> Export
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {filtered.map(donor => (
          <div key={donor.id} className="bg-surface-lowest shadow-[0_4px_24px_rgba(26,28,28,0.04)] rounded-tl-[1.5rem] rounded-r-lg rounded-bl-lg p-6 flex flex-col md:flex-row gap-6 md:items-center group border border-transparent">
            {/* Blood Type Badge */}
            <div className="shrink-0 w-16 h-16 bg-primary-fixed rounded-2xl flex items-center justify-center">
              <span className="text-primary font-display font-medium text-2xl tracking-tighter">{donor.blood_group}</span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-title-lg font-bold text-on-surfacemain">{donor.name}</h3>
              <p className="text-secondary text-sm mt-1 font-medium">
                {donor.fathers_name ? `S/O D/O ${donor.fathers_name} • ` : ''} 
                {donor.contact_no || donor.phone} • {donor.cnic ? `CNIC: ${donor.cnic} • ` : ''} {donor.age ? `${donor.age} yrs` : ''}
              </p>
              
              <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold">
                {donor.last_donation_date && (
                   <span className="flex items-center gap-1.5 text-secondary bg-surface-low px-3 py-1.5 rounded-full"><Calendar size={14}/> Last: {donor.last_donation_date}</span>
                )}
                {donor.next_eligible_date && (
                   <span className="flex items-center gap-1.5 text-primary bg-primary-fixed px-3 py-1.5 rounded-full"><Calendar size={14}/> Eligible: {donor.next_eligible_date}</span>
                )}
              </div>
            </div>

             <div className="shrink-0 flex items-center gap-2">
               <Link 
                 href={`/donors/${donor.id}`} 
                 onClick={(e) => {
                   if (!window.confirm('Are you sure you want to edit this record?')) {
                     e.preventDefault();
                   }
                 }}
                 className="bg-surface-high hover:bg-[#e0e0e0] text-secondary p-3 rounded-full transition-colors flex flex-col items-center justify-center gap-1 text-xs font-semibold border border-transparent hover:border-surface-container"
               >
                 <Edit2 size={16} /> Edit
               </Link>
               
               <button 
                 onClick={() => handleDeleteDonor(donor.id, donor.name)}
                 className="bg-surface-high hover:bg-tertiary-container text-tertiary hover:text-tertiary p-3 rounded-full transition-colors flex flex-col items-center justify-center gap-1 text-xs font-semibold border border-transparent hover:border-surface-container"
                 title="Delete Donor"
               >
                 <Trash2 size={16} /> Delete
               </button>
             </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-surface-lowest rounded-tl-2xl rounded-r-lg rounded-bl-lg py-20 text-center text-secondary shadow-[0_4px_24px_rgba(26,28,28,0.04)]">
            <p className="text-lg font-medium">No donors found. Check exact database entries.</p>
          </div>
        )}
      </div>
    </main>
  );
}
