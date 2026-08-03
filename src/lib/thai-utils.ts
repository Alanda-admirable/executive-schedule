export const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export const THAI_DIGITS = ["๐", "๑", "๒", "๓", "๔", "๕", "๖", "๗", "๘", "๙"];
export const WEEKDAYS_TH = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
export const WEEKDAYS_SHORT_TH = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

export const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const toThaiDigits = (value: string | number): string => {
  return String(value ?? "").replace(/(\*\d+\*)|([0-9])/g, (match, escaped, digit) => {
    if (escaped) {
      return escaped.slice(1, -1);
    }
    return THAI_DIGITS[Number(digit)];
  });
};

export const thaiSmartBreak = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/พ\.ศ\.[ \t]+(\d+|[๐-๙]+)/g, 'พ.ศ.\u00A0$1')
    .replace(/รุ่นที่[ \t]+(\d+|[๐-๙]+)/g, 'รุ่นที่\u00A0$1')
    .replace(/ครั้งที่[ \t]+(\d+|[๐-๙]+)/g, 'ครั้งที่\u00A0$1')
    .replace(/ชั้น[ \t]+(\d+|[๐-๙]+|M|G|B)/g, 'ชั้น\u00A0$1')
    .replace(/หมู่ที่[ \t]+(\d+|[๐-๙]+)/g, 'หมู่ที่\u00A0$1')
    .replace(/(อ\.|ต\.|จ\.)[ \t]+([ก-๙a-zA-Z]+)/g, '$1\u00A0$2')
    .replace(/[ \t]+\(([^)]+)\)/g, '\u00A0($1)')
    .replace(/(ประจำปีงบประมาณ|ปีงบประมาณ)[ \t]+(พ\.ศ\.)/g, '$1\u00A0$2')
    .replace(/(\d+|[๐-๙]+)[ \t]*(น\.|คน|ท่าน|ราย|ห้อง|แห่ง|เครื่อง|ชุด)/g, '$1\u00A0$2')
    .replace(/เวลา[ \t]+(\d+|[๐-๙]+)/g, 'เวลา\u00A0$1')
    .replace(/(ห้องประชุม|อาคาร|ตึก|ศาลากลางจังหวัด)[ \t]+([ก-๙a-zA-Z\d]+)/g, '$1\u00A0$2');
};

export const formatThaiDateFull = (date: Date): string => {
  const day = toThaiDigits(date.getDate());
  const month = THAI_MONTHS[date.getMonth()];
  const year = toThaiDigits(date.getFullYear() + 543);
  return `${WEEKDAYS_TH[date.getDay()]}ที่ ${day} ${month} ${year}`;
};

export const formatThaiTime = (timeStr: string): string => {
  if (!timeStr || timeStr.trim() === '-' || timeStr.trim() === '') return timeStr?.trim() === '-' ? '-' : '';
  const clean = timeStr.replace(":", ".").replace(/\s*น\s*\.?$/, "");
  return toThaiDigits(clean);
};

export const extractItemAlign = (text: string | null | undefined): { text: string; align: string | null } => {
  if (!text) return { text: '', align: null };
  const match = text.match(/^\{\{([CLR])\}\}/);
  if (match) {
    const alignMap: Record<string, string> = { C: 'center', L: 'left', R: 'right' };
    return { text: text.replace(/^\{\{[CLR]\}\}/, '').replace(/^\s+/, ''), align: alignMap[match[1]] || null };
  }
  return { text, align: null };
};

export const isDash = (text: string | null | undefined): boolean => {
  if (!text) return false;
  const cleaned = text.replace(/^\{\{[CLR]\}\}/, '').trim();
  return cleaned === '-';
};

export const getSpans = (schedules: any[], field: string | ((s: any) => string | null)) => {
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

export const getWeekdayHeaderStyle = (dayIndex: number) => {
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
};

export const getWeekdayBannerColor = (dayIndex: number): string => {
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
};
