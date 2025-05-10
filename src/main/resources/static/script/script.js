document.addEventListener('DOMContentLoaded', function() {
    // Конфигурация
    const API_BASE_URL = 'http://localhost:8081/api';
    const MAX_READ_NOTIFICATIONS = 6;
    const BIRTHDAY_THEME_ENABLED = true;

    // Состояние приложения
    let currentTheme = localStorage.getItem('theme') || 'orange-theme';
    let userPhoto = localStorage.getItem('userPhoto') || '';
    let userData = JSON.parse(localStorage.getItem('userData')) || {};
    let notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    let userQueues = JSON.parse(localStorage.getItem('userQueues')) || [];

    // DOM элементы
    const body = document.body;
    const content = document.getElementById('content');
    const themeToggle = document.getElementById('theme-toggle');
    const userPhotoElement = document.getElementById('user-photo');

    // Инициализация темы
    body.classList.add(currentTheme);

    // ========================
    // API функции
    // ========================

    async function fetchSchedule() {
        try {
            const response = await fetch(`${API_BASE_URL}/schedule`);
            return await response.json();
        } catch (e) {
            showToast('Ошибка загрузки расписания');
            return [];
        }
    }

    async function loginUser(authData) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(authData)
            });
            return await response.json();
        } catch (e) {
            showToast('Ошибка соединения');
            return null;
        }
    }

    // ========================
    // Логика приложения
    // ========================

    function saveLocalData() {
        localStorage.setItem('theme', currentTheme);
        localStorage.setItem('userPhoto', userPhoto);
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('notifications', JSON.stringify(notifications));
        localStorage.setItem('userQueues', JSON.stringify(userQueues));
    }

    function checkBirthday() {
        if (!userData.birthDate) return false;
        const birthDate = new Date(userData.birthDate);
        const today = new Date();
        return birthDate.getDate() === today.getDate() &&
               birthDate.getMonth() === today.getMonth();
    }

    // ========================
    // Работа с интерфейсом
    // ========================

    async function loadSchedule() {
        const scheduleData = await fetchSchedule();
        renderSchedule(scheduleData);
    }

    function renderSchedule(data) {
        const container = document.getElementById('schedule-list');
        container.innerHTML = '';

        data.forEach(item => {
            const isQueued = userQueues.some(q => q.subject === item.subject);

            const div = document.createElement('div');
            div.className = `schedule-item ${isQueued ? 'queued' : ''}`;
            div.innerHTML = `
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
            `;
            container.appendChild(div);
        });
        setupQueueButtons();
    }

    // ========================
    # Система очередей
    // ========================

    function confirmQueue(subject, teacher) {
        const newQueue = {
            id: Date.now(),
            subject,
            teacher,
            date: new Date().toISOString()
        };

        userQueues.push(newQueue);
        saveLocalData();
        showToast(`Вы записаны на ${subject}`);
        addNotification(`Новая запись: ${subject}`);
        loadPage('schedule');
    }

    // ========================
    # Уведомления
    // ========================

    function addNotification(text) {
        const newNotification = {
            id: Date.now(),
            text,
            read: false,
            date: new Date().toISOString()
        };

        notifications.unshift(newNotification);
        saveLocalData();
        setupNotifications();
    }

    // ========================
    # Пользовательский интерфейс
    // ========================

    function setupTheme() {
        themeToggle.addEventListener('click', () => {
            body.classList.remove(currentTheme);
            currentTheme = currentTheme === 'dark-theme'
                ? 'orange-theme'
                : 'dark-theme';
            body.classList.add(currentTheme);
            localStorage.setItem('theme', currentTheme);
        });
    }

    function initPhotoUpload() {
        const uploadPhotoInput = document.createElement('input');
        uploadPhotoInput.type = 'file';
        uploadPhotoInput.accept = 'image/*';
        uploadPhotoInput.style.display = 'none';
        document.body.appendChild(uploadPhotoInput);

        userPhotoElement.addEventListener('click', () => uploadPhotoInput.click());

        uploadPhotoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = () => {
                userPhotoElement.src = reader.result;
                userPhoto = reader.result;
                localStorage.setItem('userPhoto', userPhoto);
            };

            reader.readAsDataURL(file);
        });
    }

    // ========================
    # Инициализация
    // ========================

    async function initApp() {
        // Загрузка начальных данных
        if (localStorage.getItem('userData')) {
            await loadSchedule();
        }

        // Настройка обработчиков
        setupTheme();
        initPhotoUpload();

        // Проверка дня рождения
        if (BIRTHDAY_THEME_ENABLED && checkBirthday()) {
            body.classList.add('birthday-theme');
        }
    }

    // Запуск приложения
    initApp();
});