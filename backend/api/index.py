import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, date

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    '''API для управления рабочими процессами: график работы, чат, запросы'''
    
    method = event.get('httpMethod', 'GET')
    path = event.get('requestContext', {}).get('http', {}).get('path', '')
    
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
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action', '')
        
        if method == 'GET':
            if action == 'time_entries':
                cur.execute('''
                    SELECT id, worker_name, date, hours, location, status, work_type,
                           TO_CHAR(created_at, 'YYYY-MM-DD') as created_at
                    FROM time_entries 
                    ORDER BY date DESC, created_at DESC
                    LIMIT 100
                ''')
                entries = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(e) for e in entries], default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'chat_messages':
                cur.execute('''
                    SELECT id, user_name, message, 
                           TO_CHAR(timestamp, 'HH24:MI') as timestamp,
                           TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
                    FROM chat_messages 
                    ORDER BY created_at ASC
                    LIMIT 100
                ''')
                messages = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(m) for m in messages], default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'requests':
                cur.execute('''
                    SELECT id, worker_name, title, description, status, date,
                           TO_CHAR(created_at, 'YYYY-MM-DD') as created_at
                    FROM requests 
                    ORDER BY created_at DESC
                    LIMIT 100
                ''')
                requests = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(r) for r in requests], default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'stats':
                cur.execute('SELECT COUNT(*) as total_hours FROM time_entries')
                total = cur.fetchone()
                
                cur.execute("SELECT COUNT(*) as approved FROM time_entries WHERE status = 'approved'")
                approved = cur.fetchone()
                
                cur.execute("SELECT location, SUM(hours) as hours FROM time_entries GROUP BY location")
                by_location = cur.fetchall()
                
                cur.execute("SELECT status, COUNT(*) as count FROM requests GROUP BY status")
                req_stats = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'total_hours': dict(total) if total else {},
                        'approved_hours': dict(approved) if approved else {},
                        'by_location': [dict(r) for r in by_location],
                        'requests_stats': [dict(r) for r in req_stats]
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'worker_stats':
                cur.execute('''
                    SELECT 
                        worker_name,
                        COALESCE(SUM(CASE WHEN work_type = 'вывозка леса' THEN hours ELSE 0 END), 0) as forest_hours,
                        COALESCE(SUM(CASE WHEN work_type = 'ремонт' THEN hours ELSE 0 END), 0) as repair_hours,
                        COALESCE(SUM(CASE WHEN work_type = 'простой' THEN hours ELSE 0 END), 0) as downtime_hours,
                        COALESCE(SUM(hours), 0) as total_hours
                    FROM time_entries
                    GROUP BY worker_name
                    ORDER BY worker_name
                ''')
                stats = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(s) for s in stats], default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', '')
            
            if action == 'add_time_entry':
                cur.execute('''
                    INSERT INTO time_entries (worker_name, date, hours, location, status, work_type)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                ''', (
                    body['worker_name'],
                    body['date'],
                    float(body['hours']),
                    body['location'],
                    body.get('status', 'pending'),
                    body.get('work_type', 'вывозка леса')
                ))
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'id': result['id']}),
                    'isBase64Encoded': False
                }
            
            elif action == 'add_chat_message':
                now = datetime.now()
                cur.execute('''
                    INSERT INTO chat_messages (user_name, message, timestamp)
                    VALUES (%s, %s, %s)
                    RETURNING id
                ''', (
                    body['user_name'],
                    body['message'],
                    now.time()
                ))
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'id': result['id']}),
                    'isBase64Encoded': False
                }
            
            elif action == 'add_request':
                cur.execute('''
                    INSERT INTO requests (worker_name, title, description, status, date)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                ''', (
                    body['worker_name'],
                    body['title'],
                    body['description'],
                    body.get('status', 'new'),
                    body['date']
                ))
                result = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'id': result['id']}),
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