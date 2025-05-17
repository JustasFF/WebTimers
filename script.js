class CountdownTimer {
    constructor(targetDate, updateCallback, completeCallback, type = 'countdown') {
        this.type = type;
        this.targetDate = new Date(targetDate);
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

        this.updateCallback({
            days: days.toString().padStart(2, '0'),
            hours: hours.toString().padStart(2, '0'),
            minutes: minutes.toString().padStart(2, '0'),
            seconds: seconds.toString().padStart(2, '0'),
            daysLabel: CountdownTimer.formatTime(days, ['день', 'дня', 'дней']),
            hoursLabel: CountdownTimer.formatTime(hours, ['час', 'часа', 'часов']),
            minutesLabel: CountdownTimer.formatTime(minutes, ['минута', 'минуты', 'минут']),
            secondsLabel: CountdownTimer.formatTime(seconds, ['секунда', 'секунды', 'секунд'])
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
        this.loadTimers();
        this.initAdminPanel();
        this.initTheme();
        this.renderTimers();
        this.addTouchEvents();
        this.fixViewportHeight();
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
        } else {
            // Примеры таймеров по умолчанию
            this.timers = {
                timer1: {
                    id: 'timer1',
                    title: 'Новый Год 2025',
                    date: new Date('2025-01-01T00:00:00').toISOString(),
                    type: 'countdown'
                },
                timer2: {
                    id: 'timer2',
                    title: 'Старт проекта',
                    date: new Date(Date.now() - 86400000).toISOString(),
                    type: 'elapsed'
                }
            };
            this.saveTimers();
        }
    }

    saveTimers() {
        localStorage.setItem('timers', JSON.stringify(this.timers));
    }

    initAdminPanel() {
        const $adminPanel = $('.admin-panel');
        
        $('#toggleAdminPanel').on('click', () => {
            $adminPanel.toggleClass('hidden');
            $('body').toggleClass('no-scroll', !$adminPanel.hasClass('hidden'));
        });
        
        $('#saveTimer').on('click', () => this.saveTimer());
        $('#cancelEdit').on('click', () => {
            $adminPanel.addClass('hidden');
            $('body').removeClass('no-scroll');
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
            date: new Date(date).toISOString()
        };

        if (id) {
            this.timers[id] = timerData;
        } else {
            this.timers[timerData.id] = timerData;
        }

        this.saveTimers();
        this.renderTimers();
        this.cancelEdit();
    }

    cancelEdit() {
        $('#timerId').val('');
        $('#timerTitle').val('');
        $('#timerDate').val('');
        $('#timerType').val('countdown');
        $('.admin-panel').addClass('hidden');
        $('body').removeClass('no-scroll');
    }

    deleteTimer(id) {
        if (confirm('Вы уверены, что хотите удалить этот таймер?')) {
            delete this.timers[id];
            this.saveTimers();
            this.renderTimers();
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
                    <div class="timer__items">
                        <div class="timer__item" data-title="дней">00</div>
                        <div class="timer__item" data-title="часов">00</div>
                        <div class="timer__item" data-title="минут">00</div>
                        <div class="timer__item" data-title="секунд">00</div>
                    </div>
                    <div class="timer-actions">
                        <button class="btn btn-danger delete-btn">Удалить</button>
                        <button class="btn btn-primary edit-btn">Изменить</button>
                    </div>
                </div>
            `);

            timerElement.find('.delete-btn').on('click', () => this.deleteTimer(timer.id));
            timerElement.find('.edit-btn').on('click', () => this.editTimer(timer));

            $('#timersWrapper').append(timerElement);

            new CountdownTimer(
                timer.date,
                (time) => {
                    const items = timerElement.find('.timer__item');
                    items.eq(0).text(time.days).attr('data-title', time.daysLabel);
                    items.eq(1).text(time.hours).attr('data-title', time.hoursLabel);
                    items.eq(2).text(time.minutes).attr('data-title', time.minutesLabel);
                    items.eq(3).text(time.seconds).attr('data-title', time.secondsLabel);
                },
                () => {
                    timerElement.append('<div class="timer-complete">Завершено!</div>');
                },
                timer.type
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
        $('.admin-panel').removeClass('hidden');
        $('body').addClass('no-scroll');
    }
}

// Инициализация при загрузке документа
$(document).ready(() => {
    const timerManager = new TimerManager();
    
    // Показать админ-панель если нет сохраненных таймеров
    if (localStorage.getItem('timers') === null) {
        $('.admin-panel').removeClass('hidden');
        $('body').addClass('no-scroll');
    }
});