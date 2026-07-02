'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import html2canvas from 'html2canvas'

interface Executive {
  id: string
  name: string
  color?: string
  title?: string
  order?: number
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

const formatDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
const WEEKDAYS_TH = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];

const toThaiDigits = (value: string | number) => {
  return String(value ?? "").replace(/[0-9]/g, digit => THAI_DIGITS[Number(digit)]);
}

const thaiSmartBreak = (text: string): string => {
  if (!text) return '';
  return text
    // 1. Prevent break inside "พ.ศ. 2569"
    .replace(/พ\.ศ\.\s+(\d+|[๐-๙]+)/g, 'พ.ศ.\u00A0$1')
    // 2. Prevent break inside "รุ่นที่ 85"
    .replace(/รุ่นที่\s+(\d+|[๐-๙]+)/g, 'รุ่นที่\u00A0$1')
    // 3. Prevent break inside "ครั้งที่ 5"
    .replace(/ครั้งที่\s+(\d+|[๐-๙]+)/g, 'ครั้งที่\u00A0$1')
    // 4. Prevent break inside "ชั้น 4"
    .replace(/ชั้น\s+(\d+|[๐-๙]+|M|G|B)/g, 'ชั้น\u00A0$1')
    // 5. Prevent break inside "หมู่ที่ 1"
    .replace(/หมู่ที่\s+(\d+|[๐-๙]+)/g, 'หมู่ที่\u00A0$1')
    // 6. Prevent break inside "อ.เมือง", "จ.ปทุมธานี", "ต.ประชาธิปัตย์"
    .replace(/(อ\.|ต\.|จ\.)\s+([ก-๙a-zA-Z]+)/g, '$1\u00A0$2')
    // 7. Prevent break before opening parenthesis and inside parenthesis
    .replace(/\s+\(([^)]+)\)/g, '\u00A0($1)')
    // 8. Prevent break inside "ประจำปีงบประมาณ พ.ศ."
    .replace(/(ประจำปีงบประมาณ|ปีงบประมาณ)\s+(พ\.ศ\.)/g, '$1\u00A0$2')
    // 9. Prevent break in numbers with units (e.g., "10 คน", "๐๘.๐๐ น.")
    .replace(/(\d+|[๐-๙]+)\s+(น\.|คน|ท่าน|ราย|ห้อง|แห่ง|เครื่อง|ชุด)/g, '$1\u00A0$2')
    // 10. Prevent break in time ranges like "เวลา 09.00 น."
    .replace(/เวลา\s+(\d+|[๐-๙]+)/g, 'เวลา\u00A0$1')
    // 11. Prevent break for building terms
    .replace(/(ห้องประชุม|อาคาร|ตึก|ศาลากลางจังหวัด)\s+([ก-๙a-zA-Z\d]+)/g, '$1\u00A0$2');
}

