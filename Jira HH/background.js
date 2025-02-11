// Слушаем клик по кнопке в popup.html - иначе слетают картинки
chrome.action.onClicked.addListener(function (tab) {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: function () {
      chrome.runtime.sendMessage({ action: "replaceImages" });
    },
  });
});
