document.addEventListener("DOMContentLoaded", async () => {
  const section = document.getElementById("quran");
  if (!section) return;

  try {
    const response = await fetch("quran.json");
    if (!response.ok) throw new Error("تعذر تحميل بيانات القرآن");
    const data = await response.json();
    const surahs = data.data.surahs;

    section.innerHTML = `
      <h2>📖 القرآن الكريم</h2>
      <p>القرآن الكريم كاملًا — 114 سورة، متاح للقراءة دون إنترنت.</p>
      <div class="card">
        <label for="surah-select">اختر السورة:</label>
        <select id="surah-select" style="width:100%;padding:12px;margin-top:10px;border-radius:8px;font-size:16px;"></select>
        <button id="open-surah">📖 اقرأ السورة</button>
        <div id="surah-content"></div>
      </div>`;

    const select = document.getElementById("surah-select");
    const content = document.getElementById("surah-content");

    surahs.forEach(surah => {
      const option = document.createElement("option");
      option.value = surah.number;
      option.textContent = `${surah.number}. ${surah.name} — ${surah.englishName}`;
      select.appendChild(option);
    });

    function showSurah() {
      const surah = surahs[Number(select.value) - 1];
      content.replaceChildren();

      const title = document.createElement("h3");
      title.textContent = `${surah.name} (${surah.ayahs.length} آية)`;
      title.style.textAlign = "center";
      title.style.color = "#e2c35c";
      content.appendChild(title);

      const verses = document.createElement("p");
      verses.className = "verse";
      verses.style.textAlign = "right";

      surah.ayahs.forEach(ayah => {
        const span = document.createElement("span");
        span.textContent = `${ayah.text} ﴿${ayah.numberInSurah}﴾ `;
        verses.appendChild(span);
      });

      content.appendChild(verses);
      content.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    document.getElementById("open-surah").addEventListener("click", showSurah);
    showSurah();
  } catch (error) {
    const message = document.createElement("p");
    message.textContent = "تعذر تحميل القرآن. تأكد من وجود ملف quran.json داخل التطبيق.";
    section.appendChild(message);
  }
});
