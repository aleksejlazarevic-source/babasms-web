/* Setup steps in the phone's own language (Aleksej, 10 Nov 2026: "make it so it works for every
   single country"). A web page cannot see the country without asking for location, so this reads the
   phone's language (navigator.languages). That is also the language her Safari menus are in, so the
   drawn words match her screen.

   The Slovenian text already in the page is the source. Each text node whose Slovenian words are found
   in KD_TEXT.sl is swapped for the same key in the phone's language. The headline "All your discounts,
   in one place." is English on the page and is swapped too (Aleksej, 10 Nov 2026). Its translations,
   including Slovenian, are guesses; only the English line is his approved wording.

   The steps follow her iPhone 11, iOS 27, Slovenian, bottom toolbar (her photos, 11 Nov 2026):
   the share arrow, Prikaži več, Dodaj na domači zaslon, then the button at the top right. Only the
   Slovenian words were seen on a phone. addHome is copied from Apple's "Turn a website into an app in
   Safari on iPhone" article (iphea86e5236) in each language, read 10 Nov 2026. Everything else (the
   step sentences and the other drawn rows) is a translation (guess), not checked by a native speaker
   or on a phone in that language.

   A language not listed falls back to English (guess). ?lang=xx in the address forces one, for checking. */

const KD_TEXT = {
  sl: {
    pitch: "Vsi tvoji popusti na enem mestu.",
    heading: "Na domači zaslon",
    where: "Odpri to stran v Safariju. Če je stran odprta v sporočilu, tapni ikono Safari.",
    where1: "Odpri to stran v Safariju.",
    where2a: "Če je stran odprta v sporočilu,",
    s1: "Tapni puščico iz kvadratka.",
    a1: "Je na sredini spodnje vrstice. Tri črte ob naslovu odprejo drug meni.",
    s2: "Tapni Prikaži več.",
    a2: "Je spodnja vrstica, s puščico navzdol.",
    s3: "Pomakni se navzdol. Tapni Dodaj na domači zaslon.",
    a3: "Je zadnja vrstica v sivem okvirju, pod Poišči na strani.",
    s4: "Na koncu tapni gumb zgoraj desno.",
    options: "Možnosti",
    messages: "Sporočila",
    showMore: "Prikaži več",
    addFavorites: "Dodaj med priljubljene",
    quickNote: "Dodaj v hitri zapisek",
    find: ["Poišči na strani", "Najdi na strani"],
    addHome: "Dodaj na domači zaslon",
    markup: "Označevanje",
    print: "Natisni",
    menuHint: "Tapni ⋮ zgoraj desno. Nato tapni Namesti aplikacijo.",
    installNote: "Doda ikono KinDeals na zaslon. Nato tapni ikono.",
    notNow: "Ne zdaj"
  },
  en: {
    pitch: "All your discounts, in one place.",
    heading: "On your Home Screen",
    where: "Open this page in Safari. If the page is open in a message, tap the Safari icon.",
    where1: "Open this page in Safari.",
    where2a: "If the page is open in a message,",
    s1: "Tap the arrow coming out of a square.",
    a1: "It is in the middle of the bottom row. The three lines by the address open a different menu.",
    s2: "Tap Show More.",
    a2: "It is the bottom row, with a down arrow.",
    s3: "Scroll down. Tap Add to Home Screen.",
    a3: "It is the last row in the grey box, under Find on Page.",
    s4: "Last, tap the button at the top right.",
    options: "Options",
    messages: "Messages",
    showMore: "Show More",
    addFavorites: "Add to Favourites",
    quickNote: "Add to Quick Note",
    find: "Find on Page",
    addHome: "Add to Home Screen",
    markup: "Markup",
    print: "Print",
    menuHint: "Tap ⋮ at the top right. Then tap Install app.",
    installNote: "Adds the KinDeals icon to your screen. Then tap the icon.",
    notNow: "Not now"
  },
  de: {
    pitch: "Alle deine Rabatte an einem Ort.",
    heading: "Auf den Home-Bildschirm",
    where: "Öffne diese Seite in Safari. Wenn die Seite in einer Nachricht geöffnet ist, tippe auf das Safari-Symbol.",
    where1: "Öffne diese Seite in Safari.",
    where2a: "Wenn die Seite in einer Nachricht geöffnet ist,",
    s1: "Tippe auf den Pfeil aus dem Quadrat.",
    a1: "Er ist in der Mitte der unteren Reihe. Die drei Striche neben der Adresse öffnen ein anderes Menü.",
    s2: "Tippe auf „Mehr anzeigen“.",
    a2: "Es ist die unterste Zeile, mit einem Pfeil nach unten.",
    s3: "Scrolle nach unten. Tippe auf „Zu Home-Bildschirm hinzufügen“.",
    a3: "Es ist die letzte Zeile im grauen Feld, unter „Auf der Seite suchen“.",
    s4: "Tippe zuletzt auf die Taste oben rechts.",
    options: "Optionen",
    messages: "Nachrichten",
    showMore: "Mehr anzeigen",
    addFavorites: "Zu Favoriten hinzufügen",
    quickNote: "Zu Quick Note hinzufügen",
    find: "Auf der Seite suchen",
    addHome: "Zu Home-Bildschirm hinzufügen",
    markup: "Markierungen",
    print: "Drucken"
  },
  ar: {
    pitch: "كل خصوماتك في مكان واحد.",
    heading: "على الشاشة الرئيسية",
    where: "افتح هذه الصفحة في سفاري. إذا كانت الصفحة مفتوحة في رسالة، اضغط على أيقونة سفاري.",
    where1: "افتح هذه الصفحة في سفاري.",
    where2a: "إذا كانت الصفحة مفتوحة في رسالة،",
    s1: "اضغط على السهم الخارج من مربع.",
    a1: "هو في وسط الصف السفلي. الخطوط الثلاثة بجانب العنوان تفتح قائمة أخرى.",
    s2: "اضغط على عرض المزيد.",
    a2: "إنه الصف السفلي، مع سهم للأسفل.",
    s3: "مرِّر لأسفل. اضغط على إضافة إلى الشاشة الرئيسية.",
    a3: "إنه آخر صف في المربع الرمادي، تحت بحث في الصفحة.",
    s4: "أخيرًا، اضغط على الزر في أعلى اليمين.",
    options: "خيارات",
    messages: "الرسائل",
    showMore: "عرض المزيد",
    addFavorites: "إضافة إلى المفضلة",
    quickNote: "إضافة إلى ملاحظة سريعة",
    find: "بحث في الصفحة",
    addHome: "إضافة إلى الشاشة الرئيسية",
    markup: "ترميز",
    print: "طباعة"
  },
  bg: {
    pitch: "Всичките ти отстъпки на едно място.",
    heading: "На началния екран",
    where: "Отворете тази страница в Safari. Ако страницата е отворена в съобщение, докоснете иконата на Safari.",
    where1: "Отворете тази страница в Safari.",
    where2a: "Ако страницата е отворена в съобщение,",
    s1: "Докоснете стрелката от квадратчето.",
    a1: "Тя е в средата на долния ред. Трите черти до адреса отварят друго меню.",
    s2: "Докоснете Покажи още.",
    a2: "Това е най-долният ред, със стрелка надолу.",
    s3: "Прелистете надолу. Докоснете Добави към Начален екран.",
    a3: "Това е последният ред в сивото поле, под Намиране в страницата.",
    s4: "Накрая докоснете бутона горе вдясно.",
    options: "Опции",
    messages: "Съобщения",
    showMore: "Покажи още",
    addFavorites: "Добавяне към любими",
    quickNote: "Добави в бърза бележка",
    find: "Намиране в страницата",
    addHome: "Добави към Начален екран",
    markup: "Маркиране",
    print: "Печат"
  },
  ca: {
    pitch: "Tots els teus descomptes, en un sol lloc.",
    heading: "A la pantalla d’inici",
    where: "Obre aquesta pàgina al Safari. Si la pàgina és oberta en un missatge, toca la icona del Safari.",
    where1: "Obre aquesta pàgina al Safari.",
    where2a: "Si la pàgina és oberta en un missatge,",
    s1: "Toca la fletxa que surt d’un quadrat.",
    a1: "És al mig de la fila de sota. Les tres ratlles al costat de l’adreça obren un altre menú.",
    s2: "Toca “Mostra’n més”.",
    a2: "És la fila de sota de tot, amb una fletxa cap avall.",
    s3: "Desplaça’t cap avall. Toca “Afegeix a la pantalla d’inici”.",
    a3: "És l’última fila del quadre gris, sota “Cerca a la pàgina”.",
    s4: "Per acabar, toca el botó de dalt a la dreta.",
    options: "Opcions",
    messages: "Missatges",
    showMore: "Mostra’n més",
    addFavorites: "Afegeix a preferits",
    quickNote: "Afegeix a una nota ràpida",
    find: "Cerca a la pàgina",
    addHome: "Afegeix a la pantalla d’inici",
    markup: "Marca",
    print: "Imprimeix"
  },
  cs: {
    pitch: "Všechny tvé slevy na jednom místě.",
    heading: "Na plochu",
    where: "Otevřete tuto stránku v Safari. Pokud je stránka otevřená ve zprávě, klepněte na ikonu Safari.",
    where1: "Otevřete tuto stránku v Safari.",
    where2a: "Pokud je stránka otevřená ve zprávě,",
    s1: "Klepněte na šipku z obdélníku.",
    a1: "Je uprostřed dolní řady. Tři čárky u adresy otevřou jinou nabídku.",
    s2: "Klepněte na Zobrazit více.",
    a2: "Je to spodní řádek se šipkou dolů.",
    s3: "Posuňte seznam dolů. Klepněte na „Přidat na plochu“.",
    a3: "Je to poslední řádek v šedém rámečku, pod „Najít na stránce“.",
    s4: "Nakonec klepněte na tlačítko vpravo nahoře.",
    options: "Volby",
    messages: "Zprávy",
    showMore: "Zobrazit více",
    addFavorites: "Přidat do oblíbených",
    quickNote: "Přidat do rychlé poznámky",
    find: "Najít na stránce",
    addHome: "Přidat na plochu",
    markup: "Značky",
    print: "Tisk"
  },
  da: {
    pitch: "Alle dine rabatter samlet ét sted.",
    heading: "På hjemmeskærmen",
    where: "Åbn denne side i Safari. Hvis siden er åben i en besked, skal du trykke på Safari-symbolet.",
    where1: "Åbn denne side i Safari.",
    where2a: "Hvis siden er åben i en besked,",
    s1: "Tryk på pilen, der kommer ud af en firkant.",
    a1: "Den er midt i den nederste række. De tre streger ved adressen åbner en anden menu.",
    s2: "Tryk på Vis mere.",
    a2: "Det er den nederste række, med en pil nedad.",
    s3: "Rul ned. Tryk på Føj til hjemmeskærm.",
    a3: "Det er den sidste række i den grå boks, under Find på side.",
    s4: "Tryk til sidst på knappen øverst til højre.",
    options: "Indstillinger",
    messages: "Beskeder",
    showMore: "Vis mere",
    addFavorites: "Tilføj til favoritter",
    quickNote: "Føj til hurtig note",
    find: "Find på side",
    addHome: "Føj til hjemmeskærm",
    markup: "Markering",
    print: "Udskriv"
  },
  el: {
    pitch: "Όλες οι εκπτώσεις σου σε ένα μέρος.",
    heading: "Στην οθόνη Αφετηρίας",
    where: "Ανοίξτε αυτή τη σελίδα στο Safari. Αν η σελίδα είναι ανοιχτή σε μήνυμα, αγγίξτε το εικονίδιο του Safari.",
    where1: "Ανοίξτε αυτή τη σελίδα στο Safari.",
    where2a: "Αν η σελίδα είναι ανοιχτή σε μήνυμα,",
    s1: "Αγγίξτε το βέλος που βγαίνει από ένα τετράγωνο.",
    a1: "Είναι στη μέση της κάτω σειράς. Οι τρεις γραμμές δίπλα στη διεύθυνση ανοίγουν άλλο μενού.",
    s2: "Αγγίξτε «Εμφάνιση περισσότερων».",
    a2: "Είναι η κάτω γραμμή, με ένα βέλος προς τα κάτω.",
    s3: "Κάντε κύλιση προς τα κάτω. Αγγίξτε «Προσθήκη στην οθόνη Αφετηρίας».",
    a3: "Είναι η τελευταία γραμμή στο γκρι πλαίσιο, κάτω από το Εύρεση στη σελίδα.",
    s4: "Τέλος, αγγίξτε το κουμπί πάνω δεξιά.",
    options: "Επιλογές",
    messages: "Μηνύματα",
    showMore: "Εμφάνιση περισσότερων",
    addFavorites: "Προσθήκη στα Αγαπημένα",
    quickNote: "Προσθήκη σε Γρήγορη σημείωση",
    find: "Εύρεση στη σελίδα",
    addHome: "Προσθήκη στην οθόνη Αφετηρίας",
    markup: "Σήμανση",
    print: "Εκτύπωση"
  },
  es: {
    pitch: "Todos tus descuentos, en un solo lugar.",
    heading: "En la pantalla de inicio",
    where: "Abre esta página en Safari. Si la página está abierta en un mensaje, toca el icono de Safari.",
    where1: "Abre esta página en Safari.",
    where2a: "Si la página está abierta en un mensaje,",
    s1: "Toca la flecha que sale de un cuadrado.",
    a1: "Está en el centro de la fila de abajo. Las tres rayas junto a la dirección abren otro menú.",
    s2: "Toca “Mostrar más”.",
    a2: "Es la fila de abajo del todo, con una flecha hacia abajo.",
    s3: "Desplázate hacia abajo. Toca “Añadir a pantalla de inicio”.",
    a3: "Es la última fila del recuadro gris, debajo de “Buscar en la página”.",
    s4: "Por último, toca el botón de arriba a la derecha.",
    options: "Opciones",
    messages: "Mensajes",
    showMore: "Mostrar más",
    addFavorites: "Añadir a favoritos",
    quickNote: "Añadir a nota rápida",
    find: "Buscar en la página",
    addHome: "Añadir a pantalla de inicio",
    markup: "Marcado",
    print: "Imprimir"
  },
  "es-MX": {
    pitch: "Todos tus descuentos, en un solo lugar.",
    heading: "En la pantalla de inicio",
    where: "Abre esta página en Safari. Si la página está abierta en un mensaje, toca el ícono de Safari.",
    where1: "Abre esta página en Safari.",
    where2a: "Si la página está abierta en un mensaje,",
    s1: "Toca la flecha que sale de un cuadrado.",
    a1: "Está en el centro de la fila de abajo. Las tres rayas junto a la dirección abren otro menú.",
    s2: "Toca Mostrar más.",
    a2: "Es la fila de hasta abajo, con una flecha hacia abajo.",
    s3: "Desplázate hacia abajo. Toca Agregar a Inicio.",
    a3: "Es la última fila del recuadro gris, debajo de “Buscar en la página”.",
    s4: "Por último, toca el botón de arriba a la derecha.",
    options: "Opciones",
    messages: "Mensajes",
    showMore: "Mostrar más",
    addFavorites: "Agregar a favoritos",
    quickNote: "Agregar a nota rápida",
    find: "Buscar en la página",
    addHome: "Agregar a Inicio",
    markup: "Marcado",
    print: "Imprimir"
  },
  et: {
    pitch: "Kõik sinu allahindlused ühes kohas.",
    heading: "Home Screen-kuvasse",
    where: "Avage see leht rakenduses Safari. Kui leht on avatud sõnumis, puudutage Safari ikooni.",
    where1: "Avage see leht rakenduses Safari.",
    where2a: "Kui leht on avatud sõnumis,",
    s1: "Puudutage noolt, mis tuleb ruudust välja.",
    a1: "See on alumise rea keskel. Kolm kriipsu aadressi kõrval avavad teise menüü.",
    s2: "Puudutage Kuva rohkem.",
    a2: "See on alumine rida, allanoolega.",
    s3: "Kerige alla. Puudutage Add to Home Screen.",
    a3: "See on halli kasti viimane rida, „Otsi lehelt“ all.",
    s4: "Lõpuks puuduta nuppu üleval paremal.",
    options: "Valikud",
    messages: "Sõnumid",
    showMore: "Kuva rohkem",
    addFavorites: "Lisa lemmikutesse",
    quickNote: "Lisa kiirmärkmesse",
    find: "Otsi lehelt",
    addHome: "Add to Home Screen",
    markup: "Märgistus",
    print: "Prindi"
  },
  fi: {
    pitch: "Kaikki alennuksesi yhdessä paikassa.",
    heading: "Koti-valikkoon",
    where: "Avaa tämä sivu Safarissa. Jos sivu on auki viestissä, napauta Safari-kuvaketta.",
    where1: "Avaa tämä sivu Safarissa.",
    where2a: "Jos sivu on auki viestissä,",
    s1: "Napauta nuolta, joka tulee neliöstä.",
    a1: "Se on alarivin keskellä. Osoitteen vieressä olevat kolme viivaa avaavat toisen valikon.",
    s2: "Napauta Näytä lisää.",
    a2: "Se on alin rivi, jossa on alaspäin osoittava nuoli.",
    s3: "Vieritä alas. Napauta Lisää Koti-valikkoon.",
    a3: "Se on harmaan laatikon viimeinen rivi, kohdan Etsi sivulta alla.",
    s4: "Napauta lopuksi oikeassa yläkulmassa olevaa painiketta.",
    options: "Valinnat",
    messages: "Viestit",
    showMore: "Näytä lisää",
    addFavorites: "Lisää suosikkeihin",
    quickNote: "Lisää pikamuistiinpanoon",
    find: "Etsi sivulta",
    addHome: "Lisää Koti-valikkoon",
    markup: "Merkintä",
    print: "Tulosta"
  },
  fr: {
    pitch: "Toutes tes promos, au même endroit.",
    heading: "Sur l’écran d’accueil",
    where: "Ouvrez cette page dans Safari. Si la page est ouverte dans un message, touchez l’icône Safari.",
    where1: "Ouvrez cette page dans Safari.",
    where2a: "Si la page est ouverte dans un message,",
    s1: "Touchez la flèche qui sort d’un carré.",
    a1: "Elle est au milieu de la rangée du bas. Les trois traits à côté de l’adresse ouvrent un autre menu.",
    s2: "Touchez « Afficher plus ».",
    a2: "C’est la rangée du bas, avec une flèche vers le bas.",
    s3: "Faites défiler vers le bas. Touchez « Sur l’écran d’accueil ».",
    a3: "C’est la dernière ligne du cadre gris, sous « Rechercher dans la page ».",
    s4: "Enfin, touchez le bouton en haut à droite.",
    options: "Options",
    messages: "Messages",
    showMore: "Afficher plus",
    addFavorites: "Ajouter aux favoris",
    quickNote: "Ajouter à une note rapide",
    find: "Rechercher dans la page",
    addHome: "Sur l’écran d’accueil",
    markup: "Annotation",
    print: "Imprimer"
  },
  "fr-CA": {
    pitch: "Tous tes rabais, au même endroit.",
    heading: "Sur l’écran d’accueil",
    where: "Ouvrez cette page dans Safari. Si la page est ouverte dans un message, touchez l’icône Safari.",
    where1: "Ouvrez cette page dans Safari.",
    where2a: "Si la page est ouverte dans un message,",
    s1: "Touchez la flèche qui sort d’un carré.",
    a1: "Elle est au milieu de la rangée du bas. Les trois traits à côté de l’adresse ouvrent un autre menu.",
    s2: "Touchez « Afficher plus ».",
    a2: "C’est la rangée du bas, avec une flèche vers le bas.",
    s3: "Faites défiler vers le bas. Touchez « Sur l’écran d’accueil ».",
    a3: "C’est la dernière ligne du cadre gris, sous « Rechercher dans la page ».",
    s4: "Enfin, touchez le bouton en haut à droite.",
    options: "Options",
    messages: "Messages",
    showMore: "Afficher plus",
    addFavorites: "Ajouter aux favoris",
    quickNote: "Ajouter à une note rapide",
    find: "Rechercher dans la page",
    addHome: "Sur l’écran d’accueil",
    markup: "Annotation",
    print: "Imprimer"
  },
  he: {
    pitch: "כל ההנחות שלך במקום אחד.",
    heading: "במסך הבית",
    where: "יש לפתוח את הדף הזה ב-Safari. אם הדף פתוח בהודעה, יש להקיש על הסמל של Safari.",
    where1: "יש לפתוח את הדף הזה ב-Safari.",
    where2a: "אם הדף פתוח בהודעה,",
    s1: "יש להקיש על החץ שיוצא מריבוע.",
    a1: "הוא באמצע השורה התחתונה. שלושת הקווים ליד הכתובת פותחים תפריט אחר.",
    s2: "יש להקיש על ״הצג עוד״.",
    a2: "זו השורה התחתונה, עם חץ למטה.",
    s3: "יש לגלול למטה. יש להקיש על ״הוספה למסך הבית״.",
    a3: "זו השורה האחרונה בתיבה האפורה, מתחת לחיפוש בדף.",
    s4: "לבסוף, הקש על הכפתור בפינה הימנית העליונה.",
    options: "אפשרויות",
    messages: "הודעות",
    showMore: "הצג עוד",
    addFavorites: "הוספה למועדפים",
    quickNote: "הוסף לפתק מהיר",
    find: "חיפוש בדף",
    addHome: "הוספה למסך הבית",
    markup: "סימון",
    print: "הדפסה"
  },
  hi: {
    pitch: "आपकी सारी छूटें, एक ही जगह पर।",
    heading: "होम स्क्रीन पर",
    where: "इस पेज को Safari में खोलें। अगर पेज किसी संदेश में खुला है, तो Safari के आइकॉन पर टैप करें।",
    where1: "इस पेज को Safari में खोलें।",
    where2a: "अगर पेज किसी संदेश में खुला है,",
    s1: "वर्ग से निकलते तीर पर टैप करें।",
    a1: "यह नीचे की पंक्ति के बीच में है। पते के पास की तीन लकीरें दूसरा मेनू खोलती हैं।",
    s2: "और दिखाएँ पर टैप करें।",
    a2: "यह सबसे नीचे की पंक्ति है, नीचे तीर के साथ।",
    s3: "नीचे स्क्रोल करें। होम स्क्रीन पर जोड़ें पर टैप करें।",
    a3: "यह धूसर बॉक्स की आख़िरी पंक्ति है, पेज पर खोजें के नीचे।",
    s4: "अंत में, ऊपर दाईं ओर वाले बटन पर टैप करें।",
    options: "विकल्प",
    messages: "संदेश",
    showMore: "और दिखाएँ",
    addFavorites: "पसंदीदा में जोड़ें",
    quickNote: "क्विक नोट में जोड़ें",
    find: "पेज पर खोजें",
    addHome: "होम स्क्रीन पर जोड़ें",
    markup: "मार्कअप",
    print: "प्रिंट करें"
  },
  hr: {
    pitch: "Svi tvoji popusti na jednom mjestu.",
    heading: "Na početni zaslon",
    where: "Otvorite ovu stranicu u Safariju. Ako je stranica otvorena u poruci, dodirnite ikonu Safari.",
    where1: "Otvorite ovu stranicu u Safariju.",
    where2a: "Ako je stranica otvorena u poruci,",
    s1: "Dodirnite strelicu iz kvadratića.",
    a1: "Nalazi se u sredini donjeg retka. Tri crte pokraj adrese otvaraju drugi izbornik.",
    s2: "Dodirnite Prikaži više.",
    a2: "To je donji redak, sa strelicom prema dolje.",
    s3: "Listajte prema dolje. Dodirnite Dodaj na početni zaslon.",
    a3: "To je zadnji redak u sivom okviru, ispod Pronađi na stranici.",
    s4: "Na kraju dodirnite tipku gore desno.",
    options: "Opcije",
    messages: "Poruke",
    showMore: "Prikaži više",
    addFavorites: "Dodaj u favorite",
    quickNote: "Dodaj u brzu bilješku",
    find: "Pronađi na stranici",
    addHome: "Dodaj na početni zaslon",
    markup: "Označavanje",
    print: "Ispiši"
  },
  hu: {
    pitch: "Minden kedvezményed egy helyen.",
    heading: "A Főképernyőre",
    where: "Nyissa meg ezt az oldalt a Safariban. Ha az oldal egy üzenetben van megnyitva, koppintson a Safari ikonjára.",
    where1: "Nyissa meg ezt az oldalt a Safariban.",
    where2a: "Ha az oldal egy üzenetben van megnyitva,",
    s1: "Koppintson a négyzetből kijövő nyílra.",
    a1: "Az alsó sor közepén van. A cím melletti három vonal másik menüt nyit.",
    s2: "Koppintson a Több megjelenítése elemre.",
    a2: "Ez a legalsó sor, lefelé mutató nyíllal.",
    s3: "Görgessen lefelé. Koppintson a Hozzáadás a Főképernyőhöz elemre.",
    a3: "Ez a szürke keret utolsó sora, a(z) Keresés az oldalon alatt.",
    s4: "Végül koppintson a jobb felső gombra.",
    options: "Beállítások",
    messages: "Üzenetek",
    showMore: "Több megjelenítése",
    addFavorites: "Hozzáadás a Kedvencekhez",
    quickNote: "Hozzáadás gyorsjegyzethez",
    find: "Keresés az oldalon",
    addHome: "Hozzáadás a Főképernyőhöz",
    markup: "Jelölés",
    print: "Nyomtatás"
  },
  id: {
    pitch: "Semua diskonmu, di satu tempat.",
    heading: "Di Layar Utama",
    where: "Buka halaman ini di Safari. Jika halaman terbuka di pesan, ketuk ikon Safari.",
    where1: "Buka halaman ini di Safari.",
    where2a: "Jika halaman terbuka di pesan,",
    s1: "Ketuk panah yang keluar dari kotak.",
    a1: "Letaknya di tengah baris bawah. Tiga garis di samping alamat membuka menu lain.",
    s2: "Ketuk Tampilkan Lainnya.",
    a2: "Itu baris paling bawah, dengan panah ke bawah.",
    s3: "Gulir ke bawah. Ketuk Tambah ke Layar Utama.",
    a3: "Itu baris terakhir di kotak abu-abu, di bawah Cari di Halaman.",
    s4: "Terakhir, ketuk tombol di kanan atas.",
    options: "Pilihan",
    messages: "Pesan",
    showMore: "Tampilkan Lainnya",
    addFavorites: "Tambah ke Favorit",
    quickNote: "Tambahkan ke Catatan Cepat",
    find: "Cari di Halaman",
    addHome: "Tambah ke Layar Utama",
    markup: "Markup",
    print: "Cetak"
  },
  is: {
    pitch: "Allir afslættirnir þínir á einum stað.",
    heading: "Á heimaskjáinn",
    where: "Opnaðu þessa síðu í Safari. Ef síðan er opin í skilaboðum, ýttu á Safari táknið.",
    where1: "Opnaðu þessa síðu í Safari.",
    where2a: "Ef síðan er opin í skilaboðum,",
    s1: "Ýttu á örina sem kemur út úr ferningi.",
    a1: "Hún er í miðri neðstu röðinni. Þrjár línur við slóðina opna annan valmynd.",
    s2: "Ýttu á Sýna meira.",
    a2: "Það er neðsta línan, með ör niður.",
    s3: "Skrunaðu niður. Ýttu á Add to Home Screen.",
    a3: "Það er síðasta línan í gráa kassanum, undir Find on Page.",
    s4: "Ýttu að lokum á hnappinn efst til hægri.",
    options: "Valkostir",
    messages: "Skilaboð",
    showMore: "Sýna meira",
    addFavorites: "Add to Favourites",
    quickNote: "Bæta við flýtiminnismiða",
    find: "Find on Page",
    addHome: "Add to Home Screen",
    markup: "Markup",
    print: "Print"
  },
  it: {
    pitch: "Tutti i tuoi sconti, in un unico posto.",
    heading: "Sulla schermata Home",
    where: "Apri questa pagina in Safari. Se la pagina è aperta in un messaggio, tocca l’icona di Safari.",
    where1: "Apri questa pagina in Safari.",
    where2a: "Se la pagina è aperta in un messaggio,",
    s1: "Tocca la freccia che esce da un quadrato.",
    a1: "È al centro della riga in basso. Le tre linee accanto all’indirizzo aprono un altro menu.",
    s2: "Tocca Mostra altro.",
    a2: "È l’ultima riga in basso, con una freccia verso il basso.",
    s3: "Scorri verso il basso. Tocca “Aggiungi alla schermata Home”.",
    a3: "È l’ultima riga del riquadro grigio, sotto “Trova nella pagina”.",
    s4: "Infine, tocca il pulsante in alto a destra.",
    options: "Opzioni",
    messages: "Messaggi",
    showMore: "Mostra altro",
    addFavorites: "Aggiungi ai preferiti",
    quickNote: "Aggiungi a Nota rapida",
    find: "Trova nella pagina",
    addHome: "Aggiungi alla schermata Home",
    markup: "Markup",
    print: "Stampa"
  },
  ja: {
    pitch: "お得な割引を、ひとつの場所に。",
    heading: "ホーム画面に",
    where: "このページをSafariで開きます。ページがメッセージで開いている場合は、Safariのアイコンをタップします。",
    where1: "このページをSafariで開きます。",
    where2a: "ページがメッセージで開いている場合は、",
    s1: "四角から出ている矢印をタップします。",
    a1: "一番下の列の中央にあります。アドレスの横の三本線は別のメニューを開きます。",
    s2: "「さらに表示」をタップします。",
    a2: "いちばん下の行で、下向きの矢印があります。",
    s3: "下にスクロールします。「ホーム画面に追加」をタップします。",
    a3: "灰色の枠の最後の行で、「ページ内を検索」の下にあります。",
    s4: "最後に、右上のボタンをタップします。",
    options: "オプション",
    messages: "メッセージ",
    showMore: "さらに表示",
    addFavorites: "お気に入りに追加",
    quickNote: "クイックメモに追加",
    find: "ページ内を検索",
    addHome: "ホーム画面に追加",
    markup: "マークアップ",
    print: "プリント"
  },
  kk: {
    pitch: "Барлық жеңілдіктеріңіз бір жерде.",
    heading: "Басты экранға",
    where: "Бұл бетті Safari ішінде ашыңыз. Егер бет хабарламада ашылған болса, Safari белгішесін түртіңіз.",
    where1: "Бұл бетті Safari ішінде ашыңыз.",
    where2a: "Егер бет хабарламада ашылған болса,",
    s1: "Шаршыдан шыққан көрсеткіні түртіңіз.",
    a1: "Ол төменгі қатардың ортасында. Мекенжайдың жанындағы үш сызық басқа мәзірді ашады.",
    s2: "«Көбірек көрсету» түймесін түртіңіз.",
    a2: "Бұл төменгі жол, төмен көрсеткісі бар.",
    s3: "Төмен жылжыңыз. «Басты экранға қосу» опциясын түртіңіз.",
    a3: "Бұл сұр жақтаудағы соңғы жол, Беттен табу астында.",
    s4: "Соңында жоғарғы оң жақтағы түймені түртіңіз.",
    options: "Опциялар",
    messages: "Хабарлар",
    showMore: "Көбірек көрсету",
    addFavorites: "Таңдаулыларға қосу",
    quickNote: "Жылдам жазбаға қосу",
    find: "Беттен табу",
    addHome: "Басты экранға қосу",
    markup: "Белгілеу",
    print: "Басып шығару"
  },
  ko: {
    pitch: "모든 할인을 한곳에서.",
    heading: "홈 화면에",
    where: "이 페이지를 Safari에서 여십시오. 페이지가 메시지에서 열려 있으면, Safari 아이콘을 탭하십시오.",
    where1: "이 페이지를 Safari에서 여십시오.",
    where2a: "페이지가 메시지에서 열려 있으면,",
    s1: "사각형에서 나오는 화살표를 탭하십시오.",
    a1: "맨 아래 줄 가운데에 있습니다. 주소 옆의 선 세 개는 다른 메뉴를 엽니다.",
    s2: "‘더 보기’를 탭하십시오.",
    a2: "맨 아래 줄이며, 아래쪽 화살표가 있습니다.",
    s3: "아래로 스크롤하십시오. ‘홈 화면에 추가’를 탭하십시오.",
    a3: "회색 상자의 마지막 줄로, 페이지에서 찾기 아래에 있습니다.",
    s4: "마지막으로 오른쪽 위의 버튼을 탭하십시오.",
    options: "옵션",
    messages: "메시지",
    showMore: "더 보기",
    addFavorites: "즐겨찾기에 추가",
    quickNote: "빠른 메모에 추가",
    find: "페이지에서 찾기",
    addHome: "홈 화면에 추가",
    markup: "마크업",
    print: "프린트"
  },
  lt: {
    pitch: "Visos tavo nuolaidos vienoje vietoje.",
    heading: "Į pradžios ekraną",
    where: "Atidarykite šį puslapį „Safari“. Jei puslapis atidarytas žinutėje, palieskite „Safari“ piktogramą.",
    where1: "Atidarykite šį puslapį „Safari“.",
    where2a: "Jei puslapis atidarytas žinutėje,",
    s1: "Palieskite rodyklę, išeinančią iš kvadrato.",
    a1: "Ji yra apatinės eilutės viduryje. Trys brūkšniai prie adreso atidaro kitą meniu.",
    s2: "Palieskite „Rodyti daugiau“.",
    a2: "Tai apatinė eilutė su rodykle žemyn.",
    s3: "Slinkite žemyn. Palieskite „Įtraukti į pradžios ekraną“.",
    a3: "Tai paskutinė pilko langelio eilutė, po „Rasti puslapyje“.",
    s4: "Galiausiai bakstelėkite mygtuką viršuje dešinėje.",
    options: "Parinktys",
    messages: "Žinutės",
    showMore: "Rodyti daugiau",
    addFavorites: "Pridėti prie parankinių",
    quickNote: "Pridėti prie greitos pastabos",
    find: "Rasti puslapyje",
    addHome: "Įtraukti į pradžios ekraną",
    markup: "Žymėjimas",
    print: "Spausdinti"
  },
  lv: {
    pitch: "Visas tavas atlaides vienuviet.",
    heading: "Sākuma ekrānā",
    where: "Atveriet šo lapu lietotnē Safari. Ja lapa ir atvērta ziņā, pieskarieties Safari ikonai.",
    where1: "Atveriet šo lapu lietotnē Safari.",
    where2a: "Ja lapa ir atvērta ziņā,",
    s1: "Pieskarieties bultiņai, kas iznāk no kvadrāta.",
    a1: "Tā ir apakšējās rindas vidū. Trīs svītras pie adreses atver citu izvēlni.",
    s2: "Pieskarieties Rādīt vairāk.",
    a2: "Tā ir apakšējā rinda ar bultiņu uz leju.",
    s3: "Ritiniet uz leju. Pieskarieties Add to Home Screen.",
    a3: "Tā ir pelēkā lodziņa pēdējā rinda, zem Meklēt lapā.",
    s4: "Visbeidzot pieskarieties pogai augšā pa labi.",
    options: "Opcijas",
    messages: "Ziņas",
    showMore: "Rādīt vairāk",
    addFavorites: "Pievienot izlasei",
    quickNote: "Pievienot ātrajai piezīmei",
    find: "Meklēt lapā",
    addHome: "Add to Home Screen",
    markup: "Marķēšana",
    print: "Drukāt"
  },
  ms: {
    pitch: "Semua diskaun anda, di satu tempat.",
    heading: "Pada Skrin Utama",
    where: "Buka halaman ini dalam Safari. Jika halaman dibuka dalam mesej, ketik ikon Safari.",
    where1: "Buka halaman ini dalam Safari.",
    where2a: "Jika halaman dibuka dalam mesej,",
    s1: "Ketik anak panah yang keluar dari petak.",
    a1: "Ia di tengah baris bawah. Tiga garisan di sebelah alamat membuka menu lain.",
    s2: "Ketik Tunjukkan Lagi.",
    a2: "Ia baris paling bawah, dengan anak panah ke bawah.",
    s3: "Skrol ke bawah. Ketik Tambah ke Skrin Utama.",
    a3: "Ia baris terakhir dalam kotak kelabu, di bawah Cari pada Halaman.",
    s4: "Akhir sekali, ketik butang di kanan atas.",
    options: "Pilihan",
    messages: "Mesej",
    showMore: "Tunjukkan Lagi",
    addFavorites: "Tambah ke Kegemaran",
    quickNote: "Tambah ke Nota Pantas",
    find: "Cari pada Halaman",
    addHome: "Tambah ke Skrin Utama",
    markup: "Markup",
    print: "Cetak"
  },
  nl: {
    pitch: "Al je kortingen op één plek.",
    heading: "Op je beginscherm",
    where: "Open deze pagina in Safari. Als de pagina in een bericht is geopend, tik je op het Safari-symbool.",
    where1: "Open deze pagina in Safari.",
    where2a: "Als de pagina in een bericht is geopend,",
    s1: "Tik op de pijl die uit een vierkant komt.",
    a1: "Die staat in het midden van de onderste rij. De drie strepen naast het adres openen een ander menu.",
    s2: "Tik op 'Toon meer'.",
    a2: "Het is de onderste rij, met een pijl omlaag.",
    s3: "Scrol omlaag. Tik op 'Zet op beginscherm'.",
    a3: "Het is de laatste rij in het grijze vak, onder ‘Zoek op pagina’.",
    s4: "Tik ten slotte op de knop rechtsboven.",
    options: "Opties",
    messages: "Berichten",
    showMore: "Toon meer",
    addFavorites: "Zet in favorieten",
    quickNote: "Voeg toe aan snelle notitie",
    find: "Zoek op pagina",
    addHome: "Zet op beginscherm",
    markup: "Markeer",
    print: "Print"
  },
  no: {
    pitch: "Alle rabattene dine, på ett sted.",
    heading: "På Hjem-skjermen",
    where: "Åpne denne siden i Safari. Hvis siden er åpen i en melding, trykker du på Safari-symbolet.",
    where1: "Åpne denne siden i Safari.",
    where2a: "Hvis siden er åpen i en melding,",
    s1: "Trykk på pilen som kommer ut av et kvadrat.",
    a1: "Den er midt på den nederste raden. De tre strekene ved adressen åpner en annen meny.",
    s2: "Trykk på Vis mer.",
    a2: "Det er den nederste raden, med en pil ned.",
    s3: "Rull ned. Trykk på Legg til på Hjem-skjermen.",
    a3: "Det er den siste raden i den grå boksen, under Finn på siden.",
    s4: "Til slutt trykker du på knappen øverst til høyre.",
    options: "Valg",
    messages: "Meldinger",
    showMore: "Vis mer",
    addFavorites: "Legg til i favoritter",
    quickNote: "Legg til i hurtignotat",
    find: "Finn på siden",
    addHome: "Legg til på Hjem-skjermen",
    markup: "Markering",
    print: "Skriv ut"
  },
  pl: {
    pitch: "Wszystkie twoje zniżki w jednym miejscu.",
    heading: "Na ekranie głównym",
    where: "Otwórz tę stronę w Safari. Jeśli strona jest otwarta w wiadomości, stuknij w ikonę Safari.",
    where1: "Otwórz tę stronę w Safari.",
    where2a: "Jeśli strona jest otwarta w wiadomości,",
    s1: "Stuknij strzałkę wychodzącą z kwadratu.",
    a1: "Jest na środku dolnego rzędu. Trzy kreski obok adresu otwierają inne menu.",
    s2: "Stuknij w Pokaż więcej.",
    a2: "To dolny wiersz, ze strzałką w dół.",
    s3: "Przewiń w dół. Stuknij w Do ekranu głównego.",
    a3: "To ostatni wiersz w szarym polu, pod „Znajdź na stronie”.",
    s4: "Na koniec stuknij przycisk w prawym górnym rogu.",
    options: "Opcje",
    messages: "Wiadomości",
    showMore: "Pokaż więcej",
    addFavorites: "Dodaj do ulubionych",
    quickNote: "Dodaj do szybkiej notatki",
    find: "Znajdź na stronie",
    addHome: "Do ekranu głównego",
    markup: "Markup",
    print: "Drukuj"
  },
  "pt-BR": {
    pitch: "Todos os seus descontos, em um só lugar.",
    heading: "Na Tela de Início",
    where: "Abra esta página no Safari. Se a página estiver aberta em uma mensagem, toque no ícone do Safari.",
    where1: "Abra esta página no Safari.",
    where2a: "Se a página estiver aberta em uma mensagem,",
    s1: "Toque na seta que sai de um quadrado.",
    a1: "Ela fica no meio da fileira de baixo. Os três traços ao lado do endereço abrem outro menu.",
    s2: "Toque em Mostrar Mais.",
    a2: "É a linha de baixo, com uma seta para baixo.",
    s3: "Role para baixo. Toque em “Adicionar à Tela de Início”.",
    a3: "É a última linha do quadro cinza, abaixo de “Buscar na Página”.",
    s4: "Por fim, toque no botão no canto superior direito.",
    options: "Opções",
    messages: "Mensagens",
    showMore: "Mostrar Mais",
    addFavorites: "Adicionar aos Favoritos",
    quickNote: "Adicionar à Nota Rápida",
    find: "Buscar na Página",
    addHome: "Adicionar à Tela de Início",
    markup: "Marcação",
    print: "Imprimir"
  },
  "pt-PT": {
    pitch: "Todos os teus descontos, num só lugar.",
    heading: "No ecrã principal",
    where: "Abra esta página no Safari. Se a página estiver aberta numa mensagem, toque no ícone do Safari.",
    where1: "Abra esta página no Safari.",
    where2a: "Se a página estiver aberta numa mensagem,",
    s1: "Toque na seta que sai de um quadrado.",
    a1: "Está no meio da fila de baixo. Os três traços ao lado do endereço abrem outro menu.",
    s2: "Toque em “Mostrar mais”.",
    a2: "É a linha de baixo, com uma seta para baixo.",
    s3: "Desloque-se para baixo. Toque em “Adicionar ao ecrã principal”.",
    a3: "É a última linha da caixa cinzenta, por baixo de “Procurar na página”.",
    s4: "Por fim, toque no botão no canto superior direito.",
    options: "Opções",
    messages: "Mensagens",
    showMore: "Mostrar mais",
    addFavorites: "Adicionar aos favoritos",
    quickNote: "Adicionar a nota rápida",
    find: "Procurar na página",
    addHome: "Adicionar ao ecrã principal",
    markup: "Marcação",
    print: "Imprimir"
  },
  ro: {
    pitch: "Toate reducerile tale, într-un singur loc.",
    heading: "Pe ecranul principal",
    where: "Deschideți această pagină în Safari. Dacă pagina este deschisă într-un mesaj, apăsați pe pictograma Safari.",
    where1: "Deschideți această pagină în Safari.",
    where2a: "Dacă pagina este deschisă într-un mesaj,",
    s1: "Apăsați săgeata care iese dintr-un pătrat.",
    a1: "Este la mijlocul rândului de jos. Cele trei linii de lângă adresă deschid alt meniu.",
    s2: "Apăsați pe Afișează mai mult.",
    a2: "Este rândul de jos, cu o săgeată în jos.",
    s3: "Derulați în jos. Apăsați pe Adăugați la ecranul principal.",
    a3: "Este ultimul rând din caseta gri, sub „Căutare în pagină”.",
    s4: "La final, apasă butonul din dreapta sus.",
    options: "Opțiuni",
    messages: "Mesaje",
    showMore: "Afișează mai mult",
    addFavorites: "Adăugare la Favorite",
    quickNote: "Adaugă la notiță rapidă",
    find: "Căutare în pagină",
    addHome: "Adăugați la ecranul principal",
    markup: "Marcare",
    print: "Imprimare"
  },
  ru: {
    pitch: "Все ваши скидки в одном месте.",
    heading: "На экране «Домой»",
    where: "Откройте эту страницу в Safari. Если страница открыта в сообщении, коснитесь значка Safari.",
    where1: "Откройте эту страницу в Safari.",
    where2a: "Если страница открыта в сообщении,",
    s1: "Коснитесь стрелки, выходящей из квадрата.",
    a1: "Она в середине нижнего ряда. Три черты рядом с адресом открывают другое меню.",
    s2: "Коснитесь «Показать больше».",
    a2: "Это нижняя строка, со стрелкой вниз.",
    s3: "Прокрутите вниз. Коснитесь «На экран \"Домой\"».",
    a3: "Это последняя строка в сером блоке, под «Найти на странице».",
    s4: "В конце коснитесь кнопки справа вверху.",
    options: "Параметры",
    messages: "Сообщения",
    showMore: "Показать больше",
    addFavorites: "Добавить в Избранное",
    quickNote: "Добавить в Быструю заметку",
    find: "Найти на странице",
    addHome: "На экран \"Домой\"",
    markup: "Разметка",
    print: "Напечатать"
  },
  sk: {
    pitch: "Všetky tvoje zľavy na jednom mieste.",
    heading: "Na ploche",
    where: "Otvorte túto stránku v Safari. Ak je stránka otvorená v správe, klepnite na ikonu Safari.",
    where1: "Otvorte túto stránku v Safari.",
    where2a: "Ak je stránka otvorená v správe,",
    s1: "Klepnite na šípku z obdĺžnika.",
    a1: "Je v strede dolného radu. Tri čiarky pri adrese otvoria inú ponuku.",
    s2: "Klepnite na Zobraziť viac.",
    a2: "Je to spodný riadok so šípkou nadol.",
    s3: "Rolujte nadol. Klepnite na Pridať na plochu.",
    a3: "Je to posledný riadok v sivom rámčeku, pod „Hľadať na stránke“.",
    s4: "Nakoniec ťuknite na tlačidlo vpravo hore.",
    options: "Voľby",
    messages: "Správy",
    showMore: "Zobraziť viac",
    addFavorites: "Pridať medzi obľúbené",
    quickNote: "Pridať do rýchlej poznámky",
    find: "Hľadať na stránke",
    addHome: "Pridať na plochu",
    markup: "Značky",
    print: "Tlačiť"
  },
  sr: {
    pitch: "Сви твоји попусти на једном месту.",
    heading: "На почетном екрану",
    where: "Отворите ову страницу у прегледачу Safari. Ако је страница отворена у поруци, тапните на икону Safari.",
    where1: "Отворите ову страницу у прегледачу Safari.",
    where2a: "Ако је страница отворена у поруци,",
    s1: "Тапните стрелицу из квадратића.",
    a1: "Она је на средини доњег реда. Три црте поред адресе отварају други мени.",
    s2: "Тапните на Прикажи више.",
    a2: "То је доњи ред, са стрелицом надоле.",
    s3: "Листајте надоле. Тапните на Add to Home Screen.",
    a3: "То је последњи ред у сивом оквиру, испод Пронађи на страници.",
    s4: "На крају додирните дугме горе десно.",
    options: "Опције",
    messages: "Поруке",
    showMore: "Прикажи више",
    addFavorites: "Додај у омиљене",
    quickNote: "Додај у брзу белешку",
    find: "Пронађи на страници",
    addHome: "Add to Home Screen",
    markup: "Означавање",
    print: "Одштампај"
  },
  sv: {
    pitch: "Alla dina rabatter på ett ställe.",
    heading: "På hemskärmen",
    where: "Öppna den här sidan i Safari. Om sidan är öppen i ett meddelande, trycker du på Safari-symbolen.",
    where1: "Öppna den här sidan i Safari.",
    where2a: "Om sidan är öppen i ett meddelande,",
    s1: "Tryck på pilen som kommer ut ur en fyrkant.",
    a1: "Den sitter i mitten av den nedersta raden. De tre strecken vid adressen öppnar en annan meny.",
    s2: "Tryck på Visa mer.",
    a2: "Det är den nedersta raden, med en pil nedåt.",
    s3: "Rulla nedåt. Tryck på Lägg till på hemskärmen.",
    a3: "Det är den sista raden i den grå rutan, under Sök på sidan.",
    s4: "Tryck till sist på knappen uppe till höger.",
    options: "Alternativ",
    messages: "Meddelanden",
    showMore: "Visa mer",
    addFavorites: "Lägg till i favoriter",
    quickNote: "Lägg till i snabbanteckning",
    find: "Sök på sidan",
    addHome: "Lägg till på hemskärmen",
    markup: "Uppmärkning",
    print: "Skriv ut"
  },
  th: {
    pitch: "ส่วนลดทั้งหมดของคุณ ในที่เดียว",
    heading: "บนหน้าจอโฮม",
    where: "เปิดหน้านี้ใน Safari ถ้าหน้านี้เปิดอยู่ในข้อความ ให้แตะไอคอน Safari",
    where1: "เปิดหน้านี้ใน Safari",
    where2a: "ถ้าหน้านี้เปิดอยู่ในข้อความ",
    s1: "แตะลูกศรที่ออกจากสี่เหลี่ยม",
    a1: "อยู่ตรงกลางแถวล่าง เส้นสามเส้นข้างที่อยู่เปิดเมนูอีกอัน",
    s2: "แตะ แสดงเพิ่มเติม",
    a2: "เป็นแถวล่างสุด มีลูกศรชี้ลง",
    s3: "เลื่อนลง แตะ เพิ่มไปยังหน้าจอโฮม",
    a3: "เป็นแถวสุดท้ายในกรอบสีเทา ใต้ ค้นหาในหน้า",
    s4: "สุดท้าย แตะปุ่มที่มุมขวาบน",
    options: "ตัวเลือก",
    messages: "ข้อความ",
    showMore: "แสดงเพิ่มเติม",
    addFavorites: "เพิ่มไปยังรายการโปรด",
    quickNote: "เพิ่มไปยังโน้ตด่วน",
    find: "ค้นหาในหน้า",
    addHome: "เพิ่มไปยังหน้าจอโฮม",
    markup: "มาร์กอัพ",
    print: "พิมพ์"
  },
  tr: {
    pitch: "Tüm indirimlerin tek bir yerde.",
    heading: "Ana ekranda",
    where: "Bu sayfayı Safari’de açın. Sayfa bir mesajda açıksa, Safari simgesine dokunun.",
    where1: "Bu sayfayı Safari’de açın.",
    where2a: "Sayfa bir mesajda açıksa,",
    s1: "Kareden çıkan oka dokunun.",
    a1: "Alt sıranın ortasındadır. Adresin yanındaki üç çizgi başka bir menü açar.",
    s2: "Daha Fazla Göster’a dokunun.",
    a2: "En alttaki satırdır, aşağı oklu.",
    s3: "Aşağı kaydırın. Ana Ekrana Ekle’ye dokunun.",
    a3: "Gri kutunun son satırıdır, Sayfada Bul öğesinin altında.",
    s4: "Son olarak sağ üstteki düğmeye dokunun.",
    options: "Seçenekler",
    messages: "Mesajlar",
    showMore: "Daha Fazla Göster",
    addFavorites: "Sık Kullanılanlara Ekle",
    quickNote: "Hızlı Nota Ekle",
    find: "Sayfada Bul",
    addHome: "Ana Ekrana Ekle",
    markup: "İşaretleme",
    print: "Yazdır"
  },
  uk: {
    pitch: "Усі ваші знижки в одному місці.",
    heading: "На Початковому екрані",
    where: "Відкрийте цю сторінку в Safari. Якщо сторінку відкрито в повідомленні, торкніть іконку Safari.",
    where1: "Відкрийте цю сторінку в Safari.",
    where2a: "Якщо сторінку відкрито в повідомленні,",
    s1: "Торкніть стрілку, що виходить із квадрата.",
    a1: "Вона посередині нижнього ряду. Три риски біля адреси відкривають інше меню.",
    s2: "Торкніть «Показати більше».",
    a2: "Це нижній рядок, зі стрілкою вниз.",
    s3: "Прокрутіть униз. Торкніть «На Початковий екран».",
    a3: "Це останній рядок у сірому блоці, під «Знайти на сторінці».",
    s4: "Наостанок торкніться кнопки праворуч угорі.",
    options: "Параметри",
    messages: "Повідомлення",
    showMore: "Показати більше",
    addFavorites: "Додати в обране",
    quickNote: "Додати в Швидку нотатку",
    find: "Знайти на сторінці",
    addHome: "На Початковий екран",
    markup: "Розмітка",
    print: "Друк"
  },
  vi: {
    pitch: "Mọi ưu đãi của bạn, ở cùng một nơi.",
    heading: "Trên Màn hình chính",
    where: "Mở trang này trong Safari. Nếu trang đang mở trong tin nhắn, hãy chạm vào biểu tượng Safari.",
    where1: "Mở trang này trong Safari.",
    where2a: "Nếu trang đang mở trong tin nhắn,",
    s1: "Chạm vào mũi tên đi ra từ hình vuông.",
    a1: "Nó ở giữa hàng dưới cùng. Ba gạch cạnh địa chỉ mở một menu khác.",
    s2: "Chạm vào Hiển thị thêm.",
    a2: "Đó là hàng dưới cùng, có mũi tên chỉ xuống.",
    s3: "Cuộn xuống. Chạm vào Thêm vào Màn hình chính.",
    a3: "Đó là hàng cuối cùng trong khung xám, dưới Tìm trên trang.",
    s4: "Cuối cùng, chạm vào nút ở góc trên bên phải.",
    options: "Tùy chọn",
    messages: "Tin nhắn",
    showMore: "Hiển thị thêm",
    addFavorites: "Thêm vào Mục yêu thích",
    quickNote: "Thêm vào Ghi chú nhanh",
    find: "Tìm trên trang",
    addHome: "Thêm vào Màn hình chính",
    markup: "Đánh dấu",
    print: "In"
  },
  "zh-CN": {
    pitch: "你的所有折扣，尽在一处。",
    heading: "在主屏幕上",
    where: "在 Safari 浏览器中打开此页面。如果页面是在信息中打开的，请轻点 Safari 浏览器图标。",
    where1: "在 Safari 浏览器中打开此页面。",
    where2a: "如果页面是在信息中打开的，",
    s1: "轻点从方框里伸出的箭头。",
    a1: "它在最下面一行的中间。地址旁边的三条线会打开另一个菜单。",
    s2: "轻点“显示更多”。",
    a2: "它在最下面一行，带一个向下的箭头。",
    s3: "向下滚动。轻点“添加到主屏幕”。",
    a3: "它是灰色框里的最后一行，在“在页面上查找”下面。",
    s4: "最后，轻点右上角的按钮。",
    options: "选项",
    messages: "信息",
    showMore: "显示更多",
    addFavorites: "添加到个人收藏",
    quickNote: "添加到快速备忘录",
    find: "在页面上查找",
    addHome: "添加到主屏幕",
    markup: "标记",
    print: "打印"
  },
  "zh-HK": {
    pitch: "你的所有折扣，盡在一處。",
    heading: "在主畫面上",
    where: "在 Safari 開啟此頁面。如果頁面是在訊息中開啟，請點一下 Safari 圖像。",
    where1: "在 Safari 開啟此頁面。",
    where2a: "如果頁面是在訊息中開啟，",
    s1: "點一下從方框伸出的箭頭。",
    a1: "它在最下面一列的中間。網址旁邊的三條線會打開另一個選單。",
    s2: "點一下「顯示更多」。",
    a2: "它在最下面一行，有一個向下的箭嘴。",
    s3: "向下捲動。點一下「加至主畫面」。",
    a3: "它是灰色框中的最後一行，在「在頁面上尋找」下面。",
    s4: "最後，點一下右上角的按鈕。",
    options: "選項",
    messages: "訊息",
    showMore: "顯示更多",
    addFavorites: "加入個人收藏",
    quickNote: "加至快速備忘錄",
    find: "在頁面上尋找",
    addHome: "加至主畫面",
    markup: "標記",
    print: "列印"
  },
  "zh-TW": {
    pitch: "你的所有折扣，盡在一處。",
    heading: "在主畫面上",
    where: "在 Safari 打開此頁面。如果頁面是在訊息中打開，請點一下 Safari 圖像。",
    where1: "在 Safari 打開此頁面。",
    where2a: "如果頁面是在訊息中打開，",
    s1: "點一下從方框伸出的箭頭。",
    a1: "它在最下面一列的中間。網址旁邊的三條線會打開另一個選單。",
    s2: "點一下「顯示更多」。",
    a2: "它在最下面一行，有一個向下的箭頭。",
    s3: "向下捲動。點一下「加入主畫面」。",
    a3: "它是灰色框中的最後一行，在「尋找頁面」下面。",
    s4: "最後，點一下右上角的按鈕。",
    options: "選項",
    messages: "訊息",
    showMore: "顯示更多",
    addFavorites: "加入個人收藏",
    quickNote: "加入快速備忘錄",
    find: "尋找頁面",
    addHome: "加入主畫面",
    markup: "標示",
    print: "列印"
  }
};

