(function() {
  // Глобальная переменная: если true – сообщения от бота скрыты, если false – видны.
  let hideBotComments = true;

  // Функция для замены иконки medium
  function replaceImages() {
    const images = document.querySelectorAll(
      'img[src$="/images/icons/priorities/major.svg"], img[src$="jira.hh.ru/images/icons/priorities/major.svg"]'
    );
    images.forEach(image => {
      image.src = image.src.replace("major.svg", "medium.svg");
    });
  }

  // Функция для вставки количества дней в статусе
  function enhanceJiraCards() {
    const cards = document.querySelectorAll('.ghx-days');
    cards.forEach(card => {
      const titleText = card.getAttribute('title');
      if (titleText && !card.querySelector('.ghx-inner')) {
        const span = document.createElement('span');
        span.className = 'ghx-inner';
        span.textContent = titleText;
        card.appendChild(span);
      }
    });
  }

  // Функция для поиска и пометки блоков действий, выполненных ботом
  function markBotActions() {
    const activityModule = document.getElementById("activitymodule");
    if (!activityModule) return;

    const issueBlocks = activityModule.querySelectorAll(".issue-data-block");
    issueBlocks.forEach(block => {
      // Если блок уже обработан — пропускаем
      if (block.dataset.botActionMarked) return;

      const actionContainers = block.querySelectorAll(".actionContainer");
      let isBotAction = false;
      actionContainers.forEach(container => {
        const actionDetails = container.querySelector(".action-details");
        if (actionDetails) {
          const userAvatar = actionDetails.querySelector(".user-hover.user-avatar");
          if (userAvatar && (userAvatar.getAttribute("rel") === "n8n-jira" || userAvatar.getAttribute("rel") === "jira-bot")) {
            isBotAction = true;
          }
        }
      });

      if (isBotAction) {
        block.dataset.botActionMarked = "true";
        block.classList.add("bot-action-block");
        // Присваиваем стиль скрытия
        block.style.display = hideBotComments ? "none" : "";
      }
    });
  }

  // Функция обновления видимости помеченных блоков с сообщениями от бота  
  // При показе удаляем стиль
  function updateBotCommentsVisibility() {
    const botBlocks = document.querySelectorAll(".bot-action-block");
    botBlocks.forEach(block => {
      if (hideBotComments) {
        block.style.display = "none";
      } else {
        block.style.removeProperty("display");
      }
    });
  }

  // Функция добавления кнопки в контейнер sortwrap 
  function addToggleButton() {
    const container = document.querySelector("div.sortwrap");
    if (!container) {
      console.warn("Контейнер с классом 'sortwrap' не найден.");
      return;
    }
    // Если кнопка уже добавлена — не добавляем повторно
    if (document.getElementById("hide_bot")) return;

    const button = document.createElement("button");
    button.id = "hide_bot";
    button.className = "aui-button";
    button.title = "Показать сообщения от бота";
    button.setAttribute("resolved", "");

    const span = document.createElement("span");
    span.className = "activity-tab-sort-label";
    span.textContent = "Показать бота";
    button.appendChild(span);

    container.appendChild(button);

    // Обработчик клика 
    button.addEventListener("click", () => {
      hideBotComments = !hideBotComments;
      updateBotCommentsVisibility();

      if (hideBotComments) {
        button.title = "Показать сообщения от бота";
        span.textContent = "Показать бота";
      } else {
        button.title = "Скрыть сообщения от бота";
        span.textContent = "Скрыть бота";
      }
    });
  }

  // так ну тут я пытался оптимизировать как смог. Потому что sortwrap не везде
  // Если после 10 попыток элемент не найден, запускается обсервер
  function waitForSortwrap(maxAttempts = 10) {
    let attempts = 0;
    function poll() {
      const container = document.querySelector("div.sortwrap");
      if (container) {
        addToggleButton();
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(poll, 500);
      } else {
        observeSortwrap();
      }
    }
    poll();
  }

  // Функция наблюдения за появлением div.sortwrap через MutationObserver.
  function observeSortwrap() {
    const observerForSortwrap = new MutationObserver((mutations, obs) => {
      const container = document.querySelector("div.sortwrap");
      if (container) {
        addToggleButton();
        obs.disconnect();
      }
    });
    observerForSortwrap.observe(document.body, { childList: true, subtree: true });
  }

  // Первоначальный запуск функций
  document.addEventListener("DOMContentLoaded", () => {
    replaceImages();
    enhanceJiraCards();
    markBotActions();
    updateBotCommentsVisibility();

    // Пытаемся добавить кнопку сразу, если нет то ждуна sortwrap
    addToggleButton();
    waitForSortwrap();
  });

  // Глобальный МутантОбсервер для отслеживания динамически подгружаемых элементов
  const observer = new MutationObserver(mutationsList => {
    for (const mutation of mutationsList) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        replaceImages();
        enhanceJiraCards();
        markBotActions();
        updateBotCommentsVisibility();
        // Если кнопка ещё не добавлена, пробуем добавить её
        if (!document.getElementById("hide_bot")) {
          addToggleButton();
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Дополнительный стиль для корректного отображения длинных названий прикреплённых задач
  const style = document.createElement("style");
  style.textContent = `
    .link-summary {
      white-space: normal !important;
      overflow: visible !important;
      text-overflow: initial !important;
    }
  `;
  document.head.appendChild(style);
})();
