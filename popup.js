document.getElementById('sendBtn').addEventListener('click', async () => {
    let tabs = await chrome.tabs.query({});
    let userPrompt = document.getElementById('prompt').value;

    tabs.forEach(tab => {
        if (!tab || !tab.url) return;

        const isGemini = tab.url.includes("gemini.google.com");
        const isGroq = tab.url.includes("grok.com");

        if (isGemini || isGroq) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (text, type) => {
                    let field;
                    let btn;
                    let selector = type === 'gemini' ? '.markdown-main-panel' : '.message-row';

                    // 1. Считаем сообщения ДО отправки нового вопроса
                    const initialCount = document.querySelectorAll(selector).length;

                    if (type === 'gemini') {
                        field = document.querySelector('[aria-label="Введите запрос для Gemini"]') || document.querySelector('div[contenteditable="true"]');
                        btn = document.querySelector('button[aria-label="Отправить сообщение"]');
                    } else if (type === 'groq') {
                        field = document.querySelector('.ProseMirror');
                        btn = document.querySelector('[data-testid="chat-submit"]');
                    }

                    if (field) {
                        field.focus();
                        document.execCommand('insertText', false, text);
                        field.dispatchEvent(new Event('input', { bubbles: true }));

                        setTimeout(() => {
                            if (btn) {
                                if (btn.hasAttribute('disabled')) btn.removeAttribute('disabled');
                                btn.click();
                            } else {
                                field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
                            }

                            // 2. Слежка за новым ответом
                            let checkInterval = setInterval(() => {
                                let all = document.querySelectorAll(selector);

                                // Берем именно ТО сообщение, которое появилось после нашего initialCount
                                let lastOne = all[initialCount];

                                if (lastOne && lastOne.getAttribute('aria-busy') === "false") {
                                    clearInterval(checkInterval);

                                    chrome.runtime.sendMessage({
                                        action: "ANSWER_RECEIVED",
                                        provider: type,
                                        text: lastOne.innerText
                                    });
                                }
                            }, 1000);

                        }, 700);
                    }
                },
                args: [userPrompt, isGemini ? 'gemini' : 'groq']
            });
        }
    });
});

// "Ухо" расширения — остается в самом низу файла
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "ANSWER_RECEIVED") {
        let blockId = message.provider + "-result";
        let targetBlock = document.getElementById(blockId);

        if (targetBlock) {
            targetBlock.innerText = message.text;
            targetBlock.style.color = "black";
        }
    }
});