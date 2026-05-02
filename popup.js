document.getElementById('sendBtn').addEventListener('click', async () => {
    try {
        // 1. Берем все открытые вкладки (не только активную!)
        let tabs = await chrome.tabs.query({});
        let userPrompt = document.getElementById('prompt').value;

        tabs.forEach(tab => {
            // 2. Проверяем, подходит ли вкладка под наши ИИ
            const isGemini = tab.url.includes("gemini.google.com");
            const isGroq = tab.url.includes("grok.com");

            if (isGemini || isGroq) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (text, siteType) => {
                        // Внутренняя логика выбора селектора
                        let field;
                        let btn;

                        if (siteType === 'gemini') {
                            field = document.querySelector('[aria-label="Введите запрос для Gemini"]');
                            btn = document.querySelector('button[aria-label="Отправить сообщение"]');
                        } else if (siteType === 'groq') {
                            field = document.querySelector('.ProseMirror');
                            // У Грока кнопка отправки часто без лейбла, 
                            // попробуем найти её по типу или соседству (обычно это последний button в блоке)
                            btn = document.querySelector('button[type="submit"]') || document.querySelector('.ProseMirror').closest('div').parentElement.querySelector('button');
                        }

                        if (field) {
                            field.focus();
                            // Для ProseMirror/Tiptap лучше работает innerText или замена параграфа
                            field.innerText = text;
                            field.dispatchEvent(new Event('input', { bubbles: true }));

                            setTimeout(() => {
                                if (btn) btn.click();
                            }, 500);
                        }
                    },
                    args: [userPrompt, isGemini ? 'gemini' : 'groq']
                });
            }
        });
    } catch (error) {
        console.error("Ошибка оркестрации:", error);
    }
});