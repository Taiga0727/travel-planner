"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabaseClient"; // เรียกใช้ไฟล์ที่เราเพิ่งสร้าง
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Clock, Link as LinkIcon, Trash2, MapPin, Loader2 } from "lucide-react";

// กำหนดหน้าตาข้อมูลให้ตรงกับ Database
interface Activity {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  image_url: string;
  link: string;
  color: string;
  date: string;
}

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    start_time: "09:00",
    end_time: "10:00",
    image_url: "",
    link: "",
    color: "bg-blue-100 text-blue-700",
  });

  // ฟังก์ชันดึงข้อมูลจาก Supabase
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

  // ดึงข้อมูลใหม่ทุกครั้งที่เปลี่ยนวัน
  useEffect(() => {
    fetchActivities();
  }, [date]);

  // ฟังก์ชันบันทึกข้อมูล (Save)
  const handleSave = async () => {
    if (!date || !formData.title) return;
    setLoading(true);

    const { error } = await supabase.from("schedule_items").insert([
      {
        ...formData,
        date: format(date, "yyyy-MM-dd"),
      },
    ]);

    if (error) {
      alert("Error saving data!");
      console.error(error);
    } else {
      setIsDialogOpen(false); // ปิด Popup
      setFormData({ // รีเซ็ตฟอร์ม
        title: "", description: "", start_time: "09:00", end_time: "10:00",
        image_url: "", link: "", color: "bg-blue-100 text-blue-700"
      });
      fetchActivities(); // ดึงข้อมูลใหม่ทันที
    }
    setLoading(false);
  };

  // ฟังก์ชันลบข้อมูล (Delete)
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this?")) return;
    
    const { error } = await supabase.from("schedule_items").delete().eq("id", id);
    if (!error) fetchActivities();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-80 bg-slate-50 border-r p-6 flex flex-col gap-6 fixed md:relative h-auto md:h-screen z-10">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">My Planner 📅</h1>
          <p className="text-slate-500 text-sm">Organize your life day by day.</p>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md" />
        </div>

        {/* ปุ่มเปิด Popup สร้างกิจกรรม */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="w-full bg-slate-900 hover:bg-slate-800 shadow-lg">
              <Plus className="mr-2 h-4 w-4" /> Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Activity</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Activity Name</Label>
                <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="e.g. Morning Meeting" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>End Time</Label>
                  <Input type="time" value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Details..." />
              </div>
              <div className="grid gap-2">
                <Label>Image URL (Optional)</Label>
                <Input value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})} placeholder="https://..." />
              </div>
              <div className="grid gap-2">
                <Label>Link / Map (Optional)</Label>
                <Input value={formData.link} onChange={(e) => setFormData({...formData, link: e.target.value})} placeholder="https://maps.google..." />
              </div>
              <div className="grid gap-2">
                <Label>Color Tag</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  value={formData.color}
                  onChange={(e) => setFormData({...formData, color: e.target.value})}
                >
                  <option value="bg-blue-100 text-blue-700">Blue (General)</option>
                  <option value="bg-red-100 text-red-700">Red (Important)</option>
                  <option value="bg-green-100 text-green-700">Green (Relax)</option>
                  <option value="bg-purple-100 text-purple-700">Purple (Work)</option>
                  <option value="bg-orange-100 text-orange-700">Orange (Travel)</option>
                </select>
              </div>
            </div>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Save Activity"}
            </Button>
          </DialogContent>
        </Dialog>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">
                {date ? format(date, "EEEE, d MMMM yyyy") : "Select a date"}
              </h2>
              <p className="text-slate-400 mt-1">{activities.length} activities scheduled</p>
            </div>
          </div>

          <div className="space-y-6 relative border-l-2 border-slate-200 ml-3 md:ml-6 pl-6 md:pl-10 pb-10">
            {loading ? (
               <div className="text-slate-400">Loading...</div>
            ) : activities.length === 0 ? (
               <div className="text-slate-400 italic">No activities yet. Click "Add Activity" to start planning!</div>
            ) : (
              activities.map((item) => (
                <div key={item.id} className="relative group">
                  <div className={`absolute -left-[33px] md:-left-[49px] top-4 w-4 h-4 rounded-full border-2 border-white shadow-sm ${item.color.split(" ")[0]}`}></div>
                  
                  <Card className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-slate-50/50 group">
                    <CardContent className="p-0 flex flex-col sm:flex-row">
                      <div className="p-4 sm:w-32 flex flex-row sm:flex-col items-center sm:justify-center gap-2 text-slate-500 font-medium border-b sm:border-b-0 sm:border-r border-slate-100 bg-white">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm text-center">{item.start_time.slice(0,5)} - {item.end_time.slice(0,5)}</span>
                      </div>

                      <div className="p-4 flex-1 relative">
                         {/* ปุ่มลบ (จะโผล่มาตอนเอาเมาส์ไปชี้) */}
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex justify-between items-start mb-2 pr-8">
                          <Badge variant="secondary" className={`${item.color} border-none`}>
                            {item.title}
                          </Badge>
                        </div>
                        
                        <p className="text-slate-600 mb-3 text-sm leading-relaxed whitespace-pre-wrap">
                          {item.description}
                        </p>

                        {item.image_url && (
                          <div className="mb-3 rounded-lg overflow-hidden h-48 w-full relative">
                             <img src={item.image_url} alt={item.title} className="object-cover w-full h-full" />
                          </div>
                        )}

                        {item.link && (
                          <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-blue-500 hover:text-blue-700 font-medium bg-blue-50 px-3 py-1.5 rounded-full transition-colors">
                            <LinkIcon className="w-3 h-3 mr-1" /> Open Link
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
    </div>
  );
}