document.getElementById('sendBtn').addEventListener('click', async () => {
    // 1. Получаем ВООБЩЕ ВСЕ вкладки
    let tabs = await chrome.tabs.query({});
    let userPrompt = document.getElementById('prompt').value;

    console.log("Всего вкладок найдено:", tabs.length);

    tabs.forEach(tab => {
        // Безопасная проверка: если у вкладки нет URL, просто идем к следующей
        if (!tab || !tab.url) {
            return;
        }

        const isGemini = tab.url.includes("gemini.google.com");
        const isGroq = tab.url.includes("grok.com");

        // ... остальной код

        if (isGemini || isGroq) {
            console.log("Найдена целевая вкладка:", tab.url);

            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (text, type) => {
                    // Эта часть выполняется ВНУТРИ страницы сайта
                    let field;
                    let btn;

                    if (type === 'gemini') {
                        field = document.querySelector('[aria-label="Введите запрос для Gemini"]');
                        btn = document.querySelector('button[aria-label="Отправить сообщение"]');
                    } else if (type === 'groq') {
                        field = document.querySelector('.ProseMirror');
                        // Ищем кнопку по самому надежному атрибуту, который ты нашел
                        btn = document.querySelector('[data-testid="chat-submit"]');
                    }

                    if (field) {
                        field.focus();

                        // Имитируем ввод текста
                        document.execCommand('insertText', false, text);
                        field.dispatchEvent(new Event('input', { bubbles: true }));

                        setTimeout(() => {
                            if (btn) {
                                // Маленький хак: если кнопка заблокирована (серая), делаем её активной
                                if (btn.hasAttribute('disabled')) {
                                    btn.removeAttribute('disabled');
                                }
                                btn.click();
                                console.log("Грок: Ракета улетела!");
                            } else {
                                // Если кнопка не нашлась, пробуем нажать Enter как план Б
                                field.dispatchEvent(new KeyboardEvent('keydown', {
                                    key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
                                }));
                            }
                        }, 700);
                    }
                },
                args: [userPrompt, isGemini ? 'gemini' : 'groq']
            });
        }
    });
});