import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  id: number;
  telegram_id: number;
  first_name: string;
  last_name: string;
  username: string;
  role: 'admin' | 'worker';
  created_at: string;
  last_login: string;
}

const AUTH_URL = 'https://functions.poehali.dev/f2fc4d73-e289-4be7-81af-a21f1d42f9e6';

const AdminPanel = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_users' })
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast.error('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: number, newRole: 'admin' | 'worker') => {
    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_role',
          user_id: userId,
          role: newRole
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Роль обновлена');
        fetchUsers();
      } else {
        toast.error('Ошибка обновления роли');
      }
    } catch (error) {
      toast.error('Ошибка подключения');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon name="Loader2" className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Управление пользователями</h2>
        <p className="text-slate-600">Управление ролями и правами доступа</p>
      </div>

      <div className="grid gap-4">
        {users.length === 0 ? (
          <Card className="p-8 text-center">
            <Icon name="Users" size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">Нет зарегистрированных пользователей</p>
          </Card>
        ) : (
          users.map((user) => (
            <Card key={user.id} className="p-6 bg-white shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Icon name="User" size={24} className="text-primary" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-slate-800">
                        {user.first_name} {user.last_name}
                      </h3>
                      {user.role === 'admin' ? (
                        <Badge variant="default" className="bg-purple-600">
                          <Icon name="Crown" size={12} className="mr-1" />
                          Администратор
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Icon name="Briefcase" size={12} className="mr-1" />
                          Сотрудник
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      {user.username && (
                        <div className="flex items-center gap-1">
                          <Icon name="AtSign" size={14} />
                          <span>@{user.username}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Icon name="Calendar" size={14} />
                        <span>Регистрация: {user.created_at}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Icon name="Clock" size={14} />
                        <span>Последний вход: {user.last_login}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Select
                    value={user.role}
                    onValueChange={(value: 'admin' | 'worker') => updateUserRole(user.id, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="worker">
                        <div className="flex items-center gap-2">
                          <Icon name="Briefcase" size={14} />
                          Сотрудник
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Icon name="Crown" size={14} />
                          Администратор
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={20} className="text-blue-600 mt-0.5" />
          <div className="text-sm text-slate-700">
            <p className="font-semibold mb-1">Права доступа:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li><strong>Администратор:</strong> полный доступ к системе, управление пользователями, просмотр всей статистики</li>
              <li><strong>Сотрудник:</strong> отметка рабочего времени, чат, создание запросов, просмотр своей статистики</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminPanel;
