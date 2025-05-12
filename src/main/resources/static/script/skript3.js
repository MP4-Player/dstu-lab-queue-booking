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
    let filteredSchedule = [];
    let currentTeacherFilter = null;
    let currentSubjectFilter = null;

    // API Endpoints
    const API = {
        GROUPS: '/api/groups',
        LOGIN: '/api/users/login',
        SCHEDULE: '/schedule'
    };

    // ================================================
    // ФУНКЦИИ ДЛЯ РАБОТЫ С API (НОВЫЕ ИЛИ ИЗМЕНЕННЫЕ)
    // ================================================

    // Загрузка групп из API
    async function loadGroups() {
        try {
            const response = await fetch(API.GROUPS);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            const data = await response.json();
            return data.map(group => ({ name: group.groupName }));
        } catch (error) {
            console.error('Ошибка загрузки групп:', error);
            showToast('Не удалось загрузить список групп');
            return [];
        }
    }

    // Хэширование пароля (совместимо с Java Long)
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0; // Приведение к 32-битному целому
        }
        return hash;
    }

    // Авторизация пользователя
    async function handleAuth() {
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value.trim();
        const group = document.getElementById('group-select')?.value;

        if (!email || !password || !group) {
            showToast('Заполните все поля');
            return;
        }

        try {
            const response = await fetch(API.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password_hash: simpleHash(password)
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Ошибка авторизации');
            }

            const user = await response.json();
            localStorage.setItem('userData', JSON.stringify({
                ...user,
                group: group
            }));

            loadPage('schedule');
        } catch (error) {
            console.error('Auth error:', error);
            showToast(error.message);
        }
    }

    // Загрузка расписания
    async function loadSchedule() {
        try {
            const user = JSON.parse(localStorage.getItem('userData'));
            if (!user?.group) return [];

            const response = await fetch(`${API.SCHEDULE}?group=${encodeURIComponent(user.group)}`);
            if (!response.ok) throw new Error('Ошибка загрузки расписания');
            return await response.json();
        } catch (error) {
            console.error('Schedule error:', error);
            return [];
        }
    }

    // ================================================
    // МОДИФИЦИРОВАННЫЕ ФУНКЦИИ ИНТЕРФЕЙСА
    // ================================================

    // Инициализация выпадающего списка групп
    async function initGroupSelect() {
        const groups = await loadGroups();
        const select = document.getElementById('group-select');
        if (!select) return;

        select.innerHTML = '<option value="" disabled selected>Выберите группу</option>';
        groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group.name;
            option.textContent = group.name;
            select.appendChild(option);
        });
    }

    // Загрузка страницы (полная реализация)
    function loadPage(page) {
        const content = document.getElementById('content');
        const bottomPanel = document.querySelector('.bottom-panel');

        // Скрываем нижнюю панель на странице авторизации
        if (bottomPanel) {
            bottomPanel.style.display = page === 'auth' ? 'none' : 'flex';
        }

        let html = '';
        switch (page) {
            case 'auth':
                html = `
                    <div class="auth-form">
                        <h1>Авторизация</h1>
                        <input type="email" id="email" placeholder="Email" required>
                        <input type="password" id="password" placeholder="Пароль" required>
                        <select id="group-select" required>
                            <option value="" disabled selected>Выберите группу</option>
                        </select>
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

            // Инициализация компонентов после рендера
            switch (page) {
                case 'auth':
                    initGroupSelect();
                    document.getElementById('login-btn').addEventListener('click', handleAuth);
                    break;

                case 'schedule':
                    renderSchedule();
                    setupFilters();
                    break;

                case 'notifications':
                    setupNotifications();
                    break;
            }

            // Активация темы дня рождения
            if (page !== 'auth' && checkBirthday()) {
                activateBirthdayTheme();
            }
        }
    }

    // ================================================
    // СУЩЕСТВУЮЩИЕ ФУНКЦИИ БЕЗ ИЗМЕНЕНИЙ
    // ================================================

    // initData()
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

    // checkBirthday()
    function checkBirthday() {
        if (!BIRTHDAY_THEME_ENABLED || !userData.birthDate) return false;
        const today = new Date();
        const birthDate = new Date(userData.birthDate);
        return today.getDate() === birthDate.getDate() && today.getMonth() === birthDate.getMonth();
    }

    // activateBirthdayTheme()
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


    // setupQueueButtons()
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


    // setupNotifications()
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


    // showToast()
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    // ================================================
    // ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
    // ================================================

    function init() {
        initData();
        loadPage('auth');

        // Инициализация темы
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-theme');
                document.body.classList.toggle('orange-theme');
                currentTheme = document.body.classList.contains('dark-theme')
                    ? 'dark-theme'
                    : 'orange-theme';
            });
        }

        // Загрузка аватара
        if (userPhoto && document.getElementById('user-photo')) {
            document.getElementById('user-photo').src = userPhoto;
        }
    }

    // Запуск
    init();
});