/* ====================================================
   Two languages: English (written in the HTML) and Hungarian.
   Text elements are matched by their English text and swapped
   in place; scripts use i18n.t() for text they generate.
==================================================== */
(function () {
  const root = document.documentElement;

  // English page text → Hungarian HTML
  const HU = {
  "loss": "veszteség",
  "step": "lépés",
  "✓ converged": "✓ konvergált",
  "about": "rólam",
  "experience": "tapasztalat",
  "education": "tanulmányok",
  "projects": "projektek",
  "tokenizer": "tokenizáló",
  "skills": "készségek",
  "contact": "kapcsolat",
  "home": "főoldal",
  "tokTokens": "<span class=\"tok-chip\">tok</span>Tokenek",
  "Building automations & AI workflows · Tech Enthusiast @ EVK College": "Automatizálás és AI-munkafolyamatok · Tech-rajongó @ EVK",
  "See my work ↓": "Munkáim ↓",
  "hover for −∇L · click the map to drop a new θ₀": "vidd fölé az egeret: −∇L · kattints a térképre egy új θ₀-ért",
  "hover for −∇L · click to drop θ₀": "egér fölé: −∇L · kattints egy új θ₀-ért",
  "GPA in my first semester at Corvinus": "átlag az első félévemben a Corvinuson",
  "run in 4 days, incl. an untrained marathon": "futás 4 nap alatt, köztük egy edzés nélküli maraton",
  "th": ".",
  "in the national geography competition (OKTV)": "hely az országos földrajzversenyen (OKTV)",
  "About me": "Rólam",
  "Budapest, HU": "Budapest",
  "I’m an Applied Economics student at Corvinus University of Budapest who loves mathematics, data and building things with code.": "A Budapesti Corvinus Egyetem alkalmazott közgazdaságtan szakos hallgatója vagyok, és imádom a <span class=\"highlight\">matematikát, az adatokat és azt, ha kóddal építhetek valamit</span>.",
  "I support the Department of Mathematics as a Teaching Assistant, work in the IT Committee of EVK College for Advanced Studies, and sharpen my structured problem-solving at the Consulting Club.": "Demonstrátorként a Matematika Tanszék munkáját segítem, az EVK Szakkollégium IT Bizottságában dolgozom, a Consulting Clubban pedig a strukturált problémamegoldásomat fejlesztem.",
  "Outside university I’m into calisthenics, running, the gym, ice swimming and the occasional crazy one like parachuting. To prove my grit, I ran 100 km in 4 days, including a marathon without any prior training.": "Az egyetemen kívül a saját testsúlyos edzés, a futás, a konditerem és a jeges úszás köt le, néha pedig egy-egy őrültség, például az ejtőernyőzés. Kitartásból 100 km-t futottam le 4 nap alatt, köztük egy maratont mindenféle előzetes edzés nélkül.",
  "// quick facts": "// röviden",
  "Based inBudapest": "<span>Lakhely</span><span>Budapest</span>",
  "FromSzeged": "<span>Származás</span><span>Szeged</span>",
  "StudyingApplied Econ": "<span>Szak</span><span>Alk. közgazdaságtan</span>",
  "LanguagesHU · EN C1": "<span>Nyelvek</span><span>magyar · angol C1</span>",
  "Read my story →": "A történetem →",
  "Experience": "Tapasztalat",
  "3 roles · all current": "3 szerepkör · mind aktuális",
  "Oct 2026 – PresentBudapestNow": "2026. okt. – jelenleg<br/>Budapest<br/><span class=\"now\">Most</span>",
  "Teaching Assistant": "Demonstrátor",
  "Corvinus University of Budapest / Contract": "Budapesti Corvinus Egyetem <span class=\"sep\">/</span> Megbízási szerződés",
  "Supporting the Department of Mathematics at Corvinus University of Budapest in delivering undergraduate coursework.": "A Budapesti Corvinus Egyetem Matematika Tanszékét segítem az alapképzéses kurzusok megtartásában.",
  "University Teaching": "Egyetemi oktatás",
  "Mathematics": "Matematika",
  "Feb 2026 – PresentBudapestNow": "2026. feb. – jelenleg<br/>Budapest<br/><span class=\"now\">Most</span>",
  "Consulting Specialist": "Tanácsadó",
  "Member of the Consulting Club, an international, English-speaking community. I sharpen my structured problem-solving through regular case trainings and projects with partner companies.": "A Consulting Club tagja vagyok, amely egy nemzetközi, angol nyelvű közösség. Rendszeres esettréningeken és partnercégekkel közös projekteken fejlesztem a strukturált problémamegoldásomat.",
  "Case Solving": "Esetmegoldás",
  "Structured Problem-Solving": "Strukturált problémamegoldás",
  "Sep 2025 – PresentBudapestNow": "2025. szept. – jelenleg<br/>Budapest<br/><span class=\"now\">Most</span>",
  "Member": "Tag",
  "Active member focused on deepening practical skills in mathematics and programming, taking part in collaborative problem-solving sessions and technical discussions.": "Aktív tagként a gyakorlati matematikai és programozási tudásomat mélyítem, közös problémamegoldó alkalmakon és szakmai beszélgetéseken veszek részt.",
  "Education": "Tanulmányok",
  "Sep 2026 – 2030": "2026. szept. – 2030",
  "EVK College for Advanced Studies": "EVK Szakkollégium",
  "IT Committee member": "IT Bizottság tagja",
  "EVK is Corvinus University’s 35-year-old professional community. Organized like a company, it gives members hands-on experience running real business operations.": "Az EVK a Corvinus Egyetem 35 éves szakmai közössége. Cégként működik, így a tagok valódi üzleti folyamatok működtetésében szereznek gyakorlati tapasztalatot.",
  "Vibe Coding": "Vibe coding",
  "Workflow Automation": "Folyamatautomatizálás",
  "Sep 2025 – May 2028": "2025. szept. – 2028. máj.",
  "Corvinus University of Budapest": "Budapesti Corvinus Egyetem",
  "Bachelor’s degree / Applied Economics": "Alapképzés <span class=\"sep\">/</span> Alkalmazott közgazdaságtan",
  "Statistical Data Analysis": "Statisztikai adatelemzés",
  "Graduated 2025": "Érettségi: 2025",
  "High school / Szeged": "Gimnázium <span class=\"sep\">/</span> Szeged",
  "Advanced-level matura in mathematics, geography and English, with top grades in every subject.": "Emelt szintű érettségi matematikából, földrajzból és angolból, minden tárgyból jeles eredménnyel.",
  "Projects": "Projektek",
  "EVK App": "EVK app",
  "The official app of EVK College for Advanced Studies: events, programmes, forms and member dashboards in one place.": "Az EVK Szakkollégium hivatalos alkalmazása: események, programok, űrlapok és tagi dashboardok egy helyen.",
  "Migrated the organisation’s transactions from Excel sheets to SQL and automated them in the app": "A szervezet tranzakcióit Excel-táblákból SQL-be költöztettem, és automatizáltam őket az appban",
  "≈ 2 hours of manual work saved every week for a 73-member organisation": "Hetente <b>≈ 2 óra</b> kézi munka megtakarítása egy 73 fős szervezetnél",
  "Internal CRM for EVK’s partner relations: companies, contacts, pipelines per committee, Gmail sync and follow-up sequences.": "Belső CRM az EVK partnerkapcsolataihoz: cégek, kapcsolattartók, bizottságonkénti folyamatok, Gmail-szinkron és follow-up sorozatok.",
  "Reviewed the old CRM and automated 50+ manual tasks": "Átvizsgáltam a régi CRM-et, és <b>50+</b> kézi feladatot automatizáltam",
  "Found and fixed 150+ bugs": "<b>150+</b> hibát találtam meg és javítottam ki",
  "Internal tool": "Belső eszköz",
  "Sustainable Energy Research": "Fenntartható energia kutatás",
  "My research paper on sustainable energy management.": "Kutatási dolgozatom a fenntartható energiagazdálkodásról.",
  "Read paper ↗": "Dolgozat ↗",
  "Tokenizer": "Tokenizáló",
  "how a language model reads text": "így olvas egy nyelvi modell",
  "Language models never see letters. Text is first cut into tokens, sub-word pieces with an id each, and the model only ever works with those numbers. Type below and watch it happen. Then try the Hungarian sample: every accented letter falls back to its own byte-level token, so Hungarian text costs noticeably more tokens than English.": "A nyelvi modellek sosem látnak betűket. A szöveget először <em>tokenekre</em> vágják: szórészletekre, amelyeknek saját azonosítójuk van, és a modell kizárólag ezekkel a számokkal dolgozik. Írj be valamit lent, és nézd meg élőben. Utána próbáld ki a magyar mintát: minden ékezetes betű külön, bájt szintű tokenre esik szét, ezért a magyar szöveg érezhetően több tokenbe kerül, mint az angol.",
  "Code": "Kód",
  "your text": "a szöveged",
  "tokens": "token",
  "characters": "karakter",
  "chars/token": "karakter/token",
  "Text": "Szöveg",
  "IDs": "ID-k",
  "A toy tokenizer that imitates GPT-style BPE, written for this site. Real vocabularies have ~100k learned merges.": "Egyszerűsített tokenizáló, amely a GPT-stílusú BPE-t utánozza, és ehhez az oldalhoz készült. A valódi szótárak kb. 100 ezer tanult összevonást tartalmaznak.",
  "Achievements": "Eredmények",
  "Selected as a Teaching Assistant at the Department of Mathematics, Corvinus (2026)": "Demonstrátornak választottak a Corvinus Matematika Tanszékén (2026)",
  "Admitted to EVK College for Advanced Studies (2026)": "Felvételt nyertem az EVK Szakkollégiumba (2026)",
  "5.0 GPA in my first university semester": "5,0-s átlag az első egyetemi félévemben",
  "15th place in the national geography competition (OKTV, 2025)": "15. hely az országos földrajzversenyen (OKTV, 2025)",
  "Ran 100 km in 4 days, including a marathon without training": "100 km futás 4 nap alatt, köztük egy maraton edzés nélkül",
  "Skills": "Készségek",
  "// analytics & code": "// elemzés és kód",
  "Machine Learning": "Gépi tanulás",
  "// business & tools": "// üzlet és eszközök",
  "Teaching": "Oktatás",
  "Video Editing": "Videóvágás",
  "// languages": "// nyelvek",
  "Hungarian · Native": "Magyar · anyanyelv",
  "English · C1": "Angol · C1",
  "Contact": "Kapcsolat",
  "Working on a project, a case or an automation idea? I’m happy to talk.": "Projekten, esettanulmányon vagy automatizálási ötleten dolgozol? Szívesen beszélgetek róla.",
  "psst: type “ice” anywhere": "psszt: gépeld be bárhol, hogy „ice”",
  "back to top ↑": "vissza az elejére ↑",
  "home ↑": "főoldal ↑",
  "My story.": "A <em>történetem.</em>",
  "High school": "Gimnázium",
  "2025 – today": "2025 – napjainkig",
  "University": "Egyetem",
  "In 2025 I started studying Applied Economics at Corvinus University of Budapest, and finished my first semester with a 5.0 GPA. I joined SPM, the special finance and mathematics student organization, to deepen my mathematics and programming skills, and in 2026 the Consulting Club, where I practise case solving and work on projects with partner companies.": "2025-ben kezdtem alkalmazott közgazdaságtant tanulni a Budapesti Corvinus Egyetemen, és az első félévemet 5,0-s átlaggal zártam. Csatlakoztam az SPM-hez, a Speciális Pénzügyi-Matematikai Diákszervezethez, hogy elmélyítsem a matematikai és programozási tudásomat, 2026-ban pedig a Consulting Clubhoz, ahol esetmegoldást gyakorlok és partnercégekkel dolgozom projekteken.",
  "In autumn 2026 I became a member of EVK College for Advanced Studies, where I work in the IT Committee on workflow automation and building tools. Since October 2026 I have also been a Teaching Assistant at the Department of Mathematics.": "2026 őszén az EVK Szakkollégium tagja lettem, ahol az IT Bizottságban folyamatautomatizáláson és eszközök fejlesztésén dolgozom. 2026 októbere óta a Matematika Tanszéken demonstrátor is vagyok.",
  "always": "mindig",
  "Side quests": "Mellékküldetések",
  "I love sports: calisthenics, running, the gym, parachuting and other adventurous activities. I ran 100 km in 4 days, completing a marathon without any prior training. In winter you can find me ice swimming in the Tisza.": "Imádom a sportot: saját testsúlyos edzés, futás, konditerem, ejtőernyőzés és más kalandos dolgok. 4 nap alatt 100 km-t futottam, köztük egy maratont előzetes edzés nélkül. Télen a Tiszában jeges úszni találsz.",
  "bench 130 kg squat 160 kg run 100 km / 4 days": "<span>fekvenyomás <b>130 kg</b></span> <span>guggolás <b>160 kg</b></span> <span>futás <b>100 km / 4 nap</b></span>",
  "Ice swimming": "Jeges úszás",
  "water temp ≈ 2 °C": "vízhőmérséklet ≈ 2 °C",
  "pre-swim pep talk": "eligazítás úszás előtt",
  "the line-up": "felsorakozás",
  "no turning back": "nincs visszaút",
  "worth it": "megérte",
  "← Back home": "← Vissza a főoldalra",
  "I was born in Szeged, Hungary on 10 November 2006, and went to SZTE Gyakorló Gimnázium. During high school I developed a strong interest in mathematics and geography. I graduated in 2025 with top grades (5) in every matura subject, taking mathematics, geography and English at advanced level. I also competed in the national geography competition (OKTV), where I placed 15th.": "Szegeden születtem 2006. november 10-én, és az SZTE Gyakorló Gimnáziumba jártam. A gimnáziumban kezdett igazán érdekelni a matematika és a földrajz. 2025-ben érettségiztem, minden tárgyból jelessel, matematikából, földrajzból és angolból emelt szinten. Indultam az <a href=\"https://www.oktatas.hu/pub_bin/dload/kozoktatas/tanulmanyi_versenyek/oktv/oktv2024_2025_helyezettek/foldrajz.pdf\" target=\"_blank\" rel=\"noopener noreferrer\">országos földrajzversenyen (OKTV)</a> is, ahol 15. lettem.",
  "Email": "E-mail",
  "email": "e-mail",
  "English": "Angol",
  "From tokens to vectors": "Tokenekből vektorok",
  "A model can’t multiply words, so every token id selects one row of an embedding matrix. From there it’s all linear algebra: dot products measure similarity and an eigen-decomposition finds the directions that matter most.": "Egy modell nem tud szavakat szorozni, ezért minden token-azonosító kiválasztja egy beágyazási mátrix egyik sorát. Innentől minden lineáris algebra: a skaláris szorzat méri a hasonlóságot, a sajátérték-felbontás pedig megtalálja a legfontosabb irányokat.",
  "embedding rows · tokens × 16 dims": "beágyazási sorok · tokenek × 16 dimenzió",
  "cosine similarity · hover a cell": "koszinusz-hasonlóság · vidd az egeret egy cellára",
  "PCA by power iteration · 16D → 2D": "PCA hatványiterációval · 16D → 2D",
  "Embeddings here come from hashed character n-grams (like fastText), so tokens that are spelled alike point the same way. A trained model learns E from data, which is where meaning comes from.": "A beágyazások itt hashelt karakter-n-gramokból készülnek (mint a fastTextben), így a hasonlóan írt tokenek egy irányba mutatnak. Egy tanított modell adatokból tanulja meg az E mátrixot, és innen jön a jelentés.",
  "apps, websites, models, research": "appok, weboldalak, modellek, kutatás",
  "Client · HTML · JS": "Ügyfél · HTML · JS",
  "Website for a landscaping business in Szeged: services, portfolio, how the work goes, FAQ and a quote-request form with photo upload.": "Weboldal egy szegedi kertépítő vállalkozásnak: szolgáltatások, referenciák, a munka menete, GYIK és árajánlatkérő űrlap fotófeltöltéssel.",
  "Visit site ↗": "Megnézem ↗",
  "I build and maintain websites and CRM systems, and automate the work around them with AI. Applied Economics student at Corvinus University of Budapest and Teaching Assistant in mathematics.": "<strong>Weboldalakat és CRM-rendszereket</strong> építek és tartok karban, a körülöttük lévő munkát pedig AI-jal automatizálom. A Budapesti Corvinus Egyetem alkalmazott közgazdaságtan szakos hallgatója és matematika demonstrátor vagyok.",
  "Most of my work is building and looking after real systems: websites for businesses, CRM systems and the automations around them. I don’t hand them over and disappear: I host, update and fix them, so they keep working long after launch.": "A munkám nagy része valódi rendszerek építése és gondozása: weboldalak vállalkozásoknak, CRM-rendszerek és a hozzájuk tartozó automatizálások. Nem adom át őket, hogy aztán eltűnjek: üzemeltetem, frissítem és javítom őket, hogy az indulás után is sokáig működjenek.",
  "built and maintained by me": "én építettem és én tartom karban",
  "Live · maintained": "Élő · karbantartva",
  "Web Development": "Webfejlesztés",
  "CRM Systems": "CRM-rendszerek",
  "Website Maintenance": "Weboldal-karbantartás",
  "Get in touch →": "Írj nekem →",
  "EVK Website": "EVK weboldal",
  "The official website of EVK College for Advanced Studies: bilingual pages, articles, events, admissions and a page for partner companies. I maintain it as part of the IT Committee.": "Az EVK Szakkollégium hivatalos weboldala: kétnyelvű oldalak, cikkek, események, felvételi és egy oldal a partnercégeknek. Az IT Bizottság tagjaként én tartom karban.",
  "15th place at OKTV, the national secondary-school competition": "<b>15. hely</b> az OKTV-n, az országos középiskolai tanulmányi versenyen",
  "2nd place at OTDK, the national student research conference": "<b>2. hely</b> az OTDK-n, az Országos Tudományos Diákköri Konferencián",
  "2nd place at OTDK, the national student research conference, with my sustainable energy research": "2. hely az OTDK-n, az Országos Tudományos Diákköri Konferencián, a fenntartható energia kutatásommal"
};

  // Strings generated by scripts
  const T = {
    en: {
      theme_night: '☾ Night', theme_paper: '☼ Paper',
      theme_to_dark: 'Switch to dark theme', theme_to_light: 'Switch to light theme',
      lang_label: 'Magyar nyelvre váltás',
      email_show: 'Click to show', email_copied: 'Copied ✓', email_open: 'Open in your mail app ↗', email_copy: 'Click to copy',
      local_min: 'local min',
      tok_view: 'tokenizer view', tok_toy: 'toy BPE', tok_tokens: 'tokens', tok_ratio: 'chars/token',
      tok_ctx: 'of a 200k-token context window', tok_hover: 'hover a token to see its id',
      tok_text: 'Text', tok_ids: 'Token IDs', tok_close: 'Close tokenizer view', tok_title: 'See this page the way a language model reads it',
      vec_hint: 'Hover the similarity matrix to compare two tokens.',
    },
    hu: {
      theme_night: '☾ Éjszaka', theme_paper: '☼ Nappal',
      theme_to_dark: 'Váltás sötét témára', theme_to_light: 'Váltás világos témára',
      lang_label: 'Switch to English',
      email_show: 'Kattints a megjelenítéshez', email_copied: 'Másolva ✓', email_open: 'Megnyitás levelezőben ↗', email_copy: 'Kattints a másoláshoz',
      local_min: 'lokális min.',
      tok_view: 'tokenizáló nézet', tok_toy: 'egyszerű BPE', tok_tokens: 'token', tok_ratio: 'karakter/token',
      tok_ctx: 'egy 200 ezer tokenes kontextusablakból', tok_hover: 'vidd az egeret egy tokenre az azonosítójáért',
      tok_text: 'Szöveg', tok_ids: 'Token ID-k', tok_close: 'Tokenizáló nézet bezárása', tok_title: 'Nézd meg az oldalt úgy, ahogy egy nyelvi modell olvassa',
      vec_hint: 'Vidd az egeret a hasonlósági mátrixra két token összehasonlításához.',
    },
  };

  const TITLES = {
    'Ribizsár Benjámin': 'Ribizsár Benjámin',
    'My Story · Ribizsár Benjámin': 'Történetem · Ribizsár Benjámin',
  };

  const INLINE = new Set(['B', 'STRONG', 'EM', 'I', 'BR', 'SMALL', 'CODE', 'SUB', 'SUP', 'SPAN']);
  const SKIP = 'script, style, textarea, svg, canvas, noscript, select, output, [data-no-i18n], .tok-panel, .tok-out';
  const PROTECT = '[data-count], [data-email-out], [data-step], [data-loss], [data-epoch], [data-train-loss], [data-stat], [data-lr-out], [data-email]';
  const norm = (s) => s.replace(/\s+/g, ' ').trim();

  function qualifies(el) {
    if (el.matches(SKIP) || el.closest(SKIP)) return false;
    if (el.hasAttribute('data-i18n-html')) return true;
    const text = norm(el.textContent);
    if (!text || !/[A-Za-zÁ-ű]/.test(text)) return false;
    if (el.matches(PROTECT) || el.querySelector(PROTECT)) return false;
    return [...el.querySelectorAll('*')].every((d) => INLINE.has(d.tagName));
  }

  // Collect the outermost translatable elements once, while the page is still English
  const entries = [];
  (function collect(el) {
    for (const c of el.children) {
      const key = qualifies(c) ? norm(c.textContent) : null;
      if (key && HU[key] != null) {
        entries.push({ el: c, en: c.innerHTML, hu: HU[key] });
      } else if (!c.matches(SKIP)) {
        // No translation for the whole element: try its parts
        collect(c);
      }
    }
  })(document.body);

  const titleEn = document.title;
  const metaDesc = document.querySelector('meta[name="description"]');
  const descEn = metaDesc && metaDesc.content;
  const DESC_HU = 'Ribizsár Benjámin: alkalmazott közgazdaságtan szakos hallgató a Budapesti Corvinus Egyetemen, automatizálások és AI-munkafolyamatok, az EVK Szakkollégium tagja.';

  let lang = 'en';
  try { lang = localStorage.getItem('lang') || ''; } catch (e) {}
  if (lang !== 'en' && lang !== 'hu') lang = /^hu\b/i.test(navigator.language || '') ? 'hu' : 'en';

  function t(key, vars) {
    let s = (T[lang] && T[lang][key]) || T.en[key] || key;
    if (vars) Object.keys(vars).forEach((k) => { s = s.replace(`{${k}}`, vars[k]); });
    return s;
  }

  function apply() {
    root.lang = lang;
    entries.forEach((e) => { e.el.innerHTML = lang === 'hu' ? e.hu : e.en; });
    document.title = lang === 'hu' ? (TITLES[titleEn] || titleEn) : titleEn;
    if (metaDesc) metaDesc.content = lang === 'hu' ? DESC_HU : descEn;
    document.querySelectorAll('[data-lang-toggle]').forEach((b) => {
      b.dataset.current = lang;
      b.setAttribute('aria-label', t('lang_label'));
    });
  }

  function set(next) {
    if (next === lang) return;
    // Leave the tokenizer view first so the page text is plain again
    if (root.classList.contains('tok-on')) {
      const off = document.querySelector('[data-tok-toggle]');
      if (off) off.click();
    }
    lang = next;
    try { localStorage.setItem('lang', lang); } catch (e) {}
    apply();
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  document.querySelectorAll('[data-lang-toggle]').forEach((b) => {
    b.addEventListener('click', () => set(lang === 'hu' ? 'en' : 'hu'));
  });

  window.i18n = { t, set, get lang() { return lang; } };
  apply();
})();
