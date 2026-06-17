const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.schedule.deleteMany({})
  await prisma.executive.deleteMany({})
  await prisma.dayTheme.deleteMany({})
  await prisma.user.deleteMany({})

  // Seed Users
  await prisma.user.create({
    data: {
      username: 'admin',
      password: 'adminpassword',
      name: 'ผู้ดูแลระบบสูงสุด',
      role: 'ADMIN'
    }
  })

  await prisma.user.create({
    data: {
      username: 'staff',
      password: 'staffpassword',
      name: 'เจ้าหน้าที่บันทึกข้อมูล',
      role: 'STAFF'
    }
  })

  // Seed Day Themes
  const dayThemes = [
    { dayIndex: 0, dayName: "อาทิตย์", bg: "#fef2f2", soft: "#fff1f2", ink: "#991b1b", border: "#fecaca" },
    { dayIndex: 1, dayName: "จันทร์", bg: "#fefce8", soft: "#fef9c3", ink: "#854d0e", border: "#fef08a" },
    { dayIndex: 2, dayName: "อังคาร", bg: "#fdf2f8", soft: "#fce7f3", ink: "#9d174d", border: "#fbcfe8" },
    { dayIndex: 3, dayName: "พุธ", bg: "#f0fdf4", soft: "#dcfce7", ink: "#166534", border: "#bbf7d0" },
    { dayIndex: 4, dayName: "พฤหัสบดี", bg: "#fff7ed", soft: "#ffedd5", ink: "#9a3412", border: "#fed7aa" },
    { dayIndex: 5, dayName: "ศุกร์", bg: "#eff6ff", soft: "#dbeafe", ink: "#1e40af", border: "#bfdbfe" },
    { dayIndex: 6, dayName: "เสาร์", bg: "#f5f3ff", soft: "#ede9fe", ink: "#5b21b6", border: "#ddd6fe" }
  ]

  await prisma.dayTheme.createMany({
    data: dayThemes
  })

  // Seed Pathum Thani Executives
  const gov = await prisma.executive.create({
    data: {
      name: 'นายเอกวิทย์ มีเพียร',
      title: 'ผู้ว่าราชการจังหวัดปทุมธานี',
      color: '#be185d',
      order: 1,
    },
  })

  const dep1 = await prisma.executive.create({
    data: {
      name: 'นายพงศธร กาญจนะจิตรา',
      title: 'รองผู้ว่าราชการจังหวัดปทุมธานี',
      color: '#047857',
      order: 2,
    },
  })

  const dep2 = await prisma.executive.create({
    data: {
      name: 'นายองครักษ์ ทองนิรมล',
      title: 'รองผู้ว่าราชการจังหวัดปทุมธานี',
      color: '#1d4ed8',
      order: 3,
    },
  })

  const dep3 = await prisma.executive.create({
    data: {
      name: 'นายตงพล รุจิธรรมธัช',
      title: 'รองผู้ว่าราชการจังหวัดปทุมธานี',
      color: '#c2410c',
      order: 4,
    },
  })

  const palad = await prisma.executive.create({
    data: {
      name: 'ว่าที่ร้อยตรี ธีระพล โชคนำชัย',
      title: 'ปลัดจังหวัดปทุมธานี',
      color: '#000000',
      order: 5,
    },
  })

  const headOfOffice = await prisma.executive.create({
    data: {
      name: 'นางสาววัชรินทร์ มิ่งขวัญรุ่งเรือง',
      title: 'หัวหน้าสำนักงานจังหวัดปทุมธานี',
      color: '#000000',
      order: 6,
    },
  })

  // Create Schedules for Today and the target date (Wednesday June 10, 2026)
  const today = new Date()
  today.setHours(0,0,0,0)

  const targetDate = new Date('2026-06-10')
  targetDate.setHours(0,0,0,0)

  const schedulesToCreate = [];

  // Helper function to push schedules for a specific date
  const addSchedulesForDate = (date) => {
    schedulesToCreate.push(
      // Governor Schedules
      {
        executiveId: gov.id,
        date: date,
        startTime: '07:00',
        mission: 'ร่วมกิจกรรมสภากาแฟจังหวัดปทุมธานี ครั้งที่ ๕/๒๕๖๙',
        location: 'ห้องประชุมศาลาประชาคม สำนักงานเทศบาลตำบลบ้านกลาง อ.เมืองปทุมธานี',
        agency: 'อุตสาหกรรมจังหวัดปทุมธานี',
        dressCode: 'ชุดสุภาพโทนสีไว้ทุกข์',
      },
      {
        executiveId: gov.id,
        date: date,
        startTime: '09:30',
        mission: 'ประธานเปิดกิจกรรมจิตอาสาก่อสร้างฝายชะลอน้ำ ตามโครงการหนึ่งความดี ล้านความรัก ภูมิใจภักดิ์พระพันปีหลวง',
        location: 'บริเวณป่าชุมชนบ้านทรายทอง หมู่ที่ ๑๖ ต.ป่าสัก อ.เมืองปทุมธานี',
        agency: 'อำเภอเมืองปทุมธานี',
        dressCode: 'ชุดจิตอาสาพระราชทาน เสื้อยืดคอปกสีดำ หมวกสีฟ้า ผ้าพันคอสีเหลือง',
      },
      {
        executiveId: gov.id,
        date: date,
        startTime: '13:30',
        mission: 'ร่วมตรวจเยี่ยมโรงงานอุตสาหกรรม ในจังหวัดปทุมธานี ประจำปี ๒๕๖๙',
        location: 'บริษัท ต้าปัง จำกัด',
        agency: 'อุตสาหกรรมจังหวัดปทุมธานี',
        dressCode: 'ชุดสุภาพโทนสีไว้ทุกข์',
      },

      // Deputy 1 (นายพงศธร กาญจนะจิตรา) Schedules
      {
        executiveId: dep1.id,
        date: date,
        startTime: '06:30',
        mission: 'ร่วมกิจกรรมสภากาแฟจังหวัดปทุมธานี ครั้งที่ ๕/๒๕๖๙',
        location: 'ห้องประชุมศาลาประชาคม สำนักงานเทศบาลตำบลบ้านกลาง อำเภอเมืองปทุมธานี',
        agency: 'อุตสาหกรรมจังหวัดปทุมธานี',
        dressCode: 'ชุดสุภาพ',
      },
      {
        executiveId: dep1.id,
        date: date,
        startTime: '09:00',
        mission: 'ประธานเปิดการประชุมเชิงปฏิบัติการพัฒนาศักยภาพการพัฒนาระบบข้อมูลการบำบัดรักษาและฟื้นฟูผู้ติดยาเสพติดของประเทศ (บสต.) และการประเมินรับรองคุณภาพ ๒ ศูนย์ ๒ สถาน จังหวัดปทุมธานี',
        location: 'โรงแรมแกรนด์ปา โฮเทล แอนด์ รีสอร์ท ตำบลเวียงยอง อำเภอเมืองปทุมธานี',
        agency: 'สสจ.',
        dressCode: 'ชุดสุภาพ',
      },
      {
        executiveId: dep1.id,
        date: date,
        startTime: '09:30',
        mission: 'ประธานการประชุมคณะกรรมการพิจารณาอุทธรณ์การประเมินภาษีประจำจังหวัดปทุมธานี ครั้งที่ ๑/๒๕๖๙',
        location: 'ห้องประชุมอนันตยศ ชั้น ๔',
        agency: 'สถจ.',
        dressCode: 'ชุดสุภาพ',
      },
      {
        executiveId: dep1.id,
        date: date,
        startTime: '13:30',
        mission: 'ประธานการประชุมคณะอนุกรรมการป้องกันและปราบปรามการตัดไม้ทำลายป่าระดับจังหวัด (คปป.จังหวัด) จังหวัดปทุมธานี ครั้งที่ ๑/๒๕๖๙',
        location: 'ห้องประชุมหริภุญชัย ชั้น ๔',
        agency: 'ทสจ.',
        dressCode: 'ชุดสุภาพ',
      },
      {
        executiveId: dep1.id,
        date: date,
        startTime: '18:30',
        mission: 'ร่วมกิจกรรมทำวัตรสวดมนต์ สวดบารมี ๓๐ ทัศ ภายใต้กิจกรรม "ธรรมยาตราเดินเทศน์สันถี ตามวิถีครูบาสู่บุคคลสำคัญของโลก"',
        location: 'วัดจามเทวี อำเภอเมืองปทุมธานี',
        agency: 'วธ.',
        dressCode: 'ชุดปฏิบัติธรรมสีขาว',
      },

      // Deputy 2 (นายองครักษ์ ทองนิรมล) Schedules
      {
        executiveId: dep2.id,
        date: date,
        startTime: '18:00',
        mission: 'ร่วมเป็นเกียรติในพิธีเปิดการแข่งขันกีฬาอาวุโสแห่งชาติ ครั้งที่ ๘ "ตาปีเกมส์ ๖๙" (พ.ศ.๒๕๖๙)',
        location: 'สนามกีฬากลางจังหวัดสุราษฎร์ธานี',
        agency: 'กกท.',
        dressCode: 'ชุดกีฬา/ชุดสุภาพ',
      },

      // CAO / ปลัดจังหวัด (ว่าที่ร้อยตรี ธีระพล โชคนำชัย) Schedules
      {
        executiveId: palad.id,
        date: date,
        startTime: '06:30',
        mission: 'ร่วมกิจกรรมสภากาแฟ ครั้งที่ ๕/๒๕๖๙',
        location: 'ห้องประชุมศาลาประชาคม อ.เมืองปทุมธานี',
        agency: 'หน่วยงานสังกัดกระทรวงอุตสาหกรรม',
        dressCode: 'ชุดผ้าไทย/ชุดพื้นเมือง/ชุดสุภาพ',
      },
      {
        executiveId: palad.id,
        date: date,
        startTime: '09:30',
        mission: 'กิจกรรมจิตอาสาก่อสร้างฝายชะลอน้ำ ตามโครงการหนึ่งความดี ล้านความรัก ภูมิใจภักดิ์พระพันปีหลวง',
        location: 'บริเวณป่าชุมชนบ้านทรายทอง หมู่ที่ ๑๖ ต.ป่าสัก อ.เมืองปทุมธานี',
        agency: 'อ.เมืองปทุมธานี',
        dressCode: 'ชุดจิตอาสาพระราชทาน เสื้อสีดำ สวมหมวก และผูกผ้าพันคอจิตอาสาพระราชทาน',
      },
      {
        executiveId: palad.id,
        date: date,
        startTime: '13:00',
        mission: 'ประชุมรับฟังความคิดเห็นของประชาชนก่อนจัดทำร่างผังเมืองรวม ครั้งที่ ๓ ผังเมืองรวมชุมชนป่าซาง จังหวัดปทุมธานี (กลุ่มที่ ๒)',
        location: 'ห้องประชุมเทศบาลตำบลมะกอก อ.ป่าซาง',
        agency: 'สนง.โยธาธิการฯ',
        dressCode: 'ชุดสุภาพ',
      },
      {
        executiveId: palad.id,
        date: date,
        startTime: '13:30',
        mission: 'ประชุมคณะอนุกรรมการป้องกันและปราบปรามการตัดไม้ทำลายป่าระดับจังหวัด (คปป.จังหวัด)',
        location: 'ห้องประชุมหริภุญชัย ชั้น ๔',
        agency: 'ทสจ.',
        dressCode: 'ชุดสุภาพ',
      },
      {
        executiveId: palad.id,
        date: date,
        startTime: '18:30',
        mission: 'ร่วมกิจกรรมทำวัตรสวดมนต์ สวดบารมี ๓๐ ทัศ ภายใต้กิจกรรม "ธรรมยาตราเดินเทศน์สันถี ตามวิถีครูบาสู่บุคคลสำคัญของโลก"',
        location: 'วัดจามเทวี ต.ในเมือง อ.เมืองปทุมธานี',
        agency: 'วธ.จ.',
        dressCode: 'ชุดปฏิบัติธรรมสีขาว',
      },

      // Head of Office (นางสาววัชรินทร์ มิ่งขวัญรุ่งเรือง) Schedules
      {
        executiveId: headOfOffice.id,
        date: date,
        startTime: '06:30',
        mission: 'สภากาแฟจังหวัดปทุมธานี ครั้งที่ ๕/๒๕๖๙',
        location: 'ห้องประชุมศาลาประชาคม สำนักงานเทศบาลตำบลบ้านกลาง อำเภอเมืองปทุมธานี',
        agency: 'กระทรวงอุตสาหกรรม สภาอุตสาหกรรม รพ.หริภุญชัยราม ทต.บ้านกลาง',
        dressCode: 'ชุดสุภาพ',
      },
      {
        executiveId: headOfOffice.id,
        date: date,
        startTime: '08:30',
        mission: 'ร่วมเดินขบวนธรรมยาตรานำรูปเหมือนครูบาศรีวิชัย จากวัดกู่ละมัก (รมณียาราม) ถึงวัดจามเทวี',
        location: 'วัดกู่ละมัก (รมณียาราม) ถึง วัดจามเทวี',
        agency: 'วธ.',
        dressCode: 'ชุดปฏิบัติธรรมสีขาว',
      },
      {
        executiveId: headOfOffice.id,
        date: date,
        startTime: '09:30',
        mission: 'กิจกรรมจิตอาสาก่อสร้างฝายชะลอน้ำ ตามโครงการหนึ่งความดี ล้านความรัก ภูมิใจภักดิ์พระพันปีหลวง',
        location: 'บริเวณป่าชุมชนบ้านทรายทอง หมู่ ๑๖ ต.ป่าสัก อ.เมืองปทุมธานี',
        agency: 'อ.เมืองปทุมธานี',
        dressCode: 'ชุดจิตอาสาพระราชทาน เสื้อยืดคอปกสีดำ หมวกสีฟ้า ผ้าพันคอสีเหลือง',
      },
      {
        executiveId: headOfOffice.id,
        date: date,
        startTime: '13:30',
        mission: 'ร่วมตรวจเยี่ยมโรงงานอุตสาหกรรมในจังหวัดปทุมธานี ประจำเดือนมิถุนายน ๒๕๖๙',
        location: 'บริษัท ต้าปัง จำกัด ตำบลหนองหนาม อำเภอเมืองปทุมธานี',
        agency: 'อุตสาหกรรมจังหวัด',
        dressCode: 'ชุดสุภาพ',
      },
      {
        executiveId: headOfOffice.id,
        date: date,
        startTime: '18:30',
        mission: 'ร่วมกิจกรรมทำวัตรสวดมนต์ สวดบารมี ๓๐ ทัศ ภายใต้กิจกรรม "ธรรมยาตราเดินเทศน์สันถี ตามวิถีครูบาสู่บุคคลสำคัญของโลก"',
        location: 'วัดจามเทวี อำเภอเมืองปทุมธานี',
        agency: 'วธ.',
        dressCode: 'ชุดปฏิบัติธรรมสีขาว',
      }
    );
  }

  addSchedulesForDate(today);
  addSchedulesForDate(targetDate);

  await prisma.schedule.createMany({
    data: schedulesToCreate
  })

  console.log('Seed data created successfully for Pathum Thani')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
