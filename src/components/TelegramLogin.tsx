import { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [botUsername, setBotUsername] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUsername = localStorage.getItem('telegram_bot_username');
    if (savedUsername) {
      setBotUsername(savedUsername);
      setIsConfigured(true);
    }
  }, []);

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

  const handleConfigureBot = () => {
    if (!botUsername.trim()) {
      toast.error('Введите username бота');
      return;
    }

    const cleanUsername = botUsername.trim().replace('@', '');
    localStorage.setItem('telegram_bot_username', cleanUsername);
    setBotUsername(cleanUsername);
    setIsConfigured(true);
    toast.success('Бот настроен! Теперь можно войти');
  };

  const handleResetBot = () => {
    localStorage.removeItem('telegram_bot_username');
    setBotUsername('');
    setIsConfigured(false);
    if (widgetContainerRef.current) {
      widgetContainerRef.current.innerHTML = '';
    }
  };

  useEffect(() => {
    window.onTelegramAuth = handleTelegramAuth;

    if (isConfigured && botUsername && widgetContainerRef.current) {
      widgetContainerRef.current.innerHTML = '';
      
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute('data-telegram-login', botUsername);
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.setAttribute('data-request-access', 'write');
      script.async = true;
      widgetContainerRef.current.appendChild(script);
    }

    return () => {
      delete window.onTelegramAuth;
    };
  }, [isConfigured, botUsername]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 bg-white shadow-xl">
        <div className="space-y-6">
          <div className="text-center">
            <div className="bg-primary/10 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <Icon name="Briefcase" size={40} className="text-primary" />
            </div>
            
            <div className="mt-4">
              <h1 className="text-3xl font-bold text-slate-800 mb-2">WorkTrack</h1>
              <p className="text-slate-600">Система учета рабочего времени</p>
            </div>
          </div>

          {!isConfigured ? (
            <div className="space-y-4">
              <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Icon name="Settings" size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Настройка Telegram-авторизации</h3>
                    <p className="text-sm text-slate-600">Введите username вашего бота для входа</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Username бота (без символа @)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">@</span>
                        <Input
                          type="text"
                          placeholder="mybot_name"
                          value={botUsername}
                          onChange={(e) => setBotUsername(e.target.value)}
                          className="pl-7"
                          onKeyPress={(e) => e.key === 'Enter' && handleConfigureBot()}
                        />
                      </div>
                      <Button onClick={handleConfigureBot} className="px-6">
                        <Icon name="Check" size={18} className="mr-2" />
                        Сохранить
                      </Button>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="w-full text-blue-600 hover:text-blue-700"
                  >
                    <Icon name={showInstructions ? "ChevronUp" : "ChevronDown"} size={16} className="mr-2" />
                    {showInstructions ? 'Скрыть' : 'Показать'} инструкцию по настройке
                  </Button>
                </div>
              </div>

              {showInstructions && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <Icon name="BookOpen" size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-slate-700 space-y-3 flex-1">
                      <div>
                        <p className="font-bold text-amber-900 mb-2">📋 Пошаговая инструкция:</p>
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
                          <li>• Скопируйте username (например: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono">mybot_name</code>)</li>
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
                          Введите username бота выше
                        </p>
                        <p className="ml-8 text-xs text-slate-600">
                          Вставьте скопированный username в поле выше (без символа @) и нажмите "Сохранить"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 p-2 rounded-lg">
                      <Icon name="CheckCircle2" size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Бот настроен</p>
                      <p className="text-sm text-slate-600">@{botUsername}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleResetBot}>
                    <Icon name="Settings" size={16} className="mr-2" />
                    Изменить
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Icon name="MessageSquare" size={20} className="text-white" />
                  </div>
                  <span className="font-semibold text-slate-800">Вход через Telegram</span>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Нажмите кнопку для входа через Telegram
                </p>
                
                {loading ? (
                  <div className="flex items-center justify-center py-3">
                    <Icon name="Loader2" className="animate-spin text-primary" size={24} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div ref={widgetContainerRef} id="telegram-login-widget"></div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-slate-500 mb-2">или тестовый вход</p>
                      <Button 
                        onClick={() => handleTelegramAuth({
                          id: Date.now(),
                          first_name: 'Тестовый',
                          last_name: 'Пользователь',
                          username: 'testuser',
                          photo_url: '',
                          auth_date: Math.floor(Date.now() / 1000),
                          hash: ''
                        })}
                        variant="outline"
                        className="w-full"
                      >
                        <Icon name="User" size={18} className="mr-2" />
                        Войти как тестовый пользователь
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Icon name="Shield" size={14} />
            <span>Ваши данные защищены и не передаются третьим лицам</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TelegramLogin;