'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Search, Calendar, Edit2, Download, Trash2 } from 'lucide-react';

export default function PatientsList() {
  const router = useRouter();
  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [filterFromDate, setFilterFromDate] = useState('');
  const [filterToDate, setFilterToDate] = useState('');

  const handleDeletePatient = async (id: string, name: string) => {
    if (!window.confirm(`CRITICAL ALERT:\nAre you sure you want to permanently delete patient "${name}"?\nThis action cannot be undone.`)) return;
    
    const { error } = await supabase.from('patients').delete().eq('id', id);
    if (error) {
      alert(`Error deleting patient: ${error.message}`);
    } else {
      setPatients(prev => prev.filter(p => p.id !== id));
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    const { data, error } = await supabase.from('patients').select('*').order('created_at', { ascending: false });
    if (error) {
       console.warn('DB schema might not match yet. Proceeding strictly.', error);
    }
    if (data) setPatients(data);
  };

  const filtered = patients.filter(p => {
    const safeName = p.name || '';
    const safeBlood = p.blood_group || '';
    const safeContact = p.contact_no || p.guardian_phone || '';
    const safeCnic = p.cnic || '';

    const matchesSearch = 
      safeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      safeBlood.toLowerCase().includes(searchQuery.toLowerCase()) ||
      safeContact.includes(searchQuery) || 
      safeCnic.includes(searchQuery);

    const matchesBlood = filterBloodGroup ? safeBlood === filterBloodGroup : true;
    const matchesFrom = filterFromDate ? (p.last_transfusion_date && p.last_transfusion_date >= filterFromDate) : true;
    const matchesTo = filterToDate ? (p.last_transfusion_date && p.last_transfusion_date <= filterToDate) : true;

    return matchesSearch && matchesBlood && matchesFrom && matchesTo;
  });

  const exportCSV = () => {
    const escapeCSV = (str: any) => {
      if (str === null || str === undefined) return '""';
      return `"${String(str).replace(/"/g, '""')}"`;
    };

    const headers = ["S/No", "ID", "Name", "Father's Name", "CNIC", "Father's CNIC", "Contact No", "Blood Group", "Address", "Issue Date", "Last Transfusion Date", "Next Transfusion Date"];
    const csvRows = [headers.join(",")];
    
    for (const p of filtered) {
       // s_no will be available locally only after Supabase db is successfully migrated
      const snoVal = p.s_no ? p.s_no : p.id.split('-')[0];
      const row = [
        snoVal, p.id, p.name, p.fathers_name, p.cnic, p.fathers_cnic, p.contact_no || p.guardian_phone, p.blood_group, p.address, p.issue_date, p.last_transfusion_date, p.next_transfusion_date
      ].map(escapeCSV);
      csvRows.push(row.join(","));
    }

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ktcc_patients_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="max-w-4xl mx-auto p-6 pt-12">
      <Link href="/" className="inline-flex items-center gap-2 text-secondary mb-8 hover:text-primary transition-colors font-medium">
        <ArrowLeft size={20} /> Back to Dashboard
      </Link>

      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-display-sm md:text-5xl font-display font-medium text-on-surfacemain">
            Patient Directory
          </h1>
          <p className="text-secondary mt-2">Search and manage exact patient records</p>
        </div>
        <Link href="/patients/new" className="bg-gradient-to-r from-primary to-primary-container text-white px-8 py-3 rounded-full font-semibold text-center w-full md:w-auto shadow-sm hover:opacity-90 transition-opacity">
          + Add Patient
        </Link>
      </header>

      {/* Search Bar */}
      <div className="bg-surface-lowest shadow-[0_4px_24px_rgba(26,28,28,0.04)] rounded-tl-2xl rounded-r-lg rounded-bl-lg p-3 mb-6 flex items-center gap-3">
        <Search className="text-secondary ml-3" size={24} />
        <input 
          type="text" 
          placeholder="Search by Name, CNIC, Blood Group, or Contact No..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-lg p-2 font-medium placeholder:text-secondary/50 text-on-surfacemain"
        />
      </div>

      {/* Filters & Export */}
      <div className="bg-surface-lowest shadow-[0_4px_24px_rgba(26,28,28,0.04)] rounded-2xl p-4 mb-10 flex flex-col md:flex-row items-end gap-4 border border-surface-container">
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
           <label className="text-xs font-semibold text-secondary uppercase tracking-wider">Date Range (Last Transfusion)</label>
           <div className="flex items-center gap-2">
             <input type="date" value={filterFromDate} onChange={e => setFilterFromDate(e.target.value)} title="From Date"
               className="w-full bg-surface-container rounded-lg p-3 text-sm focus:outline-none focus:ring-2 ring-primary/20 border-transparent text-on-surfacemain" />
             <span className="text-secondary font-medium">to</span>
             <input type="date" value={filterToDate} onChange={e => setFilterToDate(e.target.value)} title="To Date"
               className="w-full bg-surface-container rounded-lg p-3 text-sm focus:outline-none focus:ring-2 ring-primary/20 border-transparent text-on-surfacemain" />
           </div>
        </div>
        <div className="shrink-0 w-full md:w-auto">
          <button onClick={exportCSV} className="w-full flex items-center justify-center gap-2 bg-surface-high hover:bg-[#e0e0e0] text-secondary font-semibold py-3 px-6 rounded-lg transition-colors">
            <Download size={18} /> Export CSV
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {filtered.map(patient => (
          <div key={patient.id} className="bg-surface-lowest shadow-[0_4px_24px_rgba(26,28,28,0.04)] rounded-tl-[1.5rem] rounded-r-lg rounded-bl-lg p-6 flex flex-col md:flex-row gap-6 md:items-center">
            {/* Blood Type Badge */}
            <div className="shrink-0 w-16 h-16 bg-tertiary-container rounded-2xl flex items-center justify-center">
              <span className="text-tertiary font-display font-medium tracking-tighter text-2xl">{patient.blood_group}</span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-title-lg font-bold text-on-surfacemain">{patient.name} <span className="text-sm font-medium text-secondary/60">({patient.s_no ? `S/No: ${patient.s_no}` : patient.id.split('-')[0]})</span></h3>
              <p className="text-secondary text-sm mt-1 font-medium">
                {patient.fathers_name ? `S/O D/O ${patient.fathers_name} • ` : ''} 
                {patient.contact_no || patient.guardian_phone}
                {patient.cnic ? ` • CNIC: ${patient.cnic}` : ''}
              </p>
              
              <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold">
                {patient.last_transfusion_date && (
                   <span className="flex items-center gap-1.5 text-secondary bg-surface-low px-3 py-1.5 rounded-full"><Calendar size={14}/> Last TX: {patient.last_transfusion_date}</span>
                )}
                {patient.next_transfusion_date && (
                   <span className="flex items-center gap-1.5 text-tertiary bg-tertiary-container px-3 py-1.5 rounded-full"><Calendar size={14}/> Next TX: {patient.next_transfusion_date}</span>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <Link 
                href={`/patients/${patient.id}`} 
                onClick={(e) => {
                   if (!window.confirm('Are you sure you want to edit this patient record?')) {
                     e.preventDefault();
                   }
                }}
                className="bg-surface-high hover:bg-[#e0e0e0] text-secondary p-3 rounded-full transition-colors flex flex-col items-center justify-center gap-1 text-xs font-semibold border border-transparent hover:border-surface-container"
              >
                 <Edit2 size={16} /> Edit
              </Link>
              
              <button 
                 onClick={() => handleDeletePatient(patient.id, patient.name)}
                 className="bg-surface-high hover:bg-tertiary-container text-tertiary hover:text-tertiary p-3 rounded-full transition-colors flex flex-col items-center justify-center gap-1 text-xs font-semibold border border-transparent hover:border-surface-container"
                 title="Delete Patient"
              >
                 <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="bg-surface-lowest rounded-tl-2xl rounded-r-lg rounded-bl-lg py-20 text-center text-secondary shadow-[0_4px_24px_rgba(26,28,28,0.04)]">
            <p className="text-lg font-medium">No patients found. Check exact database entries.</p>
          </div>
        )}
      </div>
    </main>
  );
}
