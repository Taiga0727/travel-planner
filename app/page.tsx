"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabaseClient";
// DnD Imports
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "@/components/SortableItem"; 

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// เพิ่ม Menu (ไอคอน 3 ขีด) สำหรับมือถือ
import { Plus, Clock, Link as LinkIcon, Trash2, Loader2, Heart, Pencil, ZoomIn, ZoomOut, X, Menu } from "lucide-react"; 
import { SidebarGallery } from "@/components/SidebarGallery";

// --- CUSTOM STYLES ---
const customStyles = `
  @keyframes flowVertical {
    0% { background-position: 0 0; }
    100% { background-position: 0 40px; }
  }
  .flowing-line {
    background-image: linear-gradient(to bottom, #ef4444 50%, transparent 50%);
    background-size: 2px 20px;
    background-repeat: repeat-y;
    animation: flowVertical 1s linear infinite;
    opacity: 0.6;
  }
  .neon-glow:hover {
    box-shadow: 0 0 15px rgba(239, 68, 68, 0.6), inset 0 0 10px rgba(239, 68, 68, 0.2);
    border-color: #fca5a5;
  }
  .glass-tech {
    background: rgba(10, 10, 10, 0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(239, 68, 68, 0.2);
  }
`;

interface Activity {
  id: string; title: string; description: string; start_time: string;
  end_time: string; image_url: string; link: string; color: string; date: string;
}

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); 

  // --- 📱 MOBILE STATE (สถานะเมนูมือถือ) ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- LIGHTBOX STATES ---
  const [selectedImage, setSelectedImage] = useState<string | null>(null); 
  const [isZoomed, setIsZoomed] = useState(false); 

  const [formData, setFormData] = useState({
    title: "", description: "", start_time: "09:00", end_time: "10:00",
    image_url: "", link: "", color: "bg-red-950/40 text-red-300 border-red-500", 
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, 
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchActivities = async () => {
    if (!date) return;
    setLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("schedule_items")
      .select("*")
      .eq("date", dateStr)
      .order("start_time", { ascending: true });
    
    if (error) console.error(error);
    else setActivities(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchActivities(); }, [date]);

  const handleEdit = (item: Activity) => {
    setEditingId(item.id); 
    setFormData({
      title: item.title,
      description: item.description,
      start_time: item.start_time,
      end_time: item.end_time,
      image_url: item.image_url,
      link: item.link,
      color: item.color,
    });
    setIsDialogOpen(true); 
    setIsMobileMenuOpen(false); // ปิดเมนูมือถือเมื่อกด edit
  };

  const handleSave = async () => {
    if (!date || !formData.title) return;
    setLoading(true);
    const dateStr = format(date, "yyyy-MM-dd");

    if (editingId) {
      const { error } = await supabase
        .from("schedule_items")
        .update({ ...formData })
        .eq("id", editingId);
      if (error) alert("Update failed!");
    } else {
      const { error } = await supabase
        .from("schedule_items")
        .insert([{ ...formData, date: dateStr }]);
      if (error) alert("Save failed!");
    }

    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ title: "", description: "", start_time: "09:00", end_time: "10:00", image_url: "", link: "", color: "bg-red-950/40 text-red-300 border-red-500"});
    fetchActivities();
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this mission?")) return;
    const { error } = await supabase.from("schedule_items").delete().eq("id", id);
    if (!error) fetchActivities();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setActivities((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col md:flex-row font-sans selection:bg-red-500/30 overflow-x-hidden">
      <style>{customStyles}</style>

      {/* --- 📱 MOBILE TOGGLE BUTTON (ปุ่มเมนู ลอยอยู่มุมซ้ายบน) --- */}
      <button 
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-[60] p-3 bg-red-600 rounded-full text-white shadow-[0_0_15px_rgba(220,38,38,0.5)] active:scale-95 transition-all"
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* --- 📱 MOBILE OVERLAY (ฉากหลังมืดเวลาเปิดเมนู) --- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* --- SIDEBAR (ปรับปรุงให้รองรับ Mobile Slide-in) --- */}
      <aside 
        className={`
            fixed md:sticky top-0 h-screen z-50 w-80 p-6 flex flex-col gap-6 
            border-r border-red-900/30 bg-[#0a0a0a]/95 backdrop-blur-xl 
            transition-transform duration-300 ease-in-out
            ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="mt-12 md:mt-0"> {/* เพิ่ม margin top ในมือถือหลบปุ่ม X */}
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-red-200 to-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            <Heart className="w-6 h-6 text-red-500 fill-red-500 animate-pulse" /> อะอะอ่าว
          </h1>
          <p className="text-red-400/60 text-xs uppercase tracking-widest mt-2 font-bold">System Online • v.Mobile</p>
        </div>
        
        {/* Calendar Container */}
        <div className="p-4 rounded-xl glass-tech shadow-[0_0_30px_-10px_rgba(239,68,68,0.15)] overflow-hidden">
          <Calendar 
            mode="single" selected={date} onSelect={(d) => { setDate(d); setIsMobileMenuOpen(false); }} 
            className="rounded-md text-zinc-300 w-full flex justify-center"
            classNames={{
              day_selected: "bg-red-600 text-white hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.6)] font-bold border border-red-400",
              day_today: "text-red-400 font-bold decoration-red-500 underline-offset-4",
            }}
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if(!open) setEditingId(null); 
        }}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full bg-red-600 hover:bg-red-500 text-white border border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] uppercase tracking-wider font-bold">
              <Plus className="mr-2 h-5 w-5" /> New Mission
            </Button>
          </DialogTrigger>
          {/* Dialog แก้ไขให้รองรับมือถือ (z-index สูง) */}
          <DialogContent className="sm:max-w-[425px] w-[95vw] rounded-xl bg-[#0f0f0f]/95 border border-red-500/50 backdrop-blur-2xl text-zinc-100 z-[100]">
            <DialogHeader>
              <DialogTitle className="text-red-400 uppercase tracking-widest">
                {editingId ? "Edit Mission" : "Initialize Task"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2"><Label className="text-red-300/70">Mission Name</Label><Input className="bg-black/50 border-red-500/30" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label className="text-red-300/70">Start</Label><Input type="time" className="bg-black/50 border-red-500/30" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} /></div>
                <div className="grid gap-2"><Label className="text-red-300/70">End</Label><Input type="time" className="bg-black/50 border-red-500/30" value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} /></div>
              </div>
              <div className="grid gap-2"><Label className="text-red-300/70">Details</Label><Textarea className="bg-black/50 border-red-500/30" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
              <div className="grid gap-2"><Label className="text-red-300/70">Image URL</Label><Input className="bg-black/50 border-red-500/30" value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} /></div>
              <div className="grid gap-2"><Label className="text-red-300/70">Link</Label><Input className="bg-black/50 border-red-500/30" value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} /></div>
              <div className="grid gap-2"><Label className="text-red-300/70">Tag Color</Label>
                <select className="flex h-10 w-full rounded-md border border-red-500/30 bg-black/50 px-3 py-2 text-sm text-zinc-300" value={formData.color} onChange={(e) => setFormData({...formData, color: e.target.value})}>
                  <option value="bg-red-950/40 text-red-300 border-red-500">Red</option>
                  <option value="bg-purple-950/40 text-purple-300 border-purple-500">Purple</option>
                  <option value="bg-blue-950/40 text-blue-300 border-blue-500">Blue</option>
                </select>
              </div>
            </div>
            <Button onClick={handleSave} disabled={loading} className="bg-red-600 hover:bg-red-500 text-white font-bold w-full">
              {loading ? <Loader2 className="animate-spin mr-2" /> : (editingId ? "UPDATE DATA" : "CONFIRM MISSION")}
            </Button>
          </DialogContent>
        </Dialog>

        <SidebarGallery />
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 p-4 md:p-10 pt-20 md:pt-10 overflow-y-auto relative z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-[#050505] to-black min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 border-b border-red-500/20 pb-6 gap-4">
            <div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] uppercase">
                {date ? format(date, "EEEE, d MMM") : "Select Date"}
              </h2>
              <p className="text-red-400 mt-2 font-mono text-xs md:text-sm tracking-widest flex items-center gap-2">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                 {activities.length} MISSIONS ACTIVE
              </p>
            </div>
          </div>

          <div className="space-y-12 relative ml-3 md:ml-8 pl-8 md:pl-16 pb-20">
            <div className="absolute left-[3px] md:left-[3px] top-2 bottom-0 w-[2px] flowing-line z-0"></div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={activities.map(a => a.id)} strategy={verticalListSortingStrategy}>
                
                {loading ? (
                   <div className="text-red-500 flex items-center gap-3 text-lg animate-pulse"><Loader2 className="animate-spin h-6 w-6"/> Synchronizing data...</div>
                ) : activities.length === 0 ? (
                   <div className="text-zinc-600 font-mono border border-dashed border-zinc-800 p-8 rounded-xl text-center text-sm">NO DATA DETECTED.</div>
                ) : (
                  activities.map((item) => (
                    <SortableItem key={item.id} id={item.id} className="relative group">
                      
                      <div className={`absolute -left-[43px] md:-left-[69px] top-6 w-5 h-5 rounded-full bg-[#0a0a0a] border-2 border-red-500 z-10 shadow-[0_0_15px_rgba(220,38,38,0.8)]`}>
                         <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-ping"></div>
                      </div>
                      
                      <Card className={`glass-tech neon-glow transition-all duration-300 hover:-translate-y-1 group overflow-hidden relative border-l-4 ${item.color.split(" ")[2].replace("border-", "border-l-")}`}>
                        <CardContent className="p-0 flex flex-col sm:flex-row relative z-10">
                          
                          {/* Mobile: Time Bar แนวนอน / Desktop: แนวตั้ง */}
                          <div className="p-4 sm:p-6 sm:w-40 flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 text-zinc-400 font-mono border-b sm:border-b-0 sm:border-r border-red-500/20 bg-black/40 cursor-grab active:cursor-grabbing">
                             <div className="flex items-center gap-2 sm:flex-col">
                                <Clock className="w-4 h-4 text-red-500" />
                                <span className="text-base sm:text-lg font-bold text-white tracking-wider">{item.start_time.slice(0,5)}</span>
                             </div>
                             <span className="text-xs text-zinc-500 block sm:hidden">-</span>
                             <span className="text-xs text-zinc-500">{item.end_time.slice(0,5)}</span>
                          </div>

                          <div className="p-4 sm:p-6 flex-1 relative">
                            {/* ปุ่ม Edit/Delete ในมือถือแสดงตลอด (ไม่ต้อง Hover) */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 z-50">
                                <button 
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                  className="p-2 text-zinc-400 hover:text-white bg-black/50 rounded-full border border-white/10"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button 
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                  className="p-2 text-zinc-400 hover:text-red-400 bg-black/50 rounded-full border border-white/10"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3 pr-16">
                              <Badge variant="outline" className={`${item.color} backdrop-blur-md px-2 py-1 text-[10px] sm:text-xs uppercase tracking-widest font-bold shadow-sm border`}>
                                {item.title}
                              </Badge>
                            </div>
                            
                            <p className="text-zinc-300 mb-5 text-sm leading-relaxed whitespace-pre-wrap font-light tracking-wide">
                              {item.description}
                            </p>

                            {item.image_url && (
                              <div 
                                className="mb-4 rounded-lg overflow-hidden w-full relative border border-red-500/30 group-hover:border-red-400/80 transition-colors shadow-lg active:scale-[0.98]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedImage(item.image_url);
                                  setIsZoomed(false);
                                }}
                                onPointerDown={(e) => e.stopPropagation()} 
                              >
                                  <img src={item.image_url} alt={item.title} className="w-full h-auto" />
                                  <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white flex items-center gap-1 backdrop-blur-sm">
                                     <ZoomIn className="w-3 h-3" /> View
                                  </div>
                              </div>
                            )}

                            {item.link && (
                              <a href={item.link} target="_blank" rel="noreferrer" 
                                 onPointerDown={(e) => e.stopPropagation()}
                                 className="inline-flex items-center text-[10px] sm:text-xs text-red-300 hover:text-white hover:bg-red-600 font-bold px-4 py-2 rounded-full transition-all duration-300 border border-red-500/40 hover:border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer"
                              >
                                <LinkIcon className="w-3 h-3 mr-2" /> ACCESS DATA
                              </a>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </SortableItem>
                  ))
                )}
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </main>
      
      {/* --- 📸 CUSTOM LIGHTBOX OVERLAY --- */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
            <div className="absolute top-6 right-6 flex gap-3 z-[1000]">
               <button 
                 onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
                 className="p-3 bg-zinc-800/80 rounded-full text-white border border-white/10"
               >
                  {isZoomed ? <ZoomOut className="w-6 h-6" /> : <ZoomIn className="w-6 h-6" />}
               </button>
               <button 
                 onClick={() => setSelectedImage(null)}
                 className="p-3 bg-red-600/80 rounded-full text-white border border-white/10"
               >
                  <X className="w-6 h-6" />
               </button>
            </div>
            <div 
              className={`w-full h-full flex items-center justify-center p-4 transition-all duration-300 ${isZoomed ? 'overflow-auto items-start pt-20' : 'overflow-hidden'}`}
              onClick={(e) => { e.stopPropagation(); setIsZoomed(!isZoomed); }}
            >
                 <img 
                   src={selectedImage} 
                   alt="Full View" 
                   className={`transition-all duration-300 ease-in-out shadow-2xl rounded-sm ${
                     isZoomed ? 'min-w-[150vw] md:min-w-[100vw] h-auto object-contain max-w-none' : 'max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain'
                   }`} 
                 />
            </div>
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none z-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(220, 38, 38, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(220, 38, 38, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
    </div>
  );
}