# Mecenate

React Native (Expo) клиент для платформы Mecenate — лента публикаций с детальным просмотром, лайками, комментариями и real-time обновлениями через WebSocket.

## Требования

- Node.js >= 18
- Expo CLI (`npx expo`)
- [Expo Go](https://expo.dev/go) на телефоне (iOS / Android)

## Быстрый старт

```bash
# 1. Установить зависимости
npm install

# 2. Скопировать переменные окружения и заполнить их
cp .env.example .env

# 3. Запустить dev-сервер
npx expo start
```

## Переменные окружения

Все секреты и URL-адреса инфраструктуры передаются через `.env`. В коде нет
fallback-значений — приложение упадёт со внятной ошибкой, если переменная не
задана.

| Переменная | Описание |
|---|---|
| `EXPO_PUBLIC_API_URL` | Базовый URL REST API (без trailing slash) |
| `EXPO_PUBLIC_WS_URL` | URL WebSocket-сервера |

> Expo автоматически подхватывает переменные с префиксом `EXPO_PUBLIC_`.
> После изменения `.env` нужно перезапустить dev-сервер.

## Авторизация

Регистрация/логин не требуются. При запуске генерируется случайный UUID,
который используется как Bearer-токен для всех HTTP-запросов и WebSocket-
соединения.

## Стек

| Слой | Технология |
|---|---|
| Платформа | React Native + Expo (iOS, Android) |
| Язык | TypeScript (strict, без `any`) |
| Навигация | Expo Router (file-based) |
| Server state | **TanStack Query (React Query) v5** — кеш, дедупликация, infinite queries, optimistic mutations |
| Client state | **MobX 6 + mobx-react-lite** — RootStore (session / ui / realtimeStatus) |
| HTTP-транспорт | Axios + interceptors (auth, error mapping) |
| Real-time | WebSocket → запись в кеш React Query, с polling-fallback через MobX |
| Анимации | React Native Reanimated |
| Тактильный отклик | expo-haptics |
| Стилизация | Дизайн-токены (`src/shared/theme/tokens.ts`) |

## Архитектура

Slice-структура (FSD-подобная):

```
src/
  shared/
    api/           # ApiClient, типы, queryKeys
    config.ts      # Чтение env с проверкой обязательных переменных
    lib/           # queryClient, helpers (getErrorMessage)
    stores/        # MobX RootStore: SessionStore, UiStore, RealtimeStatusStore
    theme/         # tokens.ts (colors, spacing, radii, typography, sizes, shadows)
  entities/
    post/          # PostCard
    comment/       # CommentItem, CommentInput
  features/
    like-post/     # LikeButton + useToggleLike (оптимистичное обновление)
    add-comment/   # useAddComment
    realtime/      # RealtimeService + useRealtime (синк WS → React Query кеш)
  widgets/
    feed/          # TierTabs + usePosts (useInfiniteQuery)
    post-detail/   # usePost + useComments
  init/
    providers/     # AppProviders (StoresProvider → QueryClientProvider → RealtimeBridge)

app/                # Expo Router
  _layout.tsx
  index.tsx         # Лента
  post/[id].tsx     # Детальная публикация
```

### Поток данных

```
Axios ApiClient
   │
   ├── usePosts(tier)               → useInfiniteQuery
   ├── usePost(id)                  → useQuery
   ├── useComments(postId)          → useInfiniteQuery
   ├── useToggleLike(postId)        → useMutation + optimistic cache patch
   └── useAddComment(postId)        → useMutation + cache prepend

RealtimeService (WS)
   │
   └── useRealtime() — пишет в queryClient.setQueryData
         ├── like_updated  → апдейт detail и каждой ленты
         └── comment_added → prepend в comments + bump commentsCount
```

### Разделение ответственности: MobX vs React Query

Каждое состояние имеет ровно одного владельца — это правило, по которому
проще всего отвечать на вопрос «куда положить?».

| Что | Где живёт | Почему |
|---|---|---|
| Список постов, детальный пост, комментарии | React Query кеш | server state: TTL, дедупликация, infinite scroll, optimistic-апдейты |
| Session token (Bearer для HTTP и WS) | `SessionStore` (MobX) | переживает экраны; HTTP и WS читают его лениво через `getToken()` |
| Выбранный таб ленты (`tier`) | `UiStore` (MobX) | ephemeral, но должно переживать unmount экрана и шариться между виджетами |
| Статус WS-соединения, число неудачных reconnect'ов, режим fallback | `RealtimeStatusStore` (MobX) | реактивный флаг для UI-бейджа и для решения «опрашивать ли REST» |
| Текст в поле комментария, локальные toggle'ы | `useState` экрана | нужно только этому экрану |

`RootStore` собирает три стора и предоставляется через `StoresProvider`,
который смонтирован **выше** `QueryClientProvider`: `ApiClient` должен
получить функцию `SessionStore.getToken` до того, как стартанёт первый запрос.

### Точки интеграции MobX ↔ transport / React Query

```
1. SessionStore.getToken() ─▶  ApiClient / RealtimeService
                               (HTTP Authorization, WS ?token=…)

2. UiStore.tier         ─────▶  usePosts(ui.tier)
                                (ключ кеша React Query)

3. RealtimeStatusStore  ─────▶  refetchInterval в usePosts/useComments/usePost
                                (polling-fallback, когда WS лежит)
```

`SessionStore` остаётся единственным владельцем строки токена. Транспорт
хранит только функцию-геттер, поэтому после `rotate()` новые HTTP-запросы
и новые WS-подключения автоматически используют актуальное значение.

Сторы экспортируют только то, что нужно потребителям — никто из
React Query кода не читает MobX напрямую, и наоборот: WS-сервис не
дёргает `queryClient`, он лишь докладывает статус в стор, а уже
`useRealtime` маршрутизирует события в кеш.

### Polling fallback

`RealtimeService` остаётся «тупым» — это просто WebSocket с
auto-reconnect. Решение «когда переключаться на polling» инкапсулировано
в `RealtimeStatusStore`:

```
WS ok                                     fallback / polling
─────────────────────────────────────────────────────────────
status:    connected / connecting     →   reconnecting → fallback
порог:     3 подряд неудачных reconnect'а
WS retry:  3 секунды                  →   30 секунд (не спамим мёртвый хост)
RQ poll:   выключен (refetchInterval=false) → 15 секунд
UI бейдж:  «live»                     →   «offline» (по `isLive` getter'у)
```

`useRealtime` слушает callback'и сервиса (`connecting` / `connected` /
`disconnected`) и пробрасывает их в `realtimeStatus.markX()`. Сервис в
свою очередь спрашивает у стора следующий `reconnectDelayMs`. Когда
WS снова открывается — `markConnected()` сбрасывает счётчик и переводит
в `connected`, observer-экраны получают `pollingIntervalMs === false`,
и React Query сам гасит интервал.

## Скрипты

| Команда | Описание |
|---|---|
| `npm start` | Запуск Expo dev-сервера |
| `npm run ios` | Запуск на iOS-симуляторе |
| `npm run android` | Запуск на Android-эмуляторе |
| `npm run web` | Запуск в браузере |
| `npm run typecheck` | `tsc --noEmit` |
