import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface WorkerStat {
  worker_name: string;
  forest_hours: number;
  repair_hours: number;
  downtime_hours: number;
  total_hours: number;
}

const API_URL = 'https://functions.poehali.dev/68106d06-fbe6-4d51-b6ff-19fd0bf2db72';

const WorkerStats = () => {
  const [stats, setStats] = useState<WorkerStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}?action=worker_stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast.error('Ошибка загрузки статистики');
    } finally {
      setLoading(false);
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
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Статистика по сотрудникам</h2>
        <p className="text-slate-600">Детализация рабочего времени каждого сотрудника</p>
      </div>

      <div className="grid gap-4">
        {stats.length === 0 ? (
          <Card className="p-8 text-center">
            <Icon name="UserX" size={48} className="mx-auto text-slate-400 mb-4" />
            <p className="text-slate-600">Нет данных о сотрудниках</p>
          </Card>
        ) : (
          stats.map((worker) => (
            <Card key={worker.worker_name} className="p-6 bg-white shadow-sm hover:shadow-md transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Icon name="User" size={24} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{worker.worker_name}</h3>
                      <p className="text-sm text-slate-600">Всего часов: {worker.total_hours}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-lg px-4 py-2">
                    {worker.total_hours} ч
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Truck" size={20} className="text-green-600" />
                      <span className="text-sm font-semibold text-green-800">Вывозка леса</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">{worker.forest_hours} ч</p>
                    <p className="text-xs text-green-600 mt-1">
                      {worker.total_hours > 0 
                        ? `${((worker.forest_hours / worker.total_hours) * 100).toFixed(1)}%` 
                        : '0%'
                      }
                    </p>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Wrench" size={20} className="text-blue-600" />
                      <span className="text-sm font-semibold text-blue-800">Ремонт</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700">{worker.repair_hours} ч</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {worker.total_hours > 0 
                        ? `${((worker.repair_hours / worker.total_hours) * 100).toFixed(1)}%` 
                        : '0%'
                      }
                    </p>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="PauseCircle" size={20} className="text-orange-600" />
                      <span className="text-sm font-semibold text-orange-800">Простой</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-700">{worker.downtime_hours} ч</p>
                    <p className="text-xs text-orange-600 mt-1">
                      {worker.total_hours > 0 
                        ? `${((worker.downtime_hours / worker.total_hours) * 100).toFixed(1)}%` 
                        : '0%'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkerStats;
