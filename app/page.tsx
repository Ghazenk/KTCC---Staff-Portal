import Link from "next/link";
import { UserPlus, Search, Droplets, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto p-6 pt-16">
      <header className="mb-12">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-display font-black tracking-tighter text-on-surfacemain leading-tight mb-2">
          KTCC
        </h1>
        <p className="text-xl sm:text-2xl mt-3 font-bold bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
          The Clinical Vitality portal!
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Donors Section */}
        <section className="bg-surface-lowest shadow-[0_4px_24px_rgba(26,28,28,0.04)] rounded-tl-[1.5rem] rounded-r-lg rounded-bl-lg p-8 flex flex-col items-start gap-6 border-transparent">
          <div className="bg-primary-fixed p-4 rounded-xl text-primary">
            <Droplets size={32} />
          </div>
          <div>
            <h2 className="font-display text-title-lg text-2xl font-semibold text-on-surfacemain mb-2">Blood Donors</h2>
            <p className="text-secondary mb-6 leading-relaxed">
              Digitize records for people donating blood. Please ensure records are accurate.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full mt-auto">
            <Link 
              href="/donors/new"
              className="flex-1 text-center bg-gradient-to-r from-primary to-primary-container text-white py-3 rounded-full font-semibold shadow-sm hover:opacity-90 transition-opacity"
            >
              Add Donor
            </Link>
            <Link 
              href="/donors"
              className="flex-1 flex justify-center items-center gap-2 text-center bg-surface-high text-secondary rounded-full py-3 hover:bg-[#e0e0e0] transition-colors"
            >
              <Search size={18} /> Search
            </Link>
          </div>
        </section>

        {/* Patients Section */}
        <section className="bg-surface-lowest shadow-[0_4px_24px_rgba(26,28,28,0.04)] rounded-tl-[1.5rem] rounded-r-lg rounded-bl-lg p-8 flex flex-col items-start gap-6 border-transparent">
          <div className="bg-tertiary-container p-4 rounded-xl text-tertiary">
            <Users size={32} />
          </div>
          <div>
            <h2 className="font-display text-title-lg text-2xl font-semibold text-on-surfacemain mb-2">Patients</h2>
            <p className="text-secondary mb-6 leading-relaxed">
              Register individuals seeking treatment and transfusion services.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full mt-auto">
            <Link 
              href="/patients/new"
              className="flex-1 text-center bg-gradient-to-r from-primary to-primary-container text-white py-3 rounded-full font-semibold shadow-sm hover:opacity-90 transition-opacity"
            >
              Add Patient
            </Link>
            <Link 
              href="/patients"
              className="flex-1 flex justify-center items-center gap-2 text-center bg-surface-high text-secondary rounded-full py-3 hover:bg-[#e0e0e0] transition-colors"
            >
              <Search size={18} /> Search
            </Link>
          </div>
        </section>
      </div>
      
      <footer className="mt-16 pb-8 flex flex-col items-center text-center text-secondary">
        <p className="font-semibold text-on-surfacemain">KTCC Staff Portal</p>
        <Link href="/creators" className="mt-4 text-sm font-bold border border-primary/20 bg-primary/5 text-primary px-4 py-2 rounded-full hover:bg-primary/10 transition-colors">
          View Creators &rarr;
        </Link>
      </footer>
    </main>
  );
}
