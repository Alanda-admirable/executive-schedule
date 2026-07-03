const renderText = (text) => {
    let formatted = text;
    formatted = formatted.replace(/^\{\{[CLR]\}\}/, '');
    formatted = formatted.replace(/\s+ณ\s*/g, '\nณ ');
    formatted = formatted
      .replace(/\s*\|\s*/g, '\n')
      .replace(/\s+;\s+/g, '\n')
      .replace(/\s+\/\s+/g, '\n')
      .replace(/ {2,}/g, '\n');
    formatted = formatted.replace(/(นาย|นาง|นางสาว|ว่าที่ร้อยตรี|ดร\.|พล\.ต\.|พ\.ต\.|ร\.ต\.|ปลัดจังหวัด|ผู้ว่าราชการจังหวัด|รองผู้ว่าราชการจังหวัด)\s+/g, '$1\u00A0');
    // Simulate thaiSmartBreak
    formatted = formatted.replace(/[ \t]+\(([^)]+)\)/g, '\u00A0($1)');
    // 6. Clean up consecutive newlines
    // Allow multiple newlines to preserve blank lines
    return formatted;
};
const res = renderText("ร่วมเฝ้าฯ รับเสด็จ สมเด็จพระนางเจ้าสุทิดา พัชรสุธาพิมลลักษณ พระบรมราชินี เสด็จฯ ทอดพระเนตรการแข่งขันกอล์ฟควีนส์คัพไทยแลนด์ แชมเปี้ยนชิพ ประจำปี 2569 \n(Queen's Cup Thailand Championship)");
console.log(JSON.stringify(res));
