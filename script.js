class CountdownTimer {
    constructor(targetDate, updateCallback, completeCallback, type = 'countdown', creationDate = null) {
        this.type = type;
        this.targetDate = new Date(targetDate);
        this.creationDate = creationDate ? new Date(creationDate) : new Date();
        this.updateCallback = updateCallback;
        this.completeCallback = completeCallback;
        this.interval = null;
        this.start();
    }

    static formatTime(value, words) {
        const cases = [2, 0, 1, 1, 1, 2];
        const index = (value % 100 > 4 && value % 100 < 20) ? 2 : cases[Math.min(value % 10, 5)];
        return words[index];
    }

    start() {
        this.update();
        this.interval = setInterval(() => this.update(), 1000);
    }

    update() {
        const now = new Date();
        let diff = this.type === 'countdown' 
            ? this.targetDate - now 
            : now - this.targetDate;

        if (diff < 0 && this.type === 'countdown') diff = 0;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        // Вычисляем прогресс для обратного отсчета
        let progress = null;
        let progressText = '';
        
        if (this.type === 'countdown') {
            const totalDuration = this.targetDate - this.creationDate;
            const elapsed = now - this.creationDate;
            const remaining = this.targetDate - now;
            
            if (totalDuration > 0 && remaining > 0) {
                // Прогресс показывает процент прошедшего времени
                progress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
                const remainingPercent = Math.max(0, Math.min(100, (remaining / totalDuration) * 100));
                progressText = `Осталось: ${remainingPercent.toFixed(1)}%`;
            } else if (remaining <= 0) {
                // Таймер завершен
                progress = 100;
                progressText = 'Завершено!';
            }
        }

        this.updateCallback({
            days: days.toString().padStart(2, '0'),
            hours: hours.toString().padStart(2, '0'),
            minutes: minutes.toString().padStart(2, '0'),
            seconds: seconds.toString().padStart(2, '0'),
            daysLabel: CountdownTimer.formatTime(days, ['день', 'дня', 'дней']),
            hoursLabel: CountdownTimer.formatTime(hours, ['час', 'часа', 'часов']),
            minutesLabel: CountdownTimer.formatTime(minutes, ['минута', 'минуты', 'минут']),
            secondsLabel: CountdownTimer.formatTime(seconds, ['секунда', 'секунды', 'секунд']),
            progress: progress,
            progressText: progressText
        });

        if (this.type === 'countdown' && diff <= 0) {
            this.stop();
            this.completeCallback?.();
        }
    }

    stop() {
        clearInterval(this.interval);
    }
}

class TimerManager {
    constructor() {
        this.timers = {};
        this.isAuthenticated = false;
        this.adminCredentials = {
            username: 'admin',
            password: 'password'
        };
        this.loadTimers();
        this.initAuth();
        this.initAdminPanel();
        this.initTheme();
        this.renderTimers();
        this.addTouchEvents();
        this.fixViewportHeight();
    }

    initAuth() {
        $('#toggleAdminPanel').on('click', () => {
            if (this.isAuthenticated) {
                this.showAdminPanel();
            } else {
                this.showAuthPanel();
            }
        });

        $('#loginBtn').on('click', () => this.authenticate());
        $('#cancelAuth').on('click', () => this.hideAuthPanel());
        
        // Обработка Enter в полях авторизации
        $('#adminLogin, #adminPassword').on('keypress', (e) => {
            if (e.which === 13) {
                this.authenticate();
            }
        });
    }

    authenticate() {
        const username = $('#adminLogin').val().trim();
        const password = $('#adminPassword').val().trim();

        if (username === this.adminCredentials.username && password === this.adminCredentials.password) {
            this.isAuthenticated = true;
            this.hideAuthPanel();
            this.showAdminPanel();
            $('#adminLogin, #adminPassword').val('');
        } else {
            alert('Неверный логин или пароль!');
            $('#adminPassword').val('').focus();
        }
    }

    showAuthPanel() {
        $('#authPanel').removeClass('hidden');
        $('#adminLogin').focus();
    }