const formatThaiDateFull = (date: Date) => {
  const day = toThaiDigits(date.getDate());
  const month = THAI_MONTHS[date.getMonth()];
  const year = toThaiDigits(date.getFullYear() + 543);
  return `${WEEKDAYS_TH[date.getDay()]}ที่ ${day} ${month} ${year}`;
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

const getWeekdayHeaderStyle = (dayIndex: number) => {
  const styles = [
    { bg: "#ef4444", text: "#000000", border: "#dc2626" }, // Sunday (Red)
    { bg: "#facc15", text: "#000000", border: "#eab308" }, // Monday (Yellow)
    { bg: "#f472b6", text: "#000000", border: "#db2777" }, // Tuesday (Pink)
    { bg: "#22c55e", text: "#000000", border: "#16a34a" }, // Wednesday (Green)
    { bg: "#f97316", text: "#000000", border: "#ea580c" }, // Thursday (Orange)
    { bg: "#3b82f6", text: "#000000", border: "#2563eb" }, // Friday (Blue)
    { bg: "#a855f7", text: "#000000", border: "#9333ea" }  // Saturday (Purple)
  ];
  return styles[dayIndex] || { bg: "#22c55e", text: "#000000", border: "#16a34a" };
}

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


export default function SchedulesAdmin() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [executives, setExecutives] = useState<Executive[]>([])
  const [selectedDate, setSelectedDate] = useState(formatDateKey(new Date()))
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [downloadingImage, setDownloadingImage] = useState(false)
  const [currentSchedule, setCurrentSchedule] = useState<Partial<Schedule>>({})

  // Suggestion states
  const [historySuggestions, setHistorySuggestions] = useState<{
    missions: string[],
    locations: string[],
    agencies: string[],
    dressCodes: string[]
  }>({ missions: [], locations: [], agencies: [], dressCodes: [] })
  const [activeSuggestionField, setActiveSuggestionField] = useState<string | null>(null)

  // Word-like Print Settings State
  const [fontFamily, setFontFamily] = useState("'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', sans-serif")
  const [fontSize, setFontSize] = useState("16px")
  const [fontWeight, setFontWeight] = useState("normal")
  const [fontStyle, setFontStyle] = useState("normal")
  const [textDecoration, setTextDecoration] = useState("none")
  const [missionAlign, setMissionAlign] = useState("left")
  const [locationAlign, setLocationAlign] = useState("left")
  const [lineHeight, setLineHeight] = useState("1.5")
  const [cellPadding, setCellPadding] = useState("normal")
  const [fitToPage, setFitToPage] = useState(true)
  const [bannerFontSize, setBannerFontSize] = useState("20px")
  const [columnLayout, setColumnLayout] = useState("auto")
  
  // Column Visibility State
  const [colTimeVisible, setColTimeVisible] = useState(true)
  const [colLocationVisible, setColLocationVisible] = useState(true)
  const [colAgencyVisible, setColAgencyVisible] = useState(true)
  const [colDressVisible, setColDressVisible] = useState(true)

  // Live Print Preview Toggle
  const [printPreviewMode, setPrintPreviewMode] = useState(false)

  const getPreviewDateText = () => {
    if (!selectedDate) return ""
    const parts = selectedDate.split('-')
    if (parts.length !== 3) return ""
    const year = parseInt(parts[0])
    const month = parseInt(parts[1]) - 1
    const day = parseInt(parts[2])
    const date = new Date(year, month, day)
    if (isNaN(date.getTime())) return ""
    return formatThaiDateFull(date)
  }

  const getSelectedDayIndex = () => {
    if (!selectedDate) return 5;
    const parts = selectedDate.split('-');
    if (parts.length !== 3) return 5;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return isNaN(date.getTime()) ? 5 : date.getDay();
  }

  const selectedDayIndex = getSelectedDayIndex();

  const renderText = (text: string | null | undefined) => {
    if (!text) return '';
    
    let formatted = text;

    // Strip alignment markers before rendering
    formatted = formatted.replace(/^\{\{[CLR]\}\}/, '');

    // 2. Convert space before prepositions (like " ณ") to a newline
    formatted = formatted.replace(/\s+ณ\s*/g, '\nณ ');

    // 3. Keep single spaces as newlines if they are separators, but handle | or / or ;
    // Also convert 2 or more spaces to a newline as instructed in the hint
    formatted = formatted
      .replace(/\s*\|\s*/g, '\n')
      .replace(/\s+;\s+/g, '\n')
      .replace(/\s+\/\s+/g, '\n')
      .replace(/ {2,}/g, '\n');
    
    // 4. Prevent word-wrap break after common Thai prefixes/titles
    formatted = formatted.replace(/(นาย|นาง|นางสาว|ว่าที่ร้อยตรี|ดร\.|พล\.ต\.|พ\.ต\.|ร\.ต\.|ปลัดจังหวัด|ผู้ว่าราชการจังหวัด|รองผู้ว่าราชการจังหวัด)\s+/g, '$1\u00A0');

    // 5. Apply Thai smart line breaking to keep units like "พ.ศ. 2569" together
    formatted = thaiSmartBreak(formatted);
    
    // 6. Clean up consecutive newlines
    // Allow multiple newlines to preserve blank lines

    // Always convert Arabic digits to Thai digits for formal Thai document presentation
    formatted = toThaiDigits(formatted);
    
    return formatted.split('\n').map((line, i, arr) => {
      if (i === arr.length - 1) return <span key={i}>{line}</span>;
      return <span key={i}>{line}<br /></span>;
    });
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
    if (!text) return false;
    const cleaned = text.replace(/^\{\{[CLR]\}\}/, '').trim();
    return cleaned === '-';
  }

  // Get current alignment of a field value (reads marker prefix)
  const getFieldAlign = (value: string | null | undefined): string => {
    if (!value) return 'default';
    const match = value.match(/^\{\{([CLR])\}\}/);
    if (match) {
      return match[1] === 'C' ? 'center' : match[1] === 'R' ? 'right' : 'left';
    }
    return 'default'; // no marker = use toolbar default
  }

  // Set alignment marker on a field value
  const setFieldAlign = (value: string | null | undefined, align: string): string => {
    const cleanValue = (value || '').replace(/^\{\{[CLR]\}\}/, '').trim();
    if (align === 'default') return cleanValue; // remove marker
    const markerMap: Record<string, string> = { left: '{{L}}', center: '{{C}}', right: '{{R}}' };
    return (markerMap[align] || '') + cleanValue;
  }

  const headerStyle = getWeekdayHeaderStyle(selectedDayIndex);


  useEffect(() => {
    fetchExecutives()
    loadPrintSettings()
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    try {
      const res = await fetch('/api/schedules/suggestions')
      if (res.ok) {
        const data = await res.json()
        setHistorySuggestions(data)
      }
    } catch (e) {
      console.error("Failed to fetch suggestions", e)
    }
  }

  const getFilteredSuggestions = (field: 'mission' | 'location' | 'agency' | 'dressCode', currentVal: string | null | undefined) => {
    const list = 
      field === 'mission' ? historySuggestions.missions :
      field === 'location' ? historySuggestions.locations :
      field === 'agency' ? historySuggestions.agencies :
      historySuggestions.dressCodes;
    
    const val = (currentVal || '').toLowerCase().trim();
    if (!val) {
      return list.slice(0, 6);
    }
    return list.filter(item => item.toLowerCase().includes(val)).slice(0, 6);
  }

  useEffect(() => {
    fetchSchedules()
  }, [selectedDate])

  const fetchExecutives = async () => {
    const res = await fetch('/api/executives')
    const data = await res.json()
    setExecutives(data)
  }

  const fetchSchedules = async () => {
    setLoading(true)
    const res = await fetch(`/api/schedules?date=${selectedDate}`)
    const data = await res.json()
    setSchedules(data)
    setLoading(false)
  }

  const loadPrintSettings = () => {
    const saved = localStorage.getItem('printSettings')
    if (saved) {
      try {
        const config = JSON.parse(saved)
        if (config.fontFamily) setFontFamily(config.fontFamily)
        if (config.fontSize) setFontSize(config.fontSize)
        if (config.fontWeight) setFontWeight(config.fontWeight)
        if (config.fontStyle) setFontStyle(config.fontStyle)
        if (config.textDecoration) setTextDecoration(config.textDecoration)
        if (config.missionAlign) setMissionAlign(config.missionAlign)
        if (config.locationAlign) setLocationAlign(config.locationAlign)
        if (config.lineHeight) setLineHeight(config.lineHeight)
        if (config.cellPadding) setCellPadding(config.cellPadding)
        if (config.fitToPage !== undefined) setFitToPage(config.fitToPage)
        if (config.bannerFontSize) setBannerFontSize(config.bannerFontSize)
        if (config.columnLayout) setColumnLayout(config.columnLayout)
        
        if (config.visibleColumns) {
          setColTimeVisible(config.visibleColumns.time !== false)
          setColLocationVisible(config.visibleColumns.location !== false)
          setColAgencyVisible(config.visibleColumns.agency !== false)
          setColDressVisible(config.visibleColumns.dress !== false)
        }
      } catch (e) {
        console.error("Error loading print settings", e)
      }
    }
  }

  const savePrintSettings = (updates: any) => {
    const currentConfig = {
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle,
      textDecoration,
      missionAlign,
      locationAlign,
      lineHeight,
      cellPadding,
      fitToPage,
      bannerFontSize,
      visibleColumns: {
        time: colTimeVisible,
        location: colLocationVisible,
        agency: colAgencyVisible,
        dress: colDressVisible
      },
      ...updates
    }
    
    localStorage.setItem('printSettings', JSON.stringify(currentConfig))
    
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'printSettings', value: currentConfig })
    }).catch(e => console.error('Failed to save settings to DB', e));
    
    // Also save legacy compatibility options for older code references
    localStorage.setItem('printFontFamily', currentConfig.fontFamily)
    localStorage.setItem('printFontSize', currentConfig.fontSize)
  }

  const handleResetSettings = () => {
    const defaultConfig = {
      fontFamily: "'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', sans-serif",
      fontSize: "16px",
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      missionAlign: "left",
      locationAlign: "left",
      lineHeight: "1.5",
      cellPadding: "normal",
      fitToPage: true,
      bannerFontSize: "20px",
      visibleColumns: {
        time: true,
        location: true,
        agency: true,
        dress: true
      }
    }
    
    setFontFamily(defaultConfig.fontFamily)
    setFontSize(defaultConfig.fontSize)
    setFontWeight(defaultConfig.fontWeight)
    setFontStyle(defaultConfig.fontStyle)
    setTextDecoration(defaultConfig.textDecoration)
    setMissionAlign(defaultConfig.missionAlign)
    setLocationAlign(defaultConfig.locationAlign)
    setLineHeight(defaultConfig.lineHeight)
    setCellPadding(defaultConfig.cellPadding)
    setFitToPage(true)
    setBannerFontSize("20px")
    setColumnLayout("auto")
    setColTimeVisible(true)
    setColLocationVisible(true)
    setColAgencyVisible(true)
    setColDressVisible(true)
    
    localStorage.setItem('printSettings', JSON.stringify(defaultConfig))
    
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'printSettings', value: defaultConfig })
    }).catch(e => console.error('Failed to reset settings in DB', e));
    
    localStorage.setItem('printFontFamily', defaultConfig.fontFamily)
    localStorage.setItem('printFontSize', defaultConfig.fontSize)
  }

  const handleDownloadImage = async () => {
    const element = document.getElementById('admin-print-preview-page');
    if (!element) return;
    
    try {
      setDownloadingImage(true)
      
      const originalStyle = element.getAttribute('style') || '';

      const table = element.querySelector('table');
      const banner = element.querySelector('.preview-banner-container');
      
      // Measure actual content width
      const contentWidth = Math.max(
        table ? (table as HTMLElement).offsetWidth : 0,
        banner ? (banner as HTMLElement).offsetWidth : 0
      );
      
      let exactWidth = element.scrollWidth;
      if (contentWidth > 0) {
        const computed = window.getComputedStyle(element);
        const paddingX = (parseFloat(computed.paddingLeft) || 0) + (parseFloat(computed.paddingRight) || 0);
        exactWidth = contentWidth + paddingX;
      }

      // Save scroll positions and scroll to top
      const originalScrollTop = element.scrollTop;
      const originalScrollLeft = element.scrollLeft;
      const originalWindowScrollY = window.scrollY;
      const originalWindowScrollX = window.scrollX;
      
      element.scrollTop = 0;
      element.scrollLeft = 0;
      window.scrollTo(0, 0);

      // Force element to expand to full height
      element.style.setProperty('height', 'auto', 'important');
      element.style.setProperty('max-height', 'none', 'important');
      element.style.setProperty('aspect-ratio', 'auto', 'important');

      element.style.width = exactWidth + 'px';
      element.style.maxWidth = 'none';
      element.style.overflow = 'visible';
      
      const canvas = await html2canvas(element, {
        scrollY: 0,
        scrollX: 0,
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        windowWidth: Math.max(1200, exactWidth + 40),
        onclone: (clonedDoc) => {
          // Force relative positioning and background-clip on all table cells to resolve html2canvas rowspan border bugs
          const cells = clonedDoc.querySelectorAll('.preview-table th, .preview-table td');
          cells.forEach(cell => {
            const el = cell as HTMLElement;
            el.style.position = 'relative';
            el.style.backgroundClip = 'padding-box';
          });
          // Ensure all table rows are transparent during capture to prevent them from overlaying spanned cells
          const rows = clonedDoc.querySelectorAll('.preview-table tr');
          rows.forEach(row => {
            const el = row as HTMLElement;
            el.style.backgroundColor = 'transparent';
          });
        }
      });
      
      element.setAttribute('style', originalStyle);
      
      // Restore scroll positions
      element.scrollTop = originalScrollTop;
      element.scrollLeft = originalScrollLeft;
      window.scrollTo(originalWindowScrollX, originalWindowScrollY);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      link.download = `วาระงานผู้บริหารปทุมธานี_${selectedDate}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to download image', error);
      alert('เกิดข้อผิดพลาดในการสร้างไฟล์รูปภาพ');
    } finally {
      setDownloadingImage(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const method = currentSchedule.id ? 'PATCH' : 'POST'
    const url = currentSchedule.id ? `/api/schedules/${currentSchedule.id}` : '/api/schedules'

    // Empty fields are now allowed (no default "-")
    const payload = {
      ...currentSchedule,
      date: selectedDate,
      startTime: (currentSchedule.startTime || '').trim(),
      endTime: (currentSchedule.endTime || '').trim() || null,
      mission: (currentSchedule.mission || '').trim(),
      location: (currentSchedule.location || '').trim(),
      agency: (currentSchedule.agency || '').trim(),
      dressCode: (currentSchedule.dressCode || '').trim() || null,
    }

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      setIsEditing(false)
      setCurrentSchedule({})
      fetchSchedules()
      fetchSuggestions() // Refresh autocomplete history list
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('คุณแน่ใจหรือไม่ที่จะลบวาระงานผู้บริหารรายการนี้?')) {
      const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' })
      if (res.ok) fetchSchedules()
    }
  }

  const getPaddingStyle = () => {
    if (cellPadding === 'compact') return '6px 8px'
    if (cellPadding === 'loose') return '16px 14px'
    return '12px 10px' // normal
  }

  // Count active columns
  const activeColCount = 2 + (colTimeVisible ? 1 : 0) + (colLocationVisible ? 1 : 0) + (colAgencyVisible ? 1 : 0) + (colDressVisible ? 1 : 0)

  // Group schedules by executive for admin live preview
  const groupedPreviewSchedules = useMemo(() => {
    // Sort executives by order
    const sorted = [...executives].sort((a, b) => (a.order || 0) - (b.order || 0))
    return sorted.map(exec => {
      const execSchedules = schedules.filter(s => s.executiveId === exec.id)
      return {
        executive: exec,
        schedules: execSchedules
      }
    })
  }, [executives, schedules])

  // === SMART TABLE ALGORITHM ===

  const totalVisibleRows = useMemo(() => {
    return groupedPreviewSchedules.reduce((sum, g) => sum + Math.max(g.schedules.length, 1), 0)
  }, [groupedPreviewSchedules])

  const smartColWidths = useMemo(() => {
    if (columnLayout === 'auto') {
      return { exec: undefined, time: undefined, mission: undefined, location: undefined, agency: undefined, dress: undefined }
    }
    const bases = {
      exec: 15, time: colTimeVisible ? 8 : 0, mission: 38,
      location: colLocationVisible ? 16 : 0, agency: colAgencyVisible ? 12 : 0, dress: colDressVisible ? 11 : 0,
    }
    const usedTotal = Object.values(bases).reduce((a, b) => a + b, 0)
    const remainder = 100 - usedTotal
    const mainTotal = bases.exec + bases.mission
    bases.exec += remainder * (bases.exec / mainTotal)
    bases.mission += remainder * (bases.mission / mainTotal)
    return {
      exec: `${Math.round(bases.exec)}%`, time: `${Math.round(bases.time)}%`,
      mission: `${Math.round(bases.mission)}%`, location: `${Math.round(bases.location)}%`,
      agency: `${Math.round(bases.agency)}%`, dress: `${Math.round(bases.dress)}%`,
    }
  }, [colTimeVisible, colLocationVisible, colAgencyVisible, colDressVisible, columnLayout])

  const getContainerWidth = useCallback(() => {
    let numericSize = 16;
    if (fontSize && typeof fontSize === 'string') {
      const parsed = parseInt(fontSize.replace(/[^0-9]/g, ''));
      if (!isNaN(parsed)) numericSize = parsed;
    }
    const ratio = Math.max(1, numericSize / 16); 
    return `${Math.round(1080 * ratio)}px`;
  }, [fontSize]);



  return (
    <div className="admin-page">
      <div className="header">
        <div>
          <h1 className="title">จัดการวาระงานผู้บริหาร</h1>
          <p className="subtitle">เพิ่ม แก้ไข ค้นหา และลบข้อมูลวาระงานผู้บริหารรายวันของจังหวัดปทุมธานี</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className={`btn-admin ${printPreviewMode ? 'btn-admin-primary' : 'btn-admin-secondary'}`}
            onClick={() => setPrintPreviewMode(!printPreviewMode)}
          >
            <span>{printPreviewMode ? '🖥️ กลับหน้าจัดการปกติ' : '🖨️ พรีวิวก่อนพิมพ์'}</span>
          </button>
          <button className="btn-admin btn-admin-primary" onClick={() => { setIsEditing(true); setCurrentSchedule({ startTime: '08:30', executiveId: executives[0]?.id }); }}>
            <span>+ เพิ่มวาระงานใหม่</span>
          </button>
        </div>
      </div>

      {/* Word-like Formatting Toolbar */}
      <div className="admin-card word-toolbar-card">
        <div className="toolbar-header">
          <span className="toolbar-title">แถบจัดรูปแบบตัวอักษรและการพิมพ์ (Formatting Toolbar)</span>
          <button className="reset-btn" onClick={handleResetSettings}>คืนค่าเริ่มต้น</button>
        </div>
        
        <div className="toolbar-body">
          {/* Font Family Selector */}
          <div className="toolbar-section">
            <span className="section-label">รูปแบบฟอนต์</span>
            <select 
              className="toolbar-select font-family-select"
              value={fontFamily}
              onChange={e => { setFontFamily(e.target.value); savePrintSettings({ fontFamily: e.target.value }); }}
            >
              <option value="'TH Sarabun 9', 'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', sans-serif">TH Sarabun ๙ (ตัวเลขไทย)</option>
              <option value="'TH Sarabun New', 'TH Sarabun PSK', 'Sarabun', sans-serif">TH Sarabun New (ฟอนต์ราชการ)</option>
              <option value="'Sarabun', sans-serif">Sarabun (Google Fonts)</option>
              <option value="'Prompt', sans-serif">Prompt</option>
              <option value="'Kanit', sans-serif">Kanit</option>
              <option value="'Noto Sans Thai', sans-serif">Noto Sans Thai</option>
              <option value="'TH Niramit AS', sans-serif">TH Niramit AS</option>
              <option value="'TH Krub', sans-serif">TH Krub</option>
              <option value="'Mali', cursive">Mali</option>
              <option value="'Angsana New', 'AngsanaUPC', sans-serif">Angsana New</option>
              <option value="'Cordia New', 'CordiaUPC', sans-serif">Cordia New</option>
              <option value="inherit">ฟอนต์ระบบเริ่มต้น</option>
            </select>
          </div>

          {/* Banner Font Size */}
          <div className="toolbar-section">
            <span className="section-label">ขนาดหัวข้อใหญ่ (Banner)</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input 
                type="text" 
                className="toolbar-input size-input" 
                value={bannerFontSize}
                onChange={e => { setBannerFontSize(e.target.value); savePrintSettings({ bannerFontSize: e.target.value }); }}
                placeholder="e.g. 20px หรือ 14pt"
              />
              <select 
                className="toolbar-select size-select"
                value={["16px", "18px", "20px", "22px", "24px", "26px", "28px", "32px"].includes(bannerFontSize) ? bannerFontSize : "custom"}
                onChange={e => { 
                  if (e.target.value !== "custom") {
                    setBannerFontSize(e.target.value); 
                    savePrintSettings({ bannerFontSize: e.target.value }); 
                  }
                }}
              >
                <option value="16px">10pt (16px)</option>
                <option value="18px">12pt (18px)</option>
                <option value="20px">13.5pt (20px) *มาตรฐาน</option>
                <option value="22px">15pt (22px)</option>
                <option value="24px">16.5pt (24px)</option>
                <option value="26px">18pt (26px)</option>
                <option value="28px">19.5pt (28px)</option>
                <option value="32px">22pt (32px)</option>
                {!["16px", "18px", "20px", "22px", "24px", "26px", "28px", "32px"].includes(bannerFontSize) && (
                  <option value="custom">กำหนดเอง ({bannerFontSize})</option>
                )}
              </select>
            </div>
          </div>

          {/* Font Size Input */}
          <div className="toolbar-section">
            <span className="section-label">ขนาดอักษร (pt / px)</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input 
                type="text" 
                className="toolbar-input size-input" 
                value={fontSize}
                onChange={e => { setFontSize(e.target.value); savePrintSettings({ fontSize: e.target.value }); }}
                placeholder="e.g. 16px หรือ 12pt"
              />
              <select 
                className="toolbar-select size-select"
                value={["12px", "14px", "16px", "18px", "20px", "24px"].includes(fontSize) ? fontSize : "custom"}
                onChange={e => { 
                  if (e.target.value !== "custom") {
                    setFontSize(e.target.value); 
                    savePrintSettings({ fontSize: e.target.value }); 
                  }
                }}
              >
                <option value="12px">9pt (12px)</option>
                <option value="14px">10.5pt (14px)</option>
                <option value="16px">12pt (16px) *มาตรฐาน</option>
                <option value="18px">14pt (18px)</option>
                <option value="20px">16pt (20px)</option>
                <option value="24px">18pt (24px)</option>
                {!["12px", "14px", "16px", "18px", "20px", "24px"].includes(fontSize) && (
                  <option value="custom">กำหนดเอง ({fontSize})</option>
                )}
              </select>
            </div>
          </div>

          {/* Font Weight Controls */}
          <div className="toolbar-section">
            <span className="section-label">ลักษณะอักษร</span>
            <div className="btn-group">
              <button 
                className={`toolbar-btn ${fontWeight === 'bold' ? 'active' : ''}`}
                onClick={() => { const val = fontWeight === 'bold' ? 'normal' : 'bold'; setFontWeight(val); savePrintSettings({ fontWeight: val }); }}
                title="ตัวหนา"
              >
                <b style={{ fontFamily: 'serif' }}>B</b>
              </button>
              <button 
                className={`toolbar-btn ${fontStyle === 'italic' ? 'active' : ''}`}
                onClick={() => { const val = fontStyle === 'italic' ? 'normal' : 'italic'; setFontStyle(val); savePrintSettings({ fontStyle: val }); }}
                title="ตัวเอียง"
              >
                <i style={{ fontFamily: 'serif' }}>I</i>
              </button>
              <button 
                className={`toolbar-btn ${textDecoration === 'underline' ? 'active' : ''}`}
                onClick={() => { const val = textDecoration === 'underline' ? 'none' : 'underline'; setTextDecoration(val); savePrintSettings({ textDecoration: val }); }}
                title="ขีดเส้นใต้"
              >
                <u style={{ fontFamily: 'serif' }}>U</u>
              </button>
            </div>
          </div>

          {/* Line Height Selector */}
          <div className="toolbar-section">
            <span className="section-label">ระยะห่างบรรทัด</span>
            <select 
              className="toolbar-select"
              value={lineHeight}
              onChange={e => { setLineHeight(e.target.value); savePrintSettings({ lineHeight: e.target.value }); }}
            >
              <option value="1.0">1.0 (เบียดสุด)</option>
              <option value="1.15">1.15 (กระชับ)</option>
              <option value="1.25">1.25 (กำลังดี)</option>
              <option value="1.5">1.5 (มาตรฐาน)</option>
              <option value="1.8">1.8</option>
              <option value="2.0">2.0 (ห่าง)</option>
            </select>
          </div>

          {/* Cell Padding Selector */}
          <div className="toolbar-section">
            <span className="section-label">ระยะขอบเซลล์</span>
            <select 
              className="toolbar-select"
              value={cellPadding}
              onChange={e => { setCellPadding(e.target.value); savePrintSettings({ cellPadding: e.target.value }); }}
            >
              <option value="compact">ชิดขอบ (Compact)</option>
              <option value="normal">ขนาดปกติ (Normal)</option>
              <option value="loose">ระยะห่างกว้าง (Loose)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Column and Alignment formatting row */}
        <div className="toolbar-body secondary-toolbar">
          {/* Mission Alignment */}
          <div className="toolbar-section">
            <span className="section-label">จัดแนวภารกิจ</span>
            <div className="btn-group">
              <button className={`toolbar-btn ${missionAlign === 'left' ? 'active' : ''}`} onClick={() => { setMissionAlign('left'); savePrintSettings({ missionAlign: 'left' }); }}>ชิดซ้าย</button>
              <button className={`toolbar-btn ${missionAlign === 'center' ? 'active' : ''}`} onClick={() => { setMissionAlign('center'); savePrintSettings({ missionAlign: 'center' }); }}>จัดกลาง</button>
            </div>
          </div>

          {/* Location Alignment */}
          <div className="toolbar-section">
            <span className="section-label">จัดแนวสถานที่</span>
            <div className="btn-group">
              <button className={`toolbar-btn ${locationAlign === 'left' ? 'active' : ''}`} onClick={() => { setLocationAlign('left'); savePrintSettings({ locationAlign: 'left' }); }}>ชิดซ้าย</button>
              <button className={`toolbar-btn ${locationAlign === 'center' ? 'active' : ''}`} onClick={() => { setLocationAlign('center'); savePrintSettings({ locationAlign: 'center' }); }}>จัดกลาง</button>
            </div>
          </div>

          {/* Column Visibility Switches */}
          <div className="toolbar-section column-visibility-section">
            <span className="section-label">เปิด/ปิดคอลัมน์สำหรับการพิมพ์</span>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={colTimeVisible}
                  onChange={e => { setColTimeVisible(e.target.checked); savePrintSettings({ visibleColumns: { time: e.target.checked, location: colLocationVisible, agency: colAgencyVisible, dress: colDressVisible } }); }}
                /> เวลา
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={colLocationVisible}
                  onChange={e => { setColLocationVisible(e.target.checked); savePrintSettings({ visibleColumns: { time: colTimeVisible, location: e.target.checked, agency: colAgencyVisible, dress: colDressVisible } }); }}
                /> สถานที่
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={colAgencyVisible}
                  onChange={e => { setColAgencyVisible(e.target.checked); savePrintSettings({ visibleColumns: { time: colTimeVisible, location: colLocationVisible, agency: e.target.checked, dress: colDressVisible } }); }}
                /> หน่วยงาน
              </label>
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={colDressVisible}
                  onChange={e => { setColDressVisible(e.target.checked); savePrintSettings({ visibleColumns: { time: colTimeVisible, location: colLocationVisible, agency: colAgencyVisible, dress: e.target.checked } }); }}
                /> การแต่งกาย
              </label>
              <label className="checkbox-label" style={{ color: '#059669', fontWeight: 'bold', marginLeft: '16px', borderLeft: '1px solid #cbd5e1', paddingLeft: '16px' }}>
                <input 
                  type="checkbox" 
                  checked={fitToPage}
                  onChange={e => { setFitToPage(e.target.checked); savePrintSettings({ fitToPage: e.target.checked }); }}
                />
                <span>✅ บีบให้พอดีหน้าเดียวอัตโนมัติ (Auto Fit to Page)</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {printPreviewMode ? (
        /* LIVE PRINT PREVIEW MODE (LANDSCAPE A4 STYLE) */
        <div className="admin-card print-preview-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '1080px', alignItems: 'center', marginBottom: '20px' }} className="no-print">
            <div className="preview-label" style={{ marginBottom: 0 }}>จำลองเอกสารพิมพ์แนวนอน (A4 Landscape Print Preview)</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-admin btn-admin-primary" onClick={() => window.print()} style={{ background: '#166534' }}>
                🖨️ กดสั่งพิมพ์หน้านี้ทันที
              </button>
              <button 
                className="btn-admin" 
                onClick={handleDownloadImage} 
                disabled={downloadingImage}
                style={{ background: '#0284c7', color: 'white', borderColor: '#0369a1' }}
              >
                🖼️ {downloadingImage ? 'กำลังสร้างรูป...' : 'ดาวน์โหลดเป็นรูปภาพ (.jpg)'}
              </button>
            </div>
          </div>
          
          <div className={`a4-landscape-page ${fitToPage ? 'preview-fit-to-page' : ''}`} id="admin-print-preview-page" style={{ 
            fontFamily: fontFamily, 
            maxWidth: columnLayout === 'auto' ? 'none' : getContainerWidth(),
            width: columnLayout === 'auto' ? 'max-content' : '100%',
            aspectRatio: columnLayout === 'auto' ? 'auto' : '1.414'
          }}>
            {/* Seal and Title Banner */}
            <div className="preview-banner-container">
              <div className="preview-seal-logo">
                <img src="/seal.jpg" alt="ตราปทุมธานี" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div 
                className="preview-banner" 
                style={{ 
                  backgroundColor: getWeekdayBannerColor(selectedDayIndex),
                  fontFamily: fontFamily 
                }}
              >
                <h2 className="preview-banner-title" style={{ fontFamily: fontFamily, fontSize: bannerFontSize }}>
                  {renderText(`วาระงานผู้ว่าราชการจังหวัดและผู้บริหารของจังหวัดปทุมธานี ${getPreviewDateText()}`)}
                </h2>
                <div className="preview-banner-sub" style={{ fontFamily: fontFamily, fontSize: bannerFontSize }}>
                  {renderText(`จัดทำโดย สำนักงานจังหวัดปทุมธานี สามารถดาวน์โหลดข้อมูลได้ที่ www.pathumthani.go.th หัวข้อ "วาระงานผู้ว่าราชการจังหวัดและผู้บริหารของจังหวัดปทุมธานี"`)}
                </div>
              </div>
            </div>

            <table 
              className="preview-table"
              style={{ 
                fontFamily: fontFamily, 
                fontSize: fontSize,
                fontWeight: fontWeight,
                fontStyle: fontStyle,
                textDecoration: textDecoration,
                lineHeight: lineHeight,
                tableLayout: columnLayout === 'auto' ? 'auto' : 'fixed',
                width: columnLayout === 'auto' ? 'max-content' : '100%',
              }}
            >
              <thead>
                <tr>
                  <th style={{ width: smartColWidths.exec, padding: '12px 8px', backgroundColor: headerStyle.bg, color: headerStyle.text, borderColor: headerStyle.border }}>ผู้บริหาร</th>
                  {colTimeVisible && <th style={{ width: smartColWidths.time, padding: '12px 8px', backgroundColor: headerStyle.bg, color: headerStyle.text, borderColor: headerStyle.border }}>เวลา</th>}
                  <th style={{ width: smartColWidths.mission, padding: '12px 8px', backgroundColor: headerStyle.bg, color: headerStyle.text, borderColor: headerStyle.border }}>วาระงาน</th>
                  {colLocationVisible && <th style={{ width: smartColWidths.location, padding: '12px 8px', backgroundColor: headerStyle.bg, color: headerStyle.text, borderColor: headerStyle.border }}>สถานที่</th>}
                  {colAgencyVisible && <th style={{ width: smartColWidths.agency, padding: '12px 8px', backgroundColor: headerStyle.bg, color: headerStyle.text, borderColor: headerStyle.border }}>หน่วยงาน</th>}
                  {colDressVisible && <th style={{ width: smartColWidths.dress, padding: '12px 8px', backgroundColor: headerStyle.bg, color: headerStyle.text, borderColor: headerStyle.border }}>การแต่งกาย</th>}
                </tr>
              </thead>
              <tbody>
                {groupedPreviewSchedules.map(group => {
                  const exec = group.executive;
                  const execSchedules = group.schedules;
                  
                  if (execSchedules.length === 0) {
                    return (
                      <tr key={exec.id} style={{ color: exec.color === '#000000' ? '#1e293b' : exec.color }}>
                        <td style={{ padding: getPaddingStyle(), textAlign: 'center', fontWeight: 'inherit', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ color: exec.color === '#000000' ? '#1e293b' : exec.color }}>{exec.name}</div>
                          <div style={{ fontWeight: 'inherit', color: exec.color === '#000000' ? '#1e293b' : exec.color }}>{exec.title}</div>
                        </td>
                        {colTimeVisible && <td style={{ padding: getPaddingStyle(), textAlign: 'center', fontWeight: 'inherit' }}>-</td>}
                        <td style={{ padding: getPaddingStyle(), textAlign: missionAlign === 'center' ? 'center' : 'left', fontWeight: 'inherit' }}>ปฏิบัติราชการปกติ</td>
                        {colLocationVisible && <td style={{ padding: getPaddingStyle(), textAlign: locationAlign === 'center' ? 'center' : 'left', fontWeight: 'inherit' }}>ศาลากลางจังหวัดปทุมธานี</td>}
                        {colAgencyVisible && <td style={{ padding: getPaddingStyle(), textAlign: 'center', fontWeight: 'inherit' }}>-</td>}
                        {colDressVisible && <td style={{ padding: getPaddingStyle(), textAlign: 'center', fontWeight: 'inherit' }}>-</td>}
                      </tr>
                    );
                  }

                  // Precalculate spans for location, agency, and dressCode within this executive's list
                  const agencySpans = getSpans(execSchedules, 'agency');
                  const dressSpans = getSpans(execSchedules, s => s.dressCode);
                  const locationSpans = getSpans(execSchedules, 'location');

                  return execSchedules.map((s, index) => (
                    <tr key={s.id} style={{ color: exec.color === '#000000' ? '#1e293b' : exec.color }}>
                      {index === 0 && (
                        <td 
                          rowSpan={execSchedules.length}
                          style={{ padding: getPaddingStyle(), textAlign: 'center', fontWeight: 'inherit', verticalAlign: 'middle', whiteSpace: 'nowrap' }}
                        >
                          <div style={{ color: exec.color === '#000000' ? '#1e293b' : exec.color }}>{exec.name}</div>
                          <div style={{ fontWeight: 'inherit', color: exec.color === '#000000' ? '#1e293b' : exec.color }}>{exec.title}</div>
                        </td>
                      )}
                      {colTimeVisible && (
                        <td style={{ padding: getPaddingStyle(), textAlign: 'center', fontWeight: 'inherit' }}>
                          {isDash(s.startTime) ? '-' : toThaiDigits(s.startTime)}
                        </td>
                      )}
                      <td style={{ padding: getPaddingStyle(), overflowWrap: 'break-word', wordBreak: 'break-word', verticalAlign: isDash(s.mission) ? 'middle' : 'top', fontWeight: 'inherit' }}>
                        {(() => {
                          const { text: mText, align: mItemAlign } = extractItemAlign(s.mission);
                          const effectiveAlign = isDash(s.mission) ? 'center' : (mItemAlign || (missionAlign === 'center' ? 'center' : 'left'));
                          return <div style={{ whiteSpace: 'pre-wrap', textAlign: effectiveAlign as any }}>{renderText(mText)}</div>;
                        })()}
                      </td>
                      {colLocationVisible && locationSpans[index].show && (
                        <td 
                          rowSpan={locationSpans[index].span}
                          style={{ padding: getPaddingStyle(), overflowWrap: 'break-word', wordBreak: 'break-word', verticalAlign: isDash(s.location) ? 'middle' : 'top', fontWeight: 'inherit' }}
                        >
                          {(() => {
                            const { text: lText, align: lItemAlign } = extractItemAlign(s.location);
                            const effectiveAlign = isDash(s.location) ? 'center' : (lItemAlign || (locationAlign === 'center' ? 'center' : 'left'));
                            return <div style={{ whiteSpace: 'pre-wrap', textAlign: effectiveAlign as any }}>{renderText(lText)}</div>;
                          })()}
                        </td>
                      )}
                      {colAgencyVisible && agencySpans[index].show && (
                        <td 
                          rowSpan={agencySpans[index].span}
                          style={{ padding: getPaddingStyle(), overflowWrap: 'break-word', wordBreak: 'break-word', fontWeight: 'inherit' }}
                        >
                          {(() => {
                            const { text: aText, align: aItemAlign } = extractItemAlign(s.agency);
                            const effectiveAlign = isDash(s.agency) ? 'center' : (aItemAlign || 'left');
                            return <div style={{ whiteSpace: 'pre-wrap', textAlign: effectiveAlign as any }}>{renderText(aText)}</div>;
                          })()}
                        </td>
                      )}
                      {colDressVisible && dressSpans[index].show && (
                        <td 
                          rowSpan={dressSpans[index].span}
                          style={{ padding: getPaddingStyle(), overflowWrap: 'break-word', wordBreak: 'break-word', fontWeight: 'inherit' }}
                        >
                          {(() => {
                            const { text: dText, align: dItemAlign } = extractItemAlign(s.dressCode);
                            const effectiveAlign = isDash(s.dressCode) ? 'center' : (dItemAlign || 'left');
                            return <div style={{ whiteSpace: 'pre-wrap', textAlign: effectiveAlign as any }}>{renderText(dText)}</div>;
                          })()}
                        </td>
                      )}
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* NORMAL MANAGEMENT VIEW */
        <>
          <div className="filter-bar admin-card">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontWeight: 800 }}>ดูวาระงานประจำวันที่:</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input 
                  className="form-input" 
                  type="date" 
                  value={selectedDate} 
                  onChange={e => setSelectedDate(e.target.value)} 
                  style={{ maxWidth: '200px' }}
                />
                <span className="text-slate-400">พบทั้งหมด {schedules.length} วาระงาน</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">กำลังดึงข้อมูลวาระงาน...</div>
          ) : (
            <div className="admin-card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>เวลา</th>
                    <th style={{ width: '180px' }}>ผู้บริหาร</th>
                    <th>กำหนดการ / ภารกิจ</th>
                    <th>สถานที่</th>
                    <th style={{ width: '160px' }}>การจัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="empty-state">
                        ไม่มีวาระงานที่บันทึกไว้สำหรับวันนี้
                      </td>
                    </tr>
                  ) : schedules.map(s => (
                    <tr key={s.id}>
                      <td className="font-mono">
                        <span className="time-badge">{s.startTime} {s.endTime ? `- ${s.endTime}` : ''}</span>
                      </td>
                      <td className="font-semibold">
                        <span 
                          style={{ 
                            backgroundColor: s.executive.color || '#64748b', 
                            display: 'inline-block', 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '50%', 
                            marginRight: '8px',
                            verticalAlign: 'middle'
                          }}
                        ></span>
                        <span style={{ verticalAlign: 'middle' }}>{s.executive.name}</span>
                      </td>
                      <td>
                        <div className="mission-text">{s.mission}</div>
                        <div className="agency-text">หน่วยงาน: {s.agency}</div>
                      </td>
                      <td>
                        <div className="location-text">{s.location}</div>
                        {s.dressCode && <div className="dress-text">การแต่งกาย: {s.dressCode}</div>}
                      </td>
                      <td>
                        <div className="flex-actions">
                          <button className="btn-admin btn-admin-secondary btn-sm" onClick={() => { setCurrentSchedule(s); setIsEditing(true); }}>แก้ไข</button>
                          <button className="btn-admin btn-admin-danger btn-sm" onClick={() => handleDelete(s.id)}>ลบ</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {isEditing && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: '800px' }}>
            <h2 className="modal-title">{currentSchedule.id ? 'แก้ไขข้อมูล' : 'เพิ่มข้อมูล'}วาระงาน</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">ผู้บริหาร</label>
                <select 
                  className="form-input"
                  value={currentSchedule.executiveId || ''} 
                  onChange={e => setCurrentSchedule({...currentSchedule, executiveId: e.target.value})}
                  required
                >
                  <option value="">เลือกผู้บริหาร</option>
                  {executives.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">เวลาเริ่มต้น (ไม่บังคับ)</label>
                  <input className="form-input" type="text" value={currentSchedule.startTime || ''} onChange={e => setCurrentSchedule({...currentSchedule, startTime: e.target.value})} placeholder="e.g. 08:30 หรือเว้นว่าง" />
                </div>
                <div className="form-group">
                  <label className="form-label">เวลาสิ้นสุด (ไม่บังคับ)</label>
                  <input className="form-input" type="text" value={currentSchedule.endTime || ''} onChange={e => setCurrentSchedule({...currentSchedule, endTime: e.target.value})} placeholder="e.g. 16:30 หรือเว้นว่าง" />
                </div>
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>รายละเอียดกำหนดการ / ภารกิจ</label>
                  <div className="align-toggle-group">
                    {['default', 'left', 'center', 'right'].map(a => (
                      <button key={a} type="button" className={`align-toggle-btn ${getFieldAlign(currentSchedule.mission) === a ? 'active' : ''}`}
                        onClick={() => setCurrentSchedule({...currentSchedule, mission: setFieldAlign(currentSchedule.mission, a)})}
                      >{a === 'default' ? 'ค่าเดิม' : a === 'left' ? '≡ ซ้าย' : a === 'center' ? '≡ กลาง' : '≡ ขวา'}</button>
                    ))}
                  </div>
                </div>
                <textarea 
                  className="form-input" 
                  style={{ height: '100px', resize: 'vertical' }} 
                  value={currentSchedule.mission || ''} 
                  onChange={e => setCurrentSchedule({...currentSchedule, mission: e.target.value})} 
                  onFocus={() => setActiveSuggestionField('mission')}
                  onBlur={() => setActiveSuggestionField(null)}
                  placeholder="ระบุภารกิจหรือรายละเอียดกิจกรรม (ไม่บังคับ)" 
                />
                {activeSuggestionField === 'mission' && getFilteredSuggestions('mission', currentSchedule.mission).length > 0 && (
                  <div className="suggestions-dropdown">
                    {getFilteredSuggestions('mission', currentSchedule.mission).map((item, idx) => (
                      <div 
                        key={idx} 
                        className="suggestion-item" 
                        onMouseDown={() => setCurrentSchedule({...currentSchedule, mission: item})}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
                <span className="input-hint">คำแนะนำ: เคาะวรรค 2 ครั้ง (Double Space) หรือกด Enter เพื่อขึ้นบรรทัดใหม่</span>
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>สถานที่</label>
                  <div className="align-toggle-group">
                    {['default', 'left', 'center', 'right'].map(a => (
                      <button key={a} type="button" className={`align-toggle-btn ${getFieldAlign(currentSchedule.location) === a ? 'active' : ''}`}
                        onClick={() => setCurrentSchedule({...currentSchedule, location: setFieldAlign(currentSchedule.location, a)})}
                      >{a === 'default' ? 'ค่าเดิม' : a === 'left' ? '≡ ซ้าย' : a === 'center' ? '≡ กลาง' : '≡ ขวา'}</button>
                    ))}
                  </div>
                </div>
                <textarea 
                  className="form-input" 
                  style={{ height: '80px', resize: 'vertical' }} 
                  value={currentSchedule.location || ''} 
                  onChange={e => setCurrentSchedule({...currentSchedule, location: e.target.value})} 
                  onFocus={() => setActiveSuggestionField('location')}
                  onBlur={() => setActiveSuggestionField(null)}
                  placeholder="e.g. ห้องประชุมบัวหลวง ชั้น ๕ / ศาลากลางจังหวัดปทุมธานี (ไม่บังคับ)" 
                />
                {activeSuggestionField === 'location' && getFilteredSuggestions('location', currentSchedule.location).length > 0 && (
                  <div className="suggestions-dropdown">
                    {getFilteredSuggestions('location', currentSchedule.location).map((item, idx) => (
                      <div 
                        key={idx} 
                        className="suggestion-item" 
                        onMouseDown={() => setCurrentSchedule({...currentSchedule, location: item})}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
                <span className="input-hint">คำแนะนำ: เคาะวรรค 2 ครั้ง (Double Space) หรือกด Enter เพื่อแยกบรรทัดสถานที่</span>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>หน่วยงานเจ้าภาพ</label>
                    <div className="align-toggle-group">
                      {['default', 'left', 'center', 'right'].map(a => (
                        <button key={a} type="button" className={`align-toggle-btn ${getFieldAlign(currentSchedule.agency) === a ? 'active' : ''}`}
                          onClick={() => setCurrentSchedule({...currentSchedule, agency: setFieldAlign(currentSchedule.agency, a)})}
                        >{a === 'default' ? 'ค่าเดิม' : a === 'left' ? '≡ ซ้าย' : a === 'center' ? '≡ กลาง' : '≡ ขวา'}</button>
                      ))}
                    </div>
                  </div>
                  <textarea 
                    className="form-input" 
                    style={{ height: '80px', resize: 'vertical' }}
                    value={currentSchedule.agency || ''} 
                    onChange={e => setCurrentSchedule({...currentSchedule, agency: e.target.value})} 
                    onFocus={() => setActiveSuggestionField('agency')}
                    onBlur={() => setActiveSuggestionField(null)}
                    placeholder="e.g. สำนักงานจังหวัดปทุมธานี (ไม่บังคับ)" 
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>คำแนะนำ: เคาะวรรค 2 ครั้ง (Double Space) หรือกด Enter เพื่อขึ้นบรรทัดใหม่</div>
                  {activeSuggestionField === 'agency' && getFilteredSuggestions('agency', currentSchedule.agency).length > 0 && (
                    <div className="suggestions-dropdown">
                      {getFilteredSuggestions('agency', currentSchedule.agency).map((item, idx) => (
                        <div 
                          key={idx} 
                          className="suggestion-item" 
                          onMouseDown={() => setCurrentSchedule({...currentSchedule, agency: item})}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group" style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>การแต่งกาย</label>
                    <div className="align-toggle-group">
                      {['default', 'left', 'center', 'right'].map(a => (
                        <button key={a} type="button" className={`align-toggle-btn ${getFieldAlign(currentSchedule.dressCode) === a ? 'active' : ''}`}
                          onClick={() => setCurrentSchedule({...currentSchedule, dressCode: setFieldAlign(currentSchedule.dressCode, a)})}
                        >{a === 'default' ? 'ค่าเดิม' : a === 'left' ? '≡ ซ้าย' : a === 'center' ? '≡ กลาง' : '≡ ขวา'}</button>
                      ))}
                    </div>
                  </div>
                  <textarea 
                    className="form-input" 
                    style={{ height: '80px', resize: 'vertical' }} 
                    value={currentSchedule.dressCode || ''} 
                    onChange={e => setCurrentSchedule({...currentSchedule, dressCode: e.target.value})} 
                    onFocus={() => setActiveSuggestionField('dressCode')}
                    onBlur={() => setActiveSuggestionField(null)}
                    placeholder="e.g. เครื่องแบบราชการสีกากี / คอพับแขนยาว" 
                  />
                  {activeSuggestionField === 'dressCode' && getFilteredSuggestions('dressCode', currentSchedule.dressCode).length > 0 && (
                    <div className="suggestions-dropdown">
                      {getFilteredSuggestions('dressCode', currentSchedule.dressCode).map((item, idx) => (
                        <div 
                          key={idx} 
                          className="suggestion-item" 
                          onMouseDown={() => setCurrentSchedule({...currentSchedule, dressCode: item})}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                  <span className="input-hint">คำแนะนำ: เคาะวรรค 2 ครั้ง (Double Space) หรือกด Enter เพื่อแยกบรรทัดประเภทชุด</span>
                </div>
              </div>
              <div className="actions">
                <button type="submit" className="btn-admin btn-admin-primary">บันทึกวาระงาน</button>
                <button type="button" className="btn-admin btn-admin-secondary" onClick={() => setIsEditing(false)}>ยกเลิก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .admin-page { max-width: 1200px; padding-bottom: 60px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .title { font-size: 1.875rem; font-weight: 700; color: #0f172a; margin: 0; }
        .subtitle { color: #64748b; margin-top: 4px; }
        
        /* Word Toolbar Card */
        .word-toolbar-card {
          padding: 16px 20px;
          margin-bottom: 24px;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
        }

        .toolbar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 1px dashed #cbd5e1;
          padding-bottom: 8px;
        }

        .toolbar-title {
          font-weight: 800;
          font-size: 0.88rem;
          color: #334155;
          text-transform: uppercase;
        }

        .reset-btn {
          background: transparent;
          border: none;
          color: #b91c1c;
          font-weight: 800;
          font-size: 0.8rem;
          cursor: pointer;
        }

        .reset-btn:hover {
          text-decoration: underline;
        }

        .toolbar-body {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: center;
        }

        .secondary-toolbar {
          margin-top: 12px;
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
        }

        .toolbar-section {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .section-label {
          font-size: 0.72rem;
          font-weight: 800;
          color: #64748b;
        }

        .toolbar-select {
          padding: 6px 20px 6px 8px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.82rem;
          font-family: inherit;
          background: white !important;
          color: #334155 !important;
          outline: none;
          flex-shrink: 0;
        }

        .toolbar-select option {
          background: white !important;
          color: #334155 !important;
        }

        .font-family-select {
          min-width: 200px;
          flex-shrink: 0;
        }

        .toolbar-input {
          padding: 6px 8px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.82rem;
          font-family: inherit;
          background: white !important;
          color: #334155 !important;
          outline: none;
          flex-shrink: 0;
        }

        .size-input {
          width: 90px;
          flex-shrink: 0;
        }

        .size-select {
          width: 130px;
          flex-shrink: 0;
        }

        .btn-group {
          display: flex;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #cbd5e1;
        }

        .toolbar-btn {
          padding: 6px 12px;
          background: white;
          border: none;
          border-right: 1px solid #cbd5e1;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          color: #475569;
          transition: all 0.15s;
        }

        .toolbar-btn:last-child {
          border-right: none;
        }

        .toolbar-btn:hover {
          background: #f1f5f9;
        }

        .toolbar-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .column-visibility-section {
          flex: 1;
          min-width: 300px;
        }

        .checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          margin-top: 4px;
        }

        .checkbox-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #475569;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
        }

        /* Landscape A4 Print Preview Container */
        .print-preview-container {
          padding: 24px;
          background: #475569;
          border-radius: 16px;
          border: 1px solid #334155;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          overflow-x: auto;
        }

        .preview-label {
          color: #e2e8f0;
          font-weight: 800;
          font-size: 0.95rem;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .a4-landscape-page {
          width: 100%;
          max-width: 1080px;
          aspect-ratio: 1.414; /* A4 Landscape ratio */
          background: white;
          box-shadow: 0 10px 25px rgba(0,0,0,0.3);
          padding: 20mm 15mm;
          overflow-y: auto;
          box-sizing: border-box;
          border: 1px solid #cbd5e1;
        }

        .preview-banner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          margin-bottom: 16px;
        }

        .preview-seal-logo {
          width: 76px;
          height: 76px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0,0,0,0.1);
          margin-bottom: 8px;
        }

        .preview-banner {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          border: none;
          color: black !important;
          padding: 8px 16px;
          width: 100%;
          box-sizing: border-box;
          gap: 2px;
        }

        .preview-banner-title {
          font-size: 1rem;
          font-weight: 800;
          margin: 0;
          color: black;
        }

        .preview-banner-sub {
          font-size: 0.72rem;
          font-weight: 800;
          margin: 0;
          color: black;
        }

        .preview-table {
          width: 100%;
          min-width: 900px;
          border-collapse: separate;
          border-spacing: 0;
          border-top: 1px solid #000000;
          border-left: 1px solid #000000;
          color: black;
          background: white;
        }

        .preview-table td {
          /* Allow native Thai word breaking, avoid middle-of-word breaks */
          word-break: normal;
          overflow-wrap: break-word;
        }

        .preview-table th,
        .preview-table td {
          font-family: inherit;
          font-size: inherit;
          border-top: none !important;
          border-left: none !important;
          border-bottom: 1px solid #000000 !important;
          border-right: 1px solid #000000 !important;
          position: relative;
          background-clip: padding-box;
        }

        /* Default Admin View Styling */
        .filter-bar { margin-bottom: 24px; padding: 16px 24px; }
        .text-slate-400 { color: #94a3b8; font-size: 0.875rem; }
        
        .modal-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin-bottom: 24px; }
        .input-hint { font-size: 0.72rem; color: #64748b; margin-top: 4px; display: block; font-weight: 500; }

        .align-toggle-group {
          display: flex;
          gap: 0;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .align-toggle-btn {
          padding: 4px 12px;
          background: #f8fafc;
          border: none;
          border-right: 1px solid #e2e8f0;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          color: #475569;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .align-toggle-btn:last-child { border-right: none; }
        .align-toggle-btn:hover { background: #e2e8f0; color: #1e293b; }
        .align-toggle-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
        .form-row { display: flex; gap: 16px; }
        .form-row > .form-group { flex: 1; }
        .actions { display: flex; gap: 12px; margin-top: 32px; }
        
        .suggestions-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          z-index: 9999;
          max-height: 200px;
          overflow-y: auto;
          margin-top: 4px;
        }
        .suggestion-item {
          padding: 8px 12px;
          cursor: pointer;
          font-size: 0.82rem;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
          white-space: pre-line;
          transition: background 0.15s;
          text-align: left;
        }
        .suggestion-item:last-child {
          border-bottom: none;
        }
        .suggestion-item:hover {
          background: #eff6ff;
          color: #1d4ed8;
        }
        
        .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
        .font-semibold { font-weight: 600; color: #1e293b; }
        .time-badge { background: #eff6ff; color: #2563eb; padding: 4px 8px; border-radius: 6px; font-weight: 600; font-size: 0.8125rem; }
        
        .mission-text { color: #1e293b; font-weight: 500; line-height: 1.4; white-space: pre-wrap; }
        .agency-text { color: #64748b; font-size: 0.75rem; margin-top: 4px; white-space: pre-wrap; }
        .location-text { color: #475569; font-size: 0.875rem; white-space: pre-wrap; }
        .dress-text { color: #64748b; font-size: 0.75rem; margin-top: 4px; white-space: pre-wrap; }
        
        .flex-actions { display: flex; gap: 8px; }
        .btn-sm { padding: 6px 12px; font-size: 0.75rem; }
        
        .empty-state { padding: 60px; text-align: center; color: #94a3b8; font-style: italic; }
        .loading-state { padding: 40px; text-align: center; color: #64748b; background: white; border-radius: 12px; border: 1px dashed #cbd5e1; }

        /* Preview Fit-to-page styles */
        .preview-fit-to-page {
          padding: 8mm 10mm !important;
          aspect-ratio: 1.414 !important;
          overflow-y: auto !important; /* Allow scroll instead of hiding content */
        }
        .preview-fit-to-page .preview-table td,
        .preview-fit-to-page .preview-table th {
          padding: 3px 5px !important;
          line-height: 1.1 !important;
        }
        .preview-fit-to-page .preview-banner {
          padding: 6px 10px !important;
          margin-bottom: 6px !important;
        }
        .preview-fit-to-page .preview-seal-logo {
          width: 52px !important;
          height: 52px !important;
        }
        .preview-fit-to-page .preview-banner-title {
          font-size: 1.1em;
        }
        .preview-fit-to-page .preview-banner-sub {
          font-size: 0.9em;
        }

        /* QoL Admin Direct Printing Layout */
        @media print {
          html, body {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .admin-nav, .header, .word-toolbar-card, .filter-bar, .admin-card:not(.print-preview-container), .no-print, button, .modal-backdrop {
            display: none !important;
          }
          .admin-page {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .print-preview-container {
            background: transparent !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .a4-landscape-page {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
            aspect-ratio: auto !important;
          }
          .preview-banner-container {
            width: 100% !important;
            max-width: 100% !important;
          }
          .preview-banner {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .preview-table {
            width: 100% !important;
            max-width: 100% !important;
            border-collapse: separate !important;
            border-spacing: 0 !important;
            border-top: 1px solid #000000 !important;
            border-left: 1px solid #000000 !important;
            border-bottom: none !important;
            border-right: none !important;
          }
          .preview-table th, .preview-table td {
            border-top: none !important;
            border-left: none !important;
            border-bottom: 1px solid #000000 !important;
            border-right: 1px solid #000000 !important;
            position: static !important;
            background-clip: border-box !important;
          }
          @page {
            size: A4 landscape;
            margin: 8mm 10mm;
          }
          /* Apply the same compact styles for printing when fitToPage is active */
          .preview-fit-to-page .preview-table td,
          .preview-fit-to-page .preview-table th {
            padding: 3px 5px !important;
            line-height: 1.1 !important;
          }
          .preview-fit-to-page .preview-banner {
            padding: 6px 10px !important;
            margin-bottom: 6px !important;
          }
          .preview-fit-to-page .preview-seal-logo {
            width: 28px !important;
            height: 28px !important;
          }
          .preview-fit-to-page .preview-banner-title {
            font-size: 13px;
          }
          .preview-fit-to-page .preview-banner-sub {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  )
}
