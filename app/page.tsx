"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Clock, Link as LinkIcon, Trash2, Loader2, CalendarDays } from "lucide-react";

// --- TYPE DEFINITIONS ---
interface Activity {
  id: string; title: string; description: string; start_time: string;
  end_time: string; image_url: string; link: string; color: string; date: string;
}

// --- GLASS STYLE CONSTANTS ---
// สไตล์กระจก Apple Glass (พื้นหลังดำโปร่งแสง + เบลอ + ขอบขาวบางๆ)
const glassCardStyle = "bg-zinc-900/40 backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]";
const glassInputStyle = "bg-zinc-800/50 border-white/10 focus-visible:ring-white/20 text-white placeholder:text-zinc-500";

export default function Home() {
  // --- STATE ---
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "", description: "", start_time: "09:00", end_time: "10:00",
    image_url: "", link: "", color: "bg-zinc-800 text-white border-zinc-600", // Default dark theme color
  });

  // --- FETCH DATA ---
  const fetchActivities = async () => {
    if (!date) return;
    setLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("schedule_items")
      .select("*")
      .eq("date", dateStr)
      .order("start_time", { ascending: true });
    if (error) console.error("Error fetching:", error);
    else setActivities(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchActivities(); }, [date]);

  // --- SAVE DATA ---
  const handleSave = async () => {
    if (!date || !formData.title) return;
    setLoading(true);
    const { error } = await supabase.from("schedule_items").insert([{...formData, date: format(date, "yyyy-MM-dd")},]);
    if (error) { alert("Error saving data!"); } 
    else {
      setIsDialogOpen(false);
      setFormData({ title: "", description: "", start_time: "09:00", end_time: "10:00", image_url: "", link: "", color: "bg-zinc-800 text-white border-zinc-600"});
      fetchActivities();
    }
    setLoading(false);
  };

  // --- DELETE DATA ---
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this?")) return;
    const { error } = await supabase.from("schedule_items").delete().eq("id", id);
    if (!error) fetchActivities();
  };

  return (
    // Main Container: พื้นหลังสีดำ พร้อม Gradient เบาๆ เพื่อให้กระจกดูมีมิติ
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 flex flex-col md:flex-row bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-[#0a0a0a] to-black">
      
      {/* --- SIDEBAR (GLASS) --- */}
      <aside className={`w-full md:w-80 p-6 flex flex-col gap-6 fixed md:relative h-auto md:h-screen z-20 ${glassCardStyle} border-r border-white/5`}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6" /> นิ้งกล้ากล้านิ้ง
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Craft your day in style.</p>
        </div>
        
        {/* Calendar Container (Glass within Glass) */}
        <div className={`p-4 rounded-xl ${glassCardStyle} bg-black/20`}>
          <Calendar 
            mode="single" selected={date} onSelect={setDate} 
            className="rounded-md text-zinc-300"
            // ปรับสีปฏิทินให้เข้ากับ Dark Mode
            classNames={{
              day_selected: "bg-white text-black hover:bg-white/90 focus:bg-white",
              day_today: "bg-zinc-800 text-white",
            }}
          />
        </div>

        {/* CREATE DIALOG */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full bg-white text-black hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all hover:scale-[1.02]">
              <Plus className="mr-2 h-4 w-4" /> Add Activity
            </Button>
          </DialogTrigger>
          {/* Dialog Content (Glass Style) */}
          <DialogContent className={`sm:max-w-[425px] ${glassCardStyle} text-zinc-100 border-white/10`}>
            <DialogHeader>
              <DialogTitle>Add New Activity</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Inputs styles for dark mode */}
              <div className="grid gap-2"><Label>Activity Name</Label><Input className={glassInputStyle} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Deep Work" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label>Start</Label><Input type="time" className={glassInputStyle} value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} /></div>
                <div className="grid gap-2"><Label>End</Label><Input type="time" className={glassInputStyle} value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} /></div>
              </div>
              <div className="grid gap-2"><Label>Description</Label><Textarea className={glassInputStyle} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Details..." /></div>
              <div className="grid gap-2"><Label>Image URL</Label><Input className={glassInputStyle} value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." /></div>
              <div className="grid gap-2"><Label>Link</Label><Input className={glassInputStyle} value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} placeholder="https://..." /></div>
              
              {/* Color Select (Dark Mode Friendly) */}
              <div className="grid gap-2"><Label>Tag Style</Label>
                <select className={`flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${glassInputStyle}`} value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})}>
                  {/* ใช้สีแบบ Dark Mode (พื้นหลังใส + ขอบสี + ตัวหนังสือสี) */}
                  <option value="bg-zinc-800/50 text-zinc-300 border-zinc-700">Neutral (Gray)</option>
                  <option value="bg-blue-950/50 text-blue-300 border-blue-800">Work (Blue)</option>
                  <option value="bg-red-950/50 text-red-300 border-red-800">Important (Red)</option>
                  <option value="bg-emerald-950/50 text-emerald-300 border-emerald-800">Personal (Green)</option>
                  <option value="bg-purple-950/50 text-purple-300 border-purple-800">Creative (Purple)</option>
                </select>
              </div>
            </div>
            <Button onClick={handleSave} disabled={loading} className="bg-white text-black hover:bg-white/90">
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Save Activity"}
            </Button>
          </DialogContent>
        </Dialog>
        {/* --- NEW IMAGE AREA (พื้นที่รูปภาพใหม่) --- */}
        {/* ใช้ glassCardStyle เพื่อให้กรอบดูเป็นกระจกเข้ากับธีม */}
        <div className={`mt-6 rounded-xl overflow-hidden relative group ${glassCardStyle} border-white/5`}>
             
             {/* ตัวรูปภาพ (เปลี่ยนลิงก์ src เป็นรูปที่คุณต้องการได้เลย) */}
             <img
               src="/sidebar-bg.jpg" // รูปตัวอย่าง (ภูเขา)
               alt="Sidebar Inspiration"
               // ปรับความสูงที่ h-48 (หรือเปลี่ยนเป็น h-64 ถ้าอยากได้รูปยาวๆ)
               className="w-full h-48 object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-in-out"
             />
             
             {/* เงาดำๆ ด้านล่างรูป เพื่อให้ใส่ข้อความแล้วอ่านง่าย (ถ้าต้องการ) */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>

             {/* ข้อความบนรูป (ถ้าไม่อยากได้ ลบส่วนนี้ทิ้งได้ครับ) */}
             <div className="absolute bottom-4 left-4 right-4">
                <p className="text-white font-bold text-lg drop-shadow-md">Focus on Today.</p>
                <p className="text-zinc-300 text-xs">Make every hour count.</p>
             </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-4xl font-black tracking-tighter text-white drop-shadow-sm">
                {date ? format(date, "EEEE, d MMMM") : "Select a date"}
              </h2>
              <p className="text-zinc-400 mt-2 font-medium">{activities.length} activities scheduled</p>
            </div>
          </div>

          {/* Timeline Container (เส้นแกนกลางสีเข้ม) */}
          <div className="space-y-8 relative border-l border-white/10 ml-3 md:ml-6 pl-8 md:pl-12 pb-10">
            {loading ? (
               <div className="text-zinc-500 flex items-center gap-2"><Loader2 className="animate-spin h-4 w-4"/> Loading schedule...</div>
            ) : activities.length === 0 ? (
               <div className="text-zinc-600 italic">Your canvas is empty. Add an activity to begin.</div>
            ) : (
              activities.map((item) => (
                <div key={item.id} className="relative group perspective-1000">
                  {/* จุดกลมบน Timeline (เรืองแสงตามสีที่เลือก) */}
                  <div className={`absolute -left-[41px] md:-left-[57px] top-5 w-4 h-4 rounded-full border-2 border-[#0a0a0a] shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all group-hover:scale-125 ${item.color.split(" ")[0].replace("/50","")}`}></div>
                  
                  {/* ACTIVITY CARD (GLASS!) */}
                  <Card className={`${glassCardStyle} border-none transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] group overflow-hidden`}>
                    <CardContent className="p-0 flex flex-col sm:flex-row">
                      
                      {/* Time Section */}
                      <div className="p-5 sm:w-36 flex flex-row sm:flex-col items-center sm:justify-center gap-2 text-zinc-400 font-medium border-b sm:border-b-0 sm:border-r border-white/5 bg-black/20">
                        <Clock className="w-4 h-4 text-zinc-500" />
                        <span className="text-sm text-center tracking-wider">{item.start_time.slice(0,5)}<br className="hidden sm:block"/> - <br className="hidden sm:block"/>{item.end_time.slice(0,5)}</span>
                      </div>

                      {/* Content Section */}
                      <div className="p-5 flex-1 relative">
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="absolute top-3 right-3 p-2 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex justify-between items-start mb-3 pr-8">
                          {/* Glass Badge */}
                          <Badge variant="outline" className={`${item.color} backdrop-blur-sm px-3 py-1 text-xs uppercase tracking-wider font-bold shadow-sm`}>
                            {item.title}
                          </Badge>
                        </div>
                        
                        <p className="text-zinc-300 mb-4 text-sm leading-relaxed whitespace-pre-wrap font-light">
                          {item.description}
                        </p>

                        {item.image_url && (
                          <div className="mb-4 rounded-lg overflow-hidden h-52 w-full relative border border-white/10 group-hover:border-white/30 transition-colors">
                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                             <img src={item.image_url} alt={item.title} className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700" />
                          </div>
                        )}

                        {item.link && (
                          <a href={item.link} target="_blank" rel="noreferrer" className={`inline-flex items-center text-xs text-white hover:bg-white/20 font-medium px-4 py-2 rounded-full transition-all duration-300 ${glassCardStyle} border-white/20 hover:border-white/40`}>
                            <LinkIcon className="w-3 h-3 mr-2" /> Open Resource
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
      
      {/* Background Noise/Gradient Overlay for more texture */}
      <div className="fixed inset-0 pointer-events-none bg-[url('/noise.svg')] opacity-[0.03] z-0 mix-blend-overlay"></div>
    </div>
  );
}