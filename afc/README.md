# AFC – Ahmad Food Center (Food Ordering Website)

Django REST Framework (backend) + React/Vite (frontend) + PostgreSQL.
Customer website (`frontend/`) + separate Admin Panel (`admin-frontend/`, alag app / alag domain). Cash on Delivery, live order tracking, WhatsApp admin notification.

## Run locally

### 1) PostgreSQL
Easiest: `docker compose up -d` (uses the credentials in `backend/.env.example`).
Without Docker: install PostgreSQL and create DB `afc_db` / user `afc_user` / password `afc_pass`.

### 2) Backend (Terminal 1)
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows   (Mac/Linux: source venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env         # Mac/Linux: cp .env.example .env
# If your virtual environment is named `.env`, use `.env.local` for settings instead.
# PowerShell: copy .env.example .env.local
python manage.py migrate
python manage.py seed          # menu, categories, settings (add --demo for fake demo orders, dev only)
python manage.py createsuperuser   # apna admin username/password khud banao
python manage.py runserver     # http://127.0.0.1:8000
```
No PostgreSQL yet? Quick test with SQLite: set `USE_SQLITE=1` in `.env` (or `.env.local`).

### 3) Customer website (Terminal 2)
```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
```

### 4) Admin panel (Terminal 3) - alag app
```bash
cd admin-frontend
npm install
copy .env.example .env         # Mac/Linux: cp .env.example .env   (optional)
npm run dev                    # http://localhost:5174
```

- Customer website: http://localhost:5173  (isme admin ka koi code/link nahi)
- Admin panel: http://localhost:5174  -> login with the user you created via `createsuperuser`
- Password badalna: Admin -> Profile -> **Change password**
- Django DB admin (optional, sirf `DEBUG=1` par): http://127.0.0.1:8000/django-admin/

## Features checklist
- Order without login: Pizza / Burger / Shawarma / Deals (+ any category you add), search, cart, qty, promo code (`AFC20` = 20%).
- Checkout: Name, Phone (+92), Address, Landmark / location pin. **COD only**; Card/Online shows *Coming Soon*.
- Order ID `AFC-xxxx`; track by Order ID + phone at `/track`. Steps: Order Placed → Preparing → Out for Delivery → Delivered (rider name + time). Auto-refreshes every 8 s.
- Admin: dashboard stats, Live Orders (status buttons, filter, Export CSV, pagination), Menu (add/edit/delete categories & items), Deals, Customers, Settings.
- New category (e.g. **Cakes**) shows instantly on the customer site (nav tabs, menu filters, Browse by Category).
- Photos: admin uploads per item. No upload → a matching default photo is picked automatically from the item/category name (pizza, burger, shawarma, deal, cake, fries, drink, generic). Broken image URLs also fall back to the default.
- Delivery fee is a server-side setting (Admin → Settings); totals are always recalculated by the server.
- Splash screen (5.6 s, once per browser session) with "Engineer M Aneeq Haider".

## WhatsApp notification
1. Admin → **Settings** → enter the admin WhatsApp number (e.g. `923001234567`).
2. **Demo mode (default):** after an order, the customer-side confirmation shows the ready message and a *Send to Admin on WhatsApp* button (wa.me link). Admin can also re-open any order's message from the green icon in Live Orders.
3. **Automatic mode:** enable *WhatsApp Business API* in Settings and fill Phone Number ID, Business Account ID and Access Token (Meta WhatsApp Cloud API). The server then sends the message itself (`shop/whatsapp.py`).
   Note: Meta only allows free-text messages inside a 24-hour customer-service window; for a fully automatic production flow you will need an approved **message template** (adjust the payload in `send_via_api`).

## Real food photos
Default photos are real food photos in `frontend/public/defaults/` (pizza, burger, shawarma, fries, cake, deal, generic). They are public placeholder images from GitHub datasets — replace them with your own photos (same file names) before launch, or upload per-item photos from the Admin panel.

## Before going live
1. `.env` (server): `DEBUG=0`, strong `SECRET_KEY`, `ALLOWED_HOSTS=api.yourdomain.com`, strong `DB_PASSWORD`,
   `CORS_ORIGINS=https://yourdomain.com,https://admin.yourdomain.com` (see `backend/.env.example`).
   `DEBUG=0` par SECRET_KEY ke bina server start nahi hota (safety).
2. Admin user: `python manage.py createsuperuser` (strong password, min 10 chars). Production par `seed --demo` kabhi na chalao.
3. Deploy **alag alag**: `frontend/` -> `yourdomain.com`, `admin-frontend/` -> `admin.yourdomain.com` (`npm run build`, serve `dist/`).
   Build se pehle `admin-frontend/.env` mein `VITE_API_URL=https://api.yourdomain.com` aur `VITE_SITE_URL=https://yourdomain.com`,
   customer `frontend/.env` mein `VITE_API_URL=https://api.yourdomain.com`.
4. Backend: gunicorn + nginx (HTTPS), proxy `/api` + `/media`; `/media` nginx/S3 se serve karo.
5. Security jo already code mein hai: admin login rate limit (5/min per IP), admin token 24 ghante baad expire,
   password change par purane sessions logout, Django built-in admin production mein band (`DJANGO_ADMIN_URL` set karo to hi chalta hai).
   Reverse proxy ke peeche rate limit sahi IP par chale iske liye nginx se `X-Forwarded-For` bhejo.
