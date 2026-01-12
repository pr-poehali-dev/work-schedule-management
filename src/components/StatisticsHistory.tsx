import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Period {
  period_id: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  formatted_start: string;
  formatted_end: string;
}

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

const WORK_LOGS_URL = 'https://functions.poehali.dev/9219da71-3cf5-4388-8de8-e3bf01b01ccf';

const StatisticsHistory = () => {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [periodStats, setPeriodStats] = useState<UserStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(WORK_LOGS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_history' })
      });

      const data = await response.json();

      if (response.ok) {
        setPeriods(data);
      } else {
        toast.error('Ошибка загрузки истории');
      }
    } catch (error) {
      toast.error('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const fetchPeriodStatistics = async (periodId: number) => {
    try {
      const response = await fetch(WORK_LOGS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_period_statistics', period_id: periodId })
      });

      const data = await response.json();

      if (response.ok) {
        setPeriodStats(data.statistics || []);
      } else {
        toast.error('Ошибка загрузки статистики периода');
      }
    } catch (error) {
      toast.error('Ошибка подключения к серверу');
    }
  };

  const handleViewPeriod = async (period: Period) => {
    setSelectedPeriod(period);
    setDialogOpen(true);
    await fetchPeriodStatistics(period.period_id);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <Card className="p-8 text-center">
        <Icon name="Loader2" className="animate-spin mx-auto text-primary mb-4" size={48} />
        <p className="text-slate-600">Загрузка истории...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-primary p-2 rounded-lg">
            <Icon name="History" size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-slate-800">История периодов</h3>
            <p className="text-sm text-slate-600">Статистика по прошлым 15-дневным периодам</p>
          </div>
        </div>

        {periods.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Calendar" size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-600">Нет сохранённых периодов</p>
          </div>
        ) : (
          <div className="space-y-3">
            {periods.map((period) => (
              <Card
                key={period.period_id}
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewPeriod(period)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-100 p-3 rounded-lg">
                      <Icon name="CalendarDays" size={24} className="text-slate-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">
                        {period.formatted_start} — {period.formatted_end}
                      </p>
                      <p className="text-sm text-slate-500">15-дневный период</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {period.is_current && (
                      <Badge variant="default" className="bg-green-600">
                        <Icon name="Star" size={12} className="mr-1" />
                        Текущий
                      </Badge>
                    )}
                    <Button variant="outline" size="sm">
                      <Icon name="Eye" size={16} className="mr-2" />
                      Просмотр
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Статистика за период
              {selectedPeriod && (
                <span className="block text-sm font-normal text-slate-600 mt-1">
                  {selectedPeriod.formatted_start} — {selectedPeriod.formatted_end}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            {periodStats.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="Users" size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-600">Нет данных за этот период</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-semibold text-slate-700">Водитель</th>
                      <th className="text-center p-3 font-semibold text-slate-700">Часов</th>
                      <th className="text-center p-3 font-semibold text-slate-700">Ремонт</th>
                      <th className="text-center p-3 font-semibold text-slate-700">Простой</th>
                      <th className="text-center p-3 font-semibold text-slate-700">Дней</th>
                      <th className="text-left p-3 font-semibold text-slate-700">Штабеля</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {periodStats.map((stat) => (
                      <tr key={stat.user_id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-slate-800">
                              {stat.first_name} {stat.last_name}
                            </p>
                            {stat.username && (
                              <p className="text-xs text-slate-500">@{stat.username}</p>
                            )}
                          </div>
                        </td>
                        <td className="text-center p-3">
                          <span className="font-bold text-slate-800">{stat.total_work_hours.toFixed(1)}</span>
                        </td>
                        <td className="text-center p-3">
                          <span className="text-slate-700">{stat.total_repair_hours.toFixed(1)}</span>
                        </td>
                        <td className="text-center p-3">
                          <Badge variant={stat.total_idle_days > 0 ? "destructive" : "secondary"} className="text-xs">
                            {stat.total_idle_days}
                          </Badge>
                        </td>
                        <td className="text-center p-3">
                          <Badge variant="default" className="bg-green-600 text-xs">
                            {stat.days_worked}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {stat.stack_numbers && stat.stack_numbers.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {stat.stack_numbers.map((stack, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {stack}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StatisticsHistory;
