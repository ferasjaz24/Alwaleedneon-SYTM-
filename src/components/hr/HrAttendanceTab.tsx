import React, { useState, useEffect } from 'react';
import { Clock, MapPin, FileSpreadsheet, ShieldAlert, CheckCircle, Percent } from 'lucide-react';
import { Employee } from '../../types';

interface AttendanceLog {
  id: string;
  empId: string;
  name: string;
  date: string;
  checkIn: string;
  checkOut: string;
  lateMinutes: number;
  latitude: number;
  longitude: number;
  assignedWorksite: string;
  worksiteLat: number;
  worksiteLng: number;
  status: 'PENDING' | 'VALIDATED' | 'OFFSET_VIOLATION';
}

interface HrAttendanceTabProps {
  lang: 'ar' | 'en';
  employees: Employee[];
}

export default function HrAttendanceTab({ lang, employees }: HrAttendanceTabProps) {
  // Preset list of daily field clock-ins including GPS parameters
  const [logs, setLogs] = useState<AttendanceLog[]>([
    {
      id: 'ATT-201',
      empId: 'EMP-1002',
      name: lang === 'ar' ? 'فهد المطيري' : 'Fahad Al-Mutairi',
      date: '2026-06-06',
      checkIn: '08:15',
      checkOut: '17:05',
      lateMinutes: 15,
      latitude: 24.7136, // Olaya Signboard worksite center
      longitude: 46.6753,
      assignedWorksite: 'Olaya Mega Banner (Riyadh)',
      worksiteLat: 24.7136,
      worksiteLng: 46.6753,
      status: 'PENDING'
    },
    {
      id: 'ATT-202',
      empId: 'EMP-1003',
      name: lang === 'ar' ? 'عماد غانم' : 'Emad Ghanem',
      date: '2026-06-06',
      checkIn: '08:42',
      checkOut: '17:00',
      lateMinutes: 42,
      latitude: 24.6405, // Far away (Coffee shop clock attempt)
      longitude: 46.7121,
      assignedWorksite: 'CNC Factory Yard (Olayah Suburb)',
      worksiteLat: 24.7431,
      worksiteLng: 46.6812,
      status: 'PENDING'
    },
    {
      id: 'ATT-203',
      empId: 'EMP-1004',
      name: lang === 'ar' ? 'راجيش كومار' : 'Rajesh Kumar',
      date: '2026-06-06',
      checkIn: '07:55',
      checkOut: '17:30',
      lateMinutes: 0,
      latitude: 24.7431,
      longitude: 46.6812,
      assignedWorksite: 'CNC Factory Yard (Olayah Suburb)',
      worksiteLat: 24.7431,
      worksiteLng: 46.6812,
      status: 'VALIDATED'
    }
  ]);

  // Load attendance logs from live database
  useEffect(() => {
    async function fetchAttendance() {
      try {
        const res = await fetch('/api/attendance');
        if (res.ok) {
          const list = await res.json();
          if (list && list.length > 0) {
            setLogs(list);
          }
        }
      } catch (err) {
        console.warn("Unable to sync attendance database table, local records active:", err);
      }
    }
    fetchAttendance();
  }, []);

  // Selected Log to inspect GPS compliance
  const [selectedLogId, setSelectedLogId] = useState('ATT-201');
  const activeLog = logs.find(l => l.id === selectedLogId) || logs[0];

  // Simple haversine-like coordinate check calculation (distance in meters)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // in meters
    return Math.round(distance);
  };

  const currentDistanceOffset = calculateDistance(
    activeLog.latitude,
    activeLog.longitude,
    activeLog.worksiteLat,
    activeLog.worksiteLng
  );

  // Verification actions
  const handleVerifyGPSLog = (logId: string) => {
    setLogs(prev => prev.map(log => {
      if (log.id === logId) {
        const offset = calculateDistance(log.latitude, log.longitude, log.worksiteLat, log.worksiteLng);
        const hasViolated = offset > 500; // Violates if more than 500 meters from assigned outdoor sign location
        const updated = {
          ...log,
          status: (hasViolated ? 'OFFSET_VIOLATION' : 'VALIDATED') as any
        };

        // Persist geofence results to Supabase table
        fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated)
        }).catch(err => console.warn("Supabase post attendance from check-in updated failed", err));

        return updated;
      }
      return log;
    }));
  };

  // Generate WPS compliance spreadsheets simulator download prompt
  const handleGenerateWPSSpreadsheet = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Employee ID,Basic Salary,Housing Allowance,Deductions,WPS Hash,Status\n"
      + employees.map(e => `${e.id},${e.basicSalary},${e.allowances?.housing || 1500},0,SADI-${e.id}-WPS,SUCCESS`).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Saudi_Wage_Protection_WPS_Riyadh.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert(lang === 'ar' ? 'تم توليد ملف حماية الأجور الموحد للتأمينات والرياض بنك بنجاح!' : 'WPS csv spreadsheet exported successfully.');
  };

  return (
    <div id="hr-attendance-processor" className="bg-white/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 space-y-6">
      
      {/* Title Header Banner block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-100 gap-4">
        <div>
          <h4 className="text-sm font-black text-[#0072BC] flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-[#00AEEF]" />
            {lang === 'ar' ? '⏱️ معالج سجلات الحضور وببصمة الموقع الجغرافي GPS' : 'GPS Geofenced Outdoor Signage Site Checkpoint Processor'}
          </h4>
          <p className="text-[10px] text-slate-400 mt-1">
            {lang === 'ar' ? 'متابعة الفنيين بمواقع اللوحات الإعلانية الميدانية ومقارنة فوارق إيقاع الإحداثيات' : 'Verify coordinate offsets on remote signboard installations with haversine algorithms'}
          </p>
        </div>

        {/* WPS Sheet generator call */}
        <button 
          onClick={handleGenerateWPSSpreadsheet}
          className="px-3 py-1.5 bg-[#0072BC] text-white hover:bg-[#0072BC]/90 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-sky-100" />
          {lang === 'ar' ? 'تصدير شيت المواليد WPS (مدد)' : 'Export WPS Compliance payroll'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side Column: Attendance Logs ledger (5 columns) */}
        <div className="lg:col-span-5 bg-slate-50/60 p-4 rounded-2xl border border-slate-100 space-y-3 max-h-[400px] overflow-y-auto">
          <p className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase">{lang === 'ar' ? 'تاريخ الحضور والبصمة اليوم:' : 'DAILY CLOCK IN ENTRIES:'}</p>
          
          <div className="space-y-2 text-xs">
            {logs.map(log => {
              const isSelected = log.id === selectedLogId;
              const hasViolated = log.status === 'OFFSET_VIOLATION';
              const isValid = log.status === 'VALIDATED';

              return (
                <div 
                  key={log.id}
                  className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                    isSelected ? 'bg-white border-[#0072BC] shadow-lg scale-102 font-bold' : 'bg-white/80 border-slate-100 hover:bg-white'
                  }`}
                  onClick={() => setSelectedLogId(log.id)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-800">{log.name}</span>
                    <span className="text-[10px] font-mono font-black text-[#0072BC]">{log.checkIn} - {log.checkOut}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100/60 text-[10px] text-slate-500">
                    <span>{log.assignedWorksite.split(' ')[0]}</span>
                    
                    {/* Status marker */}
                    {isValid ? (
                      <span className="text-emerald-600 font-black">✓ Valid Location</span>
                    ) : hasViolated ? (
                      <span className="text-rose-600 font-black animate-pulse">⚠️ Geofence Violate</span>
                    ) : (
                      <span className="text-amber-600 font-black">● AWAIT CHECK</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side Column: Geofencing GPS Verification Radar (7 columns) */}
        {activeLog && (
          <div className="lg:col-span-7 bg-white border border-slate-150 p-5 rounded-2xl space-y-4">
            <h5 className="font-extrabold text-xs text-[#0072BC] uppercase tracking-wide border-b pb-2">
              🗺️ GPS Geofence Offsets Verification Terminal
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl">
              <div>
                <span className="text-[9px] text-[#0072BC] font-bold block">{lang === 'ar' ? 'مستهدف إحداثيات اللوحة الإعلانية:' : 'Billboard Designated Coordinates:'}</span>
                <p className="font-mono text-slate-800 mt-0.5">{activeLog.worksiteLat.toFixed(4)}N , {activeLog.worksiteLng.toFixed(4)}E</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{activeLog.assignedWorksite}</p>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 block">{lang === 'ar' ? 'إحداثيات جوال الموظف بالبصمة:' : 'Real Employee GPS Clock Coordinates:'}</span>
                <p className="font-mono text-slate-800 mt-0.5">{activeLog.latitude.toFixed(4)}N , {activeLog.longitude.toFixed(4)}E</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Mobile Signature Handover</p>
              </div>
            </div>

            {/* Simulated Radar Warning Area */}
            <div className="p-4 rounded-xl border flex items-center justify-between gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">{lang === 'ar' ? 'فارق مسافة الإزاحة عن موقع التركيب:' : 'Haversine calculated distance offset:'}</span>
                <p className="font-mono text-base font-black text-slate-850">{currentDistanceOffset} {lang === 'ar' ? 'متر' : 'meters away'}</p>
              </div>

              {currentDistanceOffset > 500 ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-2 rounded-xl text-[10px] font-bold max-w-sm flex items-start gap-1">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>
                    {lang === 'ar' ? 'تحذير: خارج نطاق لوحة الإعلانات بمسافة تتعدى الـ ٥٠٠ مترا كجدار حماية!' : 'Violation: Staff clocked too far from Olaya installation site coordinates limits! Potential offset hazard.'}
                  </span>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-250 text-emerald-800 p-2 rounded-xl text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'ar' ? 'النطاق سليم ومطابق' : 'Safe. Coordinates within workspace geofence bounds.'}</span>
                </div>
              )}
            </div>

            {/* Trigger verification button */}
            {activeLog.status === 'PENDING' && (
              <button
                onClick={() => handleVerifyGPSLog(activeLog.id)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-black"
              >
                🛰️ {lang === 'ar' ? 'مصادقة والتحقق من بصمة الـ GPS' : 'Trigger Satellite GPS Verification & Align Logs'}
              </button>
            )}

            {/* Deduction rules notice */}
            <p className="text-[10px] text-slate-400 font-mono italic">
              * Geofence offset failures of more than 500 meters from signboard centers automatically append an administrative warning log and holds overtime wages.
            </p>

          </div>
        )}

      </div>

    </div>
  );
}
