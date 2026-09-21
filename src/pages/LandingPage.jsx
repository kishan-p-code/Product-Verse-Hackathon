import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Compass, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import nightSky from '../assets/night-sky.png';

const EMPTY_TIMETABLE = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] };

export default function LandingPage() {
  const navigate = useNavigate();
  const { startStudent, startAdmin } = useApp();
  const [mode, setMode] = useState('student');
  const [profile, setProfile] = useState({ name: '', college: '', course: '', age: '', semester: '' });
  const [classInfo, setClassInfo] = useState({ day: 'Monday', subject: '', time: '', room: '' });
  const [timetable, setTimetable] = useState(EMPTY_TIMETABLE);

  const addClass = () => {
    if (!classInfo.subject.trim() || !classInfo.time.trim()) return;
    setTimetable((current) => ({
      ...current,
      [classInfo.day]: [...current[classInfo.day], { ...classInfo, id: Date.now(), name: classInfo.subject, code: '' }]
    }));
    setClassInfo((current) => ({ ...current, subject: '', time: '', room: '' }));
  };

  const continueAsStudent = (event) => {
    event.preventDefault();
    startStudent(profile, timetable);
    navigate('/dashboard');
  };

  const fields = [
    ['name', 'Your full name', 'e.g. Swaraj Shah'],
    ['college', 'University / College', 'e.g. SIWS College'],
    ['course', 'Branch / Program', 'e.g. Computer Science'],
    ['age', 'Age', 'e.g. 19'],
    ['semester', 'Semester', 'e.g. Semester 5']
  ];

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#020617] px-4 py-6 text-white sm:px-6">
      <img src={nightSky} alt="Star-filled night sky" className="absolute inset-0 h-full w-full object-cover opacity-75" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/45 via-[#090f2b]/65 to-[#020617]/95" />
      <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-indigo-500/25 blur-[120px]" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-[120px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center gap-3 py-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-lg backdrop-blur"><Compass className="h-5 w-5 text-sky-200" /></div>
        <div><p className="text-lg font-bold tracking-tight">UniPilot</p><p className="text-[10px] uppercase tracking-[0.2em] text-sky-200/70">Student command centre</p></div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-88px)] max-w-6xl items-center justify-center py-10">
        <div className="w-full max-w-2xl rounded-[2rem] border border-white/20 bg-slate-950/60 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">
          <div className="mx-auto mb-6 flex w-fit rounded-2xl border border-white/15 bg-white/5 p-1.5">
            <button onClick={() => setMode('student')} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${mode === 'student' ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-300 hover:text-white'}`}><GraduationCap className="h-4 w-4" /> Student</button>
            <button onClick={() => setMode('admin')} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${mode === 'admin' ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-300 hover:text-white'}`}><ShieldCheck className="h-4 w-4" /> Admin</button>
          </div>

          {mode === 'student' ? (
            <form onSubmit={continueAsStudent}>
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-sky-200/30 bg-sky-200/10 text-sky-100 shadow-lg shadow-sky-950/50"><Sparkles className="h-6 w-6" /></div>
                <h1 className="text-2xl font-bold sm:text-3xl">Set up your study space</h1>
                
              </div>
              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fields.map(([key, label, placeholder]) => <label key={key} className={key === 'name' ? 'sm:col-span-2' : ''}><span className="mb-1.5 block text-xs font-medium text-slate-200">{label}</span><input required type={key === 'age' ? 'number' : 'text'} min={key === 'age' ? '1' : undefined} value={profile[key]} onChange={(e) => setProfile({ ...profile, [key]: e.target.value })} placeholder={placeholder} className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-300/70 focus:ring-2 focus:ring-sky-300/15" /></label>)}
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-3 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-sky-200" /><h2 className="text-sm font-semibold">Add your timetable</h2><span className="text-xs text-slate-400">optional</span></div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                  <select value={classInfo.day} onChange={(e) => setClassInfo({ ...classInfo, day: e.target.value })} className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-xs text-white outline-none">{Object.keys(EMPTY_TIMETABLE).map((day) => <option key={day}>{day}</option>)}</select>
                  <input value={classInfo.subject} onChange={(e) => setClassInfo({ ...classInfo, subject: e.target.value })} placeholder="Subject" className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-500" />
                  <input value={classInfo.time} onChange={(e) => setClassInfo({ ...classInfo, time: e.target.value })} placeholder="10:00 - 11:00" className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-500" />
                  <button type="button" onClick={addClass} className="rounded-xl border border-sky-200/25 bg-sky-200/10 px-3 py-2.5 text-xs font-semibold text-sky-100 hover:bg-sky-200/20">Add class</button>
                </div>
                {Object.values(timetable).flat().length > 0 && <p className="mt-3 text-xs text-sky-100/80">{Object.values(timetable).flat().length} class{Object.values(timetable).flat().length !== 1 ? 'es' : ''} added to your timetable.</p>}
              </div>
              <button type="submit" className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 px-5 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-sky-950/40 transition hover:brightness-110">Open my dashboard <ArrowRight className="h-4 w-4" /></button>
            </form>
          ) : (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-200/30 bg-violet-300/10 text-violet-100 shadow-lg shadow-violet-950/40"><ShieldCheck className="h-7 w-7" /></div>
              <h1 className="text-2xl font-bold">Institutional Admin Portal</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-300">
                Direct access to manage all enrolled students, inspect full live dashboards, and exercise authoritative attendance recording.
              </p>
              <button onClick={() => { startAdmin(); navigate('/admin'); }} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110">
                <span>Enter Admin Portal</span> <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
