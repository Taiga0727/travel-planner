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
import { Plus, Clock, Link as LinkIcon, Trash2, Loader2, Heart, Pencil } from "lucide-react"; // อย่าลืมเช็คว่ามี Heart ไหม
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

  const [formData, setFormData] = useState({
    title: "", description: "", start_time: "09:00", end_time: "10:00",
    image_url: "", link: "", color: "bg-red-950/40 text-red-300 border-red-500", 
  });

  // 🟢 แก้ไขจุดที่ 1: ตั้งค่า Sensor ให้รอขยับเมาส์ 8px ก่อนค่อยลาก (ทำให้กดปุ่มได้)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // ต้องลากเกิน 8px ถึงจะเริ่ม drag
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
    // console.log("Edit clicked", item.id); // เอาไว้เช็ค
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
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col md:flex-row font-sans selection:bg-red-500/30">
      <style>{customStyles}</style>

      {/* --- SIDEBAR --- */}
      <aside className="w-full md:w-80 p-6 flex flex-col gap-6 fixed md:relative h-auto md:h-screen z-20 border-r border-red-900/30 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-red-200 to-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
            <Heart className="w-6 h-6 text-red-500 fill-red-500 animate-pulse" /> นิ้งกล้ากล้านิ้ง
          </h1>
          <p className="text-red-400/60 text-xs uppercase tracking-widest mt-2 font-bold">System Online • v.2.1</p>
        </div>
        
        <div className="p-4 rounded-xl glass-tech shadow-[0_0_30px_-10px_rgba(239,68,68,0.15)]">
          <Calendar 
            mode="single" selected={date} onSelect={setDate} 
            className="rounded-md text-zinc-300"
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
          <DialogContent className="sm:max-w-[425px] bg-[#0f0f0f]/95 border border-red-500/50 backdrop-blur-2xl text-zinc-100 z-50">
            <DialogHeader>
              <DialogTitle className="text-red-400 uppercase tracking-widest">
                {editingId ? "Edit Mission" : "Initialize Task"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-[#050505] to-black">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-end mb-12 border-b border-red-500/20 pb-6">
            <div>
              <h2 className="text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] uppercase">
                {date ? format(date, "EEEE, d MMM") : "Select Date"}
              </h2>
              <p className="text-red-400 mt-2 font-mono text-sm tracking-widest flex items-center gap-2">
                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                 {activities.length} MISSIONS ACTIVE
              </p>
            </div>
          </div>

          <div className="space-y-12 relative ml-3 md:ml-8 pl-10 md:pl-16 pb-20">
            <div className="absolute left-[3px] md:left-[3px] top-2 bottom-0 w-[2px] flowing-line z-0"></div>

            {/* DND CONTEXT WRAPPER */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={activities.map(a => a.id)} strategy={verticalListSortingStrategy}>
                
                {loading ? (
                   <div className="text-red-500 flex items-center gap-3 text-lg animate-pulse"><Loader2 className="animate-spin h-6 w-6"/> Synchronizing data...</div>
                ) : activities.length === 0 ? (
                   <div className="text-zinc-600 font-mono border border-dashed border-zinc-800 p-8 rounded-xl text-center">NO DATA DETECTED.</div>
                ) : (
                  activities.map((item) => (
                    <SortableItem key={item.id} id={item.id} className="relative group">
                      
                      <div className={`absolute -left-[45px] md:-left-[69px] top-6 w-5 h-5 rounded-full bg-[#0a0a0a] border-2 border-red-500 z-10 shadow-[0_0_15px_rgba(220,38,38,0.8)] group-hover:scale-125 transition-transform duration-300`}>
                         <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-ping"></div>
                      </div>
                      
                      <Card className={`glass-tech neon-glow transition-all duration-300 hover:-translate-y-2 group overflow-hidden relative border-l-4 ${item.color.split(" ")[2].replace("border-", "border-l-")}`}>
                        <CardContent className="p-0 flex flex-col sm:flex-row relative z-10">
                          
                          <div className="p-6 sm:w-40 flex flex-row sm:flex-col items-center sm:justify-center gap-2 text-zinc-400 font-mono border-b sm:border-b-0 sm:border-r border-red-500/20 bg-black/40 cursor-grab active:cursor-grabbing">
                            <Clock className="w-5 h-5 text-red-500" />
                            <span className="text-lg font-bold text-white tracking-wider">{item.start_time.slice(0,5)}</span>
                            <span className="text-sm text-zinc-500">{item.end_time.slice(0,5)}</span>
                          </div>

                          <div className="p-6 flex-1 relative">
                            {/* 🟢 แก้ไขจุดที่ 2: เพิ่ม z-index 50 ให้ปุ่มอยู่เหนือเลเยอร์การลาก และใช้ pointer-events-auto */}
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 z-50">
                                <button 
                                  // ใส่ onPointerDownCapture เพื่อหยุด Event การลากไม่ให้ทำงานเมื่อกดปุ่มนี้
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                      e.stopPropagation(); // กันไม่ให้ไปตีกับ Drag
                                      handleEdit(item);
                                  }}
                                  className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer border border-transparent hover:border-white/20 bg-black/50 backdrop-blur-sm"
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button 
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(item.id);
                                  }}
                                  className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors cursor-pointer border border-transparent hover:border-red-500/20 bg-black/50 backdrop-blur-sm"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3 pr-16">
                              <Badge variant="outline" className={`${item.color} backdrop-blur-md px-3 py-1 text-xs uppercase tracking-widest font-bold shadow-sm border`}>
                                {item.title}
                              </Badge>
                            </div>
                            
                            <p className="text-zinc-300 mb-5 text-sm leading-relaxed whitespace-pre-wrap font-light tracking-wide">
                              {item.description}
                            </p>

                            {item.image_url && (
                              <div className="mb-4 rounded-lg overflow-hidden h-60 w-full relative border border-red-500/30 group-hover:border-red-400/80 transition-colors shadow-lg">
                                 <img src={item.image_url} alt={item.title} className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700" />
                              </div>
                            )}

                            {item.link && (
                              <a href={item.link} target="_blank" rel="noreferrer" 
                                 // กันไม่ให้กดลิงก์แล้วกลายเป็นการลาก
                                 onPointerDown={(e) => e.stopPropagation()}
                                 className="inline-flex items-center text-xs text-red-300 hover:text-white hover:bg-red-600 font-bold px-5 py-2 rounded-full transition-all duration-300 border border-red-500/40 hover:border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.1)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer"
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
      
      <div className="fixed inset-0 pointer-events-none z-0 opacity-20" style={{ backgroundImage: 'linear-gradient(rgba(220, 38, 38, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(220, 38, 38, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
    </div>
  );
}