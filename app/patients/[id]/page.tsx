'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Save, Activity, Trash2 } from 'lucide-react';

export default function PatientFormPage() {
  const router = useRouter();
  const params = useParams();
  const idStr = params?.id as string;
  const isEditing = idStr && idStr !== 'new';
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    fathers_name: '',
    cnic: '',
    fathers_cnic: '',
    contact_no: '',
    address: '',
    blood_group: 'O+',
    issue_date: '',
    last_transfusion_date: '',
    next_transfusion_date: ''
  });

  useEffect(() => {
    if (isEditing) {
      const loadData = async () => {
        const { data: patientData } = await supabase.from('patients').select('*').eq('id', idStr).single();
        if (patientData) {
          setFormData({
            name: patientData.name || '',
            fathers_name: patientData.fathers_name || '',
            cnic: patientData.cnic || '',
            fathers_cnic: patientData.fathers_cnic || '',
            contact_no: patientData.contact_no || patientData.guardian_phone || '', 
            address: patientData.address || '',
            blood_group: patientData.blood_group || 'O+',
            issue_date: patientData.issue_date || '',
            last_transfusion_date: patientData.last_transfusion_date || '',
            next_transfusion_date: patientData.next_transfusion_date || ''
          });
        }
        
        // Fetch History
        const { data: historyData } = await supabase
          .from('transfusion_history')
          .select('*')
          .eq('patient_id', idStr)
          .order('transfusion_date', { ascending: false });
          
        if (historyData) setHistory(historyData);
        
        setFetching(false);
      };
      loadData();
    }
  }, [idStr, isEditing]);

  const validate = (data: typeof formData) => {
    let errs: Record<string, string> = {};
    if (!data.name?.trim()) errs.name = "Name is required";

    // Strict Pakistani Phone Number format (e.g. 03001234567 or 0300-1234567 or 0300 1234567)
    const phoneRegex = /^03\d{2}[-\s]?\d{7}$/;
    if (!data.contact_no?.trim()) {
      errs.contact_no = "Contact No is required";
    } else if (!phoneRegex.test(data.contact_no.trim())) {
      errs.contact_no = "Invalid format. Use 11 digit format: 03XX XXXXXXX";
    }

    // Strict CNIC format: 00000-0000000-0
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    if (data.cnic?.trim() && !cnicRegex.test(data.cnic.trim())) {
      errs.cnic = "Invalid CNIC. Exact format required: 00000-0000000-0";
    }
    if (data.fathers_cnic?.trim() && !cnicRegex.test(data.fathers_cnic.trim())) {
      errs.fathers_cnic = "Invalid CNIC. Exact format required: 00000-0000000-0";
    }

    if (!data.address?.trim()) errs.address = "Address is required";
    return errs;
  };

  const handleDelete = async () => {
    if (!window.confirm('CRITICAL ALERT:\nAre you sure you want to completely delete this patient? This action cannot be undone and will permanently wipe their history.')) return;
    setLoading(true);
    const { error } = await supabase.from('patients').delete().eq('id', idStr);
    setLoading(false);
    if (error) {
      alert(`Error deleting record: ${error.message}`);
    } else {
      router.push('/patients');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const newData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newData);
    
    if (isSubmitted) {
      setErrors(validate(newData));
    } else {
      const fieldError = validate(newData)[e.target.name];
      setErrors(prev => ({ ...prev, [e.target.name]: fieldError || '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    
    const errs = validate(formData);
    const hasErrors = Object.values(errs).some(msg => msg !== '');
    if (hasErrors) {
      setErrors(errs);
      return;
    }

    if (isEditing) {
      if (!window.confirm('Are you sure you want to edit this patient record?')) return;
    }

    setLoading(true);
    
    const payload = { 
      name: formData.name,
      fathers_name: formData.fathers_name,
      cnic: formData.cnic,
      fathers_cnic: formData.fathers_cnic,
      contact_no: formData.contact_no,
      address: formData.address,
      blood_group: formData.blood_group,
      issue_date: formData.issue_date || null,
      last_transfusion_date: formData.last_transfusion_date || null,
      next_transfusion_date: formData.next_transfusion_date || null
    };

    let error;
    if (isEditing) {
      const { error: updateError } = await supabase.from('patients').update(payload).eq('id', idStr);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('patients').insert([payload]);
      error = insertError;
    }
    
    setLoading(false);
    
    if (error) {
      alert(`Database Error: Make sure your Supabase schema is updated to match the new fields!\n\n${error.message}`);
    } else {
      router.push('/patients');
    }
  };

  if (fetching) return <div className="p-12 text-center text-secondary">Loading...</div>;

  return (
    <main className="max-w-4xl mx-auto p-6 pt-12 space-y-8">
      <Link href="/patients" className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors font-medium">
        <ArrowLeft size={20} /> Back to Directory
      </Link>
      
      <div className="bg-surface-lowest shadow-[0_4px_24px_rgba(26,28,28,0.04)] rounded-tl-[2rem] rounded-r-xl rounded-bl-xl p-8 md:p-10">
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-tertiary-container p-4 rounded-xl text-tertiary">
              {isEditing ? <Save size={28} /> : <Users size={28} />}
            </div>
            <div>
              <h1 className="text-display-sm md:text-3xl font-display font-medium text-on-surfacemain">
                {isEditing ? 'Patient Profile' : 'Add New Patient'}
              </h1>
              <p className="text-secondary text-lg mt-1 font-medium">
                {isEditing ? 'Manage patient data and history' : 'Register a new patient record'}
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Name</label>
              <input name="name" value={formData.name} onChange={handleChange}
                className={`w-full bg-surface-container rounded-xl p-4 focus:outline-none transition-colors border-transparent placeholder:text-secondary/50 text-on-surfacemain ${errors.name ? 'ring-2 ring-tertiary bg-tertiary-container/30' : 'focus:bg-primary-fixed ring-0'}`}
                placeholder="Full Name" />
              {errors.name && <p className="text-tertiary text-xs font-semibold">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Father's Name</label>
              <input name="fathers_name" value={formData.fathers_name} onChange={handleChange}
                className="w-full bg-surface-container rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 placeholder:text-secondary/50 text-on-surfacemain"
                placeholder="Father's Name" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">CNIC</label>
              <input name="cnic" value={formData.cnic} onChange={handleChange}
                className={`w-full bg-surface-container rounded-xl p-4 focus:outline-none transition-colors border-transparent placeholder:text-secondary/50 text-on-surfacemain ${errors.cnic ? 'ring-2 ring-tertiary bg-tertiary-container/30' : 'focus:bg-primary-fixed ring-0'}`}
                placeholder="Patient CNIC" />
              {errors.cnic && <p className="text-tertiary text-xs font-semibold">{errors.cnic}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Father's CNIC</label>
              <input name="fathers_cnic" value={formData.fathers_cnic} onChange={handleChange}
                className={`w-full bg-surface-container rounded-xl p-4 focus:outline-none transition-colors border-transparent placeholder:text-secondary/50 text-on-surfacemain ${errors.fathers_cnic ? 'ring-2 ring-tertiary bg-tertiary-container/30' : 'focus:bg-primary-fixed ring-0'}`}
                placeholder="Father's CNIC" />
              {errors.fathers_cnic && <p className="text-tertiary text-xs font-semibold">{errors.fathers_cnic}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Contact No</label>
              <input name="contact_no" value={formData.contact_no} onChange={handleChange}
                className={`w-full bg-surface-container rounded-xl p-4 focus:outline-none transition-colors border-transparent placeholder:text-secondary/50 text-on-surfacemain ${errors.contact_no ? 'ring-2 ring-tertiary bg-tertiary-container/30' : 'focus:bg-primary-fixed ring-0'}`}
                placeholder="e.g. 0300 0000000" />
              {errors.contact_no && <p className="text-tertiary text-xs font-semibold">{errors.contact_no}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Blood Group</label>
              <select name="blood_group" value={formData.blood_group} onChange={handleChange}
                className="w-full bg-surface-container rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 appearance-none text-on-surfacemain hide-arrow">
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>O+</option><option>O-</option>
                <option>AB+</option><option>AB-</option>
              </select>
            </div>
             <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Issue Date</label>
              <input type="date" name="issue_date" value={formData.issue_date} onChange={handleChange}
                className="w-full bg-surface-container rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 text-on-surfacemain" />
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 bg-surface-main p-6 rounded-2xl">
             <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Last Transfusion Date</label>
              <input type="date" name="last_transfusion_date" value={formData.last_transfusion_date} onChange={handleChange}
                className="w-full bg-surface-container rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 text-on-surfacemain" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Next Transfusion Date</label>
              <input type="date" name="next_transfusion_date" value={formData.next_transfusion_date} onChange={handleChange}
                className="w-full bg-surface-container rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 text-on-surfacemain" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surfacemain">Address</label>
            <input name="address" value={formData.address} onChange={handleChange}
              className={`w-full bg-surface-container rounded-xl p-4 focus:outline-none transition-colors border-transparent placeholder:text-secondary/50 text-on-surfacemain ${errors.address ? 'ring-2 ring-tertiary bg-tertiary-container/30' : 'focus:bg-primary-fixed ring-0'}`}
              placeholder="Full address" />
            {errors.address && <p className="text-tertiary text-xs font-semibold">{errors.address}</p>}
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-end gap-4">
            {isEditing && (
              <button 
                disabled={loading} 
                type="button"
                onClick={handleDelete}
                className="w-full sm:w-auto px-6 py-4 bg-tertiary-container/30 text-tertiary rounded-full font-semibold hover:bg-tertiary-container transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 size={20} /> Delete Patient
              </button>
            )}
            <button disabled={loading} type="submit"
              className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-full font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[200px]">
              {loading ? 'Saving...' : (isEditing ? 'Update Patient' : 'Save Patient')}
            </button>
          </div>
        </form>
      </div>

      {isEditing && (
        <div className="bg-surface-lowest shadow-[0_4px_24px_rgba(26,28,28,0.04)] rounded-2xl p-8 md:p-10 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-tertiary" size={24} />
            <h2 className="text-2xl font-bold text-on-surfacemain">Transfusion History</h2>
          </div>
          
          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-surface-container text-secondary text-sm">
                    <th className="pb-3 pr-4 font-semibold">Date</th>
                    <th className="pb-3 pr-4 font-semibold">Blood Bag ID</th>
                    <th className="pb-3 font-semibold">Donor Used</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => (
                    <tr key={record.id} className="border-b border-surface-container hover:bg-surface-main/50 transition-colors">
                      <td className="py-4 pr-4 font-medium">{record.transfusion_date || 'N/A'}</td>
                      <td className="py-4 pr-4 text-tertiary font-medium">{record.blood_bag_id || '-'}</td>
                      <td className="py-4 font-medium">{record.donor_used || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-secondary bg-surface-main rounded-xl">
              <p className="font-medium">No transfusion history recorded yet.</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
