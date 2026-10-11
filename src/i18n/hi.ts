import { wedding } from '../config/wedding'
import { parseIsoDate, weekdayOf } from '../lib/time'
import type { Messages } from './en'

/**
 * हिन्दी — Hindi. Names and the venue are written in Devanagari; the
 * calligraphic names in the hero and intro keep their Latin lettering as part of
 * the design. Western digits are used for dates, as on printed invitations.
 */
const WEEKDAYS = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार']
const MONTHS = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर']
const [D1, D2] = wedding.days.map((d) => parseIsoDate(d.date))
const MONTH = MONTHS[D1.month - 1]
const PAIR = 'दर्शन और वत्सला'

export const hi: Messages = {
  meta: {
    title: 'दर्शन और वत्सला — शाही विवाह निमंत्रण',
    description: 'दर्शन और वत्सला के विवाह समारोह में आप सादर आमंत्रित हैं — 15 और 16 नवंबर 2026, बापूजी समुदाय भवन, दावणगेरे।',
  },
  lang: { label: 'भाषा', choose: 'भाषा चुनें' },
  common: {
    mapsNewTab: '(गूगल मैप्स नए टैब में खुलेगा)',
    waNewTab: '(व्हाट्सऐप नए टैब में खुलेगा)',
  },
  couple: { first: 'दर्शन', second: 'वत्सला', pair: PAIR, and: 'और' },
  city: 'दावणगेरे',
  region: 'कर्नाटक',
  venue: {
    name: 'बापूजी समुदाय भवन',
    line1: 'शामनूर रोड, सिद्धवीरप्पा लेआउट, शामनूर,',
    line2: 'दावणगेरे, कर्नाटक 577004',
  },
  date: {
    weekday: (iso) => WEEKDAYS[weekdayOf(iso)],
    long: (iso) => {
      const d = parseIsoDate(iso)
      return `${WEEKDAYS[weekdayOf(iso)]}, ${d.day} ${MONTHS[d.month - 1]} ${d.year}`
    },
    short: (iso) => {
      const d = parseIsoDate(iso)
      return `${d.day} ${MONTHS[d.month - 1]} ${d.year}`
    },
    monthYear: (iso) => {
      const d = parseIsoDate(iso)
      return `${MONTHS[d.month - 1]} ${d.year}`
    },
    range: `${D1.day} और ${D2.day} ${MONTH} ${D1.year}`,
    rangeOrdinal: `${D1.day} और ${D2.day} ${MONTH} ${D1.year}`,
    rangeDash: `${D1.day}–${D2.day} ${MONTH} ${D1.year}`,
    invitation: { d1: String(D1.day), s1: '', d2: String(D2.day), s2: '', monthYear: `${MONTH} ${D1.year}` },
  },
  skipToContent: 'सीधे सामग्री पर जाएँ',
  nav: {
    home: 'मुखपृष्ठ',
    invitation: 'निमंत्रण',
    calendar: 'कैलेंडर',
    compass: 'दिशासूचक',
    celebrations: 'उत्सव',
    venue: 'विवाह स्थल',
    'guest-services': 'अतिथि सेवाएँ',
    rsvp: 'उत्तर दें',
    main: 'मुख्य खंड',
    all: 'सभी खंड',
    open: 'मेनू खोलें',
    close: 'मेनू बंद करें',
    menu: 'मेनू',
    brand: 'D&V — दर्शन और वत्सला, ऊपर लौटें',
  },
  intro: {
    title: 'शाही निमंत्रण',
    open: 'खोलने के लिए स्पर्श करें',
    openLabel: 'निमंत्रण खोलने के लिए स्पर्श करें',
    skip: 'परिचय छोड़ें',
    preparing: 'आपका निमंत्रण तैयार हो रहा है…',
  },
  hero: {
    tag1: 'दो परिवार',
    tag2: 'एक सुंदर सफ़र',
    enter: 'विवाह उत्सव में प्रवेश करें',
    scroll: 'आगे देखें',
    sceneAlt: 'सूर्यास्त के समय महल के उद्यान में, फूलों के तोरण के नीचे, वरमाला पहने हाथ थामे विवाह परिधान में दर्शन और वत्सला का चित्रण',
  },
  invitation: {
    title: 'निमंत्रण',
    lead: 'हमारे परिवारों के आशीर्वाद सहित',
    youAre: 'आप',
    cordially: 'सादर आमंत्रित हैं',
    toCelebrate: 'शुभ विवाह समारोह में',
  },
  calendar: {
    eyebrow: 'दो दिवसीय उत्सव',
    title1: 'जीवंत',
    title2: 'विवाह कैलेंडर',
    lead: 'हमारा विवाह उत्सव दो दिनों तक चलेगा। विवरण देखने के लिए कोई एक दिन चुनें।',
    days: 'विवाह के दिन',
    dayCard: (n, date) => `${n === 1 ? 'पहला' : 'दूसरा'} दिन: ${date}`,
    dayEyebrow: (n, weekday) => `${n === 1 ? 'पहला' : 'दूसरा'} दिन · ${weekday}`,
    units: { days: 'दिन', hrs: 'घंटे', min: 'मिनट', sec: 'सेकंड' },
    today: 'उत्सव आज है! आपके हमारे साथ होने से हमें अपार प्रसन्नता है।',
    past: 'प्रेम और आभार सहित — इस दिन का उत्सव संपन्न हुआ।',
    note: 'इस दिन के आरंभ तक की उलटी गिनती, भारतीय मानक समय (IST)।',
    details: 'दिन का विवरण देखें',
  },
  compass: {
    title1: 'विवाह',
    title2: 'दिशासूचक',
    lead: 'विवाह की जानकारी देखने के लिए कोई एक दिशा चुनें।',
    nav: 'विवाह दिशासूचक',
    dirs: { north: 'उत्तर', east: 'पूर्व', south: 'दक्षिण', west: 'पश्चिम' },
    dest: { invitation: 'निमंत्रण', schedule: 'कार्यक्रम', services: 'अतिथि सेवाएँ', venue: 'विवाह स्थल' },
  },
  celebrations: {
    title: 'उत्सव',
    lead: 'प्रेम, परंपराओं और अनमोल पलों से भरे दो विशेष दिन।',
    tabs: 'उत्सव के दिन',
    tab: (n) => `${n === 1 ? 'पहला' : 'दूसरा'} दिन`,
    dayTitle: (n) => `${n === 1 ? 'पहला' : 'दूसरा'} दिन`,
    timings: 'समारोह का समय',
    timingsValue: 'अभी घोषित नहीं किया गया',
    programme: 'दिन का कार्यक्रम',
    programmeValue: 'इस निमंत्रण पर अभी प्रकाशित नहीं किया गया',
  },
  venueSection: {
    title: 'विवाह स्थल',
    lead: 'दावणगेरे के हृदय में स्थित एक सुंदर स्थल पर हमारे साथ पधारें।',
    directions: 'रास्ता देखें',
    viewMap: 'मानचित्र पर देखें',
  },
  services: {
    eyebrow: 'हमारे अतिथियों के लिए',
    title: 'अतिथि सेवाएँ',
    lead: 'एक सुखद और आनंदमय अनुभव के लिए आवश्यक सब कुछ।',
    travel: 'यात्रा और ठहराव',
    travelBody: 'उत्सव दावणगेरे, कर्नाटक के बापूजी समुदाय भवन में होगा। स्थल के रास्ते की जानकारी से अपनी यात्रा की योजना बनाएँ।',
    seeVenue: 'विवाह स्थल देखें',
    local: 'स्थानीय जानकारी',
    localBody: 'कर्नाटक के हृदय, दावणगेरे में आपका स्वागत है। अपनी यात्रा के लिए सुझाव चाहें तो हमसे पूछें।',
    etiquette: 'शिष्टाचार',
    etiquetteBody: 'कुछ स्नेहपूर्ण बातें: परिवार आपका स्वागत कर सके, इसके लिए कृपया अपना उत्तर भेजें, और संभव हो तो दोनों दिन हमारे लिए रखें।',
    help: 'सहायता चाहिए?',
    helpBody: 'उत्सव से पहले और उत्सव के दौरान हम आपके साथ हैं।',
    call: 'कॉल करें',
    whatsapp: 'व्हाट्सऐप',
  },
  rsvp: {
    eyebrow: 'उत्तर पत्र',
    title: 'कृपया हमें बताएँ',
    name: 'आपका नाम',
    namePh: 'पूरा नाम',
    join: 'क्या आप पधारेंगे?',
    accept: 'सहर्ष स्वीकार',
    acceptHint: 'हाँ, मैं आऊँगा/आऊँगी!',
    decline: 'सखेद अस्वीकार',
    declineHint: 'क्षमा करें, मैं नहीं आ पाऊँगा/पाऊँगी।',
    guests: 'आपको मिलाकर आने वालों की संख्या',
    optional: '(वैकल्पिक)',
    guestsPh: 'जैसे 2',
    note: 'वर-वधू के लिए आपका संदेश',
    notePh: 'आपकी शुभकामनाएँ (वैकल्पिक)',
    send: 'व्हाट्सऐप से उत्तर भेजें',
    helper: 'आपका व्हाट्सऐप संदेश तैयार होकर खुलेगा। अपना उत्तर भेजने के लिए व्हाट्सऐप में भेजें (Send) दबाएँ।',
    ready: 'आपका व्हाट्सऐप संदेश तैयार है।',
    readyNote: 'व्हाट्सऐप में भेजने पर ही आपका उत्तर परिवार तक पहुँचेगा।',
    openWa: 'व्हाट्सऐप नहीं खुला? यहाँ खोलें',
    privacy: 'आपका विवरण केवल उस व्हाट्सऐप संदेश में जाता है जिसे आप भेजते हैं। यह वेबसाइट इसे सहेजती नहीं है।',
    errors: {
      name: 'कृपया अपना नाम लिखें।',
      attendance: 'कृपया बताएँ कि आप आ पाएँगे या नहीं।',
      guests: (max) => `कृपया 1 से ${max} तक की संख्या लिखें, या खाली छोड़ दें।`,
    },
    message: {
      hello: (name) => `नमस्ते! मैं ${name} हूँ।`,
      regarding: (couple, dates) => `${dates} को ${couple} के विवाह के लिए मेरा उत्तर:`,
      accept: 'सहर्ष स्वीकार',
      decline: 'सखेद अस्वीकार',
      guests: (n) => `आने वालों की संख्या: ${n}`,
      note: (text) => `वर-वधू के लिए संदेश: ${text}`,
    },
  },
  closing: {
    blessing: 'प्रेम और आशीर्वाद सहित',
    message: 'इन विशेष पलों को आपके साथ मनाकर हमें अपार प्रसन्नता होगी। आपका आशीर्वाद, स्नेह और उपस्थिति हमारे उत्सव को पूर्ण बनाएँगे।',
    rsvp: 'उत्तर दें',
    directions: 'स्थल का रास्ता',
    made: (pair) => `${pair} के लिए प्रेम से रचित`,
    top: 'ऊपर लौटें',
  },
  actions: {
    share: 'निमंत्रण साझा करें',
    addToCalendar: 'कैलेंडर में जोड़ें',
  },
  share: {
    title: 'दर्शन और वत्सला — विवाह निमंत्रण',
    text: 'दर्शन और वत्सला के विवाह समारोह में आप सादर आमंत्रित हैं — 15 और 16 नवंबर 2026, बापूजी समुदाय भवन, दावणगेरे।',
    shared: 'निमंत्रण साझा करने के लिए धन्यवाद।',
    copied: 'निमंत्रण का लिंक कॉपी हो गया।',
    failed: 'यहाँ साझा करना संभव नहीं — कृपया एड्रेस बार से लिंक कॉपी करें।',
  },
  ics: {
    done: 'दोनों दिनों की कैलेंडर फ़ाइल डाउनलोड हो गई — जोड़ने के लिए उसे खोलें।',
    failed: 'इस डिवाइस पर कैलेंडर फ़ाइल नहीं बन सकी।',
  },
  music: {
    title: 'विवाह संगीत',
    play: 'संगीत चलाएँ',
    pause: 'संगीत रोकें',
    failed: 'संगीत शुरू नहीं हो सका। फिर से प्रयास करने के लिए चलाएँ दबाएँ।',
  },
  fireworks: {
    replay: 'आसमान जगमगाएँ',
    playing: 'आसमान जगमगा रहा है…',
  },
}
