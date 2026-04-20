'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserPlus, Save, Activity, Trash2 } from 'lucide-react';

export default function DonorFormPage() {
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
    age: '',
    gender: 'Male',
    contact_no: '',
    cnic: '',
    address: '',
    blood_group: 'O+',
    weight: '',
    status: 'Pending',
    last_donation_date: '',
    next_eligible_date: ''
  });

  const [newDonation, setNewDonation] = useState({
    donation_date: new Date().toISOString().split('T')[0],
    blood_bag_id: '',
    vitals_hb: '',
    vitals_bp: '',
    vitals_pulse: '',
    vitals_temp: ''
  });
  const [submittingDonation, setSubmittingDonation] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const loadData = async () => {
        // Fetch Donor
        const { data: donorData } = await supabase.from('donors').select('*').eq('id', idStr).single();
        if (donorData) {
          setFormData({
            name: donorData.name || '',
            fathers_name: donorData.fathers_name || '',
            age: donorData.age?.toString() || '',
            gender: donorData.gender || 'Male',
            contact_no: donorData.contact_no || donorData.phone || '', 
            cnic: donorData.cnic || '',
            address: donorData.address || '',
            blood_group: donorData.blood_group || 'O+',
            weight: donorData.weight?.toString() || '',
            status: donorData.status || 'Pending',
            last_donation_date: donorData.last_donation_date || '',
            next_eligible_date: donorData.next_eligible_date || ''
          });
        }
        
        // Fetch History
        const { data: historyData } = await supabase
          .from('donation_history')
          .select('*')
          .eq('donor_id', idStr)
          .order('donation_date', { ascending: false });
          
        if (historyData) setHistory(historyData);
        setFetching(false);
      };
      loadData();
    }
  }, [idStr, isEditing]);

  // Auto-calculate Next Eligible Date
  useEffect(() => {
    if (formData.last_donation_date) {
      const lastDate = new Date(formData.last_donation_date);
      if (!isNaN(lastDate.getTime())) {
        const monthsToAdd = formData.gender === 'Female' ? 6 : 3;
        lastDate.setMonth(lastDate.getMonth() + monthsToAdd);
        const nextEligibleStr = lastDate.toISOString().split('T')[0];
        if (nextEligibleStr !== formData.next_eligible_date) {
          setFormData(prev => ({ ...prev, next_eligible_date: nextEligibleStr }));
        }
      }
    }
  }, [formData.last_donation_date, formData.gender]);

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

    if (data.age && (parseInt(data.age) <= 0 || parseInt(data.age) > 120)) errs.age = "Enter a valid age";
    if (data.weight && (parseFloat(data.weight) <= 0)) errs.weight = "Enter a valid weight";
    if (!data.address?.trim()) errs.address = "Address is required";
    
    return errs;
  };

  const handleDelete = async () => {
    if (!window.confirm('CRITICAL ALERT:\nAre you sure you want to completely delete this donor? This action cannot be undone and will permanently wipe their history.')) return;
    setLoading(true);
    const { error } = await supabase.from('donors').delete().eq('id', idStr);
    setLoading(false);
    if (error) {
      alert(`Error deleting record: ${error.message}`);
    } else {
      router.push('/donors');
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
      status: formData.status,
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

  const handleNewDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDonation.donation_date) return alert("Donation date is required.");
    
    setSubmittingDonation(true);
    const payload = { ...newDonation, donor_id: idStr };
    const { data, error } = await supabase.from('donation_history').insert([payload]).select().single();
    
    if (error) {
      alert(`Error saving donation: ${error.message}`);
    } else if (data) {
      setHistory(prev => [data, ...prev]);
      setNewDonation({
        donation_date: new Date().toISOString().split('T')[0],
        blood_bag_id: '',
        vitals_hb: '',
        vitals_bp: '',
        vitals_pulse: '',
        vitals_temp: ''
      });
      // Optionally sync this closely with last_donation_date logic
      setFormData(prev => ({ ...prev, last_donation_date: data.donation_date }));
    }
    setSubmittingDonation(false);
  };

  if (fetching) return <div className="p-12 text-center text-secondary">Loading...</div>;

  return (
    <main className="max-w-4xl mx-auto p-6 pt-12 space-y-8">
      <Link href="/donors" className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors font-medium">
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
                {isEditing ? 'Donor Profile' : 'Add New Donor'}
              </h1>
              <p className="text-secondary text-lg mt-1 font-medium">
                {isEditing ? 'Manage donor data and history' : 'Register a new blood donor'}
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
              <label className="text-sm font-semibold text-on-surfacemain">Father&apos;s Name</label>
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
                className={`w-full bg-surface-container rounded-xl p-4 focus:outline-none transition-colors border-transparent placeholder:text-secondary/50 text-on-surfacemain ${errors.cnic ? 'ring-2 ring-tertiary bg-tertiary-container/30' : 'focus:bg-primary-fixed ring-0'}`}
                placeholder="e.g. 00000-0000000-0" />
              {errors.cnic && <p className="text-tertiary text-xs font-semibold">{errors.cnic}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-semibold text-on-surfacemain">Blood Group</label>
              <select name="blood_group" value={formData.blood_group} onChange={handleChange}
                className="w-full bg-surface-container rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 appearance-none text-on-surfacemain">
                <option>A+</option><option>A-</option>
                <option>B+</option><option>B-</option>
                <option>O+</option><option>O-</option>
                <option>AB+</option><option>AB-</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-semibold text-on-surfacemain">Age</label>
              <input type="number" name="age" value={formData.age} onChange={handleChange}
                className={`w-full bg-surface-container rounded-xl p-4 focus:outline-none transition-colors border-transparent placeholder:text-secondary/50 text-on-surfacemain ${errors.age ? 'ring-2 ring-tertiary bg-tertiary-container/30' : 'focus:bg-primary-fixed ring-0'}`}
                placeholder="Years" />
              {errors.age && <p className="text-tertiary text-xs font-semibold">{errors.age}</p>}
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-semibold text-on-surfacemain">Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange}
                className="w-full bg-surface-container rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 appearance-none text-on-surfacemain">
                <option>Male</option><option>Female</option>
              </select>
            </div>
            <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-semibold text-on-surfacemain">Weight (kg)</label>
              <input type="number" name="weight" step="0.1" value={formData.weight} onChange={handleChange}
                className={`w-full bg-surface-container rounded-xl p-4 focus:outline-none transition-colors border-transparent placeholder:text-secondary/50 text-on-surfacemain ${errors.weight ? 'ring-2 ring-tertiary bg-tertiary-container/30' : 'focus:bg-primary-fixed ring-0'}`}
                placeholder="kg" />
              {errors.weight && <p className="text-tertiary text-xs font-semibold">{errors.weight}</p>}
            </div>
             <div className="space-y-2 md:col-span-1">
              <label className="text-sm font-semibold text-on-surfacemain">Status</label>
              <select name="status" value={formData.status} onChange={handleChange}
                className="w-full bg-surface-container text-primary font-semibold rounded-xl p-4 focus:bg-primary-fixed focus:outline-none transition-colors border-transparent ring-0 appearance-none">
                <option value="Pending">Pending</option>
                <option value="Available">Available</option>
                <option value="In Cooldown">In Cooldown</option>
                <option value="Unavailable">Unavailable</option>
              </select>
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

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-end gap-4">
            {isEditing && (
              <button 
                disabled={loading} 
                type="button"
                onClick={handleDelete}
                className="w-full sm:w-auto px-6 py-4 bg-tertiary-container/30 text-tertiary rounded-full font-semibold hover:bg-tertiary-container transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 size={20} /> Delete Donor
              </button>
            )}
            <button disabled={loading} type="submit"
              className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-primary to-primary-container text-white rounded-full font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 min-w-[200px]">
              {loading ? 'Saving...' : (isEditing ? 'Update Donor' : 'Save Donor')}
            </button>
          </div>
        </form>
      </div>

      {isEditing && (
        <div className="bg-surface-lowest shadow-[0_4px_24px_rgba(26,28,28,0.04)] rounded-2xl p-8 md:p-10 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="text-primary" size={24} />
            <h2 className="text-2xl font-bold text-on-surfacemain">Donation History</h2>
          </div>
          
          <form onSubmit={handleNewDonationSubmit} className="bg-surface-main p-6 rounded-xl mb-8 space-y-4">
            <h3 className="font-semibold text-on-surfacemain mb-2">Record New Donation</h3>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="space-y-1 lg:col-span-1">
                <label className="text-xs font-semibold text-secondary">Date</label>
                <input type="date" required value={newDonation.donation_date} onChange={e => setNewDonation({...newDonation, donation_date: e.target.value})}
                  className="w-full bg-surface-container rounded-lg p-3 text-sm focus:outline-none focus:ring-2 ring-primary/20 text-on-surfacemain" />
              </div>
              <div className="space-y-1 lg:col-span-1">
                <label className="text-xs font-semibold text-secondary">Bag ID</label>
                <input type="text" placeholder="Bag ID" value={newDonation.blood_bag_id} onChange={e => setNewDonation({...newDonation, blood_bag_id: e.target.value})}
                  className="w-full bg-surface-container rounded-lg p-3 text-sm focus:outline-none focus:ring-2 ring-primary/20 text-on-surfacemain" />
              </div>
              <div className="space-y-1 lg:col-span-1">
                <label className="text-xs font-semibold text-secondary">HB</label>
                <input type="number" step="0.1" placeholder="HB" value={newDonation.vitals_hb} onChange={e => setNewDonation({...newDonation, vitals_hb: e.target.value})}
                  className="w-full bg-surface-container rounded-lg p-3 text-sm focus:outline-none focus:ring-2 ring-primary/20 text-on-surfacemain" />
              </div>
              <div className="space-y-1 lg:col-span-1">
                <label className="text-xs font-semibold text-secondary">BP</label>
                <input type="text" placeholder="120/80" value={newDonation.vitals_bp} onChange={e => setNewDonation({...newDonation, vitals_bp: e.target.value})}
                  className="w-full bg-surface-container rounded-lg p-3 text-sm focus:outline-none focus:ring-2 ring-primary/20 text-on-surfacemain" />
              </div>
              <div className="space-y-1 lg:col-span-1">
                <label className="text-xs font-semibold text-secondary">Pulse</label>
                <input type="text" placeholder="BPM" value={newDonation.vitals_pulse} onChange={e => setNewDonation({...newDonation, vitals_pulse: e.target.value})}
                  className="w-full bg-surface-container rounded-lg p-3 text-sm focus:outline-none focus:ring-2 ring-primary/20 text-on-surfacemain" />
              </div>
              <div className="space-y-1 lg:col-span-1">
                <label className="text-xs font-semibold text-secondary">Temp</label>
                <input type="text" placeholder="°F/°C" value={newDonation.vitals_temp} onChange={e => setNewDonation({...newDonation, vitals_temp: e.target.value})}
                  className="w-full bg-surface-container rounded-lg p-3 text-sm focus:outline-none focus:ring-2 ring-primary/20 text-on-surfacemain" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button disabled={submittingDonation} type="submit"
                className="px-6 py-2 bg-primary text-white rounded-lg font-semibold shadow-sm hover:opacity-90 disabled:opacity-50 text-sm">
                {submittingDonation ? 'Adding...' : 'Add Record'}
              </button>
            </div>
          </form>

          {history.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-surface-container text-secondary text-sm">
                    <th className="pb-3 pr-4 font-semibold">Date</th>
                    <th className="pb-3 pr-4 font-semibold">Bag ID</th>
                    <th className="pb-3 pr-4 font-semibold">HB</th>
                    <th className="pb-3 pr-4 font-semibold">BP</th>
                    <th className="pb-3 pr-4 font-semibold">Pulse</th>
                    <th className="pb-3 font-semibold">Temp</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((record) => (
                    <tr key={record.id} className="border-b border-surface-container hover:bg-surface-main/50 transition-colors">
                      <td className="py-4 pr-4 font-medium">{record.donation_date || 'N/A'}</td>
                      <td className="py-4 pr-4 text-primary font-medium">{record.blood_bag_id || '-'}</td>
                      <td className="py-4 pr-4">{record.vitals_hb || '-'}</td>
                      <td className="py-4 pr-4">{record.vitals_bp || '-'}</td>
                      <td className="py-4 pr-4">{record.vitals_pulse || '-'}</td>
                      <td className="py-4">{record.vitals_temp || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-secondary bg-surface-main rounded-xl">
              <p className="font-medium">No donation history recorded yet.</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
