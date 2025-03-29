
document.addEventListener('DOMContentLoaded', function() {
    // Глобальные переменные для состояния приложения
    let currentTheme = 'orange-theme';
    let userPhoto = localStorage.getItem('userPhoto') || '';
    let notifications = JSON.parse(localStorage.getItem('notifications')) || [
        { id: 1, text: 'Вы записаны на 1ю лабу на предмет математики.', read: false },
        { id: 2, text: 'Напоминание: Завтра у вас пара по физике.', read: false }
    ];
    let nextNotificationId = notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1;
    const MAX_NOTIFICATIONS = 6;

    // Очереди пользователя
    let userQueues = JSON.parse(localStorage.getItem('userQueues')) || [];

    // Уведомления преподавателя
    let teacherNotifications = JSON.parse(localStorage.getItem('teacherNotifications')) || [];
    let nextTeacherNotificationId = teacherNotifications.length > 0 ? Math.max(...teacherNotifications.map(n => n.id)) + 1 : 1;

    // Роль пользователя (студент или преподаватель)
    let currentRole = localStorage.getItem('currentRole') || 'student'; // По умолчанию студент

    const body = document.body;
    const content = document.getElementById('content');
    const themeToggle = document.getElementById('theme-toggle');
    const userPhotoElement = document.getElementById('user-photo');
    const uploadPhotoInput = document.createElement('input');
    uploadPhotoInput.type = 'file';
    uploadPhotoInput.accept = 'image/*';
    uploadPhotoInput.style.display = 'none';

    document.body.appendChild(uploadPhotoInput);

    if (userPhoto && userPhotoElement) {
        userPhotoElement.src = userPhoto;
    }

    // ------------------ Данные расписания ------------------
    const scheduleData = [
        { subject: 'Математика', teacher: 'Иванов И.И.', status: 'Запись открыта', day: 'Понедельник, 7 октября', type: 'Лекция', group: 'ВМО21' },
        { subject: 'Физика', teacher: 'Иванов И.И.', status: 'Запись открыта', day: 'Понедельник, 7 октября', type: 'Лабораторная', group: 'ВМО22' },
        { subject: 'Информатика', teacher: 'Иванов И.И.', status: 'Запись закрыта', day: 'Вторник, 8 октября', type: 'Практика', group: 'ВМО23' },
        { subject: 'Программирование', teacher: 'Иванов И.И.', status: 'Запись открыта', day: 'Вторник, 8 октября', type: 'Лабораторная', group: 'ВМО21' },
        { subject: 'История', teacher: 'Петров П.П.', status: 'Запись открыта', day: 'Среда, 9 октября', type: 'Лекция', group: 'ВМО22' },
        { subject: 'Английский', teacher: 'Сидорова А.А.', status: 'Запись закрыта', day: 'Среда, 9 октября', type: 'Практика', group: 'ВМО23' },
        { subject: 'Химия', teacher: 'Кузнецов С.С.', status: 'Запись открыта', day: 'Четверг, 10 октября', type: 'Лабораторная', group: 'ВМО21' },
        { subject: 'Биология', teacher: 'Смирнова Е.В.', status: 'Запись открыта', day: 'Четверг, 10 октября', type: 'Лекция', group: 'ВМО22' },
        { subject: 'География', teacher: 'Волков Д.Д.', status: 'Запись закрыта', day: 'Пятница, 11 октября', type: 'Практика', group: 'ВМО23' },
        { subject: 'Литература', teacher: 'Морозова О.И.', status: 'Запись открыта', day: 'Пятница, 11 октября', type: 'Лекция', group: 'ВМО21' }
    ];

    let filteredSchedule = [...scheduleData];
    let currentTeacherFilter = null;
    let currentSubjectFilter = null;
    let currentGroupFilter = null;
    let currentTypeFilter = null;
    let activeFilter = null; // Чтобы отслеживать, какой фильтр активен

    // ------------------ Обработка Темы ------------------
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            if (currentTheme === 'dark-theme') {
                body.classList.remove('dark-theme');
                body.classList.add('orange-theme');
                currentTheme = 'orange-theme';
            } else {
                body.classList.remove('orange-theme');
                body.classList.add('dark-theme');
                currentTheme = 'dark-theme';
            }
        });
    }

    // ------------------ Обработка модального окна ------------------
    function setupQueueButtons() {
        const joinQueueButtons = document.querySelectorAll('.join-queue');

        joinQueueButtons.forEach(button => {
            button.addEventListener('click', function() {
                const queueModal = document.getElementById('queue-modal');
                if (queueModal) {
                    // Получаем данные о предмете и преподавателе из атрибутов кнопки
                    const subject = this.getAttribute('data-subject');
                    const teacher = this.getAttribute('data-teacher');

                    // Заполняем скрытые поля в модальном окне
                    document.getElementById('queue-subject').value = subject;
                    document.getElementById('queue-teacher').value = teacher;

                    // Открываем модальное окно
                    queueModal.classList.remove('hidden');
                }
            });
        });

        const toggleQueueButtons = document.querySelectorAll('.toggle-queue');
        toggleQueueButtons.forEach(button => {
            button.addEventListener('click', function() {
                const subject = this.getAttribute('data-subject');
                const isQueueOpen = this.getAttribute('data-queue-open') === 'true';

                if (isQueueOpen) {
                    // Закрываем очередь
                    this.textContent = 'Открыть очередь';
                    this.setAttribute('data-queue-open', 'false');
                    addTeacherNotification(`Вы закрыли очередь на предмет ${subject}.`);
                } else {
                    // Открываем очередь
                    this.textContent = 'Закрыть очередь';
                    this.setAttribute('data-queue-open', 'true');
                    addTeacherNotification(`Вы открыли очередь на предмет ${subject}.`);
                }
            });
        });
    }

    const closeModalButton = document.getElementById('close-modal');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', function() {
            const queueModal = document.getElementById('queue-modal');
            if (queueModal) {
                queueModal.classList.add('hidden');
            }
        });
    }

    const confirmQueueButton = document.getElementById('confirm-queue');
    if (confirmQueueButton) {
        confirmQueueButton.addEventListener('click', function() {
            const labNumberSelect = document.getElementById('lab-number');
            const labNumber = labNumberSelect ? labNumberSelect.value : '1';

            // Получаем данные о предмете и преподавателе из скрытых полей
            const subject = document.getElementById('queue-subject').value;
            const teacher = document.getElementById('queue-teacher').value;

            const message = `Вы записались на лабораторную ${labNumber} по предмету ${subject}. Ваше место в очереди: 3`;

            // Добавляем запись в очередь
            const queueEntry = {
                id: Date.now(), // Уникальный ID записи
                subject: subject, // Предмет
                teacher: teacher, // Преподаватель
                labNumber: labNumber,
                position: 3, // Пример
                date: new Date().toLocaleString() // Текущая дата и время
            };
            userQueues.push(queueEntry);
            localStorage.setItem('userQueues', JSON.stringify(userQueues));

            showToast(message);
            addNotification(message);
            const queueModal = document.getElementById('queue-modal');
            if (queueModal) {
                queueModal.classList.add('hidden');
            }

            // Обновляем страницу очередей, если она активна
            if (content.innerHTML.includes('queues-list')) {
                loadPage('queues');
            }
        });
    }

    const cancelQueueButton = document.getElementById('cancel-queue');
    if (cancelQueueButton) {
        cancelQueueButton.addEventListener('click', function() {
            const queueModal = document.getElementById('queue-modal');
            if (queueModal) {
                queueModal.classList.add('hidden');
            }
        });
    }

    // ------------------ Обработка уведомлений ------------------
    function setupNotifications() {
        const notificationsList = document.getElementById('notifications-list');
        if (notificationsList) {
            notifications.sort((a, b) => (a.read === b.read) ? 0 : (a.read ? 1 : -1));

            notificationsList.innerHTML = notifications.map(notification => `
                <div class="notification ${notification.read ? 'read' : ''}" data-id="${notification.id}">
                    ${notification.text}
                </div>
            `).join('');

            const notificationElements = document.querySelectorAll('.notification');
            notificationElements.forEach(notification => {
                notification.addEventListener('click', function() {
                    const notificationId = parseInt(this.dataset.id);
                    const notificationObj = notifications.find(n => n.id === notificationId);

                    if (!notificationObj) {
                        console.error("Уведомление не найдено");
                        return;
                    }
                    showConfirmationModal(notificationObj, this);
                });
            });
        }
    }

    function showConfirmationModal(notification, notificationElement) {
        const confirmationModal = document.createElement('div');
        confirmationModal.className = 'confirmation-modal';
        confirmationModal.innerHTML = `
            <div class="confirmation-content">
                <p>Вы прочитали это уведомление?</p>
                <button id="mark-read" data-id="${notification.id}">Прочитано</button>
                <button id="close-confirmation">✕</button>
            </div>
        `;

        document.body.appendChild(confirmationModal);

        const markReadButton = confirmationModal.querySelector('#mark-read');
        const closeConfirmationButton = confirmationModal.querySelector('#close-confirmation');

        markReadButton.addEventListener('click', function() {
            const notificationId = parseInt(this.dataset.id);
            markNotificationAsRead(notificationId);
            notificationElement.classList.add('read');
            confirmationModal.remove();
        });

        closeConfirmationButton.addEventListener('click', function() {
            confirmationModal.remove();
        });
    }

    function markNotificationAsRead(id) {
        const notification = notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            saveNotificationsToLocalStorage();
            setupNotifications();
        }
    }

    function addNotification(message) {
        const newNotification = {
            id: nextNotificationId++,
            text: message,
            read: false
        };
        notifications.unshift(newNotification);
        trimNotifications();
        saveNotificationsToLocalStorage();

        if (content.innerHTML.includes('notifications-list')) {
            setupNotifications();
        }
    }

    function addTeacherNotification(message) {
        const newNotification = {
            id: nextTeacherNotificationId++,
            text: message,
            read: false
        };
        teacherNotifications.unshift(newNotification);
        localStorage.setItem('teacherNotifications', JSON.stringify(teacherNotifications));

        if (content.innerHTML.includes('teacher-notifications-list')) {
            setupTeacherNotifications();
        }
    }

    function trimNotifications() {
        const readNotifications = notifications.filter(n => n.read);
        if (notifications.length > MAX_NOTIFICATIONS) {
            const numToRemove = notifications.length - MAX_NOTIFICATIONS;
            for (let i = 0; i < numToRemove; i++) {
                if (readNotifications[i]) {
                    const index = notifications.findIndex(n => n.id === readNotifications[i].id);
                    if (index !== -1) {
                        notifications.splice(index, 1);
                    }
                }
            }
        }
    }

    function saveNotificationsToLocalStorage() {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }

    // ------------------ Загрузка фото ------------------
    if (userPhotoElement) {
        userPhotoElement.addEventListener('click', function() {
            uploadPhotoInput.click();
        });

        uploadPhotoInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function() {
                    userPhotoElement.src = reader.result;
                    userPhoto = reader.result;
                    localStorage.setItem('userPhoto', userPhoto);
                    showToast('Фотография успешно загружена!');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ------------------ Навигация ------------------
    const navButtons = {
        'nav-notifications': 'notifications',
        'nav-queues': 'queues',
        'nav-schedule': 'schedule',
        'nav-profile': 'profile'
    };

    for (const [id, page] of Object.entries(navButtons)) {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', function() {
                loadPage(page);
            });
        }
    }

    // ------------------ Функции фильтрации расписания ------------------
    function renderSchedule(schedule) {
        const scheduleList = document.getElementById('schedule-list');
        if (!scheduleList) return;

        const groupedSchedule = schedule.reduce((groups, item) => {
            const day = item.day;
            if (!groups[day]) {
                groups[day] = [];
            }
            groups[day].push(item);
            return groups;
        }, {});

        let html = '';
        for (const day in groupedSchedule) {
            html += `<h3>${day}</h3>`;
            groupedSchedule[day].forEach(item => {
                html += `
                    <div class="schedule-item">
                        <p>Название пары: ${item.subject}</p>
                        <p>Преподаватель: ${item.teacher}</p>
                        <p>Тип: ${item.type}</p>
                        <p>Статус: ${item.status}</p>
                        ${currentRole === 'student' ? `
                            <button class="join-queue" data-subject="${item.subject}" data-teacher="${item.teacher}">Записаться</button>
                        ` : `
                            <button class="toggle-queue" data-subject="${item.subject}" data-queue-open="true">Закрыть очередь</button>
                        `}
                    </div>
                `;
            });
        }

        scheduleList.innerHTML = html;
        setupQueueButtons();
    }

    function filterSchedule() {
        filteredSchedule = [...scheduleData];

        if (currentTeacherFilter) {
            filteredSchedule = filteredSchedule.filter(item => item.teacher === currentTeacherFilter);
        }

        if (currentSubjectFilter) {
            filteredSchedule = filteredSchedule.filter(item => item.subject === currentSubjectFilter);
        }

        if (currentGroupFilter) {
            filteredSchedule = filteredSchedule.filter(item => item.group === currentGroupFilter);
        }

        if (currentTypeFilter) {
            filteredSchedule = filteredSchedule.filter(item => item.type === currentTypeFilter);
        }

        renderSchedule(filteredSchedule);
    }

    function setupFilters() {
        const teacherFilterButton = document.getElementById('teacher-filter');
        const subjectFilterButton = document.getElementById('subject-filter');
        const groupFilterButton = document.getElementById('group-filter');
        const typeFilterButton = document.getElementById('type-filter');
        const clearFiltersButton = document.getElementById('clear-filters');

        if (teacherFilterButton) {
            teacherFilterButton.addEventListener('click', () => {
                toggleFilterOptions('teacher', teacherFilterButton);
            });
        }

        if (subjectFilterButton) {
            subjectFilterButton.addEventListener('click', () => {
                toggleFilterOptions('subject', subjectFilterButton);
            });
        }

        if (groupFilterButton) {
            groupFilterButton.addEventListener('click', () => {
                toggleFilterOptions('group', groupFilterButton);
            });
        }

        if (typeFilterButton) {
            typeFilterButton.addEventListener('click', () => {
                toggleFilterOptions('type', typeFilterButton);
            });
        }

        if (clearFiltersButton) {
            clearFiltersButton.addEventListener('click', () => {
                currentTeacherFilter = null;
                currentSubjectFilter = null;
                currentTypeFilter = null;
                filterSchedule();
            });
        }
    }

    function toggleFilterOptions(filterType, button) {
        // Если фильтр уже активен, закрываем его
        if (activeFilter === filterType) {
            closeFilterOptions();
            return;
        }

        // Закрываем любой открытый фильтр перед открытием нового
        closeFilterOptions();

        activeFilter = filterType;
        const filterOptions = document.createElement('div');
        filterOptions.className = 'filter-options';
        filterOptions.dataset.filterType = filterType; // Сохраняем тип фильтра

        let options = [];
        if (filterType === 'teacher') {
            options = [...new Set(scheduleData.map(item => item.teacher))];
        } else if (filterType === 'subject') {
            options = [...new Set(scheduleData.map(item => item.subject))];
        } else if (filterType === 'group') {
            options = ['ВМО21', 'ВМО22', 'ВМО23']; // Пример групп
        } else if (filterType === 'type') {
            options = ['Лекция', 'Лабораторная', 'Практика'];
        }

        options.forEach(option => {
            const optionButton = document.createElement('button');
            optionButton.textContent = option;
            optionButton.addEventListener('click', () => {
                if (filterType === 'teacher') {
                    currentTeacherFilter = option;
                } else if (filterType === 'subject') {
                    currentSubjectFilter = option;
                } else if (filterType === 'group') {
                    currentGroupFilter = option;
                } else if (filterType === 'type') {
                    currentTypeFilter = option;
                }
                filterSchedule();
                closeFilterOptions();
            });
            filterOptions.appendChild(optionButton);
        });

        content.appendChild(filterOptions);
        positionFilterOptions(filterOptions);
    }

    function closeFilterOptions() {
        const activeOptions = document.querySelector('.filter-options');
        if (activeOptions) {
            activeOptions.remove();
            activeFilter = null;
        }
    }

    function positionFilterOptions(filterOptions) {
        const filterType = filterOptions.dataset.filterType;
        const teacherFilterButton = document.getElementById('teacher-filter');
        const subjectFilterButton = document.getElementById('subject-filter');
        const groupFilterButton = document.getElementById('group-filter');
        const typeFilterButton = document.getElementById('type-filter');

        // Позиционируем фильтры относительно кнопок
        if (filterType === 'teacher' && teacherFilterButton) {
            const teacherFilterRect = teacherFilterButton.getBoundingClientRect();
            filterOptions.style.top = `${teacherFilterRect.bottom + 10}px`;
            filterOptions.style.left = `${teacherFilterRect.left}px`;
        } else if (filterType === 'subject' && subjectFilterButton) {
            const subjectFilterRect = subjectFilterButton.getBoundingClientRect();
            filterOptions.style.top = `${subjectFilterRect.bottom + 10}px`;
            filterOptions.style.left = `${subjectFilterRect.left}px`;
        } else if (filterType === 'group' && groupFilterButton) {
            const groupFilterRect = groupFilterButton.getBoundingClientRect();
            filterOptions.style.top = `${groupFilterRect.bottom + 10}px`;
            filterOptions.style.left = `${groupFilterRect.left}px`;
        } else if (filterType === 'type' && typeFilterButton) {
            const typeFilterRect = typeFilterButton.getBoundingClientRect();
            filterOptions.style.top = `${typeFilterRect.bottom + 10}px`;
            filterOptions.style.left = `${typeFilterRect.left}px`;
        }

        // Если уже есть открытый фильтр, сдвигаем новый фильтр вниз
        const activeOptions = document.querySelectorAll('.filter-options');
        if (activeOptions.length > 1) {
            activeOptions.forEach((options, index) => {
                if (index > 0) {
                    const prevOptions = activeOptions[index - 1];
                    const prevOptionsRect = prevOptions.getBoundingClientRect();
                    options.style.top = `${prevOptionsRect.bottom + 10}px`;
                }
            });
        }
    }

    // ------------------ Функции для работы с очередями ------------------
    function renderQueues() {
        const queuesList = document.getElementById('queues-list');
        if (!queuesList) return;

        queuesList.innerHTML = userQueues.map(queue => `
            <div class="queue-ticket" data-id="${queue.id}">
                <p>Предмет: ${queue.subject}</p>
                <p>Преподаватель: ${queue.teacher}</p>
                <p>Лабораторная: ${queue.labNumber}</p>
                <p>Место в очереди: ${queue.position}</p>
                <p>Дата и время: ${queue.date}</p>
                ${currentRole === 'student' ? `
                    <button class="cancel-queue">Отмена</button>
                ` : `
                    <button class="start-check">Начать проверку</button>
                `}
            </div>
        `).join('');

        // Добавляем обработчики для кнопок отмены (студент)
        const cancelButtons = document.querySelectorAll('.cancel-queue');
        cancelButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.stopPropagation(); // Останавливаем всплытие события
                const ticket = this.closest('.queue-ticket');
                const queueId = parseInt(ticket.dataset.id);
                cancelQueue(queueId);
            });
        });

        // Добавляем обработчики для кнопок "Начать проверку" (преподаватель)
        const startCheckButtons = document.querySelectorAll('.start-check');
        startCheckButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                event.stopPropagation(); // Останавливаем всплытие события
                const ticket = this.closest('.queue-ticket');
                const queueId = parseInt(ticket.dataset.id);
                showCheckModal(queueId);
            });
        });

        // Добавляем обработчик для открытия модального окна "Текущая очередь"
        const queueTickets = document.querySelectorAll('.queue-ticket');
        queueTickets.forEach(ticket => {
            ticket.addEventListener('click', function() {
                const queueId = parseInt(this.dataset.id);
                const queue = userQueues.find(q => q.id === queueId);
                if (queue) {
                    showCurrentQueueModal(queue);
                }
            });
        });
    }

    function cancelQueue(queueId) {
        userQueues = userQueues.filter(queue => queue.id !== queueId);
        localStorage.setItem('userQueues', JSON.stringify(userQueues));

        // Показываем уведомление об отмене
        const notificationMessage = 'Вы отменили запись на лабораторную работу.';
        addNotification(notificationMessage);

        // Обновляем страницу очередей
        if (content.innerHTML.includes('queues-list')) {
            loadPage('queues');
        }
    }

    function showCheckModal(queueId) {
        const queue = userQueues.find(q => q.id === queueId);
        if (!queue) return;

        const checkModal = document.createElement('div');
        checkModal.className = 'modal';
        checkModal.innerHTML = `
            <div class="modal-content">
                <span id="close-check-modal" class="close-modal">&times;</span>
                <h2>Проверка лабораторной работы</h2>
                <div class="check-container">
                    <div class="student-list">
                        <h3>Список студентов</h3>
                        <div id="student-list">
                            <div class="student-item highlighted">Иванов Иван</div>
                            <div class="student-item">Петров Петр</div>
                            <div class="student-item">Сидорова Анна</div>
                            <div class="student-item">Васильев Василий</div>
                        </div>
                    </div>
                    <div class="check-actions">
                        <button id="start-check">Начать проверку</button>
                        <div id="check-result" class="hidden">
                            <button id="pass-check">Сдал</button>
                            <button id="fail-check">Не сдал</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(checkModal);

        // Закрытие модального окна
        const closeCheckModal = document.getElementById('close-check-modal');
        if (closeCheckModal) {
            closeCheckModal.addEventListener('click', function() {
                checkModal.remove();
            });
        }

        // Закрытие при клике вне модального окна
        checkModal.addEventListener('click', function(event) {
            if (event.target === checkModal) {
                checkModal.remove();
            }
        });

        // Начало проверки
        const startCheckButton = document.getElementById('start-check');
        const checkResult = document.getElementById('check-result');
        if (startCheckButton) {
            startCheckButton.addEventListener('click', function() {
                checkResult.classList.remove('hidden');
                startCheckButton.classList.add('hidden');
            });
        }

        // Обработка результатов проверки
        const passCheckButton = document.getElementById('pass-check');
        const failCheckButton = document.getElementById('fail-check');
        if (passCheckButton && failCheckButton) {
            passCheckButton.addEventListener('click', function() {
                const studentList = document.getElementById('student-list');
                const firstStudent = studentList.querySelector('.student-item.highlighted');
                if (firstStudent) {
                    firstStudent.classList.remove('highlighted');
                    studentList.appendChild(firstStudent); // Перемещаем в конец списка
                    // Выделяем следующего студента
                    const nextStudent = studentList.querySelector('.student-item');
                    if (nextStudent) {
                        nextStudent.classList.add('highlighted');
                    }
                }
            });

            failCheckButton.addEventListener('click', function() {
                const studentList = document.getElementById('student-list');
                const firstStudent = studentList.querySelector('.student-item.highlighted');
                if (firstStudent) {
                    firstStudent.classList.remove('highlighted');
                    studentList.appendChild(firstStudent); // Перемещаем в конец списка
                    // Выделяем следующего студента
                    const nextStudent = studentList.querySelector('.student-item');
                    if (nextStudent) {
                        nextStudent.classList.add('highlighted');
                    }
                }
            });
        }
    }

    // Функция для отображения модального окна "Текущая очередь"
    function showCurrentQueueModal(queue) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Текущая очередь</h2>
                <div class="student-list">
                    <h3>Список студентов</h3>
                    <div id="student-list">
                        <div class="student-item highlighted">Иванов Иван</div>
                        <div class="student-item">Петров Петр</div>
                        <div class="student-item">Сидорова Анна</div>
                        <div class="student-item">Васильев Василий</div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Закрытие модального окна
        const closeModal = modal.querySelector('.close-modal');
        closeModal.addEventListener('click', () => {
            modal.remove();
        });

        // Закрытие при клике вне модального окна
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.remove();
            }
        });
    }

    // ------------------ Загрузка страниц ------------------
    function loadPage(page) {
        let html = '';
        switch (page) {
            case 'auth':
                html = `
                    <h1>Авторизация</h1>
                    <div class="role-select">
                        <button id="student-btn" class="role-btn">Студент</button>
                        <button id="teacher-btn" class="role-btn">Преподаватель</button>
                    </div>
                    <div id="student-auth" class="hidden">
                        <input type="text" id="login" placeholder="Логин">
                        <input type="password" id="password" placeholder="Пароль">
                        <button id="login-btn">Войти</button>
                    </div>
                    <div id="teacher-auth" class="hidden">
                        <input type="text" id="teacher-login" placeholder="Логин">
                        <input type="password" id="teacher-password" placeholder="Пароль">
                        <button id="teacher-login-btn">Войти</button>
                    </div>
                `;
                break;
            case 'notifications':
                html = `
                    <h1>Уведомления</h1>
                    <div id="notifications-list"></div>
                `;
                break;
            case 'queues':
                html = `
                    <h1>Очереди</h1>
                    <div id="queues-list"></div>
                `;
                break;
            case 'schedule':
                html = `
                    <h1>Расписание</h1>
                    <div class="filters">
                        ${currentRole === 'teacher' ? `
                            <button id="group-filter">Фильтр по группам</button>
                            <button id="type-filter">Фильтр по виду занятия</button>
                            <button id="group-list-button">Список групп на текущий семестр</button>
                        ` : `
                            <button id="teacher-filter">Фильтр по преподавателю</button>
                            <button id="subject-filter">Фильтр по предмету</button>
                        `}
                        <button id="clear-filters">Сбросить фильтры</button>
                    </div>
                    <div id="schedule-list"></div>
                `;
                break;
            case 'profile':
                if (currentRole === 'teacher') {
                    html = `
                        <h1>Личный кабинет</h1>
                        <p>Имя: Джнерик</p>
                        <p>Фамилия: Джавович</p>
                        <p>Предмет: Математика</p>
                        <p>Роль: Лектор</p>
                        <img src="${userPhoto}" alt="Ваше фото" style="max-width: 200px;">
                    `;
                } else {
                    html = `
                        <h1>Личный кабинет</h1>
                        <p>Имя: Джнерик</p>
                        <p>Фамилия: Джавович</p>
                        <p>Группа: ВМО21</p>
                        <img src="${userPhoto}" alt="Ваше фото" style="max-width: 200px;">
                    `;
                }
                break;
            default:
                html = `<h1>Главная страница</h1>`;
        }
        content.innerHTML = html;

        if (page === 'auth') {
            setupAuthButtons();
        }

        if (page === 'schedule') {
            setupQueueButtons();
            renderSchedule(scheduleData);
            setupFilters();
            if (currentRole === 'teacher') {
                setupGroupListButton();
            }
        }
        if (page === 'notifications') {
            setupNotifications();
        }
        if (page === 'queues') {
            renderQueues();
        }
        if (page === 'profile') {
            if (userPhoto && document.querySelector('#content img[alt="Ваше фото"]')) {
                document.querySelector('#content img[alt="Ваше фото"]').src = userPhoto;
            }
        }
    }

    function setupAuthButtons() {
        const studentBtn = document.getElementById('student-btn');
        const teacherBtn = document.getElementById('teacher-btn');
        const studentAuth = document.getElementById('student-auth');
        const teacherAuth = document.getElementById('teacher-auth');
        const loginBtn = document.getElementById('login-btn');
        const teacherLoginBtn = document.getElementById('teacher-login-btn');

        studentBtn.addEventListener('click', function() {
            studentAuth.classList.remove('hidden');
            teacherAuth.classList.add('hidden');
        });

        teacherBtn.addEventListener('click', function() {
            teacherAuth.classList.remove('hidden');
            studentAuth.classList.add('hidden');
        });

        loginBtn.addEventListener('click', function() {
            currentRole = 'student';
            localStorage.setItem('currentRole', currentRole);
            showToast('Вы успешно авторизовались как студент!');
            loadPage('profile');
        });

        teacherLoginBtn.addEventListener('click', function() {
            currentRole = 'teacher';
            localStorage.setItem('currentRole', currentRole);
            showToast('Вы успешно авторизовались как преподаватель!');
            loadPage('schedule');
        });
    }

    function setupGroupListButton() {
        const groupListButton = document.getElementById('group-list-button');
        if (groupListButton) {
            groupListButton.addEventListener('click', function() {
                const groupListModal = document.getElementById('group-list-modal');
                if (groupListModal) {
                    groupListModal.classList.remove('hidden');
                }
            });
        }

        const closeGroupListModal = document.getElementById('close-group-list-modal');
        if (closeGroupListModal) {
            closeGroupListModal.addEventListener('click', function() {
                const groupListModal = document.getElementById('group-list-modal');
                if (groupListModal) {
                    groupListModal.classList.add('hidden');
                }
            });
        }

        const saveGroupButtons = document.querySelectorAll('.save-group');
        saveGroupButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Реализуйте логику сохранения данных группы здесь
                alert('Сохранено!'); // Простое уведомление
            });
        });

        const clearGroupButtons = document.querySelectorAll('.clear-group');
        clearGroupButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Реализуйте логику очистки данных группы здесь
                alert('Очищено!'); // Простое уведомление
            });
        });
    }

    // ------------------ Всплывающие уведомления ------------------
    function showToast(message) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.top = '20px';
        toastContainer.style.right = '20px';
        document.body.appendChild(toastContainer);

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
            if (toastContainer.children.length === 0) {
                toastContainer.remove();
            }
        }, 3000);
    }

    // Загружаем начальную страницу
    loadPage('auth');
});