(function () {
  const RTL = ["ar", "he"];

  function pick() {
    const forced = new URLSearchParams(location.search).get("lang");
    const wanted = forced ? [forced] : (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || "en"]);
    for (const raw of wanted) {
      const tag = String(raw).toLowerCase();
      const base = tag.split("-")[0];
      // Regional variants Apple writes separately.
      if (base === "zh") {
        if (/hk|mo/.test(tag)) return "zh-HK";
        if (/hant|tw/.test(tag)) return "zh-TW";
        return "zh-CN";
      }
      if (base === "pt") return /pt-pt/.test(tag) ? "pt-PT" : "pt-BR";
      if (base === "es") return (tag === "es" || tag === "es-es") ? "es" : "es-MX";
      if (base === "fr" && /fr-ca/.test(tag)) return KD_TEXT["fr-CA"] ? "fr-CA" : "fr";
      if (base === "nb" || base === "nn") return KD_TEXT.no ? "no" : "en";
      if (KD_TEXT[base]) return base;
    }
    return "en"; // guess: the widest-read fallback
  }

  const lang = pick();
  const to = KD_TEXT[lang];
  const from = KD_TEXT.sl;

  const norm = (s) => s.replace(/\s*…$/, "").replace(/\s+/g, " ").trim().toLocaleLowerCase("sl");
  const index = new Map();
  for (const key of Object.keys(from)) {
    for (const v of [].concat(from[key])) index.set(norm(v), key);
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  // Weekday on a drawn calendar icon (10 Nov 2026 is a Tuesday: "TOR").
  const weekday = new Intl.DateTimeFormat(lang, { weekday: "short" }).format(new Date(2026, 10, 10)).replace(/\.$/, "");
  const PITCH_EN = "All your discounts, in one place.";
  const PITCH_PARTS = ["All your", "discounts, in", "one place."];
  // Split a translated headline into three lines of about equal length, at spaces. Chinese and Japanese
  // (no spaces) break after their comma, then the rest in half. Thai (one space) gets two lines.
  function threeLines(t) {
    const cjk = t.match(/^(.+?[，、])(.+)$/);
    if (cjk && !/ /.test(t)) {
      const rest = Array.from(cjk[2]), h = Math.floor(rest.length / 2);
      return [cjk[1], rest.slice(0, h).join(""), rest.slice(h).join("")];
    }
    const units = t.split(" ");
    if (units.length < 3) return units.concat(["", ""]).slice(0, 3);
    const total = t.length, lines = ["", "", ""];
    let i = 0, len = 0;
    for (let li = 0; li < 3; li++) {
      const target = total * (li + 1) / 3;
      while (i < units.length && (li === 2 || lines[li] === "" || len + units[i].length / 2 <= target)) {
        lines[li] += (lines[li] ? " " : "") + units[i];
        len += units[i].length + 1;
        i++;
        if (li < 2 && units.length - i <= 2 - li) break; // leave a word for each line still to fill
      }
    }
    return lines;
  }
  const pitchLines = threeLines(to.pitch);
  const changed = [];
  for (const n of nodes) {
    const raw = n.nodeValue;
    const text = raw.trim();
    if (!text) continue;
    if (text === "TOR") { n.nodeValue = raw.replace(text, weekday.toLocaleUpperCase(lang)); continue; }
    // The headline, whole or drawn as three lines ("All your" / "discounts, in" / "one place.").
    const part = PITCH_PARTS.indexOf(text);
    if (text === PITCH_EN || part >= 0) {
      n.nodeValue = raw.replace(text, part >= 0 ? pitchLines[part] : to.pitch);
      changed.push(n);
      continue;
    }
    const key = index.get(norm(text));
    if (!key || to[key] == null) continue;
    let out = [].concat(to[key])[0];
    const ell = text.match(/\s*…$/);
    if (ell) out += ell[0];
    if (text === text.toLocaleUpperCase("sl") && /[A-ZČŠŽ]/.test(text)) out = out.toLocaleUpperCase(lang);
    n.nodeValue = raw.replace(text, out);
    changed.push(n);
  }

  document.documentElement.lang = lang;
  const style = document.createElement("style");
  // A long word (Russian "веб‑приложение» has a no-break hyphen) must wrap, not widen the page.
  style.textContent = "ol li > p, h1 { min-width: 0; overflow-wrap: break-word; } ol li > * { min-width: 0; }";
  if (RTL.includes(lang.split("-")[0])) {
    document.documentElement.dir = "rtl";
    // The drawings are laid out left to right; flipping the direction pushed drawn words off the
    // screen. Arabic and Hebrew words still read right to left inside each label. The drawings are
    // not mirrored the way an Arabic or Hebrew iPhone is (known gap, 10 Nov 2026).
    style.textContent += " ol [aria-hidden='true'] { direction: ltr; }";
  }
  // The headline was set to break as "All your / discounts, in / one place." In other languages let
  // the browser even out the lines, and keep Japanese and Chinese words whole (no "に。" left alone).
  const HEADS = "h1, .pg-h, .pg .y strong";
  if (lang !== "en") style.textContent += ` ${HEADS} { text-wrap: balance; }`;
  if (/^(ja|zh)/.test(lang)) style.textContent += ` ${HEADS} { word-break: auto-phrase; }`;
  document.head.appendChild(style);

  // Longer words than the Slovenian ones can spill out of a drawn button or screen. Shrink only the
  // label that spills, at most to 60% of its size (guess: smaller is unreadable for her).
  function fit() {
    for (const n of changed) { // only translated words; the address is cut off on purpose
      const el = n.parentElement;
      if (!el || !n.nodeValue.trim()) continue;
      const root = el.closest("ol [aria-hidden='true']");
      if (!root) continue;
      const isSvg = el instanceof SVGElement;
      let box;
      if (isSvg) {
        box = el.ownerSVGElement.getBoundingClientRect();
      } else {
        let a = el; box = root.getBoundingClientRect();
        while (a && a !== root) {
          if (getComputedStyle(a).overflow !== "visible") { box = a.getBoundingClientRect(); break; }
          a = a.parentElement;
        }
      }
      const base = parseFloat(getComputedStyle(el).fontSize);
      for (let i = 1; i <= 8; i++) {
        const rg = document.createRange(); rg.selectNodeContents(n);
        const t = rg.getBoundingClientRect();
        // Drawn words keep 8px clear of the screen edge (guess), so they do not touch it.
        const pad = isSvg ? 8 : 1;
        if (!t.width || (t.left >= box.left - pad && t.right <= box.right - (isSvg ? pad : -1))) break;
        el.style.fontSize = (base * (1 - i * 0.05)) + "px";
      }
    }
    // A drawn headline may take no more lines than the English one did in that drawing, so it does not
    // run over the rest of the drawn page. Same limit: at most 60% of its size.
    for (const el of document.querySelectorAll("ol .pg-h, ol .pg .y strong")) {
      const now = el.textContent;
      el.textContent = PITCH_EN;
      const h = el.getBoundingClientRect().height;
      el.textContent = now;
      const base = parseFloat(getComputedStyle(el).fontSize);
      for (let i = 1; i <= 8 && el.getBoundingClientRect().height > h + 1; i++) {
        el.style.fontSize = (base * (1 - i * 0.05)) + "px";
      }
    }
  }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
})();
