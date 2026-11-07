# DESIGN — Bulls and Cows

Документ описывает архитектурные решения: какие структуры данных использованы и почему, как устроены ключевые алгоритмы, какова их сложность, и какие принципы чистого кода применены — с указанием конкретных файлов и функций.

## 1. Структуры данных и алгоритмы

### 1.1. Состояние игры

```ts
interface GameState {
  readonly secret: string; // секретное число как строка
  readonly length: number; // длина секрета
  readonly base: number; // система счисления
  readonly history: readonly Attempt[]; // история попыток
  readonly status: 'playing' | 'won'; // статус раунда
  readonly startTime: number; // timestamp начала
  readonly endTime?: number; // timestamp победы
}

interface Attempt {
  readonly guess: string; // попытка игрока (нормализована в нижний регистр)
  readonly bulls: number; // точных совпадений
  readonly cows: number; // совпадений не на своём месте
}
```

**Почему `secret` — строка, а не число:**

- ведущие нули корректно сохраняются (`0123` — валидный секрет длины 4);
- hex-цифры (`a`–`f`) представимы без потерь;
- сравнение посимвольно (`secret[i]`) — сложность O(1).

**Почему `history` — `readonly Attempt[]`, а не `Map`/`Set`:**

- порядок попыток имеет значение для UI и для подсчёта результата;
- иммутабельное добавление в конец через `[...history, attempt]` — O(n) по копированию массива, но `n ≤ ~20` на практике; альтернативы (`push`, мутация) запрещены требованием иммутабельности;
- сериализуется в `localStorage` без преобразований;
- `readonly` в типе делает мутацию (`history.push(...)`) ошибкой компиляции TypeScript — иммутабельность защищена на уровне типов, а не только соглашением.

**Почему `status` — дискриминированный union, а не boolean:**

- `'playing' | 'won'` лучше читается и расширяем (можно добавить `'gave-up'` без ломки API);
- проверка «игра завершена» сводится к `state.status === 'won'`;
- `endTime?: number` типизирован как «есть только после победы» — по смыслу связан со статусом.

**История попыток.** Хранит `Attempt` с уже посчитанными `bulls`/`cows`, а не сырые `guess`-строки. Это компромисс: память O(n) вместо O(n) с пересчётом при каждом рендере. Выигрыш — в предсказуемости UI: при перерисовке (`render()`) не нужно заново вызывать `evaluateGuess` на всех прошлых попытках.

**Иммутабельные обновления.** Все переходы состояния реализованы через spread:

```ts
// src/logic/gameState.ts
const next = {
  ...state,
  history: [...state.history, attempt],
  status: won ? 'won' : 'playing',
  endTime: won ? now : undefined,
};
```

Старый объект не мутируется — можно безопасно хранить ссылки на предыдущие состояния (актуально для отладки и потенциального undo).

### 1.2. Алгоритм `evaluateGuess`

```ts
// src/logic/evaluateGuess.ts
const bulls = g.reduce((count, char, i) => count + (char === s[i] ? 1 : 0), 0);
const cows = g.reduce((count, char, i) => count + (char !== s[i] && s.includes(char) ? 1 : 0), 0);
```

1. Обе строки приводятся к нижнему регистру (`toLowerCase`) — hex нечувствителен к регистру (`A` и `a` — одна цифра).
2. **Быки** — `reduce` по символам `guess`: символ `char` совпадает с `secret[i]` → `+1`. Это HOF вместо ручного цикла со счётчиком — по требованию задания.
3. **Коровы** — второй `reduce`: символ есть в `secret`, но не на этой позиции → `+1`. Условие `char !== s[i]` гарантирует, что один символ не считается одновременно быком и коровой.
4. Дубликаты в секрете и в попытке запрещены (`isValidGuess`), поэтому двойного счёта одной цифры не возникает — это не допущение, а инвариант, проверенный валидацией.

### 1.3. Алгоритм `countPossibleSecrets`

```ts
// src/logic/countPossibleSecrets.ts
const rawCountPossibleSecrets = (length: number, base: number): number => {
  if (length === 0) return 1;
  if (length < 0 || base < 0 || base < length) return 0;
  return base * countPossibleSecrets(length - 1, base - 1);
};
export const countPossibleSecrets = memoize(rawCountPossibleSecrets);
```

