import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface UserStatistics {
  user_id: number;
  first_name: string;
  last_name: string;
  username: string;
  total_work_hours: number;
  total_repair_hours: number;
  total_idle_days: number;
  days_worked: number;
  stack_numbers: string[] | null;
}

interface Period {
  start_date: string;
  end_date: string;
}

const WORK_LOGS_URL = 'https://functions.poehali.dev/9219da71-3cf5-4388-8de8-e3bf01b01ccf';

const StatisticsTable = () => {
  const [statistics, setStatistics] = useState<UserStatistics[]>([]);
  const [period, setPeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const response = await fetch(WORK_LOGS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_current_statistics' })
      });

      const data = await response.json();

      if (response.ok) {
        setStatistics(data.statistics || []);
        setPeriod(data.period);
      } else {
        toast.error('Ошибка загрузки статистики');
      }
    } catch (error) {
      toast.error('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Icon name="Loader2" className="animate-spin mx-auto text-primary mb-4" size={48} />
        <p className="text-slate-600">Загрузка статистики...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {period && (
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Текущий период</h3>
              <p className="text-slate-600">
                {formatDate(period.start_date)} — {formatDate(period.end_date)}
              </p>
            </div>
            <div className="bg-primary/20 p-3 rounded-lg">
              <Icon name="Calendar" size={32} className="text-primary" />
            </div>
          </div>
        </Card>
      )}

      <Card className="bg-white shadow-sm">
        <div className="p-6 border-b">
          <h3 className="text-xl font-semibold text-slate-800">Статистика по водителям</h3>
        </div>

        {statistics.length === 0 ? (
          <div className="p-12 text-center">
            <Icon name="Users" size={64} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600 text-lg mb-2">Нет данных за текущий период</p>
            <p className="text-slate-500 text-sm">Водители ещё не заполнили отчёты</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-slate-700">Водитель</th>
                  <th className="text-center p-4 font-semibold text-slate-700">Часов работы</th>
                  <th className="text-center p-4 font-semibold text-slate-700">Часов ремонта</th>
                  <th className="text-center p-4 font-semibold text-slate-700">Дней простоя</th>
                  <th className="text-center p-4 font-semibold text-slate-700">Дней на работе</th>
                  <th className="text-left p-4 font-semibold text-slate-700">Штабеля</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {statistics.map((stat) => (
                  <tr key={stat.user_id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {stat.first_name} {stat.last_name}
                        </p>
                        {stat.username && (
                          <p className="text-sm text-slate-500">@{stat.username}</p>
                        )}
                      </div>
                    </td>
                    <td className="text-center p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Icon name="Clock" size={16} className="text-blue-600" />
                        <span className="font-bold text-slate-800">{stat.total_work_hours.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="text-center p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Icon name="Wrench" size={16} className="text-orange-600" />
                        <span className="font-medium text-slate-700">{stat.total_repair_hours.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="text-center p-4">
                      <Badge variant={stat.total_idle_days > 0 ? "destructive" : "secondary"}>
                        {stat.total_idle_days}
                      </Badge>
                    </td>
                    <td className="text-center p-4">
                      <Badge variant="default" className="bg-green-600">
                        {stat.days_worked}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {stat.stack_numbers && stat.stack_numbers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {stat.stack_numbers.map((stack, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {stack}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StatisticsTable;
