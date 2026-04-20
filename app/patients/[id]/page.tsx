'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Save } from 'lucide-react';

export default function PatientFormPage() {
  const router = useRouter();
  const params = useParams();
  const idStr = params?.id as string;
  const isEditing = idStr && idStr !== 'new';
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
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
      const loadPatient = async () => {
        const { data, error } = await supabase.from('patients').select('*').eq('id', idStr).single();
        if (data) {
          setFormData({
            name: data.name || '',
            fathers_name: data.fathers_name || '',
            cnic: data.cnic || '',
            fathers_cnic: data.fathers_cnic || '',
            contact_no: data.contact_no || data.guardian_phone || '', // backward compat mapping
            address: data.address || '',
            blood_group: data.blood_group || 'O+',
            issue_date: data.issue_date || '',
            last_transfusion_date: data.last_transfusion_date || '',
            next_transfusion_date: data.next_transfusion_date || ''
          });
        }
        setFetching(false);
      };
      loadPatient();
    }
  }, [idStr, isEditing]);

  const validate = (data: typeof formData) => {
    let errs: Record<string, string> = {};
    if (!data.name?.trim()) errs.name = "Name is required";
    if (!data.contact_no?.trim()) errs.contact_no = "Contact No is required";
    if (!data.address?.trim()) errs.address = "Address is required";
    return errs;
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
    <main className="max-w-4xl mx-auto p-6 pt-12">
      <Link href="/patients" className="inline-flex items-center gap-2 text-secondary mb-8 hover:text-primary transition-colors font-medium">
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
                {isEditing ? 'Edit Patient' : 'Add New Patient'}
              </h1>
              <p className="text-secondary text-lg mt-1 font-medium">
                {isEditing ? 'Update exact patient data' : 'Register a new patient record'}
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
                className="w-full bg-surface-container rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 placeholder:text-secondary/50 text-on-surfacemain"
                placeholder="Patient CNIC" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Father's CNIC</label>
              <input name="fathers_cnic" value={formData.fathers_cnic} onChange={handleChange}
                className="w-full bg-surface-container rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 placeholder:text-secondary/50 text-on-surfacemain"
                placeholder="Father's CNIC" />
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

          <div className="pt-6 flex flex-col items-end gap-2">
            <button disabled={loading} type="submit"
              className="px-10 py-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-full font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[200px]">
              {loading ? 'Saving...' : (isEditing ? 'Update Patient' : 'Save Patient')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
