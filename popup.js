document.getElementById('sendBtn').addEventListener('click', async () => {
    try {
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Проверка: мы вообще на сайте Gemini?
        if (!tab.url.includes("gemini.google.com")) {
            alert("Сначала открой вкладку с Gemini!");
            return;
        }

        let userPrompt = document.getElementById('prompt').value;

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (text) => {
                const field = document.querySelector('[aria-label="Введите запрос для Gemini"]');
                if (field) {
                    field.focus();
                    field.innerText = text;
                    field.dispatchEvent(new Event('input', { bubbles: true }));

                    setTimeout(() => {
                        // Ищем кнопку по aria-label
                        const btn = document.querySelector('button[aria-label="Отправить сообщение"]');
                        if (btn) {
                            btn.click();
                        } else {
                            console.error("Кнопка отправки не найдена!");
                        }
                    }, 500);
                } else {
                    console.error("Поле ввода не найдено!");
                }
            },
            args: [userPrompt]
        });
    } catch (error) {
        console.error("Ошибка расширения:", error);
    }
});