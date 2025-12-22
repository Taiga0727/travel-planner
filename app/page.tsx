"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Plus, MapPin, Calendar as CalIcon } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  // จำลองข้อมูลทริป (เดี๋ยวเราจะเปลี่ยนเป็นดึงจาก Database ทีหลัง)
  const trips = [
    { id: 1, name: "Japan Winter Trip", location: "Tokyo, Japan", date: "Dec 25 - Jan 5" },
    { id: 2, name: "Phuket Relax", location: "Phuket, Thailand", date: "Mar 10 - Mar 15" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {/* Header ส่วนหัว */}
      <header className="flex justify-between items-center mb-10 max-w-6xl mx-auto">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">My Travel Planner ✈️</h1>
          <p className="text-slate-500">Manage your adventures effortlessly.</p>
        </div>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" /> Create New Trip
        </Button>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left: Trip List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Upcoming Trips</h2>
          {trips.map((trip) => (
            <Card key={trip.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl">{trip.name}</CardTitle>
                <span className="text-sm text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  Planning
                </span>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-slate-500 space-x-4">
                  <div className="flex items-center"><MapPin className="w-4 h-4 mr-1"/> {trip.location}</div>
                  <div className="flex items-center"><CalIcon className="w-4 h-4 mr-1"/> {trip.date}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right: Calendar Preview */}
        <div>
           <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
               <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border shadow-sm"
              />
            </CardContent>
           </Card>
        </div>

      </main>
    </div>
  );
}