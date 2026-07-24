import requests

SUPABASE_URL = "https://yzykfkuoievdwqccyjtc.supabase.co"
SUPABASE_KEY = "sb_publishable_YjClzHhXo654XAvea2jhtg_HDGidz5E"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

email = "atlasadmin@gmail.com"
password = "AtlasAdmin2026!"

url = f"{SUPABASE_URL}/auth/v1/signup"
data = {"email": email, "password": password}
response = requests.post(url, headers=HEADERS, json=data)

print(response.status_code)
print(response.json())
