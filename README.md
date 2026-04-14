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

# 2. Скопировать переменные окружения
cp .env.example .env

# 3. Запустить dev-сервер
npx expo start
```

После запуска появится QR-код в терминале.

### Expo Go

1. Установите **Expo Go** из [App Store](https://apps.apple.com/app/expo-go/id982107779) или [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Запустите `npx expo start`
3. Отсканируйте QR-код камерой (iOS) или из приложения Expo Go (Android)
4. Приложение откроется на устройстве

> Телефон и компьютер должны быть в одной Wi-Fi сети. Если есть проблемы — запустите с флагом `npx expo start --tunnel`.

## Переменные окружения

Файл `.env` (создаётся из `.env.example`):

| Переменная | Описание | Значение по умолчанию |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Базовый URL REST API | `https://k8s.mectest.ru/test-app` |
| `EXPO_PUBLIC_WS_URL` | URL WebSocket-сервера | `wss://k8s.mectest.ru/test-app/ws` |

Expo автоматически подхватывает переменные с префиксом `EXPO_PUBLIC_` — перезапуск dev-сервера после изменения `.env` обязателен.

## Авторизация

Регистрация/логин не требуются. При запуске генерируется случайный UUID, который используется как Bearer-токен для всех HTTP-запросов и WebSocket-соединения. Сервер принимает любой валидный UUID как `user_id`.

## Стек

| Слой | Технология |
|---|---|
| Платформа | React Native + Expo (iOS, Android) |
| Язык | TypeScript (strict) |
| Навигация | Expo Router (file-based) |
| State management | MobX (RootStore pattern) |
| HTTP | Axios (interceptors для auth и error handling) |
| Real-time | WebSocket (RealtimeService) |
| Анимации | React Native Reanimated 2 |
| Тактильный отклик | expo-haptics |
| Стилизация | Дизайн-токены (`src/theme/tokens.ts`) |

## Архитектура

```
src/
  config.ts                  # Env-переменные (API_URL, WS_URL)
  api/
    client.ts                # ApiClient — Axios instance + interceptors
    types.ts                 # TypeScript-типы API и WebSocket
  services/
    RealtimeService.ts       # WebSocket: connect / reconnect / event dispatch
  stores/
    RootStore.ts             # Корневой стор: создаёт ApiClient, сторы, RealtimeService
    FeedStore.ts             # Лента: загрузка, пагинация, фильтр по tier
    PostDetailStore.ts       # Детальный пост: загрузка, optimistic like
    CommentsStore.ts         # Комментарии: загрузка, пагинация, отправка
  context/
    StoreContext.tsx          # React Context + StoreProvider + useStore()
  components/
    PostCard.tsx              # Карточка поста в ленте
    TierTabs.tsx              # Таб-фильтр: Все / Бесплатные / Платные
    LikeButton.tsx            # Кнопка лайка с анимацией
    CommentItem.tsx           # Элемент комментария
    CommentInput.tsx          # Поле ввода комментария
  theme/
    tokens.ts                 # Дизайн-токены: цвета, отступы, типографика, тени

app/
  _layout.tsx                 # Root layout: GestureHandler, StoreProvider, Stack
  index.tsx                   # Экран ленты (Feed)
  post/[id].tsx               # Экран детальной публикации (Post Detail)
```

### Поток данных

```
ApiClient (Axios + interceptors)
    │
    ├── FeedStore.loadPosts()
    ├── PostDetailStore.load(id)
    └── CommentsStore.load(postId)

RealtimeService (WebSocket)
    │
    └── RootStore.bindRealtime()
          ├── like_updated  → FeedStore + PostDetailStore
          └── comment_added → CommentsStore + PostDetailStore
```

## Скрипты

| Команда | Описание |
|---|---|
| `npm start` | Запуск Expo dev-сервера |
| `npm run ios` | Запуск на iOS-симуляторе |
| `npm run android` | Запуск на Android-эмуляторе |
| `npm run web` | Запуск в браузере |

## API

- **Swagger/OpenAPI**: https://k8s.mectest.ru/test-app/openapi.json
- **Документация**: https://k8s.mectest.ru/test-app/docs
