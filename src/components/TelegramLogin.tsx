import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginProps {
  onSuccess: (user: any, token: string) => void;
}

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void;
  }
}

const AUTH_URL = 'https://functions.poehali.dev/f2fc4d73-e289-4be7-81af-a21f1d42f9e6';

const TelegramLogin = ({ onSuccess }: TelegramLoginProps) => {
  const [loading, setLoading] = useState(false);
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  const handleTelegramAuth = async (user: TelegramUser) => {
    setLoading(true);
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify',
          auth_data: user
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Успешный вход!');
        onSuccess(data.user, data.token);
      } else {
        toast.error('Ошибка авторизации: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      toast.error('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.onTelegramAuth = handleTelegramAuth;

    if (widgetContainerRef.current) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', 'YOUR_BOT_USERNAME');
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      widgetContainerRef.current.appendChild(script);
    }

    return () => {
      delete window.onTelegramAuth;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-xl">
        <div className="text-center space-y-6">
          <div className="bg-primary/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
            <Icon name="Briefcase" size={40} className="text-primary" />
          </div>
          
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">WorkTrack</h1>
            <p className="text-slate-600">Система учета рабочего времени</p>
          </div>

          <div className="space-y-4 pt-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Icon name="MessageSquare" size={20} className="text-white" />
                </div>
                <span className="font-semibold text-slate-800">Вход через Telegram</span>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Войдите с помощью вашего аккаунта Telegram для быстрого и безопасного доступа
              </p>
              
              {loading ? (
                <div className="flex items-center justify-center py-3">
                  <Icon name="Loader2" className="animate-spin text-primary" size={24} />
                </div>
              ) : (
                <div className="flex justify-center">
                  <div ref={widgetContainerRef} id="telegram-login-widget"></div>
                </div>
              )}
            </div>

            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-start gap-3">
                <Icon name="Settings" size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-700 space-y-3">
                  <div>
                    <p className="font-bold text-amber-900 mb-2">⚙️ Быстрая настройка входа (3 минуты):</p>
                  </div>

                  <div className="bg-white p-3 rounded border border-amber-200">
                    <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <span className="bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                      Найдите username вашего бота
                    </p>
                    <ul className="ml-8 space-y-1 text-xs text-slate-600">
                      <li>• Откройте <strong>@BotFather</strong> в Telegram</li>
                      <li>• Отправьте команду: <code className="bg-slate-100 px-2 py-0.5 rounded text-blue-600 font-mono">/mybots</code></li>
                      <li>• Выберите вашего бота из списка</li>
                      <li>• Скопируйте username (например: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono">@mybot_name</code>)</li>
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded border border-amber-200">
                    <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <span className="bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                      Настройте домен для входа
                    </p>
                    <ul className="ml-8 space-y-1 text-xs text-slate-600">
                      <li>• В @BotFather отправьте: <code className="bg-slate-100 px-2 py-0.5 rounded text-blue-600 font-mono">/setdomain</code></li>
                      <li>• Выберите вашего бота</li>
                      <li>• Укажите домен: <code className="bg-slate-100 px-2 py-0.5 rounded text-green-600 font-mono">{window.location.hostname}</code></li>
                    </ul>
                  </div>

                  <div className="bg-white p-3 rounded border border-amber-200">
                    <p className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                      <span className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                      Обновите код (нужна помощь разработчика)
                    </p>
                    <div className="ml-8 space-y-2 text-xs">
                      <p className="text-slate-600">Откройте файл <code className="bg-slate-100 px-2 py-0.5 rounded font-mono">src/components/TelegramLogin.tsx</code></p>
                      <p className="text-slate-600">Найдите строку 67:</p>
                      <pre className="bg-slate-900 text-slate-200 p-2 rounded overflow-x-auto text-xs font-mono">
script.setAttribute('data-telegram-login', <span className="text-red-400">'YOUR_BOT_USERNAME'</span>);
                      </pre>
                      <p className="text-slate-600">Замените на:</p>
                      <pre className="bg-slate-900 text-green-400 p-2 rounded overflow-x-auto text-xs font-mono">
script.setAttribute('data-telegram-login', <span className="text-green-400">'mybot_name'</span>);
                      </pre>
                      <p className="text-amber-700 font-semibold mt-2">⚠️ Укажите username БЕЗ символа @</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500">
              <Icon name="Shield" size={14} />
              <span>Ваши данные защищены и не передаются третьим лицам</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TelegramLogin;