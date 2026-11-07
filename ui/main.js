import { countPossibleSecrets } from '../logic/countPossibleSecrets.js';
import { createDigitValidator } from '../logic/createDigitValidator.js';
import { applyGuess, createGameState } from '../logic/gameState.js';
import { isValidGuess } from '../logic/isValidGuess.js';
import { loadRecords, saveRecord } from '../logic/records.js';
import { clearChildren, createElement } from './dom.js';
import { openModal } from './modal.js';
const BASE_NAMES = {
    2: 'bin',
    8: 'oct',
    10: 'dec',
    16: 'hex',
};
const pluralize = (n, forms) => {
    const n10 = n % 10;
    const n100 = n % 100;
    if (n10 === 1 && n100 !== 11) {
        return forms[0];
    }
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) {
        return forms[1];
    }
    return forms[2];
};
const digitsLabel = (n) => `${n} ${pluralize(n, ['цифра', 'цифры', 'цифр'])}`;
const root = document.createElement('div');
root.id = 'app';
document.body.appendChild(root);
let screen = 'settings';
let config = { length: 4, base: 10 };
let game = null;
let timerId = null;
const normalizeConfig = (c) => {
    if (c.length > c.base) {
        return { ...c, length: Math.max(2, c.base) };
    }
    if (c.length < 2) {
        return { ...c, length: 2 };
    }
    return c;
};
const formatTime = (ms) => {
    const total = Math.floor(ms / 1000);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
const startTimer = () => {
    stopTimer();
    timerId = window.setInterval(() => {
        const el = document.getElementById('timer');
        if (el && game) {
            el.textContent = formatTime(Date.now() - game.startTime);
        }
    }, 250);
};
const stopTimer = () => {
    if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
    }
};
const renderRecordsTable = () => {
    const records = loadRecords();
    if (records.length === 0) {
        return createElement('p', { className: 'hint', text: 'Пока нет рекордов' });
    }
    const tbody = createElement('tbody');
    records.forEach((r, i) => {
        tbody.append(createElement('tr', {}, [
            createElement('td', { text: String(i + 1) }),
            createElement('td', { text: String(r.attempts) }),
            createElement('td', { text: formatTime(r.timeMs) }),
            createElement('td', {
                text: `${digitsLabel(r.length)}, ${BASE_NAMES[r.base] ?? '?'}`,
            }),
            createElement('td', { text: new Date(r.date).toLocaleString() }),
        ]));
    });
    return createElement('table', { className: 'records-table' }, [
        createElement('thead', {}, [
            createElement('tr', {}, [
                createElement('th', { text: '#' }),
                createElement('th', { text: 'Попытки' }),
                createElement('th', { text: 'Время' }),
                createElement('th', { text: 'Настройки' }),
                createElement('th', { text: 'Дата' }),
            ]),
        ]),
        tbody,
    ]);
};
const renderSettings = () => {
    config = normalizeConfig(config);
    const lengthSelect = createElement('select', { id: 'length' });
    for (let len = 2; len <= 6; len++) {
        const option = createElement('option', { value: String(len), text: String(len) });
        if (len > config.base) {
            option.disabled = true;
        }
        if (len === config.length) {
            option.selected = true;
        }
        lengthSelect.append(option);
    }
    lengthSelect.addEventListener('change', () => {
        config = normalizeConfig({ ...config, length: Number(lengthSelect.value) });
        render();
    });
    const baseSelect = createElement('select', { id: 'base' });
    [2, 8, 10, 16].forEach((b) => {
        const option = createElement('option', {
            value: String(b),
            text: `${BASE_NAMES[b]} (${b})`,
        });
        if (b === config.base) {
            option.selected = true;
        }
        baseSelect.append(option);
    });
    baseSelect.addEventListener('change', () => {
        config = normalizeConfig({ ...config, base: Number(baseSelect.value) });
        render();
    });
    const startBtn = createElement('button', { text: 'Начать игру' });
    startBtn.addEventListener('click', () => {
        game = createGameState(config.length, config.base);
        screen = 'game';
        startTimer();
        render();
    });
    const recordsBtn = createElement('button', {
        className: 'secondary',
        text: 'Таблица лидеров',
    });
    recordsBtn.addEventListener('click', () => {
        screen = 'records';
        render();
    });
    return createElement('div', { className: 'screen settings' }, [
        createElement('h1', { text: 'Bulls and Cows' }),
        createElement('div', { className: 'field' }, [
            createElement('label', { text: 'Длина: ', for: 'length' }),
            lengthSelect,
        ]),
        createElement('div', { className: 'field' }, [
            createElement('label', { text: 'Система счисления: ', for: 'base' }),
            baseSelect,
        ]),
        createElement('div', { className: 'button-row' }, [startBtn, recordsBtn]),
        createElement('p', {
            className: 'hint',
            text: `Возможных вариантов: ${countPossibleSecrets(config.length, config.base)}`,
        }),
    ]);
};
const showMessage = (msg) => {
    const el = document.getElementById('message');
    if (el) {
        el.textContent = msg;
    }
};
const renderGame = () => {
    const current = game;
    if (!current) {
        throw new Error('No game');
    }
    const validator = createDigitValidator(current.base);
    const giveUp = () => {
        openModal({
            title: 'Сдаться?',
            message: 'Текущий раунд будет прерван, прогресс не сохранится.',
            confirmText: 'Сдаться',
            cancelText: 'Продолжить',
            onConfirm: () => {
                stopTimer();
                game = null;
                screen = 'settings';
                render();
            },
        });
    };
    const input = createElement('input', {
        type: 'text',
        id: 'guess-input',
        maxlength: String(current.length),
        placeholder: `Введите ${digitsLabel(current.length)}`,
        autocomplete: 'off',
    });
    input.addEventListener('input', () => {
        const filtered = input.value
            .toLowerCase()
            .split('')
            .filter(validator)
            .join('')
            .slice(0, current.length);
        if (filtered !== input.value) {
            input.value = filtered;
        }
    });
    const submit = () => {
        const g = game;
        if (!g) {
            return;
        }
        const value = input.value.toLowerCase();
        if (!isValidGuess(value, g.length, g.base)) {
            showMessage('Некорректная попытка');
            return;
        }
        const next = applyGuess(g, value);
        game = next;
        input.value = '';
        if (next.status === 'won') {
            stopTimer();
            screen = 'won';
            saveRecord({
                length: next.length,
                base: next.base,
                attempts: next.history.length,
                timeMs: (next.endTime ?? Date.now()) - next.startTime,
                date: new Date().toISOString(),
            });
        }
        render();
    };
    input.addEventListener('keydown', (e) => {
        const key = e.key;
        if (key === 'Enter') {
            submit();
        }
        if (key === 'Escape') {
            giveUp();
        }
    });
    const submitBtn = createElement('button', { text: 'Проверить' });
    submitBtn.addEventListener('click', submit);
    const giveUpBtn = createElement('button', {
        className: 'secondary give-up',
        text: 'Сдаться',
    });
    giveUpBtn.addEventListener('click', giveUp);
    const historyList = createElement('ol', { className: 'history' });
    current.history.forEach((a) => {
        historyList.append(createElement('li', {}, [
            createElement('span', { className: 'guess', text: a.guess }),
            createElement('div', { className: 'badges' }, [
                createElement('span', {
                    className: 'badge bulls',
                    text: `Попадание (bulls): ${a.bulls}`,
                }),
                createElement('span', {
                    className: 'badge cows',
                    text: `Промах (cows): ${a.cows}`,
                }),
            ]),
        ]));
    });
    const screenEl = createElement('div', { className: 'screen game' }, [
        createElement('h2', {
            text: `Игра: ${digitsLabel(current.length)}, ${BASE_NAMES[current.base]}`,
        }),
        createElement('div', {
            id: 'timer',
            text: formatTime(Date.now() - current.startTime),
        }),
        createElement('div', { className: 'input-row' }, [input, submitBtn]),
        createElement('div', { id: 'message', className: 'message' }),
        historyList,
        giveUpBtn,
    ]);
    requestAnimationFrame(() => {
        input.focus();
        historyList.scrollTop = historyList.scrollHeight;
    });
    return screenEl;
};
const renderWon = (g) => {
    const attempts = g.history.length;
    const timeMs = (g.endTime ?? Date.now()) - g.startTime;
    const newGameBtn = createElement('button', { text: 'Новая игра' });
    newGameBtn.addEventListener('click', () => {
        stopTimer();
        game = null;
        screen = 'settings';
        render();
    });
    return createElement('div', { className: 'screen won' }, [
        createElement('h2', { text: 'Победа!' }),
        createElement('p', { text: `Загаданное число: ${g.secret}` }),
        createElement('p', { text: `Попыток: ${attempts}` }),
        createElement('p', { text: `Время: ${formatTime(timeMs)}` }),
        createElement('h3', { text: 'Таблица лидеров' }),
        renderRecordsTable(),
        newGameBtn,
    ]);
};
const renderRecords = () => {
    const backBtn = createElement('button', { className: 'secondary', text: 'Назад' });
    backBtn.addEventListener('click', () => {
        screen = 'settings';
        render();
    });
    return createElement('div', { className: 'screen records-screen' }, [
        createElement('h2', { text: 'Таблица лидеров' }),
        renderRecordsTable(),
        backBtn,
    ]);
};
const render = () => {
    clearChildren(root);
    if (screen === 'settings') {
        root.append(renderSettings());
    }
    else if (screen === 'game') {
        root.append(renderGame());
    }
    else if (screen === 'won' && game) {
        root.append(renderWon(game));
    }
    else if (screen === 'records') {
        root.append(renderRecords());
    }
};
render();
