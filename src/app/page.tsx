'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import html2canvas from 'html2canvas'

interface Executive {
  id: string
  name: string
  title: string
  color: string
  order: number
}

interface Schedule {
  id: string
  executiveId: string
  executive: Executive
  date: string
  startTime: string
  endTime: string | null
  mission: string
  location: string
  agency: string
  dressCode: string | null
}

interface DayTheme {
  dayIndex: number
  dayName: string
  bg: string
  soft: string
  ink: string
  border: string
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];

const WEEKDAYS_TH = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
const WEEKDAYS_SHORT_TH = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

const thaiSmartBreak = (text: string): string => {
  if (!text) return '';
  return text
    // 1. Prevent break inside "พ.ศ. 2569"
    .replace(/พ\.ศ\.\s*(\d+|[๐-๙]+)/g, 'พ.ศ.\u00A0$1')
    // 2. Prevent break inside "รุ่นที่ 85"
    .replace(/รุ่นที่\s*(\d+|[๐-๙]+)/g, 'รุ่นที่\u00A0$1')
    // 3. Prevent break inside "ครั้งที่ 5"
    .replace(/ครั้งที่\s*(\d+|[๐-๙]+)/g, 'ครั้งที่\u00A0$1')
    // 4. Prevent break inside "ชั้น 4"
    .replace(/ชั้น\s*(\d+|[๐-๙]+|M|G|B)/g, 'ชั้น\u00A0$1')
    // 5. Prevent break inside "หมู่ที่ 1"
    .replace(/หมู่ที่\s*(\d+|[๐-๙]+)/g, 'หมู่ที่\u00A0$1')
    // 6. Prevent break inside "อ.เมือง", "จ.ปทุมธานี", "ต.ประชาธิปัตย์"
    .replace(/(อ\.|ต\.|จ\.)\s*([ก-๙a-zA-Z]+)/g, '$1\u00A0$2')
    // 7. Prevent break before opening parenthesis and inside parenthesis
    .replace(/\s+\(([^)]+)\)/g, '\u00A0($1)')
    // 8. Prevent break inside "ประจำปีงบประมาณ พ.ศ."
    .replace(/(ประจำปีงบประมาณ|ปีงบประมาณ)\s+(พ\.ศ\.)/g, '$1\u00A0$2')
    // 9. Prevent break in numbers with units (e.g., "10 คน", "๐๘.๐๐ น.")
    .replace(/(\d+|[๐-๙]+)\s*(น\.|คน|ท่าน|ราย|ห้อง|แห่ง|เครื่อง|ชุด)/g, '$1\u00A0$2')
    // 10. Prevent break in time ranges like "เวลา 09.00 น."
    .replace(/เวลา\s*(\d+|[๐-๙]+)/g, 'เวลา\u00A0$1')
    // 11. Prevent break for building terms
    .replace(/(ห้องประชุม|อาคาร|ตึก|ศาลากลางจังหวัด)\s*([ก-๙a-zA-Z\d]+)/g, '$1\u00A0$2');
}

// Helper to calculate spans for adjacent rows of the same executive
const getSpans = (schedules: any[], field: string | ((s: any) => string | null)) => {
  const spans: { span: number; show: boolean }[] = [];
  let i = 0;
  while (i < schedules.length) {
    let span = 1;
    const getVal = typeof field === 'function' ? field : (s: any) => s[field] as string | null;
    const currentVal = (getVal(schedules[i]) || '').trim();
    
    while (i + span < schedules.length) {
      const nextVal = (getVal(schedules[i + span]) || '').trim();
      if (currentVal === nextVal && currentVal !== '' && currentVal !== '-') {
        span++;
      } else {
        break;
      }
    }
    
    spans.push({ span, show: true });
    for (let j = 1; j < span; j++) {
      spans.push({ span: 1, show: false });
    }
    i += span;
  }
  return spans;
};

