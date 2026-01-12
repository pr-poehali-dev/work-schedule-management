import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta, date
from decimal import Decimal

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    '''API для учёта рабочих смен водителей и статистики вывозки леса'''
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', '')
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if action == 'add_log':
            user_id = body.get('user_id')
            work_date = body.get('work_date')
            work_hours = body.get('work_hours', 0)
            stack_number = body.get('stack_number', '')
            repair_hours = body.get('repair_hours', 0)
            idle_days = body.get('idle_days', 0)
            notes = body.get('notes', '')
            
            cur.execute('''
                INSERT INTO work_logs (user_id, work_date, work_hours, stack_number, repair_hours, idle_days, notes, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id, work_date)
                DO UPDATE SET
                    work_hours = EXCLUDED.work_hours,
                    stack_number = EXCLUDED.stack_number,
                    repair_hours = EXCLUDED.repair_hours,
                    idle_days = EXCLUDED.idle_days,
                    notes = EXCLUDED.notes,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id, work_date, work_hours, stack_number, repair_hours, idle_days
            ''', (user_id, work_date, work_hours, stack_number, repair_hours, idle_days, notes))
            
            log = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'log': dict(log)}, cls=CustomJSONEncoder),
                'isBase64Encoded': False
            }
        
        elif action == 'get_current_statistics':
            cur.execute('''
                SELECT 
                    u.id as user_id,
                    u.first_name,
                    u.last_name,
                    u.username,
                    COALESCE(SUM(wl.work_hours), 0) as total_work_hours,
                    COALESCE(SUM(wl.repair_hours), 0) as total_repair_hours,
                    COALESCE(SUM(wl.idle_days), 0) as total_idle_days,
                    COUNT(DISTINCT wl.work_date) as days_worked,
                    ARRAY_AGG(DISTINCT wl.stack_number ORDER BY wl.stack_number) FILTER (WHERE wl.stack_number IS NOT NULL AND wl.stack_number != '') as stack_numbers
                FROM users u
                LEFT JOIN work_logs wl ON u.id = wl.user_id
                    AND wl.work_date >= (SELECT start_date FROM statistics_periods WHERE is_current = TRUE LIMIT 1)
                    AND wl.work_date <= (SELECT end_date FROM statistics_periods WHERE is_current = TRUE LIMIT 1)
                WHERE u.role = 'worker'
                GROUP BY u.id, u.first_name, u.last_name, u.username
                ORDER BY total_work_hours DESC
            ''')
            
            stats = cur.fetchall()
            
            cur.execute('SELECT start_date, end_date FROM statistics_periods WHERE is_current = TRUE LIMIT 1')
            period = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'statistics': [dict(s) for s in stats],
                    'period': dict(period) if period else None
                }, cls=CustomJSONEncoder),
                'isBase64Encoded': False
            }
        
        elif action == 'get_user_logs':
            user_id = body.get('user_id')
            start_date = body.get('start_date')
            end_date = body.get('end_date')
            
            cur.execute('''
                SELECT 
                    id, work_date, work_hours, stack_number, 
                    repair_hours, idle_days, notes,
                    TO_CHAR(work_date, 'YYYY-MM-DD') as formatted_date
                FROM work_logs
                WHERE user_id = %s
                    AND work_date >= %s
                    AND work_date <= %s
                ORDER BY work_date DESC
            ''', (user_id, start_date, end_date))
            
            logs = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(log) for log in logs], cls=CustomJSONEncoder),
                'isBase64Encoded': False
            }
        
        elif action == 'get_history':
            cur.execute('''
                SELECT 
                    sp.id as period_id,
                    sp.start_date,
                    sp.end_date,
                    sp.is_current,
                    TO_CHAR(sp.start_date, 'DD.MM.YYYY') as formatted_start,
                    TO_CHAR(sp.end_date, 'DD.MM.YYYY') as formatted_end
                FROM statistics_periods sp
                ORDER BY sp.start_date DESC
            ''')
            
            periods = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(p) for p in periods], cls=CustomJSONEncoder),
                'isBase64Encoded': False
            }
        
        elif action == 'get_period_statistics':
            period_id = body.get('period_id')
            
            cur.execute('SELECT start_date, end_date FROM statistics_periods WHERE id = %s', (period_id,))
            period = cur.fetchone()
            
            if not period:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Period not found'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                SELECT 
                    u.id as user_id,
                    u.first_name,
                    u.last_name,
                    u.username,
                    COALESCE(SUM(wl.work_hours), 0) as total_work_hours,
                    COALESCE(SUM(wl.repair_hours), 0) as total_repair_hours,
                    COALESCE(SUM(wl.idle_days), 0) as total_idle_days,
                    COUNT(DISTINCT wl.work_date) as days_worked,
                    ARRAY_AGG(DISTINCT wl.stack_number ORDER BY wl.stack_number) FILTER (WHERE wl.stack_number IS NOT NULL AND wl.stack_number != '') as stack_numbers
                FROM users u
                LEFT JOIN work_logs wl ON u.id = wl.user_id
                    AND wl.work_date >= %s
                    AND wl.work_date <= %s
                WHERE u.role = 'worker'
                GROUP BY u.id, u.first_name, u.last_name, u.username
                ORDER BY total_work_hours DESC
            ''', (period['start_date'], period['end_date']))
            
            stats = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'statistics': [dict(s) for s in stats],
                    'period': dict(period)
                }, cls=CustomJSONEncoder),
                'isBase64Encoded': False
            }
        
        elif action == 'close_current_period':
            cur.execute('UPDATE statistics_periods SET is_current = FALSE WHERE is_current = TRUE')
            
            cur.execute('''
                INSERT INTO statistics_periods (start_date, end_date, is_current)
                VALUES (CURRENT_DATE, CURRENT_DATE + INTERVAL '15 days', TRUE)
                RETURNING id, start_date, end_date
            ''')
            
            new_period = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'new_period': dict(new_period)}, cls=CustomJSONEncoder),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid action'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()