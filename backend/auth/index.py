import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import hashlib
import hmac
from datetime import datetime, timedelta
import secrets

def verify_telegram_auth(auth_data: dict, bot_token: str) -> bool:
    check_hash = auth_data.pop('hash', None)
    if not check_hash:
        return False
    
    data_check_arr = [f"{k}={v}" for k, v in sorted(auth_data.items())]
    data_check_string = '\n'.join(data_check_arr)
    
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    
    return calculated_hash == check_hash

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    '''API для авторизации через Telegram'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', '')
        
        if action == 'verify':
            auth_data = body.get('auth_data', {})
            
            telegram_id = auth_data.get('id')
            if telegram_id is None:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing id in auth_data'}),
                    'isBase64Encoded': False
                }
            
            bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
            if bot_token and 'hash' in auth_data:
                if not verify_telegram_auth(auth_data.copy(), bot_token):
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Hash verification failed'}),
                        'isBase64Encoded': False
                    }
            
            conn = get_db_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            first_name = auth_data.get('first_name', '')
            last_name = auth_data.get('last_name', '')
            username = auth_data.get('username', '')
            photo_url = auth_data.get('photo_url', '')
            
            cur.execute('''
                INSERT INTO users (telegram_id, first_name, last_name, username, photo_url, last_login)
                VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (telegram_id) 
                DO UPDATE SET 
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    username = EXCLUDED.username,
                    photo_url = EXCLUDED.photo_url,
                    last_login = CURRENT_TIMESTAMP
                RETURNING id, telegram_id, first_name, last_name, username, role
            ''', (telegram_id, first_name, last_name, username, photo_url))
            
            user = cur.fetchone()
            conn.commit()
            
            session_token = secrets.token_urlsafe(32)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user': dict(user),
                    'token': session_token
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'check_session':
            token = body.get('token')
            if not token:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'No token provided'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'valid': True}),
                'isBase64Encoded': False
            }
        
        elif action == 'get_users':
            conn = get_db_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            cur.execute('''
                SELECT id, telegram_id, first_name, last_name, username, role,
                       TO_CHAR(created_at, 'YYYY-MM-DD') as created_at,
                       TO_CHAR(last_login, 'YYYY-MM-DD HH24:MI') as last_login
                FROM users
                ORDER BY created_at DESC
            ''')
            users = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps([dict(u) for u in users]),
                'isBase64Encoded': False
            }
        
        elif action == 'update_role':
            conn = get_db_connection()
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            user_id = body.get('user_id')
            new_role = body.get('role')
            
            if new_role not in ['admin', 'worker']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid role'}),
                    'isBase64Encoded': False
                }
            
            cur.execute('''
                UPDATE users 
                SET role = %s
                WHERE id = %s
                RETURNING id, telegram_id, first_name, last_name, username, role
            ''', (new_role, user_id))
            
            user = cur.fetchone()
            conn.commit()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'user': dict(user)}),
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