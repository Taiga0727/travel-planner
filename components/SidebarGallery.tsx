"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Maximize2, X } from "lucide-react";

// --- แก้ชื่อรูปภาพให้ตรงกับไฟล์ในเครื่องคุณ ---
const images = [
  "/sidebar-bg.jpg",
  "/sidebar-2.jpg",
  "/sidebar-3.jpg",
];

export function SidebarGallery() {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* --- ส่วนที่แสดงใน Sidebar (เหมือนเดิม) --- */}
      <DialogTrigger asChild>
        <div className="mt-6 rounded-xl overflow-hidden relative group cursor-pointer border border-white/5 aspect-[3/4]">
          <Carousel className="w-full h-full" opts={{ loop: true }}>
            <CarouselContent className="h-full ml-0">
              {images.map((img, index) => (
                <CarouselItem key={index} className="pl-0 h-full">
                  <div className="relative w-full h-full">
                    <img
                      src={img}
                      alt={`Gallery ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          <div className="absolute bottom-5 left-5 right-5 pointer-events-none z-10">
            <p className="text-white font-bold text-xl drop-shadow-lg">Inspiration</p>
            <p className="text-zinc-300 text-xs mt-1 font-medium flex items-center gap-2">
               <Maximize2 className="w-3 h-3" /> Click to expand
            </p>
          </div>
        </div>
      </DialogTrigger>

      {/* --- 🟢 ส่วนที่แก้ใหม่: ขยายเต็มจอ (Lightbox) --- */}
      <DialogContent className="max-w-[95vw] h-[90vh] w-full p-0 border-none bg-transparent shadow-none flex items-center justify-center focus:outline-none">
        
        {/* กล่องสีดำพื้นหลัง (ปรับให้ใหญ่เต็มพื้นที่) */}
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/95 backdrop-blur-2xl border border-white/10 flex items-center justify-center">
            
            {/* ปุ่มปิด (Close Button) */}
            <button onClick={() => setOpen(false)} className="absolute top-6 right-6 z-50 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-md">
                <X className="w-6 h-6" />
            </button>

            {/* Carousel รูปใหญ่ */}
            <Carousel className="w-full h-full flex items-center" opts={{ loop: true }}>
                <CarouselContent className="h-full">
                {images.map((img, index) => (
                    <CarouselItem key={index} className="flex items-center justify-center h-full w-full pl-0">
                      {/* ตัวรูปภาพ: ปรับให้ยืดเต็มที่แต่ไม่เสียสัดส่วน (object-contain) */}
                      <img
                          src={img}
                          alt={`Full ${index + 1}`}
                          className="max-h-[85vh] max-w-[90vw] w-auto h-auto object-contain drop-shadow-2xl"
                      />
                    </CarouselItem>
                ))}
                </CarouselContent>
                {/* ปุ่มลูกศรซ้าย-ขวา */}
                <CarouselPrevious className="left-4 md:left-8 bg-black/50 hover:bg-white/20 border-white/10 text-white h-12 w-12" />
                <CarouselNext className="right-4 md:right-8 bg-black/50 hover:bg-white/20 border-white/10 text-white h-12 w-12" />
            </Carousel>
        </div>
      </DialogContent>
    </Dialog>
  );
}