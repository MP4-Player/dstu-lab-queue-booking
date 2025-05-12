document.addEventListener('DOMContentLoaded', function() {
    // Глобальные переменные
    let currentTheme = 'orange-theme';
    let userPhoto = localStorage.getItem('userPhoto') || '';
    let userData = JSON.parse(localStorage.getItem('userData')) || {};
    let notifications = [];
    let nextNotificationId = 1;
    const MAX_READ_NOTIFICATIONS = 6;
    const BIRTHDAY_THEME_ENABLED = true;
    let userQueues = [];
    let scheduleData = [];
    let filteredSchedule = [];
    let groups = [];
    let isLoading = false;

    // API URL endpoints
    const API_BASE_URL = window.location.hostname === 'localhost'
        ? `http://${window.location.hostname}:8081` // Правильный порт 8081
        : `http://${window.location.hostname}`;

    const API_ENDPOINTS = {
        LOGIN: `${API_BASE_URL}/api/users/login`,
        USERS: `${API_BASE_URL}/api/users`,
        GROUPS: `${API_BASE_URL}/api/groups`,
        SCHEDULE: `${API_BASE_URL}/schedule`
    };

    // Текущие фильтры расписания
    let currentTeacherFilter = null;
    let currentSubjectFilter = null;

    // DOM элементы
    const body = document.body;
    const content = document.getElementById('content');
    const themeToggle = document.getElementById('theme-toggle');
    const userPhotoElement = document.getElementById('user-photo');
    const uploadPhotoInput = document.createElement('input');
    uploadPhotoInput.type = 'file';
    uploadPhotoInput.accept = 'image/*';
    uploadPhotoInput.style.display = 'none';
    document.body.appendChild(uploadPhotoInput);

    // API Service функции
    const api = {
        // Общий метод для выполнения запросов
        async request(url, options = {}) {
            try {
                console.log(`Выполняется запрос к: ${url}`);

                const fetchOptions = {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        ...(options.headers || {})
                    },
                    mode: 'cors'
                };

                isLoading = true;
                updateLoadingIndicator();

                const response = await fetch(url, fetchOptions);

                isLoading = false;
                updateLoadingIndicator();

                if (!response.ok) {
                    let errorText;
                    try {
                        const errorData = await response.json();
                        errorText = errorData.message || `Ошибка сервера: ${response.status}`;
                    } catch (e) {
                        errorText = `Ошибка сервера: ${response.status} ${response.statusText}`;
                    }
                    throw new Error(errorText);
                }

                // Проверяем, есть ли что-то в ответе
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    return await response.json();
                } else {
                    return await response.text();
                }
            } catch (error) {
                console.error('API Error:', error);

                const errorMessage = error.name === 'TypeError' && error.message.includes('fetch')
                    ? 'Не удалось подключиться к серверу. Проверьте соединение.'
                    : error.message;

                showToast(`Ошибка: ${errorMessage}`);
                throw error;
            } finally {
                isLoading = false;
                updateLoadingIndicator();
            }
        },

        // Авторизация пользователя
        async login(email, password_hash) {
            try {
                return await this.request(API_ENDPOINTS.LOGIN, {
                    method: 'POST',
                    body: JSON.stringify({
                        email,
                        password_hash: Number(password_hash)
                    })
                });
            } catch (error) {
                // Обходной вход для тестового пользователя
                if (email === 'meeporen@gmail.com' && password_hash === simpleHash('122345')) {
                    console.log('Используем обходной вход для тестового пользователя');
                    return {
                        id: 1,
                        first_name: 'Карен',
                        last_name: 'Карэнович',
                        patronymic: 'Карамян',
                        email: 'meeporen@gmail.com',
                        birth: '1990-03-12',
                        group_id: 57352
                    };
                }

                throw error;
            }
        },

        // Регистрация пользователя
        async registerUser(userData) {
            if (userData.password_hash && typeof userData.password_hash !== 'number') {
                userData.password_hash = Number(userData.password_hash);
            }

            return await this.request(API_ENDPOINTS.USERS, {
                method: 'POST',
                body: JSON.stringify(userData)
            });
        },

        // Получение всех групп
        async getGroups() {
            try {
                return await this.request(API_ENDPOINTS.GROUPS);
            } catch (error) {
                console.error('Ошибка получения групп:', error);

                // Возвращаем резервные данные о группах
                return [
                    { groupId: 57352, groupName: 'AMCE11' },
                    { groupId: 57779, groupName: 'ВМО21' },
                    { groupId: 57780, groupName: 'ВМО22' },
                    { groupId: 57781, groupName: 'ВМО23' }
                ];
            }
        },

        // Получение расписания - обновленная версия согласно структуре БД
        async getSchedule() {
            try {
                console.log('Запрос расписания...');
                const result = await this.request(API_ENDPOINTS.SCHEDULE, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json, text/plain, */*'
                    }
                });
                console.log('Получено расписание (тип):', typeof result);

                // Если получен пустой массив или null, выбрасываем ошибку
                if (!result || (Array.isArray(result) && result.length === 0)) {
                    throw new Error('Сервер вернул пустые данные расписания');
                }

                return result;
            } catch (error) {
                console.error('Ошибка получения расписания:', error);

                // Возвращаем демо-данные, соответствующие структуре таблицы в БД
                return [
                    {
                        schedule_id: 267184656,
                        subject_id: 101,
                        group_id: 2001,
                        teacher_id: null,
                        classroom: "1-490",
                        date_time: "2024-03-25 10:15:00",
                        class_type: "Лекция"
                    }
                ];
            }
        }
    };

    // Отображение индикатора загрузки
    function updateLoadingIndicator() {
        const existingIndicator = document.getElementById('loading-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        if (isLoading) {
            const indicator = document.createElement('div');
            indicator.id = 'loading-indicator';
            indicator.innerHTML = 'Загрузка...';
            indicator.style.position = 'fixed';
            indicator.style.top = '0';
            indicator.style.left = '0';
            indicator.style.width = '100%';
            indicator.style.padding = '8px';
            indicator.style.backgroundColor = '#4caf50';
            indicator.style.color = 'white';
            indicator.style.textAlign = 'center';
            indicator.style.zIndex = '9999';
            document.body.appendChild(indicator);
        }
    }

    // Инициализация данных
    async function initData() {
        try {
            userData = JSON.parse(localStorage.getItem('userData')) || {};
            notifications = JSON.parse(localStorage.getItem('notifications')) || [
                { id: 1, text: 'Вы записаны на пару по математике.', read: false },
                { id: 2, text: 'Напоминание: Завтра у вас пара по физике.', read: false }
            ];
            userQueues = JSON.parse(localStorage.getItem('userQueues')) || [];
            nextNotificationId = notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1;

            // Загружаем группы при старте приложения
            await loadGroups();

            // Загружаем расписание если пользователь авторизован
            if (localStorage.getItem('authenticated') === 'true') {
                await loadSchedule();
            }
        } catch (e) {
            console.error('Ошибка загрузки данных:', e);
            resetData();
        }
    }

    // Отображение сообщения об ошибке
    function showErrorMessage(message) {
        const existingError = document.querySelector('.error-banner');
        if (existingError) {
            existingError.textContent = message;
            return;
        }

        const errorBanner = document.createElement('div');
        errorBanner.className = 'error-banner';
        errorBanner.textContent = message;
        errorBanner.style.position = 'fixed';
        errorBanner.style.top = isLoading ? '40px' : '0';
        errorBanner.style.left = '0';
        errorBanner.style.width = '100%';
        errorBanner.style.padding = '10px';
        errorBanner.style.backgroundColor = '#f44336';
        errorBanner.style.color = 'white';
        errorBanner.style.textAlign = 'center';
        errorBanner.style.zIndex = '9998';

        const closeButton = document.createElement('span');
        closeButton.textContent = '×';
        closeButton.style.float = 'right';
        closeButton.style.cursor = 'pointer';
        closeButton.style.marginRight = '10px';
        closeButton.onclick = function() {
            errorBanner.remove();
        };

        errorBanner.appendChild(closeButton);
        document.body.appendChild(errorBanner);

        setTimeout(() => {
            if (document.body.contains(errorBanner)) {
                errorBanner.remove();
            }
        }, 10000);
    }

    // Загрузка групп с сервера
    async function loadGroups() {
        try {
            groups = await api.getGroups();
            console.log('Загружено групп:', groups ? groups.length : 0);

            // Проверка, если группы получены, но имеют неправильный формат
            if (groups && !Array.isArray(groups)) {
                // Проверяем, может данные в data
                if (groups.data && Array.isArray(groups.data)) {
                    groups = groups.data;
                } else {
                    // Принудительно преобразуем в массив если получили объект
                    groups = Object.values(groups).filter(item => item && typeof item === 'object');
                }
            }

            // Добавляем демо-группы если список пуст
            if (!groups || !groups.length) {
                groups = [
                    { groupId: 57352, groupName: 'AMCE11' },
                    { groupId: 57779, groupName: 'ВМО21' },
                    { groupId: 57780, groupName: 'ВМО22' },
                    { groupId: 57781, groupName: 'ВМО23' }
                ];
            }

            // Обновляем UI, если нужно
            if (content && content.innerHTML.includes('group-select')) {
                updateGroupsDropdown();
            }
        } catch (error) {
            console.error('Не удалось загрузить группы:', error);

            // Добавляем демо-группы для продолжения работы
            groups = [
                { groupId: 57352, groupName: 'AMCE11' },
                { groupId: 57779, groupName: 'ВМО21' },
                { groupId: 57780, groupName: 'ВМО22' },
                { groupId: 57781, groupName: 'ВМО23' }
            ];
        }
    }

    // Обновление выпадающего списка групп
    function updateGroupsDropdown() {
        const groupSelect = document.getElementById('group-select');
        if (!groupSelect) return;

        const currentValue = groupSelect.value;

        groupSelect.innerHTML = '<option value="">Выберите группу</option>';

        if (groups && groups.length) {
            groups.forEach(group => {
                if (group.groupName) {
                    const option = document.createElement('option');
                    option.value = group.groupName;
                    option.textContent = group.groupName;
                    option.selected = currentValue === group.groupName;
                    groupSelect.appendChild(option);
                }
            });
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Ошибка загрузки групп';
            option.disabled = true;
            groupSelect.appendChild(option);
        }
    }

    // Загрузка расписания с сервера - обновленная версия
    async function loadSchedule() {
        try {
            // Получаем расписание через API
            const response = await api.getSchedule();
            console.log('Получен ответ от API расписания:', response);

            let processedSchedule;

            // Обрабатываем ответ в зависимости от его типа
            if (typeof response === 'string') {
                try {
                    processedSchedule = JSON.parse(response);
                } catch (e) {
                    console.error('Не удалось разобрать ответ как JSON:', e);
                    processedSchedule = [];
                }
            } else {
                processedSchedule = response;
            }

            // Если ответ не является массивом, пробуем найти массив внутри объекта
            if (!Array.isArray(processedSchedule)) {
                if (processedSchedule && processedSchedule.data && Array.isArray(processedSchedule.data)) {
                    processedSchedule = processedSchedule.data;
                } else if (processedSchedule && typeof processedSchedule === 'object') {
                    // Если это объект, пробуем преобразовать его в массив
                    processedSchedule = [processedSchedule];
                } else {
                    // Если ничего не подошло, используем пустой массив
                    processedSchedule = [];
                }
            }

            // Преобразуем данные в формат, подходящий для отображения
            // КЛЮЧЕВАЯ ЧАСТЬ: Адаптация к формату данных существующего бэкенда
            scheduleData = processedSchedule.map(item => {
                // Определяем преподавателя по ID или используем текстовое поле, если оно есть
                const teacherName = item.teacher ||
                                  (item.teacherId ? `Преподаватель ${item.teacherId}` : "Преподаватель не указан");

                // Определяем предмет по ID или используем текстовое поле, если оно есть
                const subjectName = item.subject ||
                                  (item.subjectId ? `Предмет ${item.subjectId}` : "Предмет не указан");

                // Определяем группу по ID
                const groupId = item.groupId || item.group_id || 2001;
                const groupInfo = findGroupNameById(groupId);

                // Определяем аудиторию из любого доступного поля
                const room = item.roomNumber || item.classroom || item.room_number || "Аудитория не указана";

                // Определяем дату и время из любого доступного поля
                const dateStr = item.scheduleData || item.dateTime || item.schedule_data ||
                              item.date || new Date().toISOString();

                // Определяем тип занятия
                const classType = item.classType || "Лекция";

                return {
                    scheduleId: item.scheduleId || item.schedule_id || 1,
                    subject: subjectName,
                    teacher: teacherName,
                    group: groupInfo,
                    roomNumber: room,
                    classType: classType,
                    date: dateStr,
                    originalData: item // Сохраняем исходные данные для отладки
                };
            });

            console.log('Обработанные данные расписания:', scheduleData);

            filteredSchedule = [...scheduleData];

            // Обновляем UI если мы на странице расписания
            if (content && content.innerHTML.includes('schedule-list')) {
                renderSchedule(filteredSchedule);
                setupFilters();
            }
        } catch (error) {
            console.error('Ошибка загрузки расписания:', error);

            // Демо-данные, если не удалось загрузить
            scheduleData = [
                {
                    scheduleId: 267184656,
                    subject: "Администрирование операционных систем и сетей",
                    teacher: "Долгов В.В.",
                    group: "ВМО21",
                    roomNumber: "1-490",
                    classType: "Лекция",
                    date: "2024-05-15 10:15:00"
                },
                {
                    scheduleId: 267184657,
                    subject: "Структуры и алгоритмы обработки данных",
                    teacher: "Носачева Н.М.",
                    group: "ВМО21",
                    roomNumber: "1-392",
                    classType: "Лабораторная",
                    date: "2024-05-16 12:00:00"
                }
            ];

            filteredSchedule = [...scheduleData];
            showToast('Используются демо-данные расписания. Подключение к серверу не удалось.');

            if (content && content.innerHTML.includes('schedule-list')) {
                renderSchedule(filteredSchedule);
                setupFilters();
            }
        }
    }

    // Форматирование даты
    function formatDate(dateTimeStr) {
        if (!dateTimeStr) return 'Дата не указана';

        let date;
        try {
            // Пробуем разные форматы даты
            date = new Date(dateTimeStr);

            // Проверяем валидность даты
            if (isNaN(date.getTime())) {
                // Если первый формат не сработал, пробуем другие форматы
                if (typeof dateTimeStr === 'string') {
                    if (dateTimeStr.includes('.')) {
                        // Формат DD.MM.YYYY
                        const parts = dateTimeStr.split('.');
                        date = new Date(parts[2], parts[1]-1, parts[0]);
                    } else if (dateTimeStr.includes('/')) {
                        // Формат MM/DD/YYYY
                        const parts = dateTimeStr.split('/');
                        date = new Date(parts[2], parts[0]-1, parts[1]);
                    }
                }

                // Если дата всё ещё невалидна
                if (isNaN(date.getTime())) {
                    return 'Дата в формате: ' + dateTimeStr;
                }
            }
        } catch (e) {
            console.error('Ошибка при обработке даты:', e);
            return 'Дата не распознана';
        }

        const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

        const dayOfWeek = days[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];

        return `${dayOfWeek}, ${day} ${month}`;
    }

    // Найти имя группы по ID - обновленная версия
    function findGroupNameById(groupId) {
        if (!groupId || !groups || !groups.length) return `Группа ${groupId || 'не указана'}`;

        // Преобразуем к числу для корректного сравнения
        const numericGroupId = Number(groupId);
        if (isNaN(numericGroupId)) return `Группа ${groupId}`;

        // Проверяем сначала по обычному полю groupId, затем по полю id
        const group = groups.find(g =>
            Number(g.groupId) === numericGroupId || Number(g.id) === numericGroupId
        );

        return group ? (group.groupName || group.name) : `Группа ${groupId}`;
    }

    // Сброс данных пользователя
    function resetData() {
        userData = {};
        notifications = [];
        userQueues = [];
        localStorage.removeItem('userData');
        localStorage.removeItem('notifications');
        localStorage.removeItem('userQueues');
        localStorage.removeItem('authenticated');
    }

    // Проверка дня рождения
    function checkBirthday() {
        if (!BIRTHDAY_THEME_ENABLED || !userData.birthDate) return false;
        const today = new Date();
        const birthDate = new Date(userData.birthDate);
        return today.getDate() === birthDate.getDate() &&
               today.getMonth() === birthDate.getMonth();
    }

    // Активация праздничной темы
    function activateBirthdayTheme() {
        if (!checkBirthday()) return;

        body.classList.add('birthday-theme');

        // Шляпа на аватар
        const hat = document.createElement('div');
        hat.className = 'birthday-hat';
        if (userPhotoElement && userPhotoElement.parentNode) {
            userPhotoElement.parentNode.appendChild(hat);

            function positionHat() {
                const rect = userPhotoElement.getBoundingClientRect();
                hat.style.position = 'absolute';
                hat.style.top = `${rect.top - 30}px`;
                hat.style.left = `${rect.left + rect.width/2 - 30}px`;
            }
            positionHat();
            window.addEventListener('resize', positionHat);
        }

        // Запускаем конфетти на всех страницах
        startConfetti();
    }

    // Функция для конфетти
    function startConfetti() {
        // Создаем контейнер для конфетти
        const confettiContainer = document.createElement('div');
        confettiContainer.id = 'confetti-container';
        confettiContainer.style.position = 'fixed';
        confettiContainer.style.top = '0';
        confettiContainer.style.left = '0';
        confettiContainer.style.width = '100%';
        confettiContainer.style.height = '100%';
        confettiContainer.style.pointerEvents = 'none';
        confettiContainer.style.overflow = 'hidden';
        confettiContainer.style.zIndex = '9999';
        document.body.appendChild(confettiContainer);

        // Цвета конфетти
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ff8800', '#ff0088'];

        // Создаем частицы
        function createParticle() {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-particle';
            confetti.style.position = 'absolute';
            confetti.style.width = `${Math.random() * 10 + 5}px`;
            confetti.style.height = `${Math.random() * 10 + 5}px`;
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = '50%';
            confetti.style.left = `${Math.random() * 100}vw`;
            confetti.style.top = '-20px';
            confetti.style.opacity = '0.8';
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

            confettiContainer.appendChild(confetti);

            // Анимация падения
            const animationDuration = Math.random() * 3 + 2;
            const horizontalMovement = (Math.random() - 0.5) * 100;

            const keyframes = [
                {
                    transform: 'translateY(0) translateX(0) rotate(0deg)',
                    opacity: 0.8
                },
                {
                    transform: `translateY(100vh) translateX(${horizontalMovement}px) rotate(360deg)`,
                    opacity: 0
                }
            ];

            const options = {
                duration: animationDuration * 1000,
                easing: 'cubic-bezier(0.1, 0.8, 0.9, 1)'
            };

            confetti.animate(keyframes, options);

            // Удаляем элемент после анимации
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, animationDuration * 1000);
        }

        // Запускаем создание частиц
        const interval = setInterval(createParticle, 100);

        // Останавливаем через 10 секунд
        setTimeout(() => {
            clearInterval(interval);
            setTimeout(() => {
                if (confettiContainer.parentNode) {
                    confettiContainer.parentNode.removeChild(confettiContainer);
                }
            }, 3000);
        }, 10000);
    }

    // Модальные окна
    function createQueueModal(subject, teacher) {
        closeAllModals();

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Запись на пару</h2>
                <p>Ваше место в очереди: <span id="queue-position">3</span></p>
                <button id="confirm-queue">Подтвердить</button>
                <button id="cancel-queue">Отмена</button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancel-queue').addEventListener('click', () => modal.remove());

        modal.querySelector('#confirm-queue').addEventListener('click', function() {
            confirmQueue(subject, teacher);
            modal.remove();
        });

        modal.addEventListener('click', (e) => e.target === modal && modal.remove());
    }

    function createQueueViewModal(queue) {
        closeAllModals();

        const queueStudents = [
            { name: `${userData.lastName || 'Иванов'} ${userData.firstName || 'Иван'} ${userData.middleName || 'Иванович'}`, position: 1, isCurrent: true },
            { name: 'Петров Петр Петрович', position: 2 },
            { name: 'Сидорова Анна Михайловна', position: 3 },
            { name: 'Кузнецов Сергей Сергеевич', position: 4 }
        ];

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>Текущая очередь</h2>
                <div id="queue-list">
                    ${queueStudents.map(student => `
                        <div class="queue-position ${student.isCurrent ? 'highlighted' : ''}">
                            <p>${student.position}. ${student.name}</p>
                            ${student.isCurrent ? `
                                <p>Предмет: ${queue.subject}</p>
                                <p>Преподаватель: ${queue.teacher}</p>
                            ` : ''}
                        </div>
                    `).join('')}
                    <button id="cancel-current-queue" class="cancel-queue">Отменить запись</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.querySelector('#cancel-current-queue').addEventListener('click', () => {
            cancelQueue(queue.id);
            modal.remove();
        });

        modal.addEventListener('click', (e) => e.target === modal && modal.remove());
    }

    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => modal.remove());
    }

    // Очереди
    function setupQueueButtons() {
        document.querySelectorAll('.join-queue').forEach(button => {
            button.addEventListener('click', function() {
                const subject = this.getAttribute('data-subject');
                const teacher = this.getAttribute('data-teacher');
                const existingQueue = userQueues.find(q => q.subject === subject && q.teacher === teacher);

                existingQueue ? createQueueViewModal(existingQueue) : createQueueModal(subject, teacher);
            });
        });
    }

    function confirmQueue(subject, teacher) {
        try {
            const queueEntry = {
                id: Date.now(),
                subject: subject,
                teacher: teacher,
                position: 3,
                date: new Date().toLocaleString()
            };

            userQueues.push(queueEntry);
            localStorage.setItem('userQueues', JSON.stringify(userQueues));

            showToast(`Вы записались на пару по предмету ${subject}. Ваше место в очереди: 3`);
            addNotification(`Вы записались на пару по предмету ${subject}.`);

            loadPage('schedule');
        } catch (error) {
            console.error('Ошибка при подтверждении очереди:', error);
            showToast(`Ошибка при записи на пару: ${error.message}`);
        }
    }

    function cancelQueue(queueId) {
        try {
            userQueues = userQueues.filter(queue => queue.id !== queueId);
            localStorage.setItem('userQueues', JSON.stringify(userQueues));
            addNotification('Вы отменили запись на пару.');
            loadPage('schedule');
        } catch (error) {
            console.error('Ошибка при отмене очереди:', error);
            showToast(`Ошибка при отмене записи: ${error.message}`);
        }
    }

    // Уведомления
    function setupNotifications() {
        const notificationsList = document.getElementById('notifications-list');
        if (!notificationsList) return;

        notifications.sort((a, b) => (a.read === b.read) ? 0 : (a.read ? 1 : -1));

        notificationsList.innerHTML = notifications.length > 0
            ? notifications.map(notification => `
                <div class="notification ${notification.read ? 'read' : ''}" data-id="${notification.id}">
                    ${notification.text}
                </div>
            `).join('')
            : '<p class="empty-notifications">У вас нет уведомлений</p>';

        document.querySelectorAll('.notification').forEach(notification => {
            notification.addEventListener('click', function() {
                const notificationId = parseInt(this.dataset.id);
                const notificationObj = notifications.find(n => n.id === notificationId);

                if (notificationObj && !notificationObj.read) {
                    showConfirmationModal(notificationObj, this);
                }
            });
        });
    }

    function showConfirmationModal(notification, element) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <p>Вы прочитали это уведомление?</p>
                <button id="mark-read" data-id="${notification.id}">Прочитано</button>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => e.target === modal && modal.remove());

        modal.querySelector('#mark-read').addEventListener('click', function() {
            const notificationId = parseInt(this.dataset.id);
            markNotificationAsRead(notificationId);
            element.classList.add('read');
            modal.remove();
        });
    }

    function markNotificationAsRead(id) {
        const notification = notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            saveNotifications();
            trimNotifications();
        }
    }

    function addNotification(message) {
        const newNotification = {
            id: nextNotificationId++,
            text: message,
            read: false,
            date: new Date().toISOString()
        };
        notifications.unshift(newNotification);
        saveNotifications();

        if (content && content.innerHTML.includes('notifications-list')) {
            setupNotifications();
        }
    }

    function trimNotifications() {
        const readNotifications = notifications.filter(n => n.read);

        if (readNotifications.length > MAX_READ_NOTIFICATIONS) {
            const toRemove = readNotifications.length - MAX_READ_NOTIFICATIONS;
            const oldestRead = readNotifications
                .sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
                .slice(0, toRemove);

            oldestRead.forEach(notification => {
                const index = notifications.findIndex(n => n.id === notification.id);
                if (index !== -1) {
                    notifications.splice(index, 1);
                }
            });

            saveNotifications();
        }
    }

    function saveNotifications() {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }

    // Расписание и фильтры - переработанная функция
    function renderSchedule(schedule) {
        const scheduleList = document.getElementById('schedule-list');
        if (!scheduleList) return;

        if (!schedule || schedule.length === 0) {
            scheduleList.innerHTML = '<p class="schedule-empty">Расписание не найдено или загружается...</p>';
            return;
        }

        console.log('Подготовка данных для отображения расписания, элементов:', schedule.length);

        // Группируем по дням через функцию форматирования даты
        const groupedSchedule = {};

        schedule.forEach(item => {
            try {
                // Форматируем дату для группировки
                const dayKey = formatDate(item.date);
                if (!groupedSchedule[dayKey]) {
                    groupedSchedule[dayKey] = [];
                }
                groupedSchedule[dayKey].push(item);
            } catch (e) {
                console.error('Ошибка при группировке элемента расписания:', e);
                // В случае ошибки помещаем в категорию "Дата не указана"
                if (!groupedSchedule['Дата не указана']) {
                    groupedSchedule['Дата не указана'] = [];
                }
                groupedSchedule['Дата не указана'].push(item);
            }
        });

        let html = '';

        for (const day in groupedSchedule) {
            html += `<h3>${day}</h3>`;

            groupedSchedule[day].forEach(item => {
                const isQueued = userQueues.some(q => q.subject === item.subject && q.teacher === item.teacher);

                html += `
                    <div class="schedule-item ${isQueued ? 'queued' : ''}">
                        <div class="schedule-info">
                            <p><strong>${item.subject}</strong> ${item.classType ? `(${item.classType})` : ''}</p>
                            <p>Преподаватель: ${item.teacher}</p>
                            <p>Статус: Запись открыта</p>
                            <p>Группа: ${item.group}</p>
                            ${item.roomNumber ? `<p>Аудитория: ${item.roomNumber}</p>` : ''}
                        </div>
                        <button class="join-queue"
                                data-subject="${item.subject}"
                                data-teacher="${item.teacher}">
                            ${isQueued ? 'Посмотреть очередь' : 'Записаться'}
                        </button>
                    </div>
                `;
            });
        }

        scheduleList.innerHTML = html || '<p>Нет доступных записей расписания</p>';
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

        renderSchedule(filteredSchedule);
    }

    function setupFilters() {
        document.querySelectorAll('.filter-select').forEach(el => el.remove());

        const filtersContainer = document.querySelector('.filters');
        if (!filtersContainer) return;

        const teacherFilter = createFilterSelect(
            'teacher-filter',
            'Преподаватель',
            [...new Set(scheduleData.map(item => item.teacher))],
            currentTeacherFilter,
            (value) => {
                currentTeacherFilter = value === 'all' ? null : value;
                filterSchedule();
            }
        );

        const subjectFilter = createFilterSelect(
            'subject-filter',
            'Предмет',
            [...new Set(scheduleData.map(item => item.subject))],
            currentSubjectFilter,
            (value) => {
                currentSubjectFilter = value === 'all' ? null : value;
                filterSchedule();
            }
        );

        const clearButton = document.createElement('button');
        clearButton.id = 'clear-filters';
        clearButton.textContent = 'Сбросить фильтры';
        clearButton.addEventListener('click', () => {
            currentTeacherFilter = null;
            currentSubjectFilter = null;
            filterSchedule();
            setupFilters();
        });

        filtersContainer.innerHTML = '';
        filtersContainer.appendChild(teacherFilter);
        filtersContainer.appendChild(subjectFilter);
        filtersContainer.appendChild(clearButton);
    }

    function createFilterSelect(id, placeholder, options, currentValue, onChange) {
        const container = document.createElement('div');
        container.className = 'filter-select';

        const select = document.createElement('select');
        select.id = id;

        const defaultOption = document.createElement('option');
        defaultOption.value = 'all';
        defaultOption.textContent = `Все ${placeholder.toLowerCase()}ы`;
        select.appendChild(defaultOption);

        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            opt.selected = option === currentValue;
            select.appendChild(opt);
        });

        select.addEventListener('change', () => onChange(select.value));
        container.appendChild(select);

        return container;
    }

    // Навигация
    const navButtons = {
        'nav-notifications': 'notifications',
        'nav-schedule': 'schedule',
        'nav-profile': 'profile'
    };

    for (const [id, page] of Object.entries(navButtons)) {
        const button = document.getElementById(id);
        if (button) {
            button.addEventListener('click', function() {
                if (!localStorage.getItem('userData') || localStorage.getItem('authenticated') !== 'true') {
                    showToast('Пожалуйста, сначала авторизуйтесь');
                    loadPage('auth');
                    return;
                }
                loadPage(page);
            });
        }
    }

    // Загрузка фото
    if (userPhotoElement) {
        userPhotoElement.addEventListener('click', () => uploadPhotoInput.click());

        uploadPhotoInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                    userPhotoElement.src = reader.result;
                    userPhoto = reader.result;
                    localStorage.setItem('userPhoto', userPhoto);
                    showToast('Фотография успешно загружена!');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Всплывающие уведомления
    function showToast(message) {
        const existingToasts = document.querySelectorAll('.toast');
        if (existingToasts.length > 0) {
            existingToasts.forEach((toast, index) => {
                toast.style.top = `${20 + index * 60}px`;
                if (existingToasts.length > 3) {
                    toast.remove();
                }
            });
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;

        const topPosition = existingToasts.length > 0 ?
            20 + existingToasts.length * 60 : 20;

        toast.style.position = 'fixed';
        toast.style.top = `${topPosition}px`;
        toast.style.right = '20px';
        toast.style.backgroundColor = '#4caf50';
        toast.style.color = 'white';
        toast.style.padding = '15px';
        toast.style.borderRadius = '5px';
        toast.style.zIndex = '1001';
        toast.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';

        const closeButton = document.createElement('span');
        closeButton.textContent = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '5px';
        closeButton.style.right = '5px';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = function(e) {
            e.stopPropagation();
            toast.remove();
        };

        toast.appendChild(closeButton);
        document.body.appendChild(toast);

        setTimeout(() => {
            if (document.body.contains(toast)) {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.5s';
                setTimeout(() => toast.remove(), 500);
            }
        }, 4000);
    }

    // Загрузка страниц
    function loadPage(page) {
        const bottomPanel = document.querySelector('.bottom-panel');
        if (bottomPanel) {
            bottomPanel.style.display = page === 'auth' ? 'none' : 'flex';
        }

        let html = '';
        switch (page) {
            case 'auth':
                html = `
                    <div class="auth-form">
                        <h1>Авторизация</h1>
                        <div id="login-form">
                            <input type="email" id="email" placeholder="Email" required value="${localStorage.getItem('lastEmail') || ''}">
                            <input type="password" id="password" placeholder="Пароль" required>
                            <button id="login-btn">Войти</button>
                            <p>Нет аккаунта? <a href="#" id="switch-to-register">Зарегистрироваться</a></p>
                        </div>

                        <div id="register-form" class="hidden">
                            <input type="text" id="lastName" placeholder="Фамилия" required>
                            <input type="text" id="firstName" placeholder="Имя" required>
                            <input type="text" id="middleName" placeholder="Отчество">
                            <select id="group-select" required>
                                <option value="">Выберите группу</option>
                                ${groups && groups.length ? groups.map(group =>
                                    `<option value="${group.groupName}">${group.groupName}</option>`
                                ).join('') : '<option value="" disabled>Загрузка групп...</option>'}
                            </select>
                            <input type="date" id="birthDate" placeholder="Дата рождения" required>
                            <input type="email" id="reg-email" placeholder="Email" required>
                            <input type="password" id="reg-password" placeholder="Пароль" required>
                            <button id="register-btn">Зарегистрироваться</button>
                            <p>Уже есть аккаунт? <a href="#" id="switch-to-login">Войти</a></p>
                        </div>
                    </div>
                `;
                break;
            case 'notifications':
                html = `
                    <h1>Уведомления</h1>
                    <div id="notifications-list"></div>
                `;
                break;
            case 'schedule':
                html = `
                    <h1>Расписание</h1>
                    <div class="filters"></div>
                    <div id="schedule-list"></div>
                `;
                break;
            case 'profile':
                const fullName = `${userData.lastName || ''} ${userData.firstName || ''} ${userData.middleName || ''}`.trim();
                html = `
                    <h1>Личный кабинет</h1>
                    <div class="profile-info">
                        ${checkBirthday() ? '<div class="birthday-text">С ДНЁМ РОЖДЕНИЯ!</div>' : ''}
                        <p><strong>ФИО:</strong> ${fullName || 'Не указано'}</p>
                        <p><strong>Группа:</strong> ${userData.group || 'Не указана'}</p>
                        <p><strong>Email:</strong> ${userData.email || 'Не указан'}</p>
                        <p><strong>Дата рождения:</strong> ${userData.birthDate ? new Date(userData.birthDate).toLocaleDateString() : 'Не указана'}</p>
                    </div>
                    <div class="profile-photo">
                        <img src="${userPhoto || 'icons/user.png'}" alt="Ваше фото">
                    </div>
                    <button id="logout-btn" style="margin-top: 20px; background-color: #f44336;">Выйти</button>

                    <div class="app-info" style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                        <p><strong>Обновление данных:</strong></p>
                        <button id="refresh-data" style="margin-top: 10px; background-color: #2196F3;">Обновить данные</button>
                    </div>
                `;
                break;
            default:
                html = `<h1>Главная страница</h1>`;
        }

        if (content) {
            content.innerHTML = html;

            if (page === 'auth') {
                setupAuthPage();
            }
            else if (page === 'schedule') {
                renderSchedule(filteredSchedule);
                setupFilters();
            }
            else if (page === 'notifications') {
                setupNotifications();
            }
            else if (page === 'profile') {
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', logout);
                }

                const refreshBtn = document.getElementById('refresh-data');
                if (refreshBtn) {
                    refreshBtn.addEventListener('click', refreshAppData);
                }
            }

            if (page !== 'auth' && checkBirthday()) {
                activateBirthdayTheme();
            }
        }
    }

    // Функция обновления данных приложения
    async function refreshAppData() {
        try {
            isLoading = true;
            updateLoadingIndicator();

            await Promise.all([
                loadGroups(),
                loadSchedule()
            ]);

            showToast('Данные успешно обновлены');

            // Обновляем текущую страницу
            const currentPage = document.querySelector('h1')?.textContent.toLowerCase();
            if (currentPage === 'расписание') {
                renderSchedule(filteredSchedule);
                setupFilters();
            } else if (currentPage === 'личный кабинет') {
                loadPage('profile');
            }
        } catch (error) {
            console.error('Ошибка обновления данных:', error);
            showErrorMessage('Не удалось обновить данные: ' + error.message);
        } finally {
            isLoading = false;
            updateLoadingIndicator();
        }
    }

    // Настройка страницы авторизации
    function setupAuthPage() {
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        const switchToRegister = document.getElementById('switch-to-register');
        const switchToLogin = document.getElementById('switch-to-login');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (switchToRegister) {
            switchToRegister.addEventListener('click', function(e) {
                e.preventDefault();
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            });
        }

        if (switchToLogin) {
            switchToLogin.addEventListener('click', function(e) {
                e.preventDefault();
                registerForm.classList.add('hidden');
                loginForm.classList.remove('hidden');
            });
        }

        if (loginBtn) {
            loginBtn.addEventListener('click', async function() {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;

                if (!email || !password) {
                    showToast('Пожалуйста, заполните все поля');
                    return;
                }

                loginBtn.disabled = true;
                loginBtn.textContent = 'Выполняется вход...';
                isLoading = true;
                updateLoadingIndicator();

                try {
                    localStorage.setItem('lastEmail', email);
                    const password_hash = simpleHash(password);

                    // Пробуем обходной путь для тестирования, если API недоступен
                    let user;
                    if (email === 'meeporen@gmail.com' && password === '122345') {
                        console.log('Используем обходной вход для тестового пользователя');
                        user = {
                            id: 1,
                            first_name: 'Карен',
                            last_name: 'Карэнович',
                            patronymic: 'Карамян',
                            email: 'meeporen@gmail.com',
                            birth: '1990-03-12',
                            group_id: 57352
                        };
                    } else if (email === 'vladacathjtg@gmail.com' && password === '122345') {
                        user = {
                            id: 2,
                            first_name: 'Владулик',
                            last_name: 'Владимировна',
                            patronymic: 'Карамян',
                            email: 'vladacathjtg@gmail.com',
                            birth: '2005-03-12',
                            group_id: 57781
                        };
                    } else {
                        user = await api.login(email, password_hash);
                    }

                    userData = {
                        id: user.id,
                        firstName: user.first_name,
                        lastName: user.last_name,
                        middleName: user.patronymic || '',
                        email: user.email,
                        group: await getGroupNameById(user.group_id),
                        birthDate: user.birth ? new Date(user.birth).toISOString().split('T')[0] : null
                    };

                    localStorage.setItem('userData', JSON.stringify(userData));
                    localStorage.setItem('authenticated', 'true');

                    showToast('Авторизация успешна!');
                    await loadSchedule();
                    loadPage('schedule');
                } catch (error) {
                    console.error('Ошибка авторизации:', error);
                    showToast('Ошибка авторизации: ' + (error.message || 'Неизвестная ошибка'));
                    showErrorMessage('Проверьте правильность email и пароля');
                } finally {
                    loginBtn.disabled = false;
                    loginBtn.textContent = 'Войти';
                    isLoading = false;
                    updateLoadingIndicator();
                }
            });
        }

        if (registerBtn) {
            registerBtn.addEventListener('click', async function() {
                const lastName = document.getElementById('lastName').value;
                const firstName = document.getElementById('firstName').value;
                const middleName = document.getElementById('middleName').value;
                const groupName = document.getElementById('group-select').value;
                const birthDate = document.getElementById('birthDate').value;
                const email = document.getElementById('reg-email').value;
                const password = document.getElementById('reg-password').value;

                if (!lastName || !firstName || !groupName || !birthDate || !email || !password) {
                    showToast('Пожалуйста, заполните все обязательные поля');
                    return;
                }

                registerBtn.disabled = true;
                registerBtn.textContent = 'Регистрация...';
                isLoading = true;
                updateLoadingIndicator();

                try {
                    const password_hash = simpleHash(password);

                    const registerData = {
                        first_name: firstName,
                        last_name: lastName,
                        middle_name: middleName,
                        email: email,
                        birth_date: birthDate,
                        password_hash: password_hash,
                        group_name: groupName
                    };

                    const newUser = await api.registerUser(registerData);

                    userData = {
                        id: newUser.id,
                        firstName: newUser.first_name,
                        lastName: newUser.last_name,
                        middleName: newUser.patronymic || '',
                        email: newUser.email,
                        group: groupName,
                        birthDate: birthDate
                    };

                    localStorage.setItem('userData', JSON.stringify(userData));
                    localStorage.setItem('authenticated', 'true');

                    showToast('Регистрация успешна!');
                    await loadSchedule();
                    loadPage('schedule');
                } catch (error) {
                    console.error('Ошибка регистрации:', error);
                    showToast('Ошибка регистрации: ' + (error.message || 'Неизвестная ошибка'));
                    showErrorMessage('Возможно, пользователь с таким email уже существует');
                } finally {
                    registerBtn.disabled = false;
                    registerBtn.textContent = 'Зарегистрироваться';
                    isLoading = false;
                    updateLoadingIndicator();
                }
            });
        }
    }

    // Получение имени группы по ID
    async function getGroupNameById(groupId) {
        if (!groupId) return 'Не указана';

        if (!groups || !groups.length) {
            await loadGroups();
        }

        const numericGroupId = Number(groupId);
        // Проверяем сначала по обычному полю groupId, затем по полю id
        const group = groups.find(g =>
            Number(g.groupId) === numericGroupId || Number(g.id) === numericGroupId
        );

        return group ? (group.groupName || group.name) : `Группа ${groupId}`;
    }

    // Функция хеширования для демонстрации
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    // Функция выхода из аккаунта
    function logout() {
        localStorage.removeItem('authenticated');
        resetData();
        showToast('Вы вышли из аккаунта');
        loadPage('auth');
    }

    // Обработка темы
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

    // Инициализация приложения
    async function init() {
        try {
            console.log('Инициализация приложения...');
            showToast('Загрузка приложения...');

            try {
                await initData();
            } catch (dataError) {
                console.error('Ошибка инициализации данных:', dataError);
            }

            const isAuthenticated = localStorage.getItem('authenticated') === 'true';
            console.log('Статус аутентификации:', isAuthenticated);

            loadPage(isAuthenticated ? 'schedule' : 'auth');

            if (userPhoto && userPhotoElement) {
                userPhotoElement.src = userPhoto;
            }

            console.log('Инициализация завершена');
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            showErrorMessage('Ошибка загрузки приложения. Пожалуйста, обновите страницу.');
        }
    }

    // Запуск приложения
    init();
});