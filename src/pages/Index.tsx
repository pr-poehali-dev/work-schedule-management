import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import WorkLogForm from '@/components/WorkLogForm';
import StatisticsTable from '@/components/StatisticsTable';
import StatisticsHistory from '@/components/StatisticsHistory';
import AdminPanel from '@/components/AdminPanel';

interface IndexProps {
  user: any;
  onLogout: () => void;
}

const Index = ({ user, onLogout }: IndexProps) => {
  const [activeTab, setActiveTab] = useState('work-log');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground p-6 shadow-xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary p-2 rounded-lg">
                <Icon name="Truck" className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold">Вывозка леса</h1>
                <p className="text-xs text-muted-foreground">Камазы</p>
              </div>
            </div>
          </div>

          <nav className="space-y-2">
            <Button
              variant={activeTab === 'work-log' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('work-log')}
            >
              <Icon name="FileEdit" size={18} className="mr-2" />
              Ежедневный отчёт
            </Button>
            <Button
              variant={activeTab === 'statistics' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('statistics')}
            >
              <Icon name="BarChart3" size={18} className="mr-2" />
              Текущая статистика
            </Button>
            <Button
              variant={activeTab === 'history' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('history')}
            >
              <Icon name="History" size={18} className="mr-2" />
              История периодов
            </Button>
            {user?.role === 'admin' && (
              <Button
                variant={activeTab === 'admin' ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('admin')}
              >
                <Icon name="Shield" size={18} className="mr-2" />
                Управление
              </Button>
            )}
          </nav>

          <div className="mt-auto pt-8 space-y-3">
            <Card className="bg-primary/10 border-primary/20 p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-white">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm flex-1">
                  <p className="font-semibold">{user?.first_name} {user?.last_name}</p>
                  {user?.username && (
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  )}
                  {user?.role === 'admin' && (
                    <Badge variant="default" className="bg-purple-600 text-white mt-1">
                      <Icon name="Crown" size={10} className="mr-1" />
                      Админ
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={onLogout}
            >
              <Icon name="LogOut" size={16} className="mr-2" />
              Выйти
            </Button>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'work-log' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Ежедневный отчёт</h2>
                  <p className="text-slate-600">Заполните данные по работе за день</p>
                </div>

                <WorkLogForm userId={user?.id} onSuccess={handleLogSuccess} />

                <Card className="p-6 bg-blue-50 border-blue-200">
                  <div className="flex items-start gap-3">
                    <Icon name="Info" size={20} className="text-blue-600 mt-0.5" />
                    <div className="text-sm text-slate-700">
                      <p className="font-semibold mb-2">Важная информация:</p>
                      <ul className="list-disc list-inside space-y-1 text-slate-600">
                        <li>Заполняйте отчёт каждый рабочий день</li>
                        <li>Указывайте точное количество отработанных часов</li>
                        <li>Обязательно указывайте номер штабеля, с которого производилась вывозка</li>
                        <li>Если был ремонт или простой — укажите это в соответствующих полях</li>
                        <li>Все данные видны администратору и другим водителям</li>
                        <li>Каждые 15 дней статистика архивируется автоматически</li>
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'statistics' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Текущая статистика</h2>
                  <p className="text-slate-600">Показатели всех водителей за текущий период</p>
                </div>

                <StatisticsTable key={refreshKey} />
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">История периодов</h2>
                  <p className="text-slate-600">Архив статистики за прошлые 15-дневные периоды</p>
                </div>

                <StatisticsHistory />
              </div>
            )}

            {activeTab === 'admin' && user?.role === 'admin' && (
              <AdminPanel />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
