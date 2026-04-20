'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Save } from 'lucide-react';

export default function DonorFormPage() {
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
    age: '',
    gender: 'Male',
    contact_no: '',
    cnic: '',
    address: '',
    blood_group: 'O+',
    weight: '',
    last_donation_date: '',
    next_eligible_date: ''
  });

  useEffect(() => {
    if (isEditing) {
      const loadDonor = async () => {
        const { data, error } = await supabase.from('donors').select('*').eq('id', idStr).single();
        if (data) {
          setFormData({
            name: data.name || '',
            fathers_name: data.fathers_name || '',
            age: data.age?.toString() || '',
            gender: data.gender || 'Male',
            contact_no: data.contact_no || data.phone || '', // fallback to old field for backwards compat if needed
            cnic: data.cnic || '',
            address: data.address || '',
            blood_group: data.blood_group || 'O+',
            weight: data.weight?.toString() || '',
            last_donation_date: data.last_donation_date || '',
            next_eligible_date: data.next_eligible_date || ''
          });
        }
        setFetching(false);
      };
      loadDonor();
    }
  }, [idStr, isEditing]);

  const validate = (data: typeof formData) => {
    let errs: Record<string, string> = {};
    if (!data.name?.trim()) errs.name = "Name is required";
    if (!data.contact_no?.trim()) errs.contact_no = "Contact No is required";
    if (data.age && (parseInt(data.age) <= 0 || parseInt(data.age) > 120)) errs.age = "Enter a valid age";
    if (data.weight && (parseFloat(data.weight) <= 0)) errs.weight = "Enter a valid weight";
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
      if (!window.confirm('Are you sure you want to edit this donor record?')) return;
    }

    setLoading(true);
    
    const payload = { 
      name: formData.name,
      fathers_name: formData.fathers_name,
      age: parseInt(formData.age) || null,
      gender: formData.gender,
      contact_no: formData.contact_no,
      cnic: formData.cnic,
      address: formData.address,
      blood_group: formData.blood_group,
      weight: parseFloat(formData.weight) || null,
      last_donation_date: formData.last_donation_date || null,
      next_eligible_date: formData.next_eligible_date || null
    };

    let error;
    if (isEditing) {
      const { error: updateError } = await supabase.from('donors').update(payload).eq('id', idStr);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('donors').insert([payload]);
      error = insertError;
    }
    
    setLoading(false);
    
    if (error) {
      alert(`Database Error: Make sure your Supabase schema is updated to match the new fields!\n\n${error.message}`);
    } else {
      router.push('/donors');
    }
  };

  if (fetching) return <div className="p-12 text-center text-secondary">Loading...</div>;

  return (
    <main className="max-w-4xl mx-auto p-6 pt-12">
      <Link href="/donors" className="inline-flex items-center gap-2 text-secondary mb-8 hover:text-primary transition-colors font-medium">
        <ArrowLeft size={20} /> Back to Directory
      </Link>
      
      <div className="bg-surface-lowest shadow-[0_4px_24px_rgba(26,28,28,0.04)] rounded-tl-[2rem] rounded-r-xl rounded-bl-xl p-8 md:p-10">
        <header className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-primary-fixed p-4 rounded-xl text-primary">
               {isEditing ? <Save size={28} /> : <UserPlus size={28} />}
            </div>
            <div>
              <h1 className="text-display-sm md:text-3xl font-display font-medium text-on-surfacemain">
                {isEditing ? 'Edit Donor' : 'Add New Donor'}
              </h1>
              <p className="text-secondary text-lg mt-1 font-medium">
                {isEditing ? 'Update exact donor data' : 'Register a new blood donor'}
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
              <label className="text-sm font-semibold text-on-surfacemain">Contact No</label>
              <input name="contact_no" value={formData.contact_no} onChange={handleChange}
                className={`w-full bg-surface-container rounded-xl p-4 focus:outline-none transition-colors border-transparent placeholder:text-secondary/50 text-on-surfacemain ${errors.contact_no ? 'ring-2 ring-tertiary bg-tertiary-container/30' : 'focus:bg-primary-fixed ring-0'}`}
                placeholder="e.g. 0300 0000000" />
              {errors.contact_no && <p className="text-tertiary text-xs font-semibold">{errors.contact_no}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">CNIC</label>
              <input name="cnic" value={formData.cnic} onChange={handleChange}
                className="w-full bg-surface-container rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 placeholder:text-secondary/50 text-on-surfacemain"
                placeholder="e.g. 00000-0000000-0" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
                placeholder="Years" />
              {errors.age && <p className="text-tertiary text-xs font-semibold">{errors.age}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange}
                className="w-full bg-surface-container rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 appearance-none text-on-surfacemain">
                <option>Male</option><option>Female</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Weight (kg)</label>
              <input type="number" name="weight" step="0.1" value={formData.weight} onChange={handleChange}
                className={`w-full bg-surface-container rounded-xl p-4 focus:outline-none transition-colors border-transparent placeholder:text-secondary/50 text-on-surfacemain ${errors.weight ? 'ring-2 ring-tertiary bg-tertiary-container/30' : 'focus:bg-primary-fixed ring-0'}`}
                placeholder="kg" />
              {errors.weight && <p className="text-tertiary text-xs font-semibold">{errors.weight}</p>}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 bg-surface-main p-6 rounded-2xl">
             <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Last Donation Date</label>
              <input type="date" name="last_donation_date" value={formData.last_donation_date} onChange={handleChange}
                className="w-full bg-surface-container rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 text-on-surfacemain" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surfacemain">Next Eligible Date</label>
              <input type="date" name="next_eligible_date" value={formData.next_eligible_date} onChange={handleChange}
                className="w-full bg-surface-container rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 text-on-surfacemain" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-on-surfacemain">Address</label>
            <input name="address" value={formData.address} onChange={handleChange}
              className={`w-full bg-surface-container rounded-xl p-4 focus:outline-none transition-colors border-transparent placeholder:text-secondary/50 text-on-surfacemain ${errors.address ? 'ring-2 ring-tertiary bg-tertiary-container/30' : 'focus:bg-primary-fixed ring-0'}`}
              placeholder="Full address details" />
            {errors.address && <p className="text-tertiary text-xs font-semibold">{errors.address}</p>}
          </div>

          <div className="pt-6 flex flex-col items-end gap-2">
            <button disabled={loading} type="submit"
              className="px-10 py-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-full font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[200px]">
              {loading ? 'Saving...' : (isEditing ? 'Update Donor' : 'Save Donor')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
