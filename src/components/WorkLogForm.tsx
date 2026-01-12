import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface WorkLogFormProps {
  userId: number;
  onSuccess?: () => void;
}

const WORK_LOGS_URL = 'https://functions.poehali.dev/9219da71-3cf5-4388-8de8-e3bf01b01ccf';

const WorkLogForm = ({ userId, onSuccess }: WorkLogFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    work_date: new Date().toISOString().split('T')[0],
    work_hours: '',
    stack_number: '',
    repair_hours: '',
    idle_days: '0',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.work_hours) {
      toast.error('Укажите количество часов работы');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(WORK_LOGS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_log',
          user_id: userId,
          work_date: formData.work_date,
          work_hours: parseFloat(formData.work_hours),
          stack_number: formData.stack_number,
          repair_hours: parseFloat(formData.repair_hours || '0'),
          idle_days: parseInt(formData.idle_days || '0'),
          notes: formData.notes
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Отчёт сохранён!');
        setFormData({
          work_date: new Date().toISOString().split('T')[0],
          work_hours: '',
          stack_number: '',
          repair_hours: '',
          idle_days: '0',
          notes: ''
        });
        onSuccess?.();
      } else {
        toast.error('Ошибка сохранения: ' + (data.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      toast.error('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-white shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-primary p-2 rounded-lg">
          <Icon name="FileEdit" size={24} className="text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-800">Ежедневный отчёт</h3>
          <p className="text-sm text-slate-600">Заполните данные по работе за день</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Дата работы</Label>
            <Input
              type="date"
              value={formData.work_date}
              onChange={(e) => setFormData({ ...formData, work_date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <Label>Часов работы <span className="text-red-500">*</span></Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              max="24"
              placeholder="8"
              value={formData.work_hours}
              onChange={(e) => setFormData({ ...formData, work_hours: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>Номер штабеля</Label>
            <Input
              type="text"
              placeholder="Штабель №..."
              value={formData.stack_number}
              onChange={(e) => setFormData({ ...formData, stack_number: e.target.value })}
            />
          </div>

          <div>
            <Label>Часов ремонта</Label>
            <Input
              type="number"
              step="0.5"
              min="0"
              max="24"
              placeholder="0"
              value={formData.repair_hours}
              onChange={(e) => setFormData({ ...formData, repair_hours: e.target.value })}
            />
          </div>

          <div>
            <Label>Дни простоя</Label>
            <Input
              type="number"
              min="0"
              placeholder="0"
              value={formData.idle_days}
              onChange={(e) => setFormData({ ...formData, idle_days: e.target.value })}
            />
          </div>
        </div>

        <div>
          <Label>Примечания</Label>
          <Textarea
            placeholder="Дополнительная информация..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Icon name="Loader2" className="animate-spin mr-2" size={18} />
              Сохранение...
            </>
          ) : (
            <>
              <Icon name="Save" size={18} className="mr-2" />
              Сохранить отчёт
            </>
          )}
        </Button>
      </form>
    </Card>
  );
};

export default WorkLogForm;