Количество секретов — это число размещений без повторений `P(base, length) = base! / (base - length)!`. Ведущий ноль разрешён (см. `0123` в ТЗ), поэтому отдельного вычитания вариантов с нулём в начале нет.

Формула реализована через рекуррентное соотношение:

```
P(0, b) = 1
P(n, b) = b * P(n − 1, b − 1)     при n ≥ 1, b ≥ n
P(n, b) = 0                       при b < n (нельзя выбрать больше уникальных цифр, чем есть)
```

Функция обёрнута в `memoize` — HOF, кэширующий результаты в `Map` по ключу `JSON.stringify(args)`. Настройки вызывают `countPossibleSecrets` на каждый ре-рендер (при смене длины и(или) системы), но каждая пара `(length, base)` считается ровно один раз за время жизни страницы.

### 1.4. Вспомогательные структуры

- **`RecordEntry` (рекорды).** Плоская структура с полями `length`, `base`, `attempts`, `timeMs`, `date`. Хранится в `localStorage` как JSON-массив, сортируется по `(attempts asc, timeMs asc)`, обрезается до 10 (`slice(0, MAX_RECORDS)`). Один общий список с бейджем настроек в каждой строке — вариант, явно разрешённый ТЗ.
- **`DIGITS` (алфавит).** Строковая константа `'0123456789abcdef'` в `src/logic/digits.ts`. Индексация `DIGITS.slice(0, base)` даёт допустимые цифры для базы без отдельной таблицы.
- **`memoize` (кэш).** `Map<string, R>` в замыкании. Ключ — `JSON.stringify(args)`. Работает для функций с примитивными аргументами; для объектов сгодился бы `WeakMap`, но `countPossibleSecrets` принимает только числа.

## 2. Сложность (Big O)

