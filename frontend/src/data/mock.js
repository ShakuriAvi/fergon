/* ============================================================
   Mock data (ported from fergon.html)
   Schools, users, values, recognitions, rewards.
   UI chrome (value labels, reward categories) is resolved via
   i18n keys; only ids/emojis/tones live here. Domain content
   (people, schools, reward titles) stays in this data layer.
   ============================================================ */

export const SCHOOLS = [
  { id: 'herzl', name: 'בית ספר הרצל תל אביב', short: 'הרצל ת״א', city: 'תל אביב', teachers: 64, active: 0.78 },
  { id: 'rabin', name: 'חטיבת ביניים רבין חיפה', short: 'רבין חיפה', city: 'חיפה', teachers: 41, active: 0.71 },
  { id: 'golda', name: 'בית ספר גולדה ירושלים', short: 'גולדה י-ם', city: 'ירושלים', teachers: 53, active: 0.83 },
  { id: 'ort', name: 'תיכון אורט באר שבע', short: 'אורט ב״ש', city: 'באר שבע', teachers: 38, active: 0.64 },
];

/* labels resolved via i18n: values.<id> */
export const VALUES = [
  { id: 'innov', emoji: '💡', tone: 'gold' },
  { id: 'collab', emoji: '🤝', tone: 'green' },
  { id: 'mentor', emoji: '🌱', tone: 'green' },
  { id: 'devote', emoji: '💪', tone: 'terra' },
  { id: 'create', emoji: '🎨', tone: 'terra' },
  { id: 'lead', emoji: '🏆', tone: 'gold' },
];

export const USERS = [
  { id: 'u_yael', name: 'יעל כהן', role: 'מורה למתמטיקה', school: 'herzl', points: 340, allowance: 100, given: 60 },
  { id: 'u_david', name: 'דוד לוי', role: 'מורה להיסטוריה', school: 'rabin', points: 215, allowance: 100, given: 40 },
  { id: 'u_noa', name: 'נועה פרידמן', role: 'רכזת שכבה ז׳', school: 'golda', points: 510, allowance: 120, given: 85 },
  { id: 'u_itai', name: 'איתי שפירא', role: 'מורה לפיזיקה', school: 'ort', points: 95, allowance: 100, given: 25 },
  { id: 'u_michal', name: 'מיכל ברק', role: 'מחנכת כיתה ה׳', school: 'herzl', points: 420, allowance: 100, given: 70 },
  { id: 'u_avi', name: 'אבי מזרחי', role: 'מנהל בית הספר', school: 'herzl', points: 180, allowance: 200, given: 150, principal: true },
  { id: 'u_rotem', name: 'רותם אזולאי', role: 'יועצת חינוכית', school: 'rabin', points: 265, allowance: 100, given: 55 },
  { id: 'u_shira', name: 'שירה גולן', role: 'מורה לאנגלית', school: 'golda', points: 300, allowance: 100, given: 48 },
  { id: 'u_omer', name: 'עומר דהן', role: 'מורה לחינוך גופני', school: 'ort', points: 130, allowance: 100, given: 30 },
  { id: 'u_tamar', name: 'תמר וייס', role: 'סגנית מנהל', school: 'golda', points: 390, allowance: 150, given: 110 },
];

/* current signed-in user */
export const ME = 'u_yael';

export const STICKERS = ['🎉', '🌟', '👏', '💐', '🙌', '🥳', '❤️', '🚀'];