export default function PublicSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [monthSchedules, setMonthSchedules] = useState<Schedule[]>([])
  const [themes, setThemes] = useState<DayTheme[]>([])
  const [executives, setExecutives] = useState<Executive[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentViewDate, setCurrentViewDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExecFilter, setSelectedExecFilter] = useState('')

  // Settings loaded from Admin Panel via LocalStorage
  const [printFontFamily, setPrintFontFamily] = useState("'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', sans-serif")
  const [printFontSize, setPrintFontSize] = useState("16px")
  const [printFontWeight, setPrintFontWeight] = useState("normal")
  const [printMissionAlign, setPrintMissionAlign] = useState("left")
  const [printLocationAlign, setPrintLocationAlign] = useState("left")
  const [printLineHeight, setPrintLineHeight] = useState("1.5")
  const [printCellPadding, setPrintCellPadding] = useState("normal")
  const [fitToPage, setFitToPage] = useState(true)
  const [printBannerFontSize, setPrintBannerFontSize] = useState("20px")
  const [downloadingImage, setDownloadingImage] = useState(false)
  
  const [colTimeVisible, setColTimeVisible] = useState(true)
  const [colLocationVisible, setColLocationVisible] = useState(true)
  const [colAgencyVisible, setColAgencyVisible] = useState(true)
  const [colDressVisible, setColDressVisible] = useState(true)

  const toThaiDigits = (value: string | number) => {
    return String(value ?? "").replace(/[0-9]/g, digit => THAI_DIGITS[Number(digit)]);
  }

  const renderText = (text: string | null | undefined) => {
    if (!text) return '';
    
    let formatted = text;

    // Strip alignment markers before rendering
    formatted = formatted.replace(/^\{\{[CLR]\}\}/, '');

    // 2. Convert space before prepositions (like " ณ") to a newline
    formatted = formatted.replace(/\s+ณ\s*/g, '\nณ ');

    // 3. Keep single spaces as newlines if they are separators, but handle | or / or ;
    formatted = formatted
      .replace(/\s*\|\s*/g, '\n')
      .replace(/\s+;\s+/g, '\n')
      .replace(/\s+\/\s+/g, '\n');
    
    // 4. Prevent word-wrap break after common Thai prefixes/titles
    formatted = formatted.replace(/(นาย|นาง|นางสาว|ว่าที่ร้อยตรี|ดร\.|พล\.ต\.|พ\.ต\.|ร\.ต\.|ปลัดจังหวัด|ผู้ว่าราชการจังหวัด|รองผู้ว่าราชการจังหวัด)\s+/g, '$1\u00A0');

    // 5. Apply Thai smart line breaking to keep units like "พ.ศ. 2569" together
    formatted = thaiSmartBreak(formatted);
    
    // 6. Clean up consecutive newlines
    formatted = formatted.replace(/\n{2,}/g, '\n');

    // Always convert Arabic digits to Thai digits for formal Thai document presentation
    return toThaiDigits(formatted);
  }

  const formatDateKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Format time to Thai format (e.g., "08:30" -> "๐๘.๓๐ น.")
  const formatThaiTime = (timeStr: string) => {
    if (!timeStr || timeStr.trim() === '-' || timeStr.trim() === '') return timeStr?.trim() === '-' ? '-' : '';
    const clean = timeStr.replace(":", ".").replace(/\s*น\s*\.?$/, "");
    return toThaiDigits(clean);
  }

  // Extract per-item alignment marker from text: {{C}} = center, {{R}} = right, {{L}} = left
  const extractItemAlign = (text: string | null | undefined): { text: string; align: string | null } => {
    if (!text) return { text: '', align: null };
    const match = text.match(/^\{\{([CLR])\}\}/);
    if (match) {
      const alignMap: Record<string, string> = { C: 'center', L: 'left', R: 'right' };
      return { text: text.replace(/^\{\{[CLR]\}\}/, '').trim(), align: alignMap[match[1]] || null };
    }
    return { text, align: null };
  }

  // Check if text is just a dash (for auto-centering)
  const isDash = (text: string | null | undefined) => {
    if (!text) return true;
    const cleaned = text.replace(/^\{\{[CLR]\}\}/, '').trim();
    return cleaned === '-' || cleaned === '';
  }

  // QoL real-time settings synchronizer from Admin tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'printSettings' && e.newValue) {
        try {
          const config = JSON.parse(e.newValue)
          if (config.fontFamily) setPrintFontFamily(config.fontFamily)
          if (config.fontSize) setPrintFontSize(config.fontSize)
          if (config.fontWeight) setPrintFontWeight(config.fontWeight)
          if (config.missionAlign) setPrintMissionAlign(config.missionAlign)
          if (config.locationAlign) setPrintLocationAlign(config.locationAlign)
          if (config.lineHeight) setPrintLineHeight(config.lineHeight)
          if (config.cellPadding) setPrintCellPadding(config.cellPadding)
          if (config.fitToPage !== undefined) setFitToPage(config.fitToPage)
          if (config.bannerFontSize) setPrintBannerFontSize(config.bannerFontSize)
          
          if (config.visibleColumns) {
            setColTimeVisible(config.visibleColumns.time !== false)
            setColLocationVisible(config.visibleColumns.location !== false)
            setColAgencyVisible(config.visibleColumns.agency !== false)
            setColDressVisible(config.visibleColumns.dress !== false)
          }
        } catch (err) {
          console.error("Error loading print settings from storage event", err)
        }
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  useEffect(() => {
    fetchThemes()
    fetchExecutives()
    
    // Load print settings from LocalStorage
    const saved = localStorage.getItem('printSettings')
    if (saved) {
      try {
        const config = JSON.parse(saved)
        if (config.fontFamily) setPrintFontFamily(config.fontFamily)
        if (config.fontSize) setPrintFontSize(config.fontSize)
        if (config.fontWeight) setPrintFontWeight(config.fontWeight)
        if (config.missionAlign) setPrintMissionAlign(config.missionAlign)
        if (config.locationAlign) setPrintLocationAlign(config.locationAlign)
        if (config.lineHeight) setPrintLineHeight(config.lineHeight)
        if (config.cellPadding) setPrintCellPadding(config.cellPadding)
        if (config.fitToPage !== undefined) setFitToPage(config.fitToPage)
        if (config.bannerFontSize) setPrintBannerFontSize(config.bannerFontSize)
        
        if (config.visibleColumns) {
          setColTimeVisible(config.visibleColumns.time !== false)
          setColLocationVisible(config.visibleColumns.location !== false)
          setColAgencyVisible(config.visibleColumns.agency !== false)
          setColDressVisible(config.visibleColumns.dress !== false)
        }
      } catch (e) {
        console.error("Error loading print settings", e)
      }
    } else {
      const savedFont = localStorage.getItem('printFontFamily')
      const savedSize = localStorage.getItem('printFontSize')
      if (savedFont) setPrintFontFamily(savedFont)
      if (savedSize) setPrintFontSize(savedSize)
    }
  }, [])

  useEffect(() => {
    fetchSchedules()
    // Reset filters when date changes
    setSearchQuery('')
    setSelectedExecFilter('')
  }, [selectedDate])

  useEffect(() => {
    fetchMonthSchedules()
  }, [currentViewDate])

  const fetchThemes = async () => {
    const res = await fetch('/api/themes')
    const data = await res.json()
    setThemes(data)
  }

  const fetchExecutives = async () => {
    const res = await fetch('/api/executives')
    const data = await res.json()
    setExecutives(data)
  }

  const fetchSchedules = async () => {
    setLoading(true)
    const res = await fetch(`/api/schedules?date=${formatDateKey(selectedDate)}`)
    const data = await res.json()
    setSchedules(data)
    setLoading(false)
  }

  const fetchMonthSchedules = async () => {
    const month = currentViewDate.getMonth()
    const year = currentViewDate.getFullYear()
    const res = await fetch(`/api/schedules?month=${month}&year=${year}`)
    const data = await res.json()
    setMonthSchedules(data)
  }

  const handleDownloadImage = async () => {
    const element = document.getElementById('schedule-table-container');
    if (!element) return;
    
    try {
      setDownloadingImage(true)
      
      const responsiveWrapper = element.querySelector('.table-responsive') as HTMLElement;
      const originalResponsiveStyle = responsiveWrapper ? responsiveWrapper.getAttribute('style') || '' : '';
      const originalContainerStyle = element.getAttribute('style') || '';
      
      // Temporarily expand width and make overflow visible to prevent html2canvas clipping/border bugs
      element.style.width = '1120px';
      element.style.minWidth = '1120px';
      if (responsiveWrapper) {
        responsiveWrapper.style.overflowX = 'visible';
        responsiveWrapper.style.width = '100%';
      }
      
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          // Remove padding and border from container to fit table exactly
          const container = clonedDoc.getElementById('schedule-table-container');
          if (container) {
            container.style.padding = '0';
            container.style.border = 'none';
            container.style.borderRadius = '0';
          }
          
          // Force relative positioning and background-clip on all table cells to resolve html2canvas rowspan border bugs
          const cells = clonedDoc.querySelectorAll('.schedule-table th, .schedule-table td');
          cells.forEach(cell => {
            const el = cell as HTMLElement;
            el.style.position = 'relative';
            el.style.backgroundClip = 'padding-box';
          });
          // Set row backgrounds to transparent during capture to prevent them from overlaying spanned cells
          const rows = clonedDoc.querySelectorAll('.schedule-row');
          rows.forEach(row => {
            const el = row as HTMLElement;
            el.style.backgroundColor = 'transparent';
          });
        }
      });
      
      // Restore original styling
      element.setAttribute('style', originalContainerStyle);
      if (responsiveWrapper) {
        responsiveWrapper.setAttribute('style', originalResponsiveStyle);
      }
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      const dateKey = formatDateKey(selectedDate);
      link.download = `วาระงานผู้บริหารปทุมธานี_${dateKey}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to download image', error);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์รูปภาพ');
    } finally {
      setDownloadingImage(false);
    }
  }

  const currentTheme = themes.find(t => t.dayIndex === selectedDate.getDay())

  // Dynamic solid background color for table headers matching the traditional Thai colors of the day
  const getWeekdayHeaderStyle = (dayIndex: number) => {
    const styles = [
      { bg: "#ef4444", text: "white", border: "#dc2626" }, // Sunday (Red)
      { bg: "#facc15", text: "#713f12", border: "#eab308" }, // Monday (Yellow)
      { bg: "#f472b6", text: "white", border: "#db2777" }, // Tuesday (Pink)
      { bg: "#22c55e", text: "white", border: "#16a34a" }, // Wednesday (Green)
      { bg: "#f97316", text: "white", border: "#ea580c" }, // Thursday (Orange)
      { bg: "#3b82f6", text: "white", border: "#2563eb" }, // Friday (Blue)
      { bg: "#a855f7", text: "white", border: "#9333ea" }  // Saturday (Purple)
    ];
    return styles[dayIndex] || { bg: "#22c55e", text: "white", border: "#16a34a" };
  }

  // Dynamic solid background color for the main banner matching the traditional Thai colors of the day
  const getWeekdayBannerColor = (dayIndex: number) => {
    const colors = [
      "#f87171", // Sunday (Red)
      "#fde047", // Monday (Yellow)
      "#f472b6", // Tuesday (Pink)
      "#4ade80", // Wednesday (Green)
      "#fb923c", // Thursday (Orange)
      "#00b0f0", // Friday (Blue)
      "#c084fc"  // Saturday (Purple)
    ];
    return colors[dayIndex] || "#00b0f0";
  }

  const headerStyle = getWeekdayHeaderStyle(selectedDate.getDay())

  const calendarDays = useMemo(() => {
    const year = currentViewDate.getFullYear()
    const month = currentViewDate.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const startDay = new Date(firstDayOfMonth)
    startDay.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay())
    
    const days = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(startDay)
      d.setDate(startDay.getDate() + i)
      days.push(d)
    }
    return days
  }, [currentViewDate])

  const getSchedulesForDate = (date: Date) => {
    const key = formatDateKey(date)
    return monthSchedules.filter(s => formatDateKey(new Date(s.date)) === key)
  }

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentViewDate)
    newDate.setMonth(newDate.getMonth() + delta)
    setCurrentViewDate(newDate)
  }

  const formatThaiDateFull = (date: Date) => {
    const day = toThaiDigits(date.getDate());
    const month = THAI_MONTHS[date.getMonth()];
    const year = toThaiDigits(date.getFullYear() + 543);
    return `${WEEKDAYS_TH[date.getDay()]}ที่ ${day} ${month} ${year}`;
  }

  // Get unique executives from currently selected day's schedules for the filter dropdown
  const uniqueExecutivesInSchedules = useMemo(() => {
    const map = new Map<string, { id: string, name: string }>()
    schedules.forEach(s => {
      if (s.executive) {
        map.set(s.executiveId, { id: s.executiveId, name: s.executive.name })
      }
    })
    return Array.from(map.values())
  }, [schedules])

  // Group schedules by executive for rowspan formal table display
  const groupedSchedules = useMemo(() => {
    const sortedExecutives = [...executives].sort((a, b) => a.order - b.order)

    return sortedExecutives.map(exec => {
      const execSchedules = schedules.filter(s => s.executiveId === exec.id).filter(s => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (s.mission || '').toLowerCase().includes(q) ||
               (s.location || '').toLowerCase().includes(q) ||
               (s.agency || '').toLowerCase().includes(q) ||
               (s.dressCode && s.dressCode.toLowerCase().includes(q));
      });

      return {
        executive: exec,
        schedules: execSchedules
      };
    }).filter(group => {
      if (selectedExecFilter && group.executive.id !== selectedExecFilter) {
        return false;
      }
      if (searchQuery && group.schedules.length === 0) {
        return false;
      }
      return true;
    });
  }, [executives, schedules, searchQuery, selectedExecFilter])

  const getPaddingStyle = () => {
    if (printCellPadding === 'compact') return '6px 8px'
    if (printCellPadding === 'loose') return '16px 14px'
    return '12px 10px' // normal
  }

  const activeColCount = 2 + (colTimeVisible ? 1 : 0) + (colLocationVisible ? 1 : 0) + (colAgencyVisible ? 1 : 0) + (colDressVisible ? 1 : 0)

  // === SMART TABLE ALGORITHM ===

  // Count total visible rows for dynamic table-layout
  const totalVisibleRows = useMemo(() => {
    return groupedSchedules.reduce((sum, g) => sum + Math.max(g.schedules.length, 1), 0)
  }, [groupedSchedules])

  // Smart column widths: redistribute based on which columns are visible
  const smartColWidths = useMemo(() => {
    // Base proportions (out of 100)
    const bases = {
      exec: 15,
      time: colTimeVisible ? 8 : 0,
      mission: 32,
      location: colLocationVisible ? 22 : 0,
      agency: colAgencyVisible ? 12 : 0,
      dress: colDressVisible ? 11 : 0,
    }
    const usedTotal = Object.values(bases).reduce((a, b) => a + b, 0)
    // Redistribute remainder proportionally to exec + mission (the main columns)
    const remainder = 100 - usedTotal
    const mainTotal = bases.exec + bases.mission
    bases.exec += remainder * (bases.exec / mainTotal)
    bases.mission += remainder * (bases.mission / mainTotal)

    return {
      exec: `${Math.round(bases.exec)}%`,
      time: `${Math.round(bases.time)}%`,
      mission: `${Math.round(bases.mission)}%`,
      location: `${Math.round(bases.location)}%`,
      agency: `${Math.round(bases.agency)}%`,
      dress: `${Math.round(bases.dress)}%`,
    }
  }, [colTimeVisible, colLocationVisible, colAgencyVisible, colDressVisible])



  return (
    <div className={`app-container ${fitToPage ? 'print-fit-to-page' : ''}`}>
      <header className="main-header">
        <div className="container">
          <div className="header-content">
            <div className="brand-section">
              <div className="logo-placeholder" style={{ background: 'white', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                <img src="/seal.jpg" alt="ตราจังหวัดปทุมธานี" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div className="brand-text">
                <h1>ระบบปฏิทินวาระงานผู้บริหาร</h1>
                <p>จังหวัดปทุมธานี | Executive Schedule System</p>
              </div>
            </div>
            <div className="header-actions">
              <button className="nav-btn" onClick={() => { setSelectedDate(new Date()); setCurrentViewDate(new Date()); }}>วันนี้</button>
              <button className="nav-btn print-btn" onClick={() => window.print()}>
                <span className="icon">🖨️</span> พิมพ์วาระงาน
              </button>
              <button className="nav-btn download-image-btn" onClick={handleDownloadImage} disabled={downloadingImage}>
                <span className="icon">🖼️</span> {downloadingImage ? 'กำลังสร้างรูป...' : 'บันทึกเป็นรูปภาพ (.jpg)'}
              </button>
              <a href="/admin" className="admin-link">
                จัดการระบบ (Admin)
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="container main-layout">
        {/* Main Content Area: Schedule Table */}
        <div className="detail-section">
          <div className="card detail-card">
            {/* Search and Filter Inputs */}
            <div className="search-filter-bar">
              <div className="search-input-wrapper">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  placeholder="ค้นหาภารกิจ/สถานที่/หน่วยงาน..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              {uniqueExecutivesInSchedules.length > 1 && (
                <select 
                  value={selectedExecFilter}
                  onChange={(e) => setSelectedExecFilter(e.target.value)}
                  className="exec-filter-select"
                >
                  <option value="">ผู้บริหารทั้งหมด</option>
                  {uniqueExecutivesInSchedules.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="schedule-list">
              {loading ? (
                <div className="loading-state">กำลังดึงข้อมูล...</div>
              ) : (
                <div className="table-container" id="schedule-table-container">
                  {/* Official PDF/Excel Banner */}
                  <div className="official-banner-container">
                    <div className="banner-seal-wrapper">
                      <div className="banner-seal">
                        <img src="/seal.jpg" alt="ตราจังหวัดปทุมธานี" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    </div>
                    <div 
                      className="official-banner" 
                      style={{ 
                        backgroundColor: getWeekdayBannerColor(selectedDate.getDay()),
                        fontFamily: printFontFamily
                      }}
                    >
                      <h2 className="banner-title" style={{ fontFamily: printFontFamily, fontSize: printBannerFontSize }}>
                        {renderText(`วาระงานผู้ว่าราชการจังหวัดและผู้บริหารของจังหวัดปทุมธานี ${formatThaiDateFull(selectedDate)}`)}
                      </h2>
                      <div className="banner-footer" style={{ fontFamily: printFontFamily, fontSize: printBannerFontSize }}>
                        {renderText(`จัดทำโดย สำนักงานจังหวัดปทุมธานี สามารถดาวน์โหลดข้อมูลได้ที่ www.pathumthani.go.th หัวข้อ "วาระงานผู้ว่าราชการจังหวัดและผู้บริหารของจังหวัดปทุมธานี"`)}
                      </div>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table 
                      className="schedule-table" 
                      style={{ 
                        fontFamily: printFontFamily,
                        fontSize: printFontSize,
                        fontWeight: printFontWeight,
                        lineHeight: printLineHeight,
                        tableLayout: 'fixed',
                      }}
                    >
                      <thead>
                        <tr>
                          <th className="th-exec" style={{ backgroundColor: headerStyle.bg, color: headerStyle.text, borderColor: headerStyle.border, padding: getPaddingStyle(), width: smartColWidths.exec }}>ผู้บริหาร</th>
                          {colTimeVisible && <th className="th-time" style={{ backgroundColor: headerStyle.bg, color: headerStyle.text, borderColor: headerStyle.border, padding: getPaddingStyle(), width: smartColWidths.time }}>เวลา</th>}
                           <th className="th-mission" style={{ backgroundColor: headerStyle.bg, color: headerStyle.text, borderColor: headerStyle.border, padding: getPaddingStyle(), width: smartColWidths.mission }}>วาระงาน</th>
                          {colLocationVisible && <th className="th-location" style={{ backgroundColor: headerStyle.bg, color: headerStyle.text, borderColor: headerStyle.border, padding: getPaddingStyle(), width: smartColWidths.location }}>สถานที่</th>}
                          {colAgencyVisible && <th className="th-agency" style={{ backgroundColor: headerStyle.bg, color: headerStyle.text, borderColor: headerStyle.border, padding: getPaddingStyle(), width: smartColWidths.agency }}>หน่วยงาน</th>}
                          {colDressVisible && <th className="th-dress" style={{ backgroundColor: headerStyle.bg, color: headerStyle.text, borderColor: headerStyle.border, padding: getPaddingStyle(), width: smartColWidths.dress }}>การแต่งกาย</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {groupedSchedules.length === 0 ? (
                          <tr>
                            <td colSpan={activeColCount} className="text-center py-8 text-slate-400 font-bold" style={{ padding: getPaddingStyle() }}>
                              ไม่มีข้อมูลวาระงานตรงตามที่เลือกหรือตรงกับการค้นหา
                            </td>
                          </tr>
                        ) : (
                          groupedSchedules.map(group => {
                            const exec = group.executive;
                            const execSchedules = group.schedules;
                            
                            // If no schedules for this executive, show "ปฏิบัติราชการปกติ"
                            if (execSchedules.length === 0) {
                              return (
                                <tr 
                                  key={exec.id} 
                                  className="schedule-row" 
                                  style={{ 
                                    color: exec.color === '#000000' ? '#1e293b' : exec.color
                                  }}
                                >
                                  <td className="td-exec" style={{ padding: getPaddingStyle() }}>
                                    <div className="exec-name-cell">
                                      <div className="exec-name" style={{ color: exec.color === '#000000' ? '#1e293b' : exec.color }}>
                                        {exec.name}
                                      </div>
                                      <div className="exec-title" style={{ color: exec.color === '#000000' ? '#1e293b' : exec.color }}>{exec.title}</div>
                                    </div>
                                  </td>
                                  {colTimeVisible && <td className="td-time text-center font-bold" style={{ padding: getPaddingStyle() }}>-</td>}
                                  <td className="td-mission" style={{ padding: getPaddingStyle(), textAlign: printMissionAlign === 'center' ? 'center' : 'left' }}>ปฏิบัติราชการปกติ</td>
                                  {colLocationVisible && <td className="td-location" style={{ padding: getPaddingStyle(), textAlign: printLocationAlign === 'center' ? 'center' : 'left' }}>ศาลากลางจังหวัดปทุมธานี</td>}
                                  {colAgencyVisible && <td className="td-agency text-center" style={{ padding: getPaddingStyle() }}>-</td>}
                                  {colDressVisible && <td className="td-dress text-center" style={{ padding: getPaddingStyle() }}>-</td>}
                                </tr>
                              );
                            }

                            // Precalculate spans for location, agency, and dressCode within this executive's list
                            const agencySpans = getSpans(execSchedules, 'agency');
                            const dressSpans = getSpans(execSchedules, s => s.dressCode);
                            const locationSpans = getSpans(execSchedules, 'location');

                            // Otherwise, map schedules and use rowspan for the first one
                            return execSchedules.map((s, index) => (
                              <tr 
                                key={s.id} 
                                className="schedule-row" 
                                style={{ 
                                  color: exec.color === '#000000' ? '#1e293b' : exec.color
                                }}
                              >
                                {index === 0 && (
                                  <td 
                                    className="td-exec" 
                                    rowSpan={execSchedules.length}
                                    style={{ padding: getPaddingStyle() }}
                                  >
                                    <div className="exec-name-cell">
                                      <div className="exec-name" style={{ color: exec.color === '#000000' ? '#1e293b' : exec.color }}>
                                        {exec.name}
                                      </div>
                                       <div className="exec-title" style={{ color: exec.color === '#000000' ? '#1e293b' : exec.color }}>{exec.title}</div>
                                    </div>
                                  </td>
                                )}
                                {colTimeVisible && (
                                  <td className="td-time text-center font-bold" style={{ padding: getPaddingStyle() }}>
                                    {formatThaiTime(s.startTime)}
                                    {s.endTime && s.endTime.trim() !== '-' && s.endTime.trim() !== '' && (
                                      <div className="time-end-text">
                                        ถึง {formatThaiTime(s.endTime)}
                                      </div>
                                    )}
                                  </td>
                                )}
                                <td className="td-mission" style={{ padding: getPaddingStyle() }}>
                                  {(() => {
                                    const { text: mText, align: mItemAlign } = extractItemAlign(s.mission);
                                    const effectiveAlign = isDash(s.mission) ? 'center' : (mItemAlign || (printMissionAlign === 'center' ? 'center' : 'left'));
                                    return <div style={{ whiteSpace: 'pre-wrap', textAlign: effectiveAlign as any }}>{renderText(mText)}</div>;
                                  })()}
                                </td>
                                {colLocationVisible && locationSpans[index].show && (
                                  <td 
                                    className="td-location" 
                                    rowSpan={locationSpans[index].span}
                                    style={{ padding: getPaddingStyle() }}
                                  >
                                    {(() => {
                                      const { text: lText, align: lItemAlign } = extractItemAlign(s.location);
                                      const effectiveAlign = isDash(s.location) ? 'center' : (lItemAlign || (printLocationAlign === 'center' ? 'center' : 'left'));
                                      return <div style={{ whiteSpace: 'pre-wrap', textAlign: effectiveAlign as any }}>{renderText(lText)}</div>;
                                    })()}
                                  </td>
                                )}
                                {colAgencyVisible && agencySpans[index].show && (
                                  <td 
                                    className="td-agency" 
                                    rowSpan={agencySpans[index].span}
                                    style={{ padding: getPaddingStyle() }}
                                  >
                                    {(() => {
                                      const { text: aText, align: aItemAlign } = extractItemAlign(s.agency);
                                      const effectiveAlign = isDash(s.agency) ? 'center' : (aItemAlign || 'center');
                                      return <span className="agency-text" style={{ display: 'block', textAlign: effectiveAlign as any }}>{renderText(aText)}</span>;
                                    })()}
                                  </td>
                                )}
                                {colDressVisible && dressSpans[index].show && (
                                  <td 
                                    className="td-dress" 
                                    rowSpan={dressSpans[index].span}
                                    style={{ padding: getPaddingStyle() }}
                                  >
                                    {(() => {
                                      const { text: dText, align: dItemAlign } = extractItemAlign(s.dressCode || '-');
                                      const effectiveAlign = isDash(s.dressCode) ? 'center' : (dItemAlign || 'center');
                                      return <span className="dress-text" style={{ display: 'block', textAlign: effectiveAlign as any }}>{renderText(dText)}</span>;
                                    })()}
                                  </td>
                                )}
                              </tr>
                            ));
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Executive Legend Bar */}
            <div className="executive-legend">
              <span className="legend-title">สัญลักษณ์สี:</span>
              {executives.map(ex => (
                <span key={ex.id} className="legend-chip">
                  <i className="legend-dot" style={{ backgroundColor: ex.color }}></i>
                  <span className="legend-name">
                    {ex.title.replace('จังหวัดปทุมธานี', '')} ({ex.name})
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Area: Compact Calendar */}
        <div className="calendar-section">
          <div className="card calendar-card">
            <div className="calendar-toolbar">
              <div className="view-title">
                <h2>{THAI_MONTHS[currentViewDate.getMonth()]} {toThaiDigits(currentViewDate.getFullYear() + 543)}</h2>
              </div>
              <div className="view-nav">
                <button className="icon-btn" onClick={() => changeMonth(-1)}>❮</button>
                <button className="text-btn" onClick={() => setCurrentViewDate(new Date())}>เดือนนี้</button>
                <button className="icon-btn" onClick={() => changeMonth(1)}>❯</button>
              </div>
            </div>

            <div className="calendar-grid">
              <div className="weekday-row">
                {WEEKDAYS_SHORT_TH.map(d => <div key={d} className="weekday-cell">{d}</div>)}
              </div>
              <div className="days-grid">
                {calendarDays.map((date, idx) => {
                  const isOutside = date.getMonth() !== currentViewDate.getMonth()
                  const isToday = formatDateKey(date) === formatDateKey(new Date())
                  const isSelected = formatDateKey(date) === formatDateKey(selectedDate)
                  const daySchedules = getSchedulesForDate(date)
                  const dayTheme = themes.find(t => t.dayIndex === date.getDay())
                  
                  // Get unique executive colors for events on this date
                  const uniqueColors = Array.from(new Set(daySchedules.map(s => s.executive?.color).filter(Boolean)))

                  return (
                    <div 
                      key={idx} 
                      className={`day-cell ${isOutside ? 'is-outside' : ''} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className="day-header">
                        <span className="day-number" style={isSelected && dayTheme ? { background: dayTheme.bg, color: dayTheme.ink } : {}}>
                          {toThaiDigits(date.getDate())}
                        </span>
                      </div>
                      
                      {/* Compact Dots instead of bulky Pills */}
                      <div className="day-events-dots">
                        {uniqueColors.map((color, colorIdx) => (
                          <span 
                            key={colorIdx} 
                            className="day-event-dot" 
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="main-footer">
        <div className="container">
          <p>© {toThaiDigits(new Date().getFullYear() + 543)} จังหวัดปทุมธานี - ระบบบริหารจัดการวาระงานผู้บริหาร</p>
        </div>
      </footer>

      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background-color: #f8fafc;
          color: #1e293b;
          font-family: 'Sarabun', sans-serif;
          line-height: 1.6;
        }

        .container {
          max-width: 1560px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* Header */
        .main-header {
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03);
          padding: 16px 0;
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid #f1f5f9;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .logo-placeholder {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #166534, #15803d);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(22, 101, 52, 0.15);
        }

        .logo-inner {
          color: white;
          font-weight: 800;
          font-size: 1.25rem;
        }

        .brand-text h1 {
          font-size: 1.2rem;
          font-weight: 700;
          margin: 0;
          color: #0f172a;
        }

        .brand-text p {
          font-size: 0.8rem;
          color: #64748b;
          margin: 2px 0 0;
          font-weight: 500;
        }

        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .nav-btn {
          background: white;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.875rem;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .download-image-btn {
          background: #0284c7 !important;
          color: white !important;
          border-color: #0369a1 !important;
        }

        .download-image-btn:hover {
          background: #0369a1 !important;
        }

        .download-image-btn:disabled {
          background: #bae6fd !important;
          border-color: #bae6fd !important;
          color: #0369a1 !important;
          cursor: not-allowed;
        }

        .admin-link {
          background: #166534;
          color: white;
          padding: 8px 16px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 0.875rem;
          text-decoration: none;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(22, 101, 52, 0.1);
        }

        .admin-link:hover {
          background: #14532d;
          box-shadow: 0 4px 10px rgba(22, 101, 52, 0.2);
        }

        /* Layout - Table full width with Calendar below */
        .main-layout {
          display: flex;
          flex-direction: column;
          gap: 32px;
          padding-top: 24px;
          padding-bottom: 48px;
        }

        .calendar-section {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
        }

        .card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }

        /* Calendar Card */
        .calendar-card {
          position: relative;
        }

        .calendar-toolbar {
          padding: 16px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
        }

        .view-title h2 {
          font-size: 1.1rem;
          font-weight: 800;
          margin: 0;
          color: #0f172a;
        }

        .view-nav {
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .icon-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          border: 1px solid #e2e8f0;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          color: #475569;
          font-size: 0.7rem;
        }

        .icon-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .text-btn {
          background: transparent;
          border: none;
          font-weight: 700;
          color: #475569;
          padding: 0 8px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: color 0.2s;
        }

        .text-btn:hover {
          color: #166534;
        }

        .calendar-grid {
          padding: 12px;
        }

        .weekday-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 8px;
        }

        .weekday-cell {
          text-align: center;
          font-weight: 800;
          font-size: 0.75rem;
          color: #94a3b8;
          padding: 4px 0;
        }

        .days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }

        /* Compact Day Cell */
        .day-cell {
          min-height: 58px;
          padding: 4px;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          background: white;
        }

        .day-cell:hover {
          background-color: #f8fafc;
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(15, 23, 42, 0.05);
        }

        .day-cell.is-outside {
          opacity: 0.3;
          background-color: #fafafa;
        }

        .day-cell.is-today {
          border: 2px solid #166534;
          background-color: #f0fdf4;
        }

        .day-cell.is-selected {
          border: 2px solid #3b82f6;
          background-color: #eff6ff;
        }

        .day-header {
          display: flex;
          justify-content: center;
          width: 100%;
        }

        .day-number {
          font-weight: 700;
          font-size: 0.85rem;
          color: #334155;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        /* Dots indicator styling */
        .day-events-dots {
          display: flex;
          gap: 3px;
          justify-content: center;
          width: 100%;
          min-height: 6px;
          margin-bottom: 2px;
        }

        .day-event-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }

        /* Detail Card (Main area) */
        .detail-card {
          display: flex;
          flex-direction: column;
          background: white;
          padding: 24px;
        }

        /* Search Filter Bar */
        .search-filter-bar {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #edf2f7;
          margin-bottom: 20px;
        }

        .search-input-wrapper {
          position: relative;
          flex: 1;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .search-input {
          width: 100%;
          padding: 8px 12px 8px 30px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.85rem;
          font-family: inherit;
          outline: none;
          background-color: white;
          color: #1e293b;
          transition: all 0.2s;
        }

        .search-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }

        .exec-filter-select {
          padding: 8px 24px 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.85rem;
          font-family: inherit;
          outline: none;
          background-color: white;
          color: #1e293b;
          max-width: 180px;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .exec-filter-select:focus {
          border-color: #3b82f6;
        }

        /* Official PDF / Excel Style Banner Container */
        .official-banner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          margin-bottom: 24px;
        }

        .banner-seal-wrapper {
          margin-bottom: 12px;
        }

        .banner-seal {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0,0,0,0.1);
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }

        .official-banner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 12px 24px;
          width: 100%;
          border: none;
          color: #000000 !important; /* Black text */
          box-sizing: border-box;
          gap: 4px;
          border-radius: 0;
        }

        .banner-title {
          font-size: 1.25rem;
          font-weight: 800;
          margin: 0;
          color: #000000 !important;
        }

        .banner-footer {
          font-size: 0.82rem;
          font-weight: 600;
          color: #000000 !important;
          margin: 0;
        }

        .schedule-list {
          flex: 1;
        }

        .table-container {
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          overflow: hidden;
          padding: 16px;
          background-color: white;
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }

        /* Official Excel Table Styling */
        .schedule-table {
          width: 100%;
          min-width: 900px;
          border-collapse: separate;
          border-spacing: 0;
          border-top: 1px solid #000000;
          border-left: 1px solid #000000;
          background-color: white;
        }

        /* Dynamic Table Header borders and paddings */
        .schedule-table th {
          font-weight: 800;
          text-transform: uppercase;
          padding: 12px 8px;
          border-top: none !important;
          border-left: none !important;
          border-bottom: 1px solid #000000 !important;
          border-right: 1px solid #000000 !important;
          text-align: center;
          transition: background-color 0.2s, color 0.2s;
          position: relative;
          background-clip: padding-box;
        }

        /* Excel style table cells — Smart Word Break */
        .schedule-table td {
          padding: 12px 10px;
          vertical-align: middle;
          border-top: none !important;
          border-left: none !important;
          border-bottom: 1px solid #000000 !important;
          border-right: 1px solid #000000 !important;
          line-height: inherit;
          overflow-wrap: break-word;
          word-break: break-word;
          max-width: 0;
          position: relative;
          background-clip: padding-box;
        }

        .schedule-table th,
        .schedule-table td {
          font-family: inherit;
          font-size: inherit;
        }

        .schedule-row {
          background-color: transparent;
          transition: background-color 0.15s ease;
        }

        .schedule-row:hover {
          background-color: #f8fafc;
        }

        .td-exec {
          background-color: #fcfdfd;
          font-weight: 700;
          text-align: center;
        }

        .exec-name-cell {
          display: flex;
          flex-direction: column;
          gap: 2px;
          align-items: center;
          justify-content: center;
        }

        .exec-name {
          font-weight: 800;
          font-size: 0.88rem;
          line-height: 1.3;
        }

        .exec-title {
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 600;
          opacity: 0.95;
        }

        .td-time {
          vertical-align: middle;
          font-weight: 800;
        }

        .time-end-text {
          font-size: 0.72rem;
          font-weight: 600;
          margin-top: 2px;
          opacity: 0.8;
        }

        .td-mission {
          vertical-align: top;
          font-weight: inherit;
          text-align: left;
        }

        .td-location {
          vertical-align: top;
          font-weight: inherit;
          text-align: left;
        }

        .td-agency {
          vertical-align: middle;
          font-weight: inherit;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .td-dress {
          vertical-align: middle;
          font-weight: inherit;
          overflow-wrap: break-word;
          word-break: break-word;
        }

        .text-center {
          text-align: center;
        }

        /* Executive Legend Bar */
        .executive-legend {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding: 16px 0 0 0;
          margin-top: 24px;
          border-top: 1px solid #f1f5f9;
          align-items: center;
        }

        .legend-title {
          font-size: 0.75rem;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
        }

        .legend-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: white;
          border: 1px solid #e2e8f0;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 0.72rem;
          font-weight: 600;
          color: #475569;
        }

        .legend-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
        }

        /* Footer */
        .main-footer {
          padding: 32px 0;
          text-align: center;
          color: #64748b;
          font-size: 0.85rem;
          border-top: 1px solid #e2e8f0;
          background: white;
          margin-top: auto;
        }

        .main-footer p {
          margin: 0;
          font-weight: 600;
        }

        /* Responsive design */
        @media (max-width: 1200px) {
          .main-layout {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .calendar-card {
            position: static;
          }
          /* Re-order elements in mobile view so calendar is on top */
          .calendar-section {
            order: -1;
          }
        }

        @media (max-width: 768px) {
          .container {
            padding: 0 16px;
          }
          .header-content {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
          .header-actions {
            width: 100%;
            overflow-x: auto;
            padding-bottom: 4px;
          }
          .detail-card {
            padding: 12px;
          }
          .table-container {
            padding: 8px;
          }
          .official-banner {
            padding: 16px 12px;
          }
          .banner-title {
            font-size: 1.05rem;
          }
          .banner-date {
            font-size: 0.9rem;
          }
          /* Hide agency/dress columns on mobile for column priority */
          .th-agency, .td-agency, .th-dress, .td-dress {
            display: none !important;
          }
        }

        /* Perfect Print Layout - Landscape A4 format identical to PDF/Excel sheet */
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            size: A4 landscape; /* Print landscape to fit the 6 columns beautifully */
            margin: 8mm 10mm; /* Tighten margins to fit more content on a single page */
          }
          html, body {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .main-header, .calendar-section, .header-actions, .main-footer, .nav-btn, .search-filter-bar, .executive-legend {
            display: none !important;
          }
          .app-container {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            height: auto !important;
          }
          .container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
          }
          .main-layout {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            height: auto !important;
          }
          .card {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
          }
          .detail-section,
          .detail-card,
          .schedule-list,
          .table-container,
          .table-responsive {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            flex: none !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .official-banner-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 0 20px 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .official-banner {
            border: none !important;
            color: black !important;
            padding: 12px 20px !important;
            margin-bottom: 20px !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .banner-seal {
            background: white !important;
            border: 1px solid rgba(0,0,0,0.1) !important;
          }
          .schedule-table {
            width: 100% !important;
            min-width: 100% !important;
            border-collapse: separate !important;
            border-spacing: 0 !important;
            border-top: 1px solid #000000 !important;
            border-left: 1px solid #000000 !important;
            border-bottom: none !important;
            border-right: none !important;
          }
          .schedule-table th,
          .schedule-table td {
            border-top: none !important;
            border-left: none !important;
            border-bottom: 1px solid #000000 !important;
            border-right: 1px solid #000000 !important;
            position: static !important;
            background-clip: border-box !important;
          }
          .schedule-row {
            break-inside: avoid !important;
          }
          
          /* Override mobile display: none !important to ensure columns show up in PDF print */
          .th-agency, .td-agency, .th-dress, .td-dress {
            display: table-cell !important;
          }

          /* Single Page Fit Styles */
          .print-fit-to-page .schedule-table td,
          .print-fit-to-page .schedule-table th {
            padding: 3px 5px !important;
            font-size: 11px !important;
            line-height: 1.1 !important;
          }
          .print-fit-to-page .official-banner {
            padding: 6px 10px !important;
            margin-bottom: 6px !important;
            border-radius: 4px !important;
          }
          .print-fit-to-page .banner-seal {
            width: 28px !important;
            height: 28px !important;
            border-width: 1px !important;
          }
          .print-fit-to-page .banner-title {
            font-size: 13px !important;
          }
          .print-fit-to-page .banner-date {
            font-size: 11px !important;
            margin-top: 2px !important;
            margin-bottom: 4px !important;
          }
          .print-fit-to-page .banner-footer {
            font-size: 8px !important;
          }
          .print-fit-to-page .exec-name {
            font-size: 11px !important;
          }
          .print-fit-to-page .exec-title {
            font-size: 9px !important;
          }
          .print-fit-to-page .time-end-text {
            font-size: 8px !important;
          }
          .print-fit-to-page .schedule-row {
            break-inside: auto !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  )
}
