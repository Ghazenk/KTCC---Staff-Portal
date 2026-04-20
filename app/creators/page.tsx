import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail, Code } from "lucide-react";

export default function CreatorsPage() {
  const creators = [
    { name: "Ghazen Khalid", email: "1109193@stud.uot.edu.pk", image: "/images/ghazen.jpeg" },
    { name: "Mairaj Javed", email: "1109159@stud.uot.edu.pk", image: "/images/mairaj.jpeg" },
    { name: "Aman", email: "1110325@stud.uot.edu.pk", image: "/images/aman.jpeg" },
    { name: "Meer Miras", email: "1110584@stud.uot.edu.pk", image: "/images/Meer Miras.jpeg" },
  ];

  return (
    <main className="max-w-4xl mx-auto p-6 pt-12">
      <Link href="/" className="inline-flex items-center gap-2 text-secondary mb-8 hover:text-primary transition-colors font-medium">
        <ArrowLeft size={20} /> Back to Dashboard
      </Link>
      
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-primary-fixed p-4 rounded-xl text-primary">
            <Code size={32} />
          </div>
          <div>
            <h1 className="text-4xl sm:text-5xl font-display font-black text-on-surfacemain tracking-tight">
              Project Creators
            </h1>
            <p className="text-secondary text-lg sm:text-xl mt-2 font-bold bg-gradient-to-r from-primary to-primary-container bg-clip-text text-transparent">
              KTCC (Kech Thalassemia Care Center)
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-6">
        {creators.map((creator, idx) => (
          <div key={idx} className="bg-surface-lowest shadow-[0_4px_24px_rgba(26,28,28,0.04)] rounded-tl-[1.5rem] rounded-r-xl rounded-bl-xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 group">
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden shadow-inner bg-surface-container">
                {/* Fallback to standard img tag to safely render mocked image uploads */}
                <Image 
                  src={creator.image} 
                  alt={creator.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-on-surfacemain">{creator.name}</h2>
                <p className="text-secondary font-medium tracking-wide mt-1">Lead Developer</p>
              </div>
            </div>
            <a 
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${creator.email}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-[240px] justify-center items-center gap-2 bg-surface-high text-on-surfacemain hover:bg-primary hover:text-white px-6 py-4 rounded-full font-bold transition-all shadow-sm"
            >
              <Mail size={18} /> {creator.email}
            </a>
          </div>
        ))}
      </div>
      
      <footer className="mt-16 text-center">
        <p className="text-sm font-semibold text-secondary">
          Built for the Clinical Vitality Data Project
        </p>
      </footer>
    </main>
  );
}
