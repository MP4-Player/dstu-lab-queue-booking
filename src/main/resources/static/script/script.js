document.addEventListener('DOMContentLoaded', function() {
    // Глобальные переменные
    let currentTheme = 'orange-theme';
    let userPhoto = localStorage.getItem('userPhoto') || '';
    let userData = {};
    let notifications = [];
    let nextNotificationId = 1;
    const MAX_READ_NOTIFICATIONS = 6;
    const BIRTHDAY_THEME_ENABLED = true;
    let userQueues = [];

    // Данные расписания
    const scheduleData = [
        { subject: 'Математика', teacher: 'Иванов И.И.', status: 'Запись открыта', day: 'Понедельник, 7 октября', type: 'Лабораторная', group: 'ВМО21' },
        { subject: 'Физика', teacher: 'Петров П.П.', status: 'Запись открыта', day: 'Понедельник, 7 октября', type: 'Лабораторная', group: 'ВМО22' },
        { subject: 'Информатика', teacher: 'Сидорова А.А.', status: 'Запись закрыта', day: 'Вторник, 8 октября', type: 'Практика', group: 'ВМО23' },
        { subject: 'Программирование', teacher: 'Кузнецов С.С.', status: 'Запись открыта', day: 'Вторник, 8 октября', type: 'Лабораторная', group: 'ВМО21' },
        { subject: 'История', teacher: 'Морозова О.И.', status: 'Запись открыта', day: 'Среда, 9 октября', type: 'Лекция', group: 'ВМО22' },
        { subject: 'Английский', teacher: 'Волков Д.Д.', status: 'Запись закрыта', day: 'Среда, 9 октября', type: 'Практика', group: 'ВМО23' },
        { subject: 'Химия', teacher: 'Смирнова Е.В.', status: 'Запись открыта', day: 'Четверг, 10 октября', type: 'Лабораторная', group: 'ВМО21' },
        { subject: 'Биология', teacher: 'Васильев В.В.', status: 'Запись открыта', day: 'Четверг, 10 октября', type: 'Лекция', group: 'ВМО22' },
        { subject: 'География', teacher: 'Николаева Н.Н.', status: 'Запись закрыта', day: 'Пятница, 11 октября', type: 'Практика', group: 'ВМО23' },
        { subject: 'Литература', teacher: 'Федорова Ф.Ф.', status: 'Запись открыта', day: 'Пятница, 11 октября', type: 'Лекция', group: 'ВМО21' }
    ];

    let filteredSchedule = [...scheduleData];
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

    // Инициализация данных
    function initData() {
        try {
            userData = JSON.parse(localStorage.getItem('userData')) || {};
            notifications = JSON.parse(localStorage.getItem('notifications')) || [
                { id: 1, text: 'Вы записаны на пару по математике.', read: false },
                { id: 2, text: 'Напоминание: Завтра у вас пара по физике.', read: false }
            ];
            userQueues = JSON.parse(localStorage.getItem('userQueues')) || [];
            nextNotificationId = notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1;
        } catch (e) {
            console.error('Ошибка загрузки данных:', e);
            resetData();
        }
    }

    function resetData() {
        userData = {};
        notifications = [];
        userQueues = [];
        localStorage.removeItem('userData');
        localStorage.removeItem('notifications');
        localStorage.removeItem('userQueues');
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
   

// В функции activateBirthdayTheme заменяем код на:
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

// Новая функция для конфетти
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

// В функции loadPage обновляем проверку дня рождения:

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
    }

    function cancelQueue(queueId) {
        userQueues = userQueues.filter(queue => queue.id !== queueId);
        localStorage.setItem('userQueues', JSON.stringify(userQueues));
        addNotification('Вы отменили запись на пару.');
        loadPage('schedule');
    }

    // Уведомления
    function setupNotifications() {
        const notificationsList = document.getElementById('notifications-list');
        if (!notificationsList) return;

        notifications.sort((a, b) => (a.read === b.read) ? 0 : (a.read ? 1 : -1));
        
        notificationsList.innerHTML = notifications.map(notification => `
            <div class="notification ${notification.read ? 'read' : ''}" data-id="${notification.id}">
                ${notification.text}
            </div>
        `).join('');
        
        document.querySelectorAll('.notification').forEach(notification => {
            notification.addEventListener('click', function() {
                const notificationId = parseInt(this.dataset.id);
                const notificationObj = notifications.find(n => n.id === notificationId);
                
                if (!notificationObj.read) {
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
            read: false
        };
        notifications.unshift(newNotification);
        saveNotifications();
        
        if (content.innerHTML.includes('notifications-list')) {
            setupNotifications();
        }
    }

    function trimNotifications() {
        const readNotifications = notifications.filter(n => n.read);
        
        if (readNotifications.length > MAX_READ_NOTIFICATIONS) {
            const toRemove = readNotifications.length - MAX_READ_NOTIFICATIONS;
            const oldestRead = readNotifications.slice(-toRemove);
            
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

    // Расписание и фильтры
    function renderSchedule(schedule) {
        const scheduleList = document.getElementById('schedule-list');
        if (!scheduleList) return;

        const groupedSchedule = schedule.reduce((groups, item) => {
            const day = item.day;
            if (!groups[day]) groups[day] = [];
            groups[day].push(item);
            return groups;
        }, {});

        let html = '';
        for (const day in groupedSchedule) {
            html += `<h3>${day}</h3>`;
            groupedSchedule[day].forEach(item => {
                const isQueued = userQueues.some(q => q.subject === item.subject && q.teacher === item.teacher);
                
                html += `
                    <div class="schedule-item ${isQueued ? 'queued' : ''}">
                        <div class="schedule-info">
                            <p><strong>${item.subject}</strong> (${item.type})</p>
                            <p>Преподаватель: ${item.teacher}</p>
                            <p>Статус: ${item.status}</p>
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
                if (!localStorage.getItem('userData')) {
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
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => toast.remove(), 3000);
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
                        <input type="text" id="lastName" placeholder="Фамилия" value="${userData.lastName || ''}">
                        <input type="text" id="firstName" placeholder="Имя" value="${userData.firstName || ''}">
                        <input type="text" id="middleName" placeholder="Отчество" value="${userData.middleName || ''}">
                        <input type="text" id="group" placeholder="Группа" value="${userData.group || ''}">
                        <input type="date" id="birthDate" placeholder="Дата рождения" value="${userData.birthDate || ''}">
                        <button id="login-btn">Войти</button>
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
                        <p><strong>Дата рождения:</strong> ${userData.birthDate ? new Date(userData.birthDate).toLocaleDateString() : 'Не указана'}</p>
                    </div>
                    <div class="profile-photo">
                        <img src="${userPhoto || 'icons/user.png'}" alt="Ваше фото">
                    </div>
                `;
                break;
            default:
                html = `<h1>Главная страница</h1>`;
        }
        
        if (content) {
            content.innerHTML = html;
            
            if (page === 'auth') {
                const loginBtn = document.getElementById('login-btn');
                if (loginBtn) {
                    loginBtn.addEventListener('click', () => {
                        userData = {
                            lastName: document.getElementById('lastName').value,
                            firstName: document.getElementById('firstName').value,
                            middleName: document.getElementById('middleName').value,
                            group: document.getElementById('group').value,
                            birthDate: document.getElementById('birthDate').value
                        };
                        
                        if (!userData.lastName || !userData.firstName || !userData.group) {
                            showToast('Заполните обязательные поля: Фамилия, Имя и Группа');
                            return;
                        }
                        
                        localStorage.setItem('userData', JSON.stringify(userData));
                        showToast('Данные успешно сохранены!');
                        loadPage('schedule');
                    });
                }
            }
            else if (page === 'schedule') {
                renderSchedule(filteredSchedule);
                setupFilters();
            }
            else if (page === 'notifications') {
                setupNotifications();
            }
            
            if (page !== 'auth' && checkBirthday()) {
                activateBirthdayTheme();
            }
        }
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
    function init() {
        initData();
        loadPage('auth');
        
        if (userPhoto && userPhotoElement) {
            userPhotoElement.src = userPhoto;
        }
    }

    // Запуск приложения
    init();
});