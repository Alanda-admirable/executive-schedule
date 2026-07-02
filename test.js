const text = "เฝ้ารับเสด็จ สมเด็จพระเจ้าน้องนางเธอ เจ้าฟ้าจุฬาภรณวลัยลักษณ์ อัครราชกุมารี กรมพระศรีสวางควัฒน วรขัตติยราชนารี\nเนื่องในโอกาสเสด็จมาทรงเป็นประธานในพิธีเปิดงานวันประมงน้อมเกล้า ฯ ครั้งที่ ๓๖";

let formatted = text;

// Strip alignment markers before rendering
formatted = formatted.replace(/^\{\{[CLR]\}\}/, '');

// 2. Convert space before prepositions (like " ณ") to a newline
formatted = formatted.replace(/\s+ณ\s*/g, '\nณ ');

// 3. Keep single spaces as newlines if they are separators, but handle | or / or ;
formatted = formatted
  .replace(/\s*\|\s*/g, '\n')
  .replace(/\s+;\s+/g, '\n')
  .replace(/\s+\/\s+/g, '\n')
  .replace(/ {2,}/g, '\n');

console.log(JSON.stringify(formatted));
