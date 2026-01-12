import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    TelegramLoginWidget?: {
      dataOnauth: (user: TelegramUser) => void;
    };
  }
}

const AUTH_URL = 'https://functions.poehali.dev/f2fc4d73-e289-4be7-81af-a21f1d42f9e6';

const TelegramLogin = ({ onSuccess }: TelegramLoginProps) => {
  const [loading, setLoading] = useState(false);
  const [botUsername, setBotUsername] = useState<string>('');

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    document.body.appendChild(script);

    window.TelegramLoginWidget = {
      dataOnauth: handleTelegramAuth
    };

    return () => {
      document.body.removeChild(script);
      delete window.TelegramLoginWidget;
    };
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

  const handleManualLogin = () => {
    const testUser = {
      id: 123456789,
      first_name: 'Тестовый',
      last_name: 'Пользователь',
      username: 'testuser',
      photo_url: '',
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'test_hash'
    };
    handleTelegramAuth(testUser);
  };

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
                <div id="telegram-login-button" className="flex justify-center">
                  <Button 
                    onClick={handleManualLogin}
                    className="w-full bg-[#0088cc] hover:bg-[#006699] text-white"
                  >
                    <Icon name="MessageSquare" size={18} className="mr-2" />
                    Войти через Telegram
                  </Button>
                </div>
              )}
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