    hideAuthPanel() {
        $('#authPanel').addClass('hidden');
    }

    showAdminPanel() {
        $('#adminPanel').removeClass('hidden');
        $('body').addClass('no-scroll');
        this.renderAdminTimersList();
    }

    hideAdminPanel() {
        $('#adminPanel').addClass('hidden');
        $('body').removeClass('no-scroll');
    }

    renderAdminTimersList() {
        const $adminList = $('#adminTimersList');
        $adminList.empty();

        if (Object.keys(this.timers).length === 0) {
            $adminList.html('<p style="text-align: center; color: #6c757d; font-style: italic;">Нет сохраненных таймеров</p>');
            return;
        }

        Object.values(this.timers).forEach(timer => {
            const timerDate = new Date(timer.date);
            const formattedDate = timerDate.toLocaleString('ru-RU', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });

            const timerElement = $(`
                <div class="admin-timer-item">
                    <div class="admin-timer-info">
                        <div class="admin-timer-title">${timer.title}</div>
                        <div class="admin-timer-details">
                            ${timer.type === 'countdown' ? 'Обратный отсчет' : 'Прошедшее время'} • ${formattedDate}
                        </div>
                    </div>
                    <div class="admin-timer-actions">
                        <button class="btn btn-primary edit-admin-btn" data-id="${timer.id}">Изменить</button>
                        <button class="btn btn-danger delete-admin-btn" data-id="${timer.id}">Удалить</button>
                    </div>
                </div>
            `);

            timerElement.find('.edit-admin-btn').on('click', () => this.editTimer(timer));
            timerElement.find('.delete-admin-btn').on('click', () => this.deleteTimer(timer.id));

            $adminList.append(timerElement);
        });
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.body.classList.toggle('dark-theme', savedTheme === 'dark');
        }
        $('#themeToggle').on('click', () => {
            document.body.classList.toggle('dark-theme');
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    loadTimers() {
        const saved = localStorage.getItem('timers');
        if (saved) {
            this.timers = JSON.parse(saved);
            
            // Миграция: исправляем createdAt на creationDate
            let needsSave = false;
            Object.keys(this.timers).forEach(key => {
                if (this.timers[key].createdAt && !this.timers[key].creationDate) {
                    this.timers[key].creationDate = this.timers[key].createdAt;
                    delete this.timers[key].createdAt;
                    needsSave = true;
                }
            });
            
            if (needsSave) {
                this.saveTimers();
            }
        } else {
            // Примеры таймеров по умолчанию
            this.timers = {
                timer1: {
                    id: 'timer1',
                    title: 'Новый Год 2025',
                    date: new Date('2025-01-01T00:00:00').toISOString(),
                    type: 'countdown',
                    creationDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // неделю назад
                },
                timer2: {
                    id: 'timer2',
                    title: 'Старт проекта',
                    date: new Date(Date.now() - 86400000).toISOString(),
                    type: 'elapsed',
                    creationDate: new Date(Date.now() - 86400000).toISOString()
                }
            };
            this.saveTimers();
        }
    }

    saveTimers() {
        localStorage.setItem('timers', JSON.stringify(this.timers));
    }

    initAdminPanel() {
        $('#saveTimer').on('click', () => this.saveTimer());
        $('#cancelEdit').on('click', () => {
            this.hideAdminPanel();
            this.clearForm();
        });
    }

    addTouchEvents() {
        // Улучшение для сенсорных устройств
        $(document)
            .on('touchstart', '.btn', function() {
                $(this).addClass('touch-active');
            })
            .on('touchend', '.btn', function() {
                $(this).removeClass('touch-active');
            });
    }

    fixViewportHeight() {
        // Фикс для мобильных браузеров
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        
        setViewportHeight();
        $(window).on('resize orientationchange', setViewportHeight);
    }

    saveTimer() {
        const id = $('#timerId').val();
        const title = $('#timerTitle').val().trim();
        const type = $('#timerType').val();
        const date = $('#timerDate').val();

        if (!title || !date) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        const timerData = {
            id: id || `timer${Date.now()}`,
            title,
            type,
            date: new Date(date).toISOString(),
            creationDate: id ? this.timers[id]?.creationDate : new Date().toISOString()
        };

        if (id) {
            this.timers[id] = timerData;
        } else {
            this.timers[timerData.id] = timerData;
        }

        this.saveTimers();
        this.renderTimers();
        this.renderAdminTimersList();
        this.hideAdminPanel();
        this.clearForm();
    }

    clearForm() {
        $('#timerId').val('');
        $('#timerTitle').val('');
        $('#timerDate').val('');
        $('#timerType').val('countdown');
    }

    deleteTimer(id) {
        if (confirm('Вы уверены, что хотите удалить этот таймер?')) {
            delete this.timers[id];
            this.saveTimers();
            this.renderTimers();
            this.renderAdminTimersList();
        }
    }

    renderTimers() {
        $('#timersWrapper').empty();
        $('#noTimersMessage').toggle(Object.keys(this.timers).length === 0);

        Object.values(this.timers).forEach(timer => {
            const timerElement = $(`
                <div class="timer" id="${timer.id}">
                    <div class="timer-type-container">
                        <div class="timer-type ${timer.type}-type">
                            ${timer.type === 'countdown' ? 'Обратный отсчет' : 'Прошедшее время'}
                        </div>
                    </div>
                    <h2 class="timer-title">${timer.title}</h2>
                    ${timer.type === 'countdown' ? '<div class="progress-container"><div class="progress-bar"><div class="progress-fill"></div></div><div class="progress-text"></div></div>' : ''}
                    <div class="timer__items">
                        <div class="timer__item" data-title="дней">00</div>
                        <div class="timer__item" data-title="часов">00</div>
                        <div class="timer__item" data-title="минут">00</div>
                        <div class="timer__item" data-title="секунд">00</div>
                    </div>
                </div>
            `);

            $('#timersWrapper').append(timerElement);

            new CountdownTimer(
                timer.date,
                (time) => {
                    const items = timerElement.find('.timer__item');
                    items.eq(0).text(time.days).attr('data-title', time.daysLabel);
                    items.eq(1).text(time.hours).attr('data-title', time.hoursLabel);
                    items.eq(2).text(time.minutes).attr('data-title', time.minutesLabel);
                    items.eq(3).text(time.seconds).attr('data-title', time.secondsLabel);
                    
                    // Обновляем прогресс-бар для обратного отсчета
                    if (timer.type === 'countdown' && time.progress !== null) {
                        const $progressFill = timerElement.find('.progress-fill');
                        const $progressText = timerElement.find('.progress-text');
                        
                        // Принудительно устанавливаем стили
                        $progressFill.css({
                            'width': `${time.progress}%`,
                            'height': '100%',
                            'min-height': '8px',
                            'display': 'block'
                        });
                        
                        $progressText.text(time.progressText);
                        
                        // Отладочная информация для сервера
                        if (time.progress > 0) {
                            console.log(`Прогресс ${timer.title}: ${time.progress}% - ${time.progressText}`);
                        }
                    }
                },
                () => {
                    timerElement.append('<div class="timer-complete">Завершено!</div>');
                },
                timer.type,
                timer.creationDate
            );
        });
    }

    editTimer(timer) {
        $('#timerId').val(timer.id);
        $('#timerTitle').val(timer.title);
        $('#timerType').val(timer.type);
        
        // Форматирование даты для input[type="datetime-local"]
        const date = new Date(timer.date);
        const formattedDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
            .toISOString()
            .slice(0, 16);
        
        $('#timerDate').val(formattedDate);
        this.showAdminPanel();
    }
}

// Инициализация при загрузке документа
$(document).ready(() => {
    const timerManager = new TimerManager();
    
    // Показать админ-панель если нет сохраненных таймеров
    if (localStorage.getItem('timers') === null) {
        timerManager.showAuthPanel();
    }
});