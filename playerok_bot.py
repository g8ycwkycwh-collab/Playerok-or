#!/usr/bin/env python3
"""
Playerok Telegram Bot
Работает на Render (Background Worker)
"""

import os
import urllib.request
import urllib.parse
import json
import time
import sys

TOKEN = os.getenv("BOT_TOKEN", "9243467033:AAFybcu29F00vMmF0jpQ68rLJxbmGpm5_kY")
API = f"https://api.telegram.org/bot{TOKEN}"

# Мини-приложение (замени на свою ссылку с Render Static Site)
MINIAPP_URL = os.getenv("MINIAPP_URL", "https://g8ycwkycwh-collab.github.io/Playerok-or/")

# Уже загруженная картинка (file_id) — отправляется мгновенно
PHOTO_FILE_ID = "AgACAgQAAxkDAAMSauUkHp67jTPY8lJDBB3ObmCgek4AAh6wMRvV3B1S305cywd_jfsBAAMCAAN3AAM9BA"

START_CAPTION = """🎮 <b>Добро пожаловать в Playerok!</b>

Здесь ты можешь:
• Создавать и находить сделки
• Пополнять баланс (₽, $, Stars, TON)
• Следить за статусом сделок
• Общаться с менеджерами

Всё прямо внутри Telegram — быстро и удобно.

Нажми кнопку ниже, чтобы открыть приложение 👇"""

HELP_TEXT = """📖 <b>Подробный гайд по Playerok</b>

<b>1. Главная страница</b>
• Видишь свой профиль, аватар и ник
• Баланс в рублях, долларах, звёздах и TON
• Статистика: количество сделок, успешных и рейтинг

<b>2. Пополнение баланса</b>
• Нажми кнопку «Пополнить»
• Укажи сумму
• Напиши менеджеру @playerok012 и передай оплату / подарок

<b>3. Вывод средств</b>
• Нажми «Вывести»
• Укажи сумму и реквизиты (карта / TON / Stars)
• Менеджер обработает заявку

<b>4. Сделки</b>
• Во вкладке «Сделки» можно искать и открывать активные сделки
• Используй поиск по коду, игре, нику или описанию
• Создать новую сделку можно через соответствующую кнопку

<b>5. Чаты</b>
• Здесь будут переписки по сделкам
• Можно быстро связаться с менеджером

<b>6. Профиль</b>
• Вся информация о тебе
• История и статистика

━━━━━━━━━━━━━━━━
❓ <b>Нужна помощь?</b>
Пиши менеджеру: @playerok012

Команды бота:
/start — Главное меню
/help — Этот гайд"""

def api_call(method, data=None):
    url = f"{API}/{method}"
    if data:
        data = json.dumps(data).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    else:
        req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode())

def send_message(chat_id, text, reply_markup=None):
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML",
        "disable_web_page_preview": True
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return api_call("sendMessage", payload)

def send_photo(chat_id, photo, caption, reply_markup=None):
    payload = {
        "chat_id": chat_id,
        "photo": photo,
        "caption": caption,
        "parse_mode": "HTML"
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup
    return api_call("sendPhoto", payload)

def get_updates(offset=None):
    params = {"timeout": 25}
    if offset:
        params["offset"] = offset
    query = urllib.parse.urlencode(params)
    url = f"{API}/getUpdates?{query}"
    with urllib.request.urlopen(url, timeout=35) as resp:
        return json.loads(resp.read().decode())

def main():
    print("Бот Playerok запущен на Render...")
    sys.stdout.flush()

    try:
        api_call("getUpdates", {"offset": -1})
    except Exception:
        pass

    offset = None
    while True:
        try:
            updates = get_updates(offset)
            if not updates.get("ok"):
                time.sleep(2)
                continue

            for update in updates.get("result", []):
                offset = update["update_id"] + 1

                message = update.get("message")
                if message:
                    chat_id = message["chat"]["id"]
                    text = (message.get("text") or "").strip()

                    if text.startswith("/start"):
                        keyboard = {
                            "inline_keyboard": [
                                [{"text": "🚀 Открыть Playerok", "web_app": {"url": MINIAPP_URL}}],
                                [{"text": "💬 Написать менеджеру", "url": "https://t.me/playerok012"}],
                                [{"text": "📖 Как пользоваться", "callback_data": "help"}]
                            ]
                        }
                        send_photo(chat_id, PHOTO_FILE_ID, START_CAPTION, keyboard)
                        print(f"[/start] {chat_id}", flush=True)

                    elif text.startswith("/help"):
                        send_message(chat_id, HELP_TEXT)
                        print(f"[/help] {chat_id}", flush=True)

                    elif text:
                        send_message(chat_id, "Напиши /start или /help")

                callback = update.get("callback_query")
                if callback:
                    chat_id = callback["message"]["chat"]["id"]
                    data = callback.get("data")
                    if data == "help":
                        send_message(chat_id, HELP_TEXT)
                    try:
                        api_call("answerCallbackQuery", {"callback_query_id": callback["id"]})
                    except Exception:
                        pass
                    print(f"[callback] {data}", flush=True)

        except KeyboardInterrupt:
            print("\nБот остановлен.")
            sys.exit(0)
        except Exception as e:
            print("Ошибка:", e, flush=True)
            time.sleep(3)

if __name__ == "__main__":
    main()