export const recognitions = [
  { id: 'r1', from: 'u_michal', to: 'u_yael', value: 'collab', points: 8, claps: 14, mins: 22, msg: 'תודה ענקית על שעזרת לי לבנות את מבחן האמצע במתמטיקה ברגע האחרון. נשארת אחרי הצהריים בלי לחשוב פעמיים — זה בדיוק מה ששיתוף פעולה אמיתי נראה כמו.' },
  { id: 'r2', from: 'u_noa', to: 'u_shira', value: 'innov', points: 10, claps: 9, mins: 65, msg: 'הרעיון שלך לשלב פודקאסטים בשיעורי האנגלית פשוט שינה את האווירה בכיתה. התלמידים מדברים על זה גם בהפסקות. כל הכבוד על החדשנות.' },
  { id: 'r3', from: 'u_avi', to: 'u_michal', value: 'devote', points: 6, claps: 21, mins: 140, msg: 'ראיתי איך ליווית את דניאל לאורך כל השבוע הקשה שלו. ההשקעה והמסירות שלך לכל ילד וילדה הן מה שעושה את בית הספר הזה למה שהוא.' },
  { id: 'r4', from: 'u_rotem', to: 'u_david', value: 'mentor', points: 7, claps: 6, mins: 200, msg: 'תודה שלקחת את המורה החדש תחת חסותך. הוא סיפר לי כמה הישיבות איתך עזרו לו להרגיש בבית. חניכה אמיתית.' },
  { id: 'r5', from: 'u_shira', to: 'u_noa', value: 'lead', points: 9, claps: 17, mins: 320, msg: 'הדרך שבה ניהלת את ישיבת השכבה אתמול הייתה שיעור במנהיגות. נתת לכולם מקום לדבר ועדיין יצאנו עם החלטה ברורה.' },
  { id: 'r6', from: 'u_omer', to: 'u_itai', value: 'collab', points: 5, claps: 4, mins: 410, msg: 'תודה על שיתוף הפעולה בארגון יום הספורט. בלי העזרה שלך עם הלוגיסטיקה זה לא היה קורה.' },
  { id: 'r7', from: 'u_yael', to: 'u_rotem', value: 'devote', points: 8, claps: 11, mins: 510, msg: 'את תמיד זמינה לכל תלמיד שצריך אוזן קשבת, גם כשהיומן שלך מלא. המסירות שלך מדבקת.' },
  { id: 'r8', from: 'u_tamar', to: 'u_avi', value: 'lead', points: 10, claps: 23, mins: 1440, msg: 'תודה על ההובלה הרגועה של בית הספר דרך המעבר למערכת החדשה. שמרת על כולנו מאוזנים. מנהיגות שקטה וחזקה.' },
  { id: 'r9', from: 'u_david', to: 'u_omer', value: 'create', points: 6, claps: 8, mins: 1620, msg: 'הקיר שעיצבת עם התלמידים במסדרון הוא יצירת אמנות אמיתית. כל מי שעובר שם מחייך. יצירתיות בשיאה.' },
  { id: 'r10', from: 'u_michal', to: 'u_noa', value: 'mentor', points: 7, claps: 13, mins: 1700, msg: 'תודה שחנכת אותי בשנה הראשונה שלי כמחנכת. כל מה שאני יודעת על ניהול כיתה הגיע ממך.' },
  { id: 'r11', from: 'u_itai', to: 'u_yael', value: 'innov', points: 9, claps: 19, mins: 2880, msg: 'השימוש שלך בסימולציות אינטראקטיביות בשיעורי הגאומטריה הוא פשוט מבריק. גנבתי כמה רעיונות לפיזיקה, מקווה שזה בסדר.' },
  { id: 'r12', from: 'u_noa', to: 'u_tamar', value: 'collab', points: 8, claps: 10, mins: 3100, msg: 'העבודה המשותפת על תוכנית ההכלה החדשה הייתה תענוג. תודה על הסבלנות וההקשבה לאורך כל הדרך.' },
  { id: 'r13', from: 'u_avi', to: 'u_shira', value: 'devote', points: 7, claps: 7, mins: 4320, msg: 'נשארת ללוות את חוג התיאטרון עד מאוחר שבוע אחרי שבוע. התלמידים יזכרו את זה שנים. תודה על המסירות.' },
  { id: 'r14', from: 'u_rotem', to: 'u_michal', value: 'create', points: 6, claps: 12, mins: 5760, msg: 'הדרך היצירתית שבה הפכת את שיעור הספרות למשחק תפקידים החזירה את הברק לעיניים של הכיתה. כל הכבוד.' },
  { id: 'r15', from: 'u_shira', to: 'u_david', value: 'mentor', points: 8, claps: 15, mins: 7200, msg: 'תודה על שהדרכת אותי בכתיבת ההמלצות לתלמידים. למדתי ממך איך לראות את הטוב בכל אחד.' },
  { id: 'r16', from: 'u_tamar', to: 'u_omer', value: 'lead', points: 9, claps: 9, mins: 8800, msg: 'לקחת אחריות על נבחרת בית הספר והפכת אותה לקהילה. ההובלה שלך מעוררת השראה.' },
  { id: 'r17', from: 'u_yael', to: 'u_noa', value: 'innov', points: 10, claps: 16, mins: 10080, msg: 'מערכת המנטורים בין-השכבתית שיזמת היא הדבר הכי טוב שקרה לבית הספר השנה. חדשנות שמשנה תרבות.' },
];

/* rewards — Israeli providers. label resolved via i18n: rewardCats.<cat> */
export const REWARDS = [
  { id: 'steimatzky', provider: 'סטימצקי', title: 'שובר זיכוי לספרים', cost: 120, cat: 'books', color: '#1F6FB2', emoji: '📚', blurb: 'שובר בשווי 50 ₪ לכל חנויות הרשת' },
  { id: 'tzomet', provider: 'צומת ספרים', title: 'שובר ספרים דיגיטלי', cost: 110, cat: 'books', color: '#C8553D', emoji: '📖', blurb: 'שובר בשווי 50 ₪ לרכישה אונליין' },
  { id: 'shufersal', provider: 'שופרסל', title: 'שובר קנייה', cost: 220, cat: 'shop', color: '#E03A3E', emoji: '🛒', blurb: 'שובר בשווי 100 ₪ לכל סניפי הרשת' },
  { id: 'buyme', provider: 'BUYME', title: 'שובר מתנה לבחירה', cost: 200, cat: 'shop', color: '#2D5A3D', emoji: '🎁', blurb: 'בחירה מתוך מאות בתי עסק' },
  { id: 'yesplanet', provider: 'YES Planet', title: 'כרטיס סרט זוגי + פופקורן', cost: 180, cat: 'fun', color: '#0E2A6B', emoji: '🎬', blurb: 'שני כרטיסים לכל סרט בתפוצה' },
  { id: 'landwer', provider: 'קפה לנדוור', title: 'ארוחת בוקר זוגית', cost: 160, cat: 'food', color: '#5B3A1E', emoji: '🍳', blurb: 'ארוחת בוקר ישראלית לשניים' },
  { id: 'aroma', provider: 'ארומה', title: 'כרטיסייה לקפה', cost: 90, cat: 'food', color: '#7A1F2B', emoji: '☕', blurb: 'חמישה כוסות קפה לבחירתך' },
  { id: 'fox', provider: 'FOX', title: 'שובר אופנה', cost: 200, cat: 'shop', color: '#1F1A14', emoji: '👕', blurb: 'שובר בשווי 100 ₪ ברשת FOX' },
];

export const REWARD_CATS = ['all', 'books', 'food', 'shop', 'fun'];

/* weekly recognition counts for the principal chart (last 8 weeks) */
export const WEEKLY = [18, 24, 21, 30, 27, 34, 29, 41];

/* usage counts shown in the admin "values" table, indexed to VALUES order */
export const VALUE_USAGE = [42, 58, 31, 27, 19, 24];

export const getUser = (id) => USERS.find((x) => x.id === id);
export const valueById = (id) => VALUES.find((v) => v.id === id);
export const schoolById = (id) => SCHOOLS.find((s) => s.id === id);
