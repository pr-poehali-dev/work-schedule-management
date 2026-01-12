import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

interface TimeEntry {
  id: string;
  worker: string;
  date: string;
  hours: number;
  location: string;
  status: 'pending' | 'approved';
}

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: string;
}

interface Request {
  id: string;
  worker: string;
  title: string;
  description: string;
  status: 'new' | 'processing' | 'completed';
  date: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    { id: '1', worker: 'Иван Петров', date: '2026-01-10', hours: 8, location: 'Офис А', status: 'approved' },
    { id: '2', worker: 'Мария Сидорова', date: '2026-01-10', hours: 7.5, location: 'Удаленно', status: 'approved' },
    { id: '3', worker: 'Алексей Иванов', date: '2026-01-11', hours: 8, location: 'Склад Б', status: 'pending' },
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', user: 'Иван Петров', message: 'Доброе утро! Кто сегодня на складе?', timestamp: '09:15' },
    { id: '2', user: 'Мария Сидорова', message: 'Я буду там после обеда', timestamp: '09:17' },
    { id: '3', user: 'Алексей Иванов', message: 'Я уже на месте', timestamp: '09:20' },
  ]);

  const [requests, setRequests] = useState<Request[]>([
    { id: '1', worker: 'Иван Петров', title: 'Нужны новые перчатки', description: 'Размер L, 5 пар', status: 'new', date: '2026-01-10' },
    { id: '2', worker: 'Мария Сидорова', title: 'Замена инструмента', description: 'Сломался сканер штрих-кодов', status: 'processing', date: '2026-01-09' },
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [newEntry, setNewEntry] = useState({ hours: '', location: '' });
  const [newRequest, setNewRequest] = useState({ title: '', description: '' });

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        user: 'Вы',
        message: newMessage,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages([...chatMessages, message]);
      setNewMessage('');
      toast.success('Сообщение отправлено');
    }
  };

  const handleAddTimeEntry = () => {
    if (newEntry.hours && newEntry.location) {
      const entry: TimeEntry = {
        id: Date.now().toString(),
        worker: 'Вы',
        date: new Date().toISOString().split('T')[0],
        hours: parseFloat(newEntry.hours),
        location: newEntry.location,
        status: 'pending',
      };
      setTimeEntries([...timeEntries, entry]);
      setNewEntry({ hours: '', location: '' });
      toast.success('Запись добавлена');
    }
  };

  const handleAddRequest = () => {
    if (newRequest.title && newRequest.description) {
      const request: Request = {
        id: Date.now().toString(),
        worker: 'Вы',
        title: newRequest.title,
        description: newRequest.description,
        status: 'new',
        date: new Date().toISOString().split('T')[0],
      };
      setRequests([...requests, request]);
      setNewRequest({ title: '', description: '' });
      toast.success('Запрос создан');
    }
  };

  const totalHours = timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const approvedHours = timeEntries.filter(e => e.status === 'approved').reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex">
        <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground p-6 shadow-xl">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary p-2 rounded-lg">
                <Icon name="Briefcase" className="text-white" size={24} />
              </div>
              <h1 className="text-xl font-bold">WorkTrack</h1>
            </div>
          </div>

          <nav className="space-y-2">
            <Button
              variant={activeTab === 'schedule' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('schedule')}
            >
              <Icon name="Calendar" size={18} className="mr-2" />
              График работы
            </Button>
            <Button
              variant={activeTab === 'chat' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('chat')}
            >
              <Icon name="MessageSquare" size={18} className="mr-2" />
              Чат
            </Button>
            <Button
              variant={activeTab === 'requests' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('requests')}
            >
              <Icon name="FileText" size={18} className="mr-2" />
              Запросы
            </Button>
            <Button
              variant={activeTab === 'stats' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('stats')}
            >
              <Icon name="BarChart3" size={18} className="mr-2" />
              Статистика
            </Button>
          </nav>

          <div className="mt-auto pt-8">
            <Card className="bg-primary/10 border-primary/20 p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-white">ИП</AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-semibold">Иван Петров</p>
                  <p className="text-xs text-muted-foreground">Сотрудник</p>
                </div>
              </div>
            </Card>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'schedule' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">График работы</h2>
                  <p className="text-slate-600">Отмечайте рабочие часы и местоположение</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Всего часов</p>
                        <p className="text-3xl font-bold text-slate-800">{totalHours}</p>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Icon name="Clock" size={24} className="text-blue-600" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Утверждено</p>
                        <p className="text-3xl font-bold text-green-600">{approvedHours}</p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-lg">
                        <Icon name="CheckCircle" size={24} className="text-green-600" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Сотрудников</p>
                        <p className="text-3xl font-bold text-slate-800">12</p>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-lg">
                        <Icon name="Users" size={24} className="text-purple-600" />
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-6 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-800">Добавить запись</h3>
                    <Icon name="Plus" size={20} className="text-slate-600" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Часы работы</Label>
                      <Input
                        type="number"
                        placeholder="8"
                        value={newEntry.hours}
                        onChange={(e) => setNewEntry({ ...newEntry, hours: e.target.value })}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Место работы</Label>
                      <Select value={newEntry.location} onValueChange={(value) => setNewEntry({ ...newEntry, location: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите место" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Офис А">Офис А</SelectItem>
                          <SelectItem value="Склад Б">Склад Б</SelectItem>
                          <SelectItem value="Удаленно">Удаленно</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddTimeEntry} className="w-full">
                        <Icon name="Plus" size={18} className="mr-2" />
                        Добавить
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="bg-white shadow-sm">
                  <div className="p-6 border-b">
                    <h3 className="text-xl font-semibold text-slate-800">Записи времени</h3>
                  </div>
                  <div className="divide-y">
                    {timeEntries.map((entry) => (
                      <div key={entry.id} className="p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarFallback className="bg-slate-200 text-slate-700">
                                {entry.worker.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-semibold text-slate-800">{entry.worker}</p>
                              <p className="text-sm text-slate-600">{entry.location}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-sm text-slate-600">Дата</p>
                              <p className="font-medium text-slate-800">{entry.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-600">Часов</p>
                              <p className="font-bold text-slate-800">{entry.hours}</p>
                            </div>
                            <Badge variant={entry.status === 'approved' ? 'default' : 'secondary'}>
                              {entry.status === 'approved' ? 'Утверждено' : 'Ожидает'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'chat' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Чат команды</h2>
                  <p className="text-slate-600">Общайтесь с коллегами в реальном времени</p>
                </div>

                <Card className="bg-white shadow-sm h-[600px] flex flex-col">
                  <div className="p-6 border-b">
                    <h3 className="text-xl font-semibold text-slate-800">Общий чат</h3>
                  </div>

                  <ScrollArea className="flex-1 p-6">
                    <div className="space-y-4">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className="flex gap-3 animate-fade-in">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-white text-xs">
                              {msg.user.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="font-semibold text-slate-800 text-sm">{msg.user}</span>
                              <span className="text-xs text-slate-500">{msg.timestamp}</span>
                            </div>
                            <div className="bg-slate-100 rounded-lg p-3">
                              <p className="text-slate-700">{msg.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="p-6 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Введите сообщение..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={handleSendMessage}>
                        <Icon name="Send" size={18} />
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {activeTab === 'requests' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">Запросы и потребности</h2>
                    <p className="text-slate-600">Создавайте запросы на материалы и услуги</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>
                        <Icon name="Plus" size={18} className="mr-2" />
                        Новый запрос
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Создать запрос</DialogTitle>
                        <DialogDescription>
                          Опишите что вам необходимо для работы
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Название</Label>
                          <Input
                            placeholder="Краткое описание"
                            value={newRequest.title}
                            onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Описание</Label>
                          <Textarea
                            placeholder="Подробное описание потребности"
                            value={newRequest.description}
                            onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                            rows={4}
                          />
                        </div>
                        <Button onClick={handleAddRequest} className="w-full">
                          Создать запрос
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="grid gap-4">
                  {requests.map((request) => (
                    <Card key={request.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-slate-800">{request.title}</h3>
                              <Badge
                                variant={
                                  request.status === 'new' ? 'default' :
                                  request.status === 'processing' ? 'secondary' : 'outline'
                                }
                              >
                                {request.status === 'new' ? 'Новый' :
                                 request.status === 'processing' ? 'В работе' : 'Выполнен'}
                              </Badge>
                            </div>
                            <p className="text-slate-600 mb-3">{request.description}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <div className="flex items-center gap-1">
                                <Icon name="User" size={14} />
                                <span>{request.worker}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Icon name="Calendar" size={14} />
                                <span>{request.date}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800 mb-2">Статистика и отчеты</h2>
                  <p className="text-slate-600">Анализ рабочих показателей</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6 bg-white shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Часы по локациям</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-700">Офис А</span>
                        <span className="font-bold text-slate-800">8 ч</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-700">Склад Б</span>
                        <span className="font-bold text-slate-800">8 ч</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="text-slate-700">Удаленно</span>
                        <span className="font-bold text-slate-800">7.5 ч</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-white shadow-sm">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Статус запросов</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <span className="text-slate-700">Новые</span>
                        <Badge variant="default">1</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                        <span className="text-slate-700">В работе</span>
                        <Badge variant="secondary">1</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <span className="text-slate-700">Выполнено</span>
                        <Badge variant="outline">0</Badge>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-white shadow-sm md:col-span-2">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-slate-800">Экспорт отчетов</h3>
                      <Icon name="Download" size={20} className="text-slate-600" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button variant="outline" className="h-20 flex-col gap-2">
                        <Icon name="FileText" size={24} />
                        <span>Экспорт в PDF</span>
                      </Button>
                      <Button variant="outline" className="h-20 flex-col gap-2">
                        <Icon name="Table" size={24} />
                        <span>Экспорт в Excel</span>
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
