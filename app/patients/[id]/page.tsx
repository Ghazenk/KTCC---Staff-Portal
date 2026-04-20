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
    guardian_phone: '',
    blood_group: 'O+',
    age: '',
    gender: 'Male',
    address: '',
    notes: '',
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
            guardian_phone: data.guardian_phone || '',
            blood_group: data.blood_group || 'O+',
            age: data.age?.toString() || '',
            gender: data.gender || 'Male',
            address: data.address || '',
            notes: data.notes || '',
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
    if (!data.name?.trim()) errs.name = "Full Name is required";
    if (!data.guardian_phone?.trim()) errs.guardian_phone = "Guardian phone is required";
    if (data.age && (parseInt(data.age) <= 0 || parseInt(data.age) > 120)) errs.age = "Enter a valid age";
    if (!data.address?.trim()) errs.address = "Address is required";
    return errs;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      if (!window.confirm('Are you sure you want to edit this record?')) return;
    }

    setLoading(true);
    
    const payload = { 
      ...formData, 
      age: parseInt(formData.age) || null,
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
      alert(error.message);
    } else {
      router.push('/patients');
    }
  };

  if (fetching) return <div className="p-12 text-center text-secondary">Loading...</div>;

  return (
    <main className="max-w-3xl mx-auto p-6 pt-12">
      <Link href="/patients" className="inline-flex items-center gap-2 text-secondary mb-8 hover:text-primary transition-colors">
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
                {isEditing ? 'Update existing patient details' : 'Register a new patient'}
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Full Name</label>
              <input name="name" value={formData.name} onChange={handleChange}
                className={`w-full bg-surface-container rounded-xl p-4 focus:outline-none transition-colors border-transparent placeholder:text-secondary/50 text-on-surfacemain ${errors.name ? 'ring-2 ring-tertiary bg-tertiary-container/30' : 'focus:bg-primary-fixed ring-0'}`}
                placeholder="Enter full name" />
              {errors.name && <p className="text-tertiary text-xs font-semibold">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Guardian Phone</label>
              <input name="guardian_phone" value={formData.guardian_phone} onChange={handleChange}
                className={`w-full bg-surface-container rounded-xl p-4 focus:outline-none transition-colors border-transparent placeholder:text-secondary/50 text-on-surfacemain ${errors.guardian_phone ? 'ring-2 ring-tertiary bg-tertiary-container/30' : 'focus:bg-primary-fixed ring-0'}`}
                placeholder="e.g. 0300 0000000" />
              {errors.guardian_phone && <p className="text-tertiary text-xs font-semibold">{errors.guardian_phone}</p>}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Blood Group</label>
              <select name="blood_group" value={formData.blood_group} onChange={handleChange}
                className="w-full bg-surface-container rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 appearance-none text-on-surfacemain">
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>O+</option><option>O-</option>
                <option>AB+</option><option>AB-</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Age</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange}
                className={`w-full bg-surface-container rounded-xl p-4 focus:outline-none transition-colors border-transparent placeholder:text-secondary/50 text-on-surfacemain ${errors.age ? 'ring-2 ring-tertiary bg-tertiary-container/30' : 'focus:bg-primary-fixed ring-0'}`}
                placeholder="10" />
              {errors.age && <p className="text-tertiary text-xs font-semibold">{errors.age}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange}
                className="w-full bg-surface-container rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 appearance-none text-on-surfacemain">
                <option>Male</option><option>Female</option>
              </select>
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

          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surfacemain">Notes</label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3}
              className="w-full bg-surface-container rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 placeholder:text-secondary/50 text-on-surfacemain"
              placeholder="Medical urgency, condition details..." />
          </div>

          <div className="pt-6 flex flex-col items-end gap-2">
            <button disabled={loading} type="submit"
              className="px-10 py-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-full font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50">
              {loading ? 'Saving...' : (isEditing ? 'Update Patient' : 'Save Patient')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
