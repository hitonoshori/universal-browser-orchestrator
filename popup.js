document.getElementById('sendBtn').addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
                    const btn = document.querySelector('button[aria-label="Отправить сообщение"]');
                    if (btn) btn.click();
                }, 500);
            }
        },
        args: [userPrompt]
    });
});