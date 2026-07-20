import requests
import json

SUPABASE_URL = "https://yzykfkuoievdwqccyjtc.supabase.co"
SUPABASE_KEY = "sb_publishable_YjClzHhXo654XAvea2jhtg_HDGidz5E"

HEADERS_ANON = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def sign_up(email, password):
    url = f"{SUPABASE_URL}/auth/v1/signup"
    data = {"email": email, "password": password}
    response = requests.post(url, headers=HEADERS_ANON, json=data)
    return response.json(), response.status_code

def sign_in(email, password):
    url = f"{SUPABASE_URL}/auth/v1/token?grant_type=password"
    data = {"email": email, "password": password}
    response = requests.post(url, headers=HEADERS_ANON, json=data)
    return response.json(), response.status_code

def guardar_perfil(user_id, email, perfil_data, token):
    url_check = f"{SUPABASE_URL}/rest/v1/usuarios_atlas?user_id=eq.{user_id}"
    headers = HEADERS_ANON.copy()
    headers["Authorization"] = f"Bearer {token}"
    
    get_resp = requests.get(url_check, headers=headers)
    
    if get_resp.status_code == 200 and len(get_resp.json()) > 0:
        payload = {"perfil_data": json.dumps(perfil_data)}
        requests.patch(url_check, headers=headers, json=payload)
    else:
        payload = {
            "user_id": user_id, 
            "email": email,
            "perfil_data": json.dumps(perfil_data), 
            "is_vip": False
        }
        requests.post(f"{SUPABASE_URL}/rest/v1/usuarios_atlas", headers=headers, json=payload)

def cargar_perfil(user_id, token):
    url = f"{SUPABASE_URL}/rest/v1/usuarios_atlas?user_id=eq.{user_id}"
    headers = HEADERS_ANON.copy()
    headers["Authorization"] = f"Bearer {token}"
    
    response = requests.get(url, headers=headers)
    if response.status_code == 200 and len(response.json()) > 0:
        row = response.json()[0]
        try:
            data = json.loads(row.get("perfil_data", "{}"))
            return data, row.get("is_vip", False)
        except:
            pass
    return {}, False
