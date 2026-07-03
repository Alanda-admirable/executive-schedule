const THAI_DIGITS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];

const toThaiDigits = (value) => {
  return String(value ?? "").replace(/[0-9]/g, digit => THAI_DIGITS[Number(digit)]);
}

const thaiSmartBreak = (text) => {
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
}

const renderText = (text) => {
  if (!text) return '';
  let formatted = text;
  formatted = formatted.replace(/^\{\{[CLR]\}\}/, '');
  formatted = formatted.replace(/\s+ณ\s*/g, '\nณ ');
  formatted = formatted
    .replace(/\s*\|\s*/g, '\n')
    .replace(/\s+;\s+/g, '\n')
    .replace(/\s+\/\s+/g, '\n')
    .replace(/ {2,}/g, '\n');
  formatted = formatted.replace(/(นาย|นาง|นางสาว|ว่าที่ร้อยตรี|ดร\.|พล\.ต\.|พ\.ต\.|ร\.ต\.|ปลัดจังหวัด|ผู้ว่าราชการจังหวัด|รองผู้ว่าราชการจังหวัด)\s+/g, '$1\u00A0');
  formatted = thaiSmartBreak(formatted);
  formatted = toThaiDigits(formatted);
  return formatted.split('\n');
}

const dbString = "ร่วมเฝ้าฯ รับเสด็จ สมเด็จพระนางเจ้าสุทิดา พัชรสุธาพิมลลักษณ พระบรมราชินี เสด็จฯ ทอดพระเนตรการแข่งขันกอล์ฟควีนส์คัพไทยแลนด์ แชมเปี้ยนชิพ ประจำปี 2569 \n(Queen's Cup Thailand Championship)";
console.log(renderText(dbString));
