document.addEventListener("DOMContentLoaded", async () => {
  const main = document.querySelector("main");
  if (!main) return;

  const section = document.createElement("section");
  section.id = "hifz-test";
  section.innerHTML = `
    <h2>🧠 اختبار حفظ القرآن</h2>
    <p>اختبر حفظك، واختر سورة ثم حاول قراءة الآيات من ذاكرتك.</p>
    <label for="hifz-surah">السورة:</label>
    <select id="hifz-surah" style="width:100%;padding:12px;margin:10px 0"></select>
    <label for="hifz-count">عدد الآيات:</label>
    <select id="hifz-count" style="padding:10px">
      <option value="3">3 آيات</option>
      <option value="5" selected>5 آيات</option>
      <option value="10">10 آيات</option>
    </select>
    <div class="card" id="hifz-question"></div>
    <button id="hifz-show">إظهار الآيات</button>
    <button id="hifz-next">اختبار جديد</button>
  `;
  main.appendChild(section);

  const surahSelect = section.querySelector("#hifz-surah");
  const countSelect = section.querySelector("#hifz-count");
  const question = section.querySelector("#hifz-question");
  let surahs = [];
  let start = 0;
  let revealed = false;

  try {
    const response = await fetch("quran.json");
    if (!response.ok) throw new Error("load failed");
    const json = await response.json();
    surahs = json.data.surahs;

    surahs.forEach(surah => {
      const option = document.createElement("option");
      option.value = surah.number;
      option.textContent = `${surah.number}. ${surah.name}`;
      surahSelect.appendChild(option);
    });

    function newQuestion() {
      const surah = surahs[Number(surahSelect.value) - 1];
      const count = Number(countSelect.value);
      const maxStart = Math.max(0, surah.ayahs.length - count);
      start = Math.floor(Math.random() * (maxStart + 1));
      revealed = false;
      section.querySelector("#hifz-show").textContent = "إظهار الآيات";
      question.replaceChildren();

      const prompt = document.createElement("p");
      prompt.textContent = `سورة ${surah.name} — حاول تسميع ${Math.min(count, surah.ayahs.length - start)} آيات، بدايةً من الآية ${start + 1}.`;
      question.appendChild(prompt);

      const hint = document.createElement("p");
      hint.textContent = "اقرأ من حفظك، ثم اضغط «إظهار الآيات» للمراجعة.";
      question.appendChild(hint);
    }

    function reveal() {
      const surah = surahs[Number(surahSelect.value) - 1];
      const count = Number(countSelect.value);
      question.replaceChildren();

      const title = document.createElement("h3");
      title.textContent = `سورة ${surah.name}`;
      question.appendChild(title);

      const text = document.createElement("p");
      text.className = "verse";
      text.style.textAlign = "right";
      surah.ayahs.slice(start, start + count).forEach(ayah => {
        const span = document.createElement("span");
        span.textContent = `${ayah.text} ﴿${ayah.numberInSurah}﴾ `;
        text.appendChild(span);
      });
      question.appendChild(text);
      revealed = true;
      section.querySelector("#hifz-show").textContent = "إخفاء الآيات";
    }


    const voiceBox = document.createElement("div");
    voiceBox.innerHTML = `
      <button type="button" id="hifz-voice">🎙️ ابدأ التسميع بالصوت</button>
      <p id="hifz-voice-status">اضغط الزر وابدأ قراءة الآيات بصوت واضح.</p>
      <p id="hifz-transcript"></p>
    `;
    section.appendChild(voiceBox);

    const voiceButton = voiceBox.querySelector("#hifz-voice");
    const voiceStatus = voiceBox.querySelector("#hifz-voice-status");
    const transcript = voiceBox.querySelector("#hifz-transcript");

    voiceButton.addEventListener("click", async () => {
      const plugin = window.SpeechRecognitionPlugin;

      if (!plugin) {
        voiceStatus.textContent = "إضافة التعرف على الصوت غير جاهزة. تأكد من تحميل ملف speech-plugin.bundle.js.";
        return;
      }

      voiceButton.disabled = true;
      voiceStatus.textContent = "جاري تجهيز الميكروفون...";
      transcript.textContent = "";

      try {
        const availability = await plugin.available();
        if (!availability.available) {
          voiceStatus.textContent = "التعرف على الصوت غير متاح على الجهاز حاليًا.";
          return;
        }

        const permission = await plugin.requestPermissions();
        if (permission.speechRecognition !== "granted") {
          voiceStatus.textContent = "اسمح للتطبيق باستخدام الميكروفون ثم جرّب مرة أخرى.";
          return;
        }

        voiceStatus.textContent = "جاري الاستماع... اقرأ الآيات الآن.";

        const result = await plugin.start({
          language: "ar-EG",
          maxResults: 1,
          partialResults: false,
          popup: true
        });

        const spoken = result.matches?.[0] || "";
        if (!spoken) {
          voiceStatus.textContent = "لم يتم التعرف على كلام. جرّب مرة أخرى.";
          return;
        }

        transcript.textContent = "اللي اتسمع: " + spoken;

        const surah = surahs[Number(surahSelect.value) - 1];
        const count = Number(countSelect.value);
        const expected = surah.ayahs
          .slice(start, start + count)
          .map(ayah => ayah.text)
          .join(" ");

        const normalize = value => value
          .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
          .replace(/[أإآٱ]/g, "ا")
          .replace(/[^\u0621-\u064A\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        const a = normalize(spoken);
        const b = normalize(expected);
        const wordsA = new Set(a.split(" ").filter(Boolean));
        const wordsB = new Set(b.split(" ").filter(Boolean));
        const common = [...wordsA].filter(word => wordsB.has(word)).length;
        const score = wordsB.size ? Math.round(common / wordsB.size * 100) : 0;

        voiceStatus.textContent =
          `تشابه تقريبي للكلمات: ${score}%. دي مقارنة آلية بسيطة وليست تقييمًا دقيقًا للتلاوة أو التجويد.`;
      } catch (error) {
        voiceStatus.textContent = "تعذر تشغيل التعرف على الصوت: " +
          (error?.message || String(error));
      } finally {
        voiceButton.disabled = false;
      }
    });

    section.querySelector("#hifz-show").addEventListener("click", () => {
      if (revealed) newQuestion();
      else reveal();
    });
    section.querySelector("#hifz-next").addEventListener("click", newQuestion);
    surahSelect.addEventListener("change", newQuestion);
    countSelect.addEventListener("change", newQuestion);
    newQuestion();
  } catch {
    question.textContent = "تعذر تحميل بيانات القرآن. تأكد من وجود quran.json.";
  }
});