| Функция                                | Сложность                | Обоснование                                                                                                                                                                                                                                                                                                                                                                                           |
| -------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generateSecret(length, base, random)` | **O(base)**              | Строится пул из `base` символов (`DIGITS.slice(0, base).split('')`), затем выполняется `length` шагов Фишера–Йетса (каждый — O(1) swap в новом массиве через spread). Внешний `reduce` идёт по `base`, `length ≤ base`, поэтому доминирует `base`. По правилам Big O учитываем размер входа, хотя на практике `base ≤ 16` — константа.                                                                |
| `evaluateGuess(secret, guess)`         | **O(n²)**                | `n = \|guess\| = \|secret\|`. Внешний `reduce` идёт по `n` символам; внутри для каждой позиции вызывается `secret.includes(char)`, что само по себе O(n). Итого O(n²). Так как `n ≤ 6` по правилам игры, на практике это константа, но по Big O — квадрат. Возможна оптимизация до O(n) через предварительный `Set(secret)` — сейчас не сделана ради читаемости и HOF-формы, которую требует задание. |
| `isValidGuess(guess, length, base)`    | **O(n)**                 | Проверка длины — O(1). `every(validator)` по `n` символам — O(n), каждая проверка O(1) через `DIGITS.slice(0, base).includes(char)`. Построение `new Set(chars)` для проверки уникальности — O(n). Доминирует O(n).                                                                                                                                                                                   |
| `countPossibleSecrets(length, base)`   | **O(1) амортизированно** | Первый вызов для пары `(length, base)` — O(length) уникальных подзадач (рекурсия убывает по обоим аргументам одновременно, поэтому дерево вырождается в цепочку длины `length`). Повторные вызовы — O(1) на lookup в `Map` после `memoize`.                                                                                                                                                           |

**Оценки на практике** (`base ≤ 16`, `length ≤ 6`): все четыре функции выполняются за микросекунды, узкое место — не алгоритмы, а DOM.

## 3. Принципы чистого кода

### 3.1. Single Responsibility (SRP)

Каждый модуль решает одну задачу:

- `src/logic/generateSecret.ts` — только генерация секрета;
- `src/logic/evaluateGuess.ts` — только сравнение;
- `src/logic/isValidGuess.ts` — только валидация;
- `src/logic/createDigitValidator.ts` — только проверка символа на принадлежность base;
- `src/logic/countPossibleSecrets.ts` — только подсчёт перестановок;
- `src/logic/gameState.ts` — только инициализация и переходы состояния;
- `src/logic/records.ts` — только работа с рекордами и `localStorage`;
- `src/ui/dom.ts` — только создание DOM-элементов;
- `src/ui/modal.ts` — только модальное окно с focus trap;
- `src/ui/main.ts` — оркестрация экранов.

UI не знает, как устроен `evaluateGuess`. Логика не знает про DOM.

### 3.2. Чистые функции без побочных эффектов

В `src/logic/*` нет обращений к `Math.random`, `Date.now` или DOM **внутри логики**. Все зависимости от внешнего мира переданы через параметры с дефолтом:

```ts
// src/logic/generateSecret.ts
export const generateSecret = (length, base, random = Math.random): string => ...
```

```ts
// src/logic/gameState.ts
export const createGameState = (length, base, random?, now = Date.now()): GameState => ...
export const applyGuess = (state, guess, now = Date.now()): GameState => ...
```

Это делает функции тестируемыми детерминированно (см. `tests/generateSecret.test.ts`, где `random` заменён на `sequence(...)`), но в продакшене они ведут себя «как обычно». Приём называется **parameter injection of side effects** (внедрение зависимостей через параметры).

### 3.3. Функции высшего порядка вместо ручных циклов

- `evaluateGuess` — `reduce` по символам `guess` (быки и коровы считаются двумя `reduce`-проходами).
- `isValidGuess` — `every(validator)` для проверки «все символы допустимы».
- `generateSecret` — `reduce` для шага перемешивания Фишера–Йетса (новый массив на каждом шаге — иммутабельно).
- `memoize` — обёртка над функцией, возвращает функцию (HOF в чистом виде).

### 3.4. Каррирование

```ts
// src/logic/createDigitValidator.ts
export const createDigitValidator =
  (base: number) =>
  (char: string): boolean =>
    DIGITS.slice(0, base).includes(char.toLowerCase());
```

`createDigitValidator(base)` возвращает предикат `(char) => boolean`. Это **каррированная фабрика** — функция возвращает функцию. Используется в двух местах, как того требует ТЗ:

1. `src/logic/isValidGuess.ts` — `const validator = createDigitValidator(base)` для проверки «все символы допустимы для базы».
2. `src/ui/main.ts` (внутри `renderGame`) — `const validator = createDigitValidator(current.base)` для фильтрации ввода в реальном времени в обработчике `input`.

Побочный плюс: нижний регистр — тоже тут (`char.toLowerCase()`), поэтому hex-цифры `A–F` принимаются наравне со строчными в обеих точках.

### 3.5. Мемоизация

`memoize` (`src/logic/memoize.ts`) — HOF, возвращающий функцию с `Map`-кэшем. Применён к `countPossibleSecrets`. Тест `tests/memoize.test.ts` явно проверяет через `vi.fn()`, что underlying-функция вызывается один раз на уникальные аргументы.

### 3.6. Иммутабельность

Везде, где обновляется состояние, создаётся **новый объект/массив**:

- `applyGuess` — `{ ...state, history: [...state.history, attempt] }`.
- `saveRecord` — `[...loadRecords(), entry].sort(...).slice(0, MAX_RECORDS)`.
- Все поля `GameState` и `Attempt` помечены `readonly` — TypeScript не даст случайную мутацию.

Тест `tests/gameState.test.ts` проверяет, что после `applyGuess` исходный `state.history` остался пустым.

### 3.7. Разделение уровней UI / логики

- `src/logic/*` — чистые функции, тестируются в `node`-окружении без браузера.
- `src/ui/dom.ts` — примитив `createElement(tag, props, children)`, никаких `innerHTML`/`insertAdjacentHTML` нигде.
- `src/ui/main.ts` — композиция экранов: `renderSettings`, `renderGame`, `renderWon`, `renderRecords`, `render`. Каждый возвращает HTMLElement, не мутируя глобальное состояние без нужды.
- `src/ui/modal.ts` — независимый примитив с параметрами `title/message/onConfirm/onCancel`, переиспользуемый для любых подтверждений.

### 3.8. Именование

- Функции — глаголы (`createGameState`, `applyGuess`, `isValidGuess`, `countPossibleSecrets`, `renderGame`, `openModal`).
- Доменные имена взяты из терминологии игры: `bulls`, `cows`, `secret`, `attempt`, `guess`, `attempts`.
- Переменные-сокращения (`n`, `i`, `m`, `s`) — только в локальных местах, где смысл очевиден из контекста (`formatTime`, индексы в циклах).

### 3.9. Маленькие функции

Каждая функция решает одну задачу:

- `formatTime(ms)` — форматирует `MM:SS` из миллисекунд.
- `pluralize(n, forms)` — русское склонение по числу (для `2 цифры` / `5 цифр`).
- `digitsLabel(n)` — готовая подпись `N цифр/цифры/цифра`.
- `normalizeConfig(c)` — приводит конфиг к инварианту `length ≤ base`, `length ≥ 2`.
- `showMessage(msg)` — обновляет `#message`, ничего больше.
- `startTimer`/`stopTimer` — изолируют `setInterval`/`clearInterval`.

### 3.10. Обработка краёв

- `generateSecret` бросает `Error`, если `length < 1`, `base < 2` или `length > base` — контракт «параметры должны быть осмысленными» проверяется на входе, а не в середине алгоритма.
- `loadRecords` / `saveRecord` в `src/logic/records.ts` обёрнуты в `try/catch` — приватный режим Safari или переполнение квоты `localStorage` не роняют UI.
- `applyGuess` возвращает **тот же** объект состояния на невалидную попытку или дубликат — это безопасно, потому что состояние `readonly`; вызывающий код может сравнить по ссылке (`next === state`) и понять, что ничего не изменилось.

### 3.11. Отсутствие `innerHTML`

Все элементы создаются через `createElement` из `src/ui/dom.ts`. Текст устанавливается через `textContent`. Это:

- исключает XSS;
- делает поток данных явным (`children: (Node | string)[]` в `createElement`);
- соответствует требованию ТЗ «никакого `innerHTML`/`insertAdjacentHTML`».

### 3.12. UX-мелочи как часть «чистоты»

- Автофокус на поле ввода при старте раунда и после каждой попытки (`src/ui/main.ts`, `requestAnimationFrame` в конце `renderGame`) — убирает лишний клик.
- Автопрокрутка истории к последней записи (`historyList.scrollTop = historyList.scrollHeight`) в том же `requestAnimationFrame` — не нужен ручной скролл.
- Модалка «Сдаться?» с фокусом на «Продолжить» (безопасная опция) и поддержкой `Escape`/клика по подложке — случайный Enter не сдаёт игру.
- `prefers-reduced-motion` в `styles.css` отключает анимации для пользователей, которые этого попросили.

## 4. TDD и тесты

Для каждой обязательной функции (`generateSecret`, `evaluateGuess`, `isValidGuess`, `createDigitValidator`, `countPossibleSecrets`) в истории коммитов есть пара `test(...) → feat(...)`: сначала коммит с падающими тестами, затем коммит с реализацией, который делает тесты зелёными.

Тесты соответствуют FIRST:

- **Fast** — весь набор `npm test` выполняется за секунды, никакой сети и таймеров.
- **Independent** — каждый тест создаёт свои фикстуры (`sequence(...)`, `fixedRandom`), не делит состояние с другими.
- **Repeatable** — детерминированные: `generateSecret` принимает `random` параметром, `applyGuess` — `now`; никакие тесты не зависят от `Math.random` или текущего времени.
- **Self-validating** — только `expect(...)`; ручной проверки не требуется.
- **Timely** — тесты написаны до реализации (см. порядок коммитов в PR).

Дополнительно покрыты `memoize`, `gameState`, `records` — не обязательны по ТЗ, но полезны: `memoize.test.ts` фиксирует кэширование через `vi.fn()`, `gameState.test.ts` — иммутабельность переходов, `records.test.ts` — сортировку и обрезку до 10 в `localStorage` (окружение `jsdom`).
