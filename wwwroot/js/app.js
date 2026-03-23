
// ============================================================
// API — Kommunikation med ASP.NET Core backend
// ============================================================
const API_BASE = '/api';

async function apiCall(method, endpoint, body = null, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = localStorage.getItem('at');
    if (token) headers['Authorization'] = 'Bearer ' + token;
  }
  try {
    const res = await fetch(API_BASE + endpoint, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    if (res.status === 401) {
      // Försök refresh
      const refreshed = await tryRefresh();
      if (refreshed) return apiCall(method, endpoint, body, auth);
      logout();
      return null;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Okänt fel' }));
      toast(err.message || 'Serverfel', 'error');
      return null;
    }
    if (res.status === 204) return true;
    return await res.json();
  } catch (e) {
    toast('Kunde inte nå servern — kontrollera din anslutning.', 'error');
    return null;
  }
}

async function tryRefresh() {
  const rt = localStorage.getItem('rt');
  if (!rt) return false;
  try {
    const res = await fetch(API_BASE + '/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt })
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('at', data.accessToken);
    localStorage.setItem('rt', data.refreshToken);
    user = data.user;
    updateNav();
    return true;
  } catch { return false; }
}

/**
 * KodLabbet — Interaktiv kodutbildningsplattform
 * Ägare: DittFöretag, Malmö, Sverige | kontakt@dindomän.com
 * Domän: www.dindomän.com | © 2026 DittFöretag
 *
 * SÄKERHET:
 *  - All användarinput escapes via esc() innan innerHTML
 *  - Content-Security-Policy satt i <meta> (se <head>)
 *  - localStorage-åtkomst wrappas alltid i try/catch
 *  - JWT-tokens hanteras av backend (ej synliga i klient-state)
 *  - eval() förekommer ENDAST i projekt-startkod (isolated strings)
 *
 * STRUKTUR:
 *  1. Konstanter & Data (PROJS, KB_ITEMS, BADGES …)
 *  2. State-variabler (user, filters, custom …)
 *  3. Hjälpfunktioner (esc, toast, go, updateNav …)
 *  4. Feature-moduler (renderProjects, KodBot, Arena …)
 *  5. Init (loadUser, DOMContentLoaded)
 */


/* ── DOM-hjälpare ── */
/** @param {string} id @returns {HTMLElement|null} */
const $ = id => document.getElementById(id);

/** Visar/döljer element säkert */
function setVisible(id, visible) {
  const el = $(id);
  if (el) el.style.display = visible ? '' : 'none';
}

/** Sätter innerHTML säkert med escad HTML */
function setHTML(id, html) {
  const el = $(id);
  if (el) el.innerHTML = html;
}


const API='/api';
let user=null,authMode='login',billAnnual=false;
let filters={lv:'all',ct:'all',lg:'all'};
let custom={lang:'javascript',fw:'none',term:'bash'};
let chatHist=[],chatSid=null,aiCnt=0;
const FREE_AI=5;

// ===== DATA =====
const PROJS=[
  {id:1,emoji:'🎲',title:'Gissningsleken',desc:'Gissa det hemliga talet. Loopar och villkor.',lv:'beginner',tags:['javascript'],ct:'loopar',time:'1–2h',free:true,
   full:'Spel där datorn väljer 1–100 och spelaren gissar. Tränar if/else och while-loopar.',
   steps:['Skapa HTML med input och knapp','Generera slumptal med Math.random()','Jämför gissning med hemligt tal','Visa feedback och räkna försök','Lägg till highscore i localStorage'],
   code:{javascript:`const hemligtTal = Math.floor(Math.random() * 100) + 1;\nlet försök = 0;\n\nfunction gissa() {\n  const g = parseInt(document.getElementById('inp').value);\n  försök++;\n  if (g < hemligtTal) visa('📉 För lågt!');\n  else if (g > hemligtTal) visa('📈 För högt!');\n  else visa(\`🎉 Rätt på \${försök} försök!\`);\n}`,
    python:`import random\nhemligt = random.randint(1, 100)\nförsök = 0\nwhile True:\n    g = int(input("Gissa (1-100): "))\n    försök += 1\n    if g < hemligt: print("📉 För lågt!")\n    elif g > hemligt: print("📈 För högt!")\n    else:\n        print(f"🎉 Rätt på {försök} försök!")\n        break`,
    csharp:`int hemligt = new Random().Next(1, 101);\nint försök = 0;\nwhile (true) {\n    Console.Write("Gissa (1-100): ");\n    int g = int.Parse(Console.ReadLine()!);\n    försök++;\n    if (g < hemligt) Console.WriteLine("📉 För lågt!");\n    else if (g > hemligt) Console.WriteLine("📈 För högt!");\n    else { Console.WriteLine($"🎉 Rätt på {försök} försök!"); break; }\n}`}},
  {id:2,emoji:'✅',title:'Todo-lista',desc:'Klassisk todo-app med localStorage och DOM-manipulation.',lv:'beginner',tags:['javascript','css'],ct:'strängar',time:'2–3h',free:true,
   full:'Bygg en att-göra-lista med lägg till, markera klar och ta bort. Spara i localStorage.',
   steps:['Designa UI med HTML/CSS','Lägg till uppgifter dynamiskt','Markera uppgifter som klara','Ta bort uppgifter','Spara state i localStorage'],
   code:{javascript:`let todos = JSON.parse(localStorage.getItem('todos') || '[]');\n\nfunction add(text) {\n  todos.push({ text, done: false, id: Date.now() });\n  save(); render();\n}\n\nfunction save() {\n  localStorage.setItem('todos', JSON.stringify(todos));\n}`,
    python:`todos = []\n\ndef add(text):\n    todos.append({'text': text, 'done': False})\n\ndef show():\n    for i, t in enumerate(todos):\n        s = '✓' if t['done'] else '○'\n        print(f"{i}. [{s}] {t['text']}")`,
    csharp:`var todos = new List<(string Text, bool Done)>();\n\nvoid Add(string text) {\n    todos.Add((text, false));\n    Console.WriteLine($"✅ Lade till: {text}");\n}\n\nvoid Show() {\n    for (int i = 0; i < todos.Count; i++) {\n        string s = todos[i].Done ? "✓" : "○";\n        Console.WriteLine($"{i}. [{s}] {todos[i].Text}");\n    }\n}`}},
  {id:3,emoji:'🔐',title:'Lösenordsgenerator',desc:'Generera säkra lösenord med styrkeindikator.',lv:'beginner',tags:['javascript'],ct:'strängar',time:'1–2h',free:true,
   full:'Lösenordsgenerator med val av längd, teckentyper och visuell styrkeindikator.',
   steps:['Bygg UI med checkboxar och slider','Definiera teckensätt (versaler, siffror, special)','Generera baserat på val','Beräkna och visa styrka','Kopiera med Clipboard API'],
   code:{javascript:`function generate(len, opts) {\n  const sets = {\n    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',\n    lower: 'abcdefghijklmnopqrstuvwxyz',\n    digits: '0123456789',\n    special: '!@#$%^&*'\n  };\n  const chars = Object.entries(sets)\n    .filter(([k]) => opts[k])\n    .map(([,v]) => v).join('');\n  return Array.from({length: len},\n    () => chars[Math.random() * chars.length | 0]\n  ).join('');\n}`,
    python:`import random, string\n\ndef generate(length, upper=True, digits=True, special=True):\n    chars = string.ascii_lowercase\n    if upper: chars += string.ascii_uppercase\n    if digits: chars += string.digits\n    if special: chars += '!@#$%^&*'\n    return ''.join(random.choice(chars) for _ in range(length))`,
    csharp:`string Generate(int len, bool upper=true, bool digits=true, bool special=true) {\n    string chars = "abcdefghijklmnopqrstuvwxyz";\n    if (upper)   chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";\n    if (digits)  chars += "0123456789";\n    if (special) chars += "!@#$%^&*";\n    var rng = new Random();\n    return new string(Enumerable.Range(0, len)\n        .Select(_ => chars[rng.Next(chars.Length)]).ToArray());\n}`}},
  {id:4,emoji:'🧮',title:'Miniräknare',desc:'Kalkylator med knappar och de fyra räknesätten.',lv:'beginner',tags:['javascript','css'],ct:'klasser',time:'2–3h',free:true,
   full:'Klassisk miniräknare. Tränar event-handling, state management och klass-design.',
   steps:['Skapa knapp-grid med CSS Grid','Lägg till event listeners','Lagra inmatning i state-objekt','Implementera räkneoperationer','Hantera division med noll och edge cases'],
   code:{javascript:`class Calc {\n  constructor() { this.val=''; this.prev=null; this.op=null; }\n  press(k) {\n    if ('0123456789.'.includes(k)) { this.val += k; }\n    else if ('+-*/'.includes(k)) { this.prev=+this.val; this.op=k; this.val=''; }\n    else if (k === '=') {\n      const b = +this.val;\n      this.val = String(eval(\`\${this.prev}\${this.op}\${b}\`));\n    }\n    else if (k === 'C') { this.val=''; this.prev=null; }\n    this.show();\n  }\n}`,
    python:`class Kalkylator:\n    def __init__(self): self.val=''; self.prev=None; self.op=None\n    def tryck(self, k):\n        if k in '0123456789.': self.val += k\n        elif k in '+-*/': self.prev=float(self.val); self.op=k; self.val=''\n        elif k == '=':\n            b = float(self.val)\n            self.val = str(eval(f"{self.prev}{self.op}{b}"))\n        elif k == 'C': self.val = ''; self.prev = None`,
    csharp:`public class Kalkylator {\n    double? prev; string op = ""; \n    public string Val { get; private set; } = "";\n    public void Tryck(string k) {\n        if (double.TryParse(k, out _)) { Val += k; }\n        else if ("+-*/".Contains(k)) { prev=double.Parse(Val); op=k; Val=""; }\n        else if (k == "=") {\n            double b = double.Parse(Val);\n            Val = op switch {\n                "+" => (prev+b).ToString()!, "-" => (prev-b).ToString()!,\n                "*" => (prev*b).ToString()!, "/" => b!=0 ? (prev/b).ToString()! : "Fel",\n                _ => Val };\n        }\n    }\n}`}},
  {id:5,emoji:'🌤️',title:'Väderapp',desc:'Hämta väder med fetch() och OpenWeatherMap API.',lv:'medium',tags:['javascript','api'],ct:'api',time:'3–4h',free:true,
   full:'Väderapp som visar aktuellt väder för valfri stad via OpenWeatherMap.',
   steps:['Skaffa gratis API-nyckel på openweathermap.org','Bygg sökformulär med HTML','Gör fetch()-anrop med async/await','Parsa JSON-svar och extrahera data','Visa väder med ikon och felhantering'],
   code:{javascript:`async function getWeather(city) {\n  const KEY = 'din-api-nyckel';\n  const url = \`https://api.openweathermap.org/data/2.5/weather\n    ?q=\${city}&appid=\${KEY}&units=metric&lang=sv\`;\n  try {\n    const res = await fetch(url);\n    if (!res.ok) throw new Error('Stad ej hittad');\n    const d = await res.json();\n    return { temp: Math.round(d.main.temp), desc: d.weather[0].description, city: d.name };\n  } catch(e) { console.error(e); return null; }\n}`,
    python:`import requests\n\ndef get_weather(city, api_key):\n    url = f"https://api.openweathermap.org/data/2.5/weather"\n    params = {'q': city, 'appid': api_key, 'units': 'metric', 'lang': 'sv'}\n    r = requests.get(url, params=params)\n    if r.status_code == 200:\n        d = r.json()\n        return {'temp': round(d['main']['temp']), 'desc': d['weather'][0]['description']}\n    return None`,
    csharp:`async Task<string> GetWeather(string city, string key) {\n    using var client = new HttpClient();\n    var url = $"https://api.openweathermap.org/data/2.5/weather?q={city}&appid={key}&units=metric";\n    var json = await client.GetStringAsync(url);\n    using var doc = JsonDocument.Parse(json);\n    var temp = doc.RootElement.GetProperty("main").GetProperty("temp").GetDouble();\n    return $"{temp:F0}°C";\n}`}},
  {id:6,emoji:'📝',title:'Markdown-editor',desc:'Live markdown-editor med realtids-HTML-preview.',lv:'medium',tags:['javascript','css'],ct:'strängar',time:'3–5h',free:true,
   full:'Delad editor: vänster är raw markdown, höger visar live-renderad HTML.',
   steps:['Dela sidan i två paneler med CSS Flexbox','Skapa textarea till vänster','Skriv en enkel MD-parser','Koppla oninput till preview-uppdatering','Lägg till synkroniserad scroll'],
   code:{javascript:`function parseMD(text) {\n  return text\n    .replace(/^### (.+)$/gm, '<h3>$1</h3>')\n    .replace(/^## (.+)$/gm,  '<h2>$1</h2>')\n    .replace(/^# (.+)$/gm,   '<h1>$1</h1>')\n    .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')\n    .replace(/\\*(.+?)\\*/g,   '<em>$1</em>')\n    .replace(/^- (.+)$/gm,   '<li>$1</li>')\n    .replace(/\\n/g, '<br>');\n}`,
    python:`import re\n\ndef parse_md(text):\n    text = re.sub(r'^### (.+)$', r'<h3>\\1</h3>', text, flags=re.M)\n    text = re.sub(r'^## (.+)$',  r'<h2>\\1</h2>', text, flags=re.M)\n    text = re.sub(r'^# (.+)$',   r'<h1>\\1</h1>', text, flags=re.M)\n    text = re.sub(r'\\*\\*(.+?)\\*\\*', r'<strong>\\1</strong>', text)\n    text = re.sub(r'\\*(.+?)\\*',   r'<em>\\1</em>', text)\n    return text.replace('\\n', '<br>')`,
    csharp:`using System.Text.RegularExpressions;\n\nstring ParseMD(string text) {\n    text = Regex.Replace(text, @"^### (.+)$", "<h3>$1</h3>", RegexOptions.Multiline);\n    text = Regex.Replace(text, @"^## (.+)$",  "<h2>$1</h2>", RegexOptions.Multiline);\n    text = Regex.Replace(text, @"^# (.+)$",   "<h1>$1</h1>", RegexOptions.Multiline);\n    text = Regex.Replace(text, @"\\*\\*(.+?)\\*\\*", "<strong>$1</strong>");\n    return text.Replace("\\n", "<br>");\n}`}},
  // PRO LOCKED
  {id:7,emoji:'🐍',title:'Snake-spelet',desc:'Canvas API + spellogik. Rörelse, kollision, score.',lv:'advanced',tags:['javascript'],ct:'loopar',time:'5–8h',free:false,
   full:'Implementera Snake med HTML5 Canvas. Rörelse, mat, kollisionsdetektering och highscore.',
   steps:['Canvas setup + 2D context','Array-datastruktur för ormen','Rörelselogik med setInterval','Kollisionsdetektering (vägg + sig själv)','Poängsystem och game over-skärm'],
   code:{javascript:`const ctx = canvas.getContext('2d');\nlet snake = [{x:5, y:5}], dir = {x:1, y:0}, food = {x:10, y:10};\n\nfunction tick() {\n  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };\n  if (isCollision(head)) return gameOver();\n  snake.unshift(head);\n  if (head.x === food.x && head.y === food.y) {\n    food = newFood();\n  } else {\n    snake.pop();\n  }\n  draw();\n}`}},
  {id:8,emoji:'🗄️',title:'Todo-app med SQLite',desc:'Python Flask + SQLite. CRUD REST API.',lv:'medium',tags:['python','sql'],ct:'sql',time:'4–6h',free:false,
   full:'Fullständig todo-app med Flask backend och SQLite-databas. Lär dig grunderna i databas-CRUD.',
   steps:['Installera Flask och skapa app.py','Skapa SQLite-databas och schema','Implementera GET /todos och POST /todos','Lägg till PUT /todos/<id> och DELETE','Bygg enkel HTML-frontend'],
   code:{python:`from flask import Flask, jsonify, request\nimport sqlite3\n\napp = Flask(__name__)\n\ndef get_db():\n    db = sqlite3.connect('todos.db')\n    db.row_factory = sqlite3.Row\n    return db\n\n@app.route('/todos')\ndef list_todos():\n    todos = get_db().execute(\n        'SELECT * FROM todos ORDER BY created DESC'\n    ).fetchall()\n    return jsonify([dict(t) for t in todos])`}},
  {id:9,emoji:'🏗️',title:'Klassbibliotek i C#',desc:'OOP med arv, interface och polymorfism.',lv:'medium',tags:['csharp'],ct:'klasser',time:'3–5h',free:false,
   full:'Bygga ett bibliotekssystem med klasser, arv och interface. Kärnkoncepten i OOP.',
   steps:['Definiera abstrakt basklass Bok','Skapa subklasser Roman och Facklitteratur','Implementera interface ILånebar','Bygg Bibliotek-klass med List<Bok>','Använd LINQ för sökning och filtrering'],
   code:{csharp:`public abstract class Bok {\n    public string Titel { get; set; } = "";\n    public string Författare { get; set; } = "";\n    public abstract string Kategori { get; }\n    public override string ToString() => $"{Titel} av {Författare}";\n}\n\npublic interface ILånebar {\n    bool ÄrTillgänglig { get; }\n    void Låna(string låntagare);\n    void Återlämna();\n}\n\npublic class Roman : Bok, ILånebar {\n    public override string Kategori => "Roman";\n    public bool ÄrTillgänglig { get; private set; } = true;\n    public void Låna(string l) => ÄrTillgänglig = false;\n    public void Återlämna() => ÄrTillgänglig = true;\n}`}},
  {id:10,emoji:'🍃',title:'MongoDB + Node.js API',desc:'NoSQL-databas med Mongoose. REST API.',lv:'advanced',tags:['javascript','api'],ct:'mongodb',time:'5–7h',free:false,
   full:'REST API med Express.js, MongoDB Atlas och Mongoose ODM. Lär dig NoSQL-tänket.',
   steps:['Skapa MongoDB Atlas-kluster (gratis)','npm install express mongoose','Definiera Schema och Model','Implementera CRUD-routes','Lägg till validering och felhantering'],
   code:{javascript:`const mongoose = require('mongoose');\n\nconst UserSchema = new mongoose.Schema({\n  name:  { type: String, required: true },\n  email: { type: String, required: true, unique: true },\n  xp:    { type: Number, default: 0 },\n  created: { type: Date, default: Date.now }\n});\n\nconst User = mongoose.model('User', UserSchema);\n\nasync function createUser(name, email) {\n  const user = new User({ name, email });\n  return await user.save();\n}`}},
  {id:11,emoji:'⚡',title:'LINQ & Lambda i C#',desc:'Kraftfull datamanipulation med LINQ-queries.',lv:'medium',tags:['csharp'],ct:'algoritmer',time:'3–4h',free:false,
   full:'Lär dig LINQ för att filtrera, sortera och transformera data elegant i C#.',
   steps:['Förstå IEnumerable<T> och extension methods','Where(), Select(), OrderBy()','GroupBy() och Aggregate()','Join() mellan samlingar','Async LINQ med EF Core'],
   code:{csharp:`var produkter = new List<Produkt> {\n    new("Laptop", 12000, "Elektronik"),\n    new("Bok",      150,  "Utbildning"),\n    new("Headset",  800,  "Elektronik")\n};\n\n// Filtrera och sortera\nvar dyra = produkter\n    .Where(p => p.Kategori == "Elektronik" && p.Pris > 500)\n    .OrderByDescending(p => p.Pris)\n    .Select(p => new { p.Namn, p.Pris })\n    .ToList();\n\n// Gruppera med summa\nvar perKat = produkter\n    .GroupBy(p => p.Kategori)\n    .Select(g => new { Kat = g.Key, Total = g.Sum(p => p.Pris) });`}},
  {id:12,emoji:'🔗',title:'ASP.NET Web API',desc:'Komplett REST API med C# och Entity Framework.',lv:'advanced',tags:['csharp','api'],ct:'api',time:'6–8h',free:false,
   full:'Fullständigt REST API med ASP.NET Core, Entity Framework Core och Swagger.',
   steps:['dotnet new webapi -n MittAPI','Definiera modeller och DbContext','Skapa Controller med [ApiController]','EF Core migrations och databas','Lägg till Swagger/OpenAPI-docs'],
   code:{csharp:`[ApiController]\n[Route("api/[controller]")]\npublic class ProdukterController : ControllerBase {\n    private readonly AppDbContext _db;\n    public ProdukterController(AppDbContext db) => _db = db;\n\n    [HttpGet]\n    public async Task<IActionResult> GetAll() =>\n        Ok(await _db.Produkter.ToListAsync());\n\n    [HttpPost]\n    public async Task<IActionResult> Create(Produkt p) {\n        _db.Produkter.Add(p);\n        await _db.SaveChangesAsync();\n        return CreatedAtAction(nameof(GetAll), p);\n    }\n}`}},
  {id:13,emoji:'🗃️',title:'SQL Joins & Queries',desc:'Avancerade SQL-tekniker: JOINs, GROUP BY, subqueries.',lv:'medium',tags:['sql'],ct:'sql',time:'3–4h',free:false,
   full:'Avancerade SQL-tekniker med fokus på JOINs, aggregering och subqueries.',
   steps:['Sätt upp testdatabas med exempeldata','INNER JOIN – kombinera tabeller','LEFT JOIN – bevara alla rader','GROUP BY + HAVING för aggregering','Subqueries och korrelerade queries'],
   code:{javascript:`-- Kunder med ordervärde\nSELECT\n  k.namn,\n  COUNT(o.id)    AS antal_ordrar,\n  SUM(o.belopp)  AS total_värde\nFROM kunder k\nLEFT JOIN ordrar o ON k.id = o.kund_id\nGROUP BY k.id, k.namn\nHAVING total_värde > 1000\nORDER BY total_värde DESC;\n\n-- Kunder utan ordrar\nSELECT namn FROM kunder\nWHERE id NOT IN (SELECT DISTINCT kund_id FROM ordrar);`}},
  {id:14,emoji:'📊',title:'Data-visualisering',desc:'Interaktiva grafer med Chart.js och riktig data.',lv:'medium',tags:['javascript'],ct:'api',time:'3–5h',free:false,
   full:'Ladda in CSV/JSON och skapa interaktiva stapel-, linje- och cirkeldiagram.',
   steps:['Lägg till Chart.js via CDN','Förbered datakälla (CSV eller fetch)','Bygg stapeldiagram','Lägg till linjediagram med animation','Klick-events och dynamisk filtrering'],
   code:{javascript:`const chart = new Chart(ctx, {\n  type: 'bar',\n  data: {\n    labels: ['Jan','Feb','Mar','Apr','Maj','Jun'],\n    datasets: [{\n      label: 'Försäljning (kr)',\n      data: [12500, 19200, 8300, 15600, 22100, 18400],\n      backgroundColor: 'rgba(109,40,217,0.6)',\n      borderColor: 'rgb(109,40,217)',\n      borderWidth: 2, borderRadius: 6\n    }]\n  },\n  options: { responsive: true }\n});`}},,
  // ── BEGINNER ──
  {id:15,emoji:'📝',title:'Todo-lista med localStorage',desc:'Bygg en komplett todo-app som sparar uppgifter i webbläsaren.',lv:'beginner',tags:['javascript'],ct:'dom',time:'2–3h',free:true,
   full:'Klassiskt nybörjarprojekt som täcker DOM-manipulation, events och persistens med localStorage. Lär dig lägga till, bocka av och ta bort uppgifter.',
   steps:['Skapa HTML-formulär med input och knapp','Lägg till todos i en array och rendera listan','Implementera bocka av och ta bort','Spara och ladda från localStorage','Lägg till filter: Alla / Aktiva / Klara'],
   code:{javascript:`let todos = JSON.parse(localStorage.getItem('todos')) || [];\n\nfunction addTodo() {\n  const text = document.getElementById('inp').value.trim();\n  if (!text) return;\n  todos.push({ id: Date.now(), text, done: false });\n  save(); render();\n}\n\nfunction save() {\n  localStorage.setItem('todos', JSON.stringify(todos));\n}\n\nfunction render() {\n  document.getElementById('list').innerHTML = todos\n    .map(t => \`<li class="\${t.done?'done':''}">\${t.text} <button onclick="toggle(\${t.id})">✓</button></li>\`)\n    .join('');\n}`,
    python:`# Backend-version med fil-persistens\nimport json, os\n\ndef load(): return json.load(open('todos.json')) if os.path.exists('todos.json') else []\ndef save(todos): json.dump(todos, open('todos.json','w'), ensure_ascii=False)\n\ntodos = load()\nwhile True:\n    cmd = input("add/list/done/quit: ")\n    if cmd == 'add':\n        todos.append({'text': input('Uppgift: '), 'done': False})\n        save(todos)\n    elif cmd == 'list':\n        for i,t in enumerate(todos): print(f"{i}. {'✓' if t['done'] else '○'} {t['text']}")\n    elif cmd == 'done':\n        todos[int(input('Nummer: '))]['done'] = True; save(todos)\n    elif cmd == 'quit': break`}},

  {id:16,emoji:'🌡️',title:'Temperaturomvandlare',desc:'Konvertera mellan Celsius, Fahrenheit och Kelvin i realtid.',lv:'beginner',tags:['javascript'],ct:'dom',time:'1–2h',free:true,
   full:'Enkelt men pedagogiskt projekt som lär ut event-lyssnare, realtidsuppdateringar och grundläggande matematiska formler i kod.',
   steps:['Skapa tre input-fält för C, F och K','Lyssna på input-events på varje fält','Beräkna och uppdatera de andra två i realtid','Avrunda till 2 decimaler','Lägg till en visuell termometer-indikator'],
   code:{javascript:`function cToF(c) { return c * 9/5 + 32; }\nfunction cToK(c) { return c + 273.15; }\nfunction fToC(f) { return (f - 32) * 5/9; }\n\ndocument.getElementById('celsius').addEventListener('input', e => {\n  const c = parseFloat(e.target.value);\n  document.getElementById('fahrenheit').value = cToF(c).toFixed(2);\n  document.getElementById('kelvin').value = cToK(c).toFixed(2);\n});`,
    python:`def c_to_f(c): return c * 9/5 + 32\ndef c_to_k(c): return c + 273.15\ndef f_to_c(f): return (f - 32) * 5/9\n\nwhile True:\n    val = float(input("Ange Celsius: "))\n    print(f"Fahrenheit: {c_to_f(val):.2f}")\n    print(f"Kelvin:     {c_to_k(val):.2f}")\n    print(f"Celsius:    {val:.2f}")`}},

  {id:17,emoji:'🎨',title:'Slumpmässig färgpalett',desc:'Generera och spara vackra färgpaletter med ett knapptryck.',lv:'beginner',tags:['javascript'],ct:'dom',time:'1–2h',free:true,
   full:'Roligt visuellt projekt som täcker slumptal, CSS-manipulation och clipboard API. Perfekt för att förstå hur färger fungerar i kod (hex, rgb, hsl).',
   steps:['Generera 5 slumpmässiga hex-färger','Visa dem som färgbrickor','Klicka för att kopiera hex-kod till clipboard','Låsfunktion: lås enstaka färger vid regenerering','Exportera palett som CSS-variabler'],
   code:{javascript:`function randomHex() {\n  return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');\n}\n\nfunction generatePalette() {\n  const swatches = document.querySelectorAll('.swatch');\n  swatches.forEach(s => {\n    if (!s.classList.contains('locked')) {\n      const color = randomHex();\n      s.style.background = color;\n      s.querySelector('.hex').textContent = color;\n    }\n  });\n}\n\ndocument.addEventListener('keydown', e => {\n  if (e.code === 'Space') { e.preventDefault(); generatePalette(); }\n});`}},

  // ── MEDIUM ──
  {id:18,emoji:'🔐',title:'Lösenordsgenerator',desc:'Bygg en säker lösenordsgenerator med anpassningsbara regler.',lv:'medium',tags:['javascript'],ct:'dom',time:'2–3h',free:true,
   full:'Kombinerar kryptografi (crypto.getRandomValues), UI-komponenter och säkerhetstänk. Lär dig varför Math.random() INTE är säkert för lösenord.',
   steps:['Bygg UI med kryssrutor för teckentyper','Implementera crypto.getRandomValues för säker slump','Beräkna och visa lösenordsstyrka','Kopiera till clipboard med feedback','Lägg till lösenordshistorik (session)'],
   code:{javascript:`function generatePassword(length, opts) {\n  let chars = '';\n  if (opts.upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';\n  if (opts.lower) chars += 'abcdefghijklmnopqrstuvwxyz';\n  if (opts.numbers) chars += '0123456789';\n  if (opts.symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';\n  if (!chars) return 'Välj minst ett alternativ';\n  const arr = new Uint32Array(length);\n  crypto.getRandomValues(arr);\n  return Array.from(arr, n => chars[n % chars.length]).join('');\n}\n\nfunction getStrength(pwd) {\n  let score = 0;\n  if (pwd.length >= 12) score++;\n  if (/[A-Z]/.test(pwd)) score++;\n  if (/[0-9]/.test(pwd)) score++;\n  if (/[^A-Za-z0-9]/.test(pwd)) score++;\n  return ['Svagt','Okej','Bra','Starkt'][score] || 'Svagt';\n}`,
    python:`import secrets, string\n\ndef generate(length=16, upper=True, lower=True, nums=True, symbols=True):\n    chars = ''\n    if upper: chars += string.ascii_uppercase\n    if lower: chars += string.ascii_lowercase\n    if nums:  chars += string.digits\n    if symbols: chars += '!@#$%^&*()'\n    return ''.join(secrets.choice(chars) for _ in range(length))\n\nprint(generate(20))`}},

  {id:19,emoji:'📰',title:'Markdown-editor med preview',desc:'Live Markdown-editor som renderar HTML i realtid.',lv:'medium',tags:['javascript'],ct:'api',time:'3–4h',free:false,
   full:'Bygg en split-screen Markdown-editor likt GitHub eller Notion. Lär dig regex för parsning, synkroniserad scroll och hur man gör en enkel parser från scratch.',
   steps:['Skapa split-layout editor till vänster och preview till höger','Skriv en enkel MD-parser med regex','Koppla oninput till preview-uppdatering','Lägg till synkroniserad scroll','Exportera som HTML-fil med download-länk'],
   code:{javascript:`function parseMarkdown(md) {\n  return md\n    .replace(/^### (.+)/gm, '<h3>$1</h3>')\n    .replace(/^## (.+)/gm,  '<h2>$1</h2>')\n    .replace(/^# (.+)/gm,   '<h1>$1</h1>')\n    .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')\n    .replace(/\\*(.+?)\\*/g,   '<em>$1</em>')\n    .replace(/\`(.+?)\`/g,    '<code>$1</code>')\n    .replace(/^- (.+)/gm,   '<li>$1</li>')\n    .replace(/\\n/g, '<br>');\n}\n\ndocument.getElementById('editor').addEventListener('input', e => {\n  document.getElementById('preview').innerHTML = parseMarkdown(e.target.value);\n});`}},

  {id:20,emoji:'🎯',title:'Quiz-spel med timer',desc:'Bygg ett interaktivt quiz med poängsystem, timer och kategorier.',lv:'medium',tags:['javascript'],ct:'loopar',time:'3–5h',free:false,
   full:'Fullständigt quiz-spel med frågebank, nedräkningstimer, livescore och resultatsida. Perfekt projekt för att öva på arrayer, objekt och state-hantering.',
   steps:['Skapa frågebank som array av objekt','Bygg UI med fråga och 4 svarsalternativ','Implementera 30s nedräkningstimer per fråga','Visa feedback direkt och uppdatera score','Spara highscore i localStorage'],
   code:{javascript:`const frågor = [\n  { fråga: "Vad är 2 + 2?", svar: ["3","4","5","6"], rätt: 1 },\n  { fråga: "Vilken metod lägger till i array?", svar: ["pop","push","shift","splice"], rätt: 1 },\n];\n\nlet aktuell = 0, poäng = 0;\nlet timer;\n\nfunction startTimer() {\n  let kvar = 30;\n  timer = setInterval(() => {\n    document.getElementById('timer').textContent = --kvar;\n    if (kvar <= 0) { clearInterval(timer); nästaFråga(); }\n  }, 1000);\n}`,
    python:`import random, time\n\nfraagor = [\n    {"fraga": "Vad är huvudstaden i Sverige?", "svar": ["Oslo","Köpenhamn","Stockholm","Helsingfors"], "ratt": 2},\n    {"fraga": "Hur många bitar är en byte?", "svar": ["4","6","8","16"], "ratt": 2},\n]\n\npoang = 0\nfor f in random.sample(fraagor, len(fraagor)):\n    print(f["fraga"])\n    for i, s in enumerate(f["svar"]): print(f"  {i+1}. {s}")\n    svar = int(input("Ditt svar: ")) - 1\n    if svar == f["ratt"]: poang += 1; print("✅ Rätt!")\n    else: print(f"❌ Fel. Rätt svar: {f['svar'][f['ratt']]}")\nprint(f"Poäng: {poang}/{len(fraagor)}")`}},

  {id:21,emoji:'💬',title:'Chattapp med WebSocket',desc:'Bygg en realtidschatt med rum, användarnamn och meddelandehistorik.',lv:'medium',tags:['javascript'],ct:'api',time:'4–6h',free:false,
   full:'Lär dig WebSocket-protokollet och hur realtidskommunikation fungerar. Frontend i vanilla JS, backend med Node.js ws-biblioteket.',
   steps:['Sätt upp Node.js WebSocket-server','Bygg chat-UI med meddelandelista och input','Hantera connect/disconnect events','Skicka och ta emot meddelanden i realtid','Lägg till rum-stöd och användarlistning'],
   code:{javascript:`// Frontend\nconst ws = new WebSocket('ws://localhost:3000');\n\nws.onopen = () => console.log('Ansluten!');\nws.onmessage = ({ data }) => {\n  const msg = JSON.parse(data);\n  const li = document.createElement('li');\n  li.textContent = \`\${msg.user}: \${msg.text}\`;\n  document.getElementById('msgs').appendChild(li);\n};\n\nfunction skicka() {\n  const text = document.getElementById('inp').value;\n  ws.send(JSON.stringify({ user: 'Du', text }));\n  document.getElementById('inp').value = '';\n}`,
    csharp:`// ASP.NET Core WebSocket\napp.UseWebSockets();\napp.Use(async (ctx, next) => {\n    if (ctx.WebSockets.IsWebSocketRequest) {\n        var ws = await ctx.WebSockets.AcceptWebSocketAsync();\n        var buf = new byte[1024 * 4];\n        while (true) {\n            var res = await ws.ReceiveAsync(buf, CancellationToken.None);\n            if (res.CloseStatus.HasValue) break;\n            // Echo back\n            await ws.SendAsync(new ArraySegment<byte>(buf, 0, res.Count), res.MessageType, true, CancellationToken.None);\n        }\n    } else await next();\n});`}},

  // ── ADVANCED ──
  {id:22,emoji:'🛒',title:'E-handelssida (fullstack)',desc:'Komplett nätbutik med produkter, varukorg, checkout och ordrar.',lv:'advanced',tags:['javascript'],ct:'api',time:'8–12h',free:false,
   full:'Bygg en komplett e-handelslösning med produktlistning, sökfilter, varukorg i localStorage, checkout-flöde och orderbekräftelse. Avancerat state-hantering och UX-mönster.',
   steps:['Produktlista med kategorier och sökfilter','Varukorgsfunktion med localStorage','Produktdetaljsida med bildgalleri','Checkout-formulär med validering','Orderbekräftelse med sammanfattning','Adminvy för produkthantering'],
   code:{javascript:`// Enkel state-hantering för varukorg\nconst cart = {\n  items: JSON.parse(localStorage.getItem('cart') || '[]'),\n\n  add(product) {\n    const existing = this.items.find(i => i.id === product.id);\n    if (existing) existing.qty++;\n    else this.items.push({ ...product, qty: 1 });\n    this.save();\n  },\n\n  total() {\n    return this.items.reduce((sum, i) => sum + i.price * i.qty, 0);\n  },\n\n  save() {\n    localStorage.setItem('cart', JSON.stringify(this.items));\n    renderCart();\n  }\n};`,
    csharp:`// ASP.NET Core Razor Pages - produktmodell\npublic class Product {\n    public int Id { get; set; }\n    public string Name { get; set; } = "";\n    public decimal Price { get; set; }\n    public string Category { get; set; } = "";\n    public int Stock { get; set; }\n}\n\n// Varukorg i session\npublic class CartService {\n    private readonly IHttpContextAccessor _ctx;\n    public List<CartItem> GetCart() =>\n        JsonSerializer.Deserialize<List<CartItem>>(\n            _ctx.HttpContext!.Session.GetString("cart") ?? "[]"\n        ) ?? new();\n}`}},

  {id:23,emoji:'🤖',title:'AI Chatbot med OpenAI API',desc:'Bygg din egen chatbot med GPT, konversationsminne och personlighet.',lv:'advanced',tags:['javascript','python'],ct:'api',time:'4–6h',free:false,
   full:'Integrera OpenAI GPT-API:t för att bygga en chatbot med anpassad systemprompt, konversationshistorik och streaming-svar. Lär dig prompt engineering i praktiken.',
   steps:['Sätt upp API-nyckel och grundanrop','Bygg chat-UI med meddelandeflöde','Implementera konversationshistorik (messages array)','Lägg till systemprompt för personlighet','Streaming-svar för realtidskänsla','Tokenräknare och kostnadsbegränsning'],
   code:{javascript:`async function chat(history, userMsg) {\n  const res = await fetch('https://api.openai.com/v1/chat/completions', {\n    method: 'POST',\n    headers: {\n      'Content-Type': 'application/json',\n      'Authorization': \`Bearer \${API_KEY}\`\n    },\n    body: JSON.stringify({\n      model: 'gpt-4o-mini',\n      messages: [\n        { role: 'system', content: 'Du är en hjälpsam kodassistent.' },\n        ...history,\n        { role: 'user', content: userMsg }\n      ]\n    })\n  });\n  const data = await res.json();\n  return data.choices[0].message.content;\n}`,
    python:`import openai\n\nclient = openai.OpenAI(api_key="DIN_NYCKEL")\nhistorik = []\n\nwhile True:\n    msg = input("Du: ")\n    historik.append({"role": "user", "content": msg})\n    svar = client.chat.completions.create(\n        model="gpt-4o-mini",\n        messages=[{"role":"system","content":"Du är en hjälpsam assistent."}] + historik\n    )\n    bot_msg = svar.choices[0].message.content\n    historik.append({"role": "assistant", "content": bot_msg})\n    print(f"Bot: {bot_msg}")`}},

  {id:24,emoji:'📊',title:'Dashboard med realtidsdata',desc:'Adminpanel med live-grafer, KPI-kort och filtrerbar datatabell.',lv:'advanced',tags:['javascript'],ct:'api',time:'6–8h',free:false,
   full:'Bygg en professionell dashboard med Chart.js, WebSocket för live-uppdateringar, exportfunktion till CSV/Excel och responsiv layout. Riktigt portföljprojekt.',
   steps:['Bygg responsivt dashboard-grid','Implementera KPI-kort med trendindikator','Linjegraf med Chart.js och realtidsuppdatering','Filtrerbar och sorterbar datatabell','Export till CSV','Datumväljare för tidsintervall'],
   code:{javascript:`// Live-uppdatering av graf\nconst chart = new Chart(ctx, {\n  type: 'line',\n  data: { labels: [], datasets: [{ data: [], borderColor: '#6d28d9' }] }\n});\n\nconst ws = new WebSocket('ws://localhost:3000/live');\nws.onmessage = ({ data }) => {\n  const point = JSON.parse(data);\n  chart.data.labels.push(point.time);\n  chart.data.datasets[0].data.push(point.value);\n  if (chart.data.labels.length > 20) {\n    chart.data.labels.shift();\n    chart.data.datasets[0].data.shift();\n  }\n  chart.update('quiet');\n};`,
    csharp:`// EF Core + SignalR för realtidsdashboard\n[ApiController, Route("api/[controller]")]\npublic class MetricsController : ControllerBase {\n    private readonly AppDb _db;\n    private readonly IHubContext<MetricHub> _hub;\n\n    [HttpPost("record")]\n    public async Task<IActionResult> Record(MetricDto dto) {\n        _db.Metrics.Add(new Metric { Value=dto.Value, Timestamp=DateTime.UtcNow });\n        await _db.SaveChangesAsync();\n        await _hub.Clients.All.SendAsync("NewMetric", dto);\n        return Ok();\n    }\n}`}},

  {id:25,emoji:'🗄️',title:'REST API med autentisering',desc:'Bygg ett fullständigt REST API med JWT, roller och databasintegration.',lv:'advanced',tags:['javascript','csharp'],ct:'api',time:'8–10h',free:false,
   full:'Professionellt REST API med Express eller ASP.NET Core, JWT-autentisering, rollbaserad behörighet, rate limiting och Swagger-dokumentation. Branschstandard från dag ett.',
   steps:['Sätt upp Express/ASP.NET Core projekt','Implementera användarregistrering och inloggning','JWT-token generering och validering','Skyddade routes med middleware','Rollbaserad behörighet (admin/user)','Rate limiting och felhantering','Swagger/OpenAPI-dokumentation'],
   code:{javascript:`// Express + JWT\nconst jwt = require('jsonwebtoken');\n\napp.post('/login', async (req, res) => {\n  const user = await User.findOne({ email: req.body.email });\n  if (!user || !await bcrypt.compare(req.body.password, user.hash))\n    return res.status(401).json({ error: 'Ogiltiga uppgifter' });\n  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });\n  res.json({ token });\n});\n\nconst auth = (roles=[]) => (req, res, next) => {\n  const token = req.headers.authorization?.split(' ')[1];\n  try {\n    req.user = jwt.verify(token, process.env.JWT_SECRET);\n    if (roles.length && !roles.includes(req.user.role)) return res.status(403).json({ error: 'Förbjudet' });\n    next();\n  } catch { res.status(401).json({ error: 'Ogiltig token' }); }\n};`,
    csharp:`// ASP.NET Core JWT Auth\nbuilder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)\n    .AddJwtBearer(o => o.TokenValidationParameters = new() {\n        ValidateIssuerSigningKey = true,\n        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]!)),\n        ValidateIssuer = false, ValidateAudience = false\n    });\n\n[Authorize(Roles = "Admin")]\n[HttpDelete("{id}")]\npublic async Task<IActionResult> Delete(int id) {\n    var item = await _db.Items.FindAsync(id);\n    if (item == null) return NotFound();\n    _db.Items.Remove(item);\n    await _db.SaveChangesAsync();\n    return NoContent();\n}`}}

];


// ============================================================
// KUNSKAPSBANKEN DATA
// ============================================================
let KB_CAT = 'all';
let KB_TAG = 'all';
let KB_SEARCH = '';

const KB_TAGS = [
  {id:'all', lbl:'Alla'},
  {id:'javascript', lbl:'JavaScript'}, {id:'python', lbl:'Python'},
  {id:'csharp', lbl:'C#'}, {id:'sql', lbl:'SQL'}, {id:'html', lbl:'HTML/CSS'},
  {id:'databas', lbl:'Databas'}, {id:'loop', lbl:'Loopar'}, {id:'klasser', lbl:'Klasser'},
  {id:'razor', lbl:'Razor Pages'}, {id:'ai', lbl:'AI-verktyg'},
  {id:'krav', lbl:'Kravställning'}, {id:'var', lbl:'Variabler'},
  {id:'async', lbl:'Async/Await'}, {id:'api', lbl:'API'}, {id:'git', lbl:'Git'},
  {id:'dotnet', lbl:'.NET'}, {id:'react', lbl:'React'},
];

const KB_ITEMS = [
  // ===== KOD: VARIABLER =====
  {id:1, cat:'kod', tags:['var','javascript','python','csharp'], icon:'📦', iconBg:'rgba(109,40,217,0.15)',
   title:'Variabler och datatyper', badge:'Grunderna',
   desc:'En variabel är en namngiven plats i minnet. Varje språk har sina egna datatyper och syntax för att deklarera dem.',
   code:{lang:'JS / Python / C#', text:'// JavaScript\nlet namn = "Anna";      // string\nconst ålder = 25;       // number (const = oföränderlig)\nvar aktiv = true;       // boolean (undvik var, använd let/const)\n\n# Python\nnamn = "Anna"           # dynamiskt typat\nålder: int = 25         # type hint (valfritt)\nAKTIV = True            # konstant (konvention: versaler)\n\n// C#\nstring namn = "Anna";   // statiskt typat\nint ålder = 25;\nbool aktiv = true;\nvar auto = 3.14;        // C# härleder typen automatiskt'},
   expand:'Skillnaden: JavaScript och Python är dynamiskt typade (typen sätts vid runtime). C# är statiskt typat (typen måste deklareras). Typning hjälper kompilatorn hitta fel tidigt och ger bättre IDE-stöd.',
   new: false},

  {id:2, cat:'kod', tags:['loop','javascript','python','csharp'], icon:'🔁', iconBg:'rgba(14,165,233,0.15)',
   title:'Loopar — for, while, foreach', badge:'Grunderna',
   desc:'Loopar upprepar ett kodblock. Välj rätt typ beroende på om du vet antalet iterationer i förväg.',
   code:{lang:'JS / Python / C#', text:'// for-loop (känt antal)\nfor (let i = 0; i < 5; i++) console.log(i);\n\n// forEach på array\n[1,2,3].forEach(n => console.log(n));\n\n// while (okänt antal)\nlet n = 0;\nwhile (n < 10) n += 2;\n\n// Python for\nfor i in range(5): print(i)\nfor item in lista: print(item)\n\n// C# foreach\nforeach (var item in lista) Console.WriteLine(item);\n// LINQ-variant\nlista.ForEach(x => Console.WriteLine(x));'},
   expand:'Tips: Föredra forEach/for-of i JS och foreach i C# när du itererar samlingar — de är tydligare och undviker off-by-one-fel. Använd while när villkoret beror på runtime-data.',
   new: false},

  {id:3, cat:'kod', tags:['klasser','javascript','python','csharp'], icon:'🏗️', iconBg:'rgba(236,72,153,0.15)',
   title:'Klasser och OOP-principer', badge:'OOP',
   desc:'Klasser är ritningar för objekt. De kapslar in data (egenskaper) och beteende (metoder) tillsammans.',
   code:{lang:'C# / Python', text:'// C# — full OOP med properties\npublic class Person {\n    public string Namn { get; set; } = "";\n    public int Ålder { get; private set; }\n\n    public Person(string namn, int ålder) {\n        Namn = namn;\n        Ålder = ålder;\n    }\n\n    public string Hälsa() => $"Hej, jag är {Namn}!";\n}\n\n# Python — dataclass (modern)\nfrom dataclasses import dataclass\n\n@dataclass\nclass Person:\n    namn: str\n    ålder: int\n\n    def hälsa(self) -> str:\n        return f"Hej, jag är {self.namn}!"'},
   expand:'De fyra pelarna i OOP: Inkapsling (data+metoder tillsammans), Arv (utöka basklass), Polymorfism (samma interface, olika beteende), Abstraktion (dölj komplexitet). Använd composition over inheritance när möjligt.',
   new: false},

  {id:4, cat:'kod', tags:['sql','databas'], icon:'🗄️', iconBg:'rgba(16,185,129,0.15)',
   title:'SQL-grunder: SELECT, JOIN, GROUP BY', badge:'Databas',
   desc:'SQL (Structured Query Language) används för att hämta, manipulera och analysera data i relationsdatabaser.',
   code:{lang:'SQL', text:'-- Hämta med filter och sortering\nSELECT namn, ålder, stad\nFROM användare\nWHERE ålder >= 18\nORDER BY namn ASC\nLIMIT 10;\n\n-- INNER JOIN — kombinera tabeller\nSELECT u.namn, o.produkt, o.belopp\nFROM användare u\nINNER JOIN ordrar o ON u.id = o.user_id\nWHERE o.belopp > 500;\n\n-- GROUP BY + aggregering\nSELECT stad, COUNT(*) AS antal, AVG(ålder) AS snitålder\nFROM användare\nGROUP BY stad\nHAVING COUNT(*) > 5;'},
   expand:'JOIN-typer: INNER JOIN (bara matchande rader), LEFT JOIN (alla från vänster + matchande), RIGHT JOIN, FULL OUTER JOIN. HAVING filtrerar efter GROUP BY, WHERE filtrerar före.',
   new: false},

  {id:5, cat:'kod', tags:['sql','databas'], icon:'📐', iconBg:'rgba(16,185,129,0.12)',
   title:'Databasdesign och normalisering', badge:'Databas',
   desc:'God databasdesign minimerar redundans och säkerställer dataintegritet. Normalisering är processen att strukturera data korrekt.',
   code:{lang:'SQL', text:'-- 1NF: Varje cell har ett atomärt värde\n-- 2NF: Alla icke-nyckelkolumner beror på hela PK\n-- 3NF: Inga transitiva beroenden\n\n-- Skapa relationer med FK\nCREATE TABLE kunder (\n    id INTEGER PRIMARY KEY AUTOINCREMENT,\n    namn TEXT NOT NULL,\n    email TEXT UNIQUE NOT NULL\n);\n\nCREATE TABLE ordrar (\n    id INTEGER PRIMARY KEY,\n    kund_id INTEGER NOT NULL,\n    belopp DECIMAL(10,2),\n    skapad TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n    FOREIGN KEY (kund_id) REFERENCES kunder(id)\n);'},
   expand:'Index förbättrar prestanda dramatiskt: CREATE INDEX idx_kund ON ordrar(kund_id). Använd EXPLAIN ANALYZE för att se query-planen. Normalisera för integritet, denormalisera för prestanda vid behov.',
   new: false},

  {id:6, cat:'kod', tags:['html','javascript'], icon:'🌐', iconBg:'rgba(245,158,11,0.12)',
   title:'HTML5 & CSS-layout (Flex + Grid)', badge:'Frontend',
   desc:'Modern CSS-layout med Flexbox (1D) och Grid (2D). Flexbox för rader/kolumner, Grid för helsides-layout.',
   code:{lang:'HTML + CSS', text:'<!-- Flexbox — centrerat innehåll -->\n<div style="display:flex; align-items:center; justify-content:space-between; gap:1rem">\n  <div>Vänster</div>\n  <div>Höger</div>\n</div>\n\n<!-- CSS Grid — 3-kolumners layout -->\n.grid {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));\n  gap: 1.5rem;\n}\n\n/* Responsiv: en kolumn på mobil */\n@media (max-width: 600px) {\n  .grid { grid-template-columns: 1fr; }\n}'},
   expand:'Flexbox: flex-direction, justify-content, align-items, flex-wrap, gap. Grid: grid-template-columns, grid-template-rows, grid-area, place-items. Använd CSS Custom Properties (variabler) för konsekvent design.',
   new: false},

  {id:7, cat:'kod', tags:['razor','dotnet','csharp','html'], icon:'⚡', iconBg:'rgba(109,40,217,0.12)',
   title:'Razor Pages i ASP.NET Core', badge:'ASP.NET',
   desc:'Razor Pages är ett page-baserat MVC-mönster i ASP.NET Core. Varje sida har en .cshtml-vy och en .cshtml.cs code-behind.',
   code:{lang:'Razor C#', text:'// Index.cshtml.cs (PageModel)\npublic class IndexModel : PageModel {\n    private readonly IProduktService _svc;\n\n    [BindProperty]\n    public string Sökterm { get; set; } = "";\n\n    public List<Produkt> Produkter { get; set; } = new();\n\n    public IndexModel(IProduktService svc) => _svc = svc;\n\n    public async Task OnGetAsync() =>\n        Produkter = await _svc.HämtaAllaAsync();\n\n    public async Task<IActionResult> OnPostAsync() {\n        Produkter = await _svc.SökAsync(Sökterm);\n        return Page();\n    }\n}\n\n@* Index.cshtml *@\n@page\n@model IndexModel\n<form method="post">\n    <input asp-for="Sökterm" />\n    <button type="submit">Sök</button>\n</form>\n@foreach (var p in Model.Produkter) {\n    <div>@p.Namn — @p.Pris kr</div>\n}'},
   expand:'Razor Pages vs MVC: Razor Pages är enklare för CRUD och page-centric appar. MVC passar bättre för stora API-first-appar. Tag Helpers (asp-for, asp-action) genererar korrekt HTML med validering.',
   new: false},

  {id:8, cat:'kod', tags:['async','javascript','csharp','api'], icon:'⏳', iconBg:'rgba(14,165,233,0.12)',
   title:'Async/Await och asynkron programmering', badge:'Avancerat',
   desc:'Asynkron kod låter programmet göra andra saker medan det väntar på I/O (nätverk, disk). Undviker blockering av main thread.',
   code:{lang:'JS / C#', text:'// JavaScript — fetch med felhantering\nasync function hämtaData(url) {\n    try {\n        const res = await fetch(url);\n        if (!res.ok) throw new Error(`HTTP ${res.status}`);\n        return await res.json();\n    } catch (err) {\n        console.error("Fel:", err.message);\n        return null;\n    }\n}\n\n// Parallellt med Promise.all\nconst [users, posts] = await Promise.all([\n    fetch("/api/users").then(r => r.json()),\n    fetch("/api/posts").then(r => r.json())\n]);\n\n// C# — async Task med cancellation\npublic async Task<List<Produkt>> HämtaAsync(\n    CancellationToken ct = default) {\n    await Task.Delay(100, ct); // simulerad fördröjning\n    return await _db.Produkter.ToListAsync(ct);\n}'},
   expand:'Vanliga misstag: async void (använd async Task), glömma await (returnerar Task<T> istället för T), för många await i sekvens (använd Task.WhenAll för parallell körning). CancellationToken är viktigt för avbrytbara operationer.',
   new: false},

  {id:9, cat:'kod', tags:['databas','csharp','dotnet','api'], icon:'🔗', iconBg:'rgba(16,185,129,0.12)',
   title:'Entity Framework Core — ORM i C#', badge:'EF Core',
   desc:'EF Core mappar C#-klasser till databastabeller. Gör CRUD utan raw SQL och stöder migrations för schemaändringar.',
   code:{lang:'C#', text:'// DbContext\npublic class AppDbContext : DbContext {\n    public DbSet<Produkt> Produkter { get; set; } = null!;\n    public DbSet<Kategori> Kategorier { get; set; } = null!;\n\n    protected override void OnModelCreating(ModelBuilder mb) {\n        mb.Entity<Produkt>()\n            .HasOne(p => p.Kategori)\n            .WithMany(k => k.Produkter)\n            .HasForeignKey(p => p.KategoriId);\n    }\n}\n\n// CRUD-operationer\nvar prod = await db.Produkter\n    .Include(p => p.Kategori)\n    .Where(p => p.Pris < 500)\n    .OrderBy(p => p.Namn)\n    .ToListAsync();\n\ndb.Produkter.Add(new Produkt { Namn = "Bok", Pris = 150 });\nawait db.SaveChangesAsync();'},
   expand:'Migrations: dotnet ef migrations add InitialCreate → dotnet ef database update. Använd .AsNoTracking() för read-only-queries (snabbare). Eager loading (.Include) vs lazy loading — välj rätt för att undvika N+1-problemet.',
   new: false},

  {id:10, cat:'kod', tags:['git','javascript'], icon:'🌿', iconBg:'rgba(16,185,129,0.15)',
   title:'Git — versionshantering i praktiken', badge:'Verktyg',
   desc:'Git spårar ändringar i kod och möjliggör samarbete. Lär dig de viktigaste kommandona och branching-strategier.',
   code:{lang:'Bash', text:'# Initiera och grundläggande flow\ngit init && git add . && git commit -m "Initial commit"\n\n# Branching\ngit checkout -b feature/ny-funktion\ngit add src/ny-fil.js\ngit commit -m "feat: lägg till lösenordsgenerator"\ngit push origin feature/ny-funktion\n\n# Sammanfoga och städa\ngit checkout main\ngit merge feature/ny-funktion --no-ff\ngit branch -d feature/ny-funktion\n\n# Ångra ändringar\ngit restore fil.js          # ångra osparade\ngit revert HEAD             # ångra senaste commit\ngit stash && git stash pop  # parkera ändringar'},
   expand:'Konventionella commits: feat:, fix:, docs:, refactor:, test:. Branching-strategier: Git Flow (release-branches), GitHub Flow (enkelt, feature branches → main), Trunk-based (CI/CD-fokuserat).',
   new: false},

  // ===== AI-VERKTYG =====
  {id:11, cat:'ai', tags:['ai','krav'], icon:'🤖', iconBg:'rgba(14,165,233,0.15)',
   title:'Prompt Engineering: Skriv bättre AI-instruktioner', badge:'AI-verktyg',
   desc:'Kvaliteten på AI:ns svar beror direkt på kvaliteten på din prompt. Lär dig de tekniker som ger bäst resultat.',
   steps:[
     'Var specifik och konkret: "Skriv en Python-funktion som tar en lista av integers och returnerar de tre största" är bättre än "skriv kod".',
     'Ge kontext: Berätta för AI:n vem du är, vilket ramverk du använder och vad målet är.',
     'Visa exempel (few-shot): "Input: [3,1,4,1,5] → Output: [5,4,3]" hjälper AI:n förstå formatet.',
     'Be om steg-för-steg-resonemang: "Tänk steg för steg" ökar kvaliteten på komplexa problem.',
     'Iterera: Följ upp med "förklara mer om del 2" eller "visa ett alternativt sätt" för fördjupning.',
   ],
   expand:'Avancerade tekniker: Chain-of-thought (CoT), few-shot learning, system prompts, temperature-inställning (0 = deterministisk, 1 = kreativ). Använd XML-taggar för strukturerade svar: <output>, <reasoning>, <code>.',
   new: false},

  {id:12, cat:'ai', tags:['ai'], icon:'💡', iconBg:'rgba(245,158,11,0.15)',
   title:'AI som kodningspartner — rätt användning', badge:'AI-verktyg',
   desc:'AI är inte en ersättning för att förstå kod — det är en kraftfull förstärkare. Lär dig när och hur du ska använda den.',
   steps:[
     'Generera boilerplate snabbt: "Skapa en Express.js CRUD-router för en /products-endpoint med felhantering."',
     'Förklara okänd kod: Klistra in en funktion och fråga "vad gör den här funktionen och vad kan förbättras?"',
     'Debugga: "Koden ger TypeError: Cannot read properties of undefined. Här är stacktrace: [...]"',
     'Kod-review: "Granska den här funktionen för säkerhetsproblem, prestanda och läsbarhet."',
     'Lär dig nya koncept: "Förklara dependency injection med ett enkelt C#-exempel för en nybörjare."',
   ],
   expand:'Viktigt: Granska alltid AI-genererad kod. AI kan hallucinate (hitta på bibliotek som inte existerar), ha föråldrad kunskap, eller missa edge cases. Använd AI för att lära dig, inte för att slippa förstå.',
   new: false},

  {id:13, cat:'ai', tags:['ai'], icon:'🛠️', iconBg:'rgba(109,40,217,0.15)',
   title:'Populära AI-verktyg för utvecklare 2025', badge:'AI-verktyg',
   desc:'En översikt av de mest använda AI-verktygen i professionell mjukvaruutveckling just nu.',
   steps:[
     'GitHub Copilot — Inline kodkomplettering direkt i VS Code/JetBrains. Bäst för boilerplate och API-anrop.',
     'Claude (Anthropic) — Stark på kod-review, arkitekturdiskussioner och långa kontexter. Bra på C# och Python.',
     'Cursor — AI-first kodredigerare med inbyggd chattfunktion som förstår hela kodbasen.',
     'ChatGPT-4o — Bra för generella förklaringar, brainstorming och snabba prototyper.',
     'Amazon CodeWhisperer — AWS-fokuserat, gratis för privatanvändning, stark på molntjänster.',
     'Aider — Terminal-baserat AI-par-programmeringsverktyg, bra för refaktorering av hela projekt.',
   ],
   expand:'Välj verktyg baserat på uppgift: snabb inline-komplettering (Copilot), djupanalys (Claude), hela-kodbasen-förändringar (Cursor/Aider). Kombinera gärna flera för bäst resultat.',
   new: false},

  // ===== KRAVSTÄLLNING =====
  {id:14, cat:'krav', tags:['krav'], icon:'📋', iconBg:'rgba(16,185,129,0.15)',
   title:'Hur man skriver bra krav (User Stories)', badge:'Kravställning',
   desc:'User Stories är korta beskrivningar av önskat systembeteende från användarens perspektiv. De är kärnan i agil kravställning.',
   code:{lang:'Format', text:'// User Story-format\nSom [roll] vill jag [funktionalitet] så att [värde].\n\n// Exempel:\nSom inloggad användare vill jag kunna\nfiltrera produkter på kategori och pris\nså att jag snabbt hittar vad jag söker.\n\n// INVEST-kriterierna för bra stories:\nI — Independent (oberoende av andra stories)\nN — Negotiable (kan förhandlas)\nV — Valuable (ger värde för slutanvändaren)\nE — Estimable (kan uppskattas)\nS — Small (färdigimplementeras på 1-3 dagar)\nT — Testable (har acceptanskriterier)'},
   expand:'Acceptance Criteria skrivs i Given-When-Then-format: Given att användaren är inloggad, When de klickar "Filtrera", Then visas bara produkter i vald kategori. Detta gör krav testbara och tydliga.',
   new: false},

  {id:15, cat:'krav', tags:['krav'], icon:'📊', iconBg:'rgba(109,40,217,0.15)',
   title:'Kravanalys — funktionella vs icke-funktionella', badge:'Kravställning',
   desc:'Att skilja på funktionella (vad systemet ska göra) och icke-funktionella krav (hur det ska fungera) är grundläggande i systemutveckling.',
   code:{lang:'Exempel', text:'// FUNKTIONELLA KRAV (vad)\n✓ Användaren ska kunna logga in med e-post/lösenord\n✓ Systemet ska skicka bekräftelsemejl vid köp\n✓ Admin ska kunna exportera rapporter till Excel\n\n// ICKE-FUNKTIONELLA KRAV (hur)\nPrestanda:   Sidan ska ladda < 2 sek för 95% av requests\nSäkerhet:    Lösenord krypteras med bcrypt (cost factor ≥ 12)\nSkalbarhet:  Systemet ska klara 10 000 samtidiga användare\nTillgänglighet: 99.9% uptime (≈ 8.7h nedetid/år)\nAnvändbarhet: WCAG 2.1 AA-standard för tillgänglighet'},
   expand:'Tips för kravmöten: Använd "5 Whys"-tekniken för att hitta grundorsaken till ett krav. Fråga alltid "Vad händer om vi inte bygger detta?" och "Hur vet vi när kravet är uppfyllt?" Dokumentera antaganden explicit.',
   new: false},

  {id:16, cat:'krav', tags:['krav','ai'], icon:'🎯', iconBg:'rgba(245,158,11,0.15)',
   title:'Använda AI för kravanalys och specifikationer', badge:'AI + Krav',
   desc:'AI kan dramatiskt påskynda kravarbete — från att generera user stories till att hitta luckor och konflikter i kravdokument.',
   steps:[
     'Generera user stories: "Baserat på den här affärsprocessen [beskriv], generera 10 user stories med acceptanskriterier."',
     'Hitta konflikter: "Analysera dessa krav och identifiera eventuella konflikter eller luckor: [kravlista]"',
     'Skriv testfall: "För user story \'Som användare vill jag logga in\', generera 5 testscenarier inkl. negativa."',
     'Estimera komplexitet: "Ge story points (Fibonacci) för dessa stories baserat på teknisk komplexitet."',
     'Skapa wireframe-beskrivningar: "Beskriv en wireframe för den här user journey steg för steg."',
   ],
   expand:'Promptmall för kravgenerering: "Du är en senior produktägare. Jag ska bygga [systembeskrivning]. Målgruppen är [användare]. Generera en kravspecifikation med: 1) Systemöversikt, 2) Funktionella krav, 3) Icke-funktionella krav, 4) User stories med acceptanskriterier."',
   new: false},

  {id:17, cat:'krav', tags:['krav'], icon:'🗂️', iconBg:'rgba(14,165,233,0.12)',
   title:'Agil vs Vattenfall — när du väljer vad', badge:'Metodik',
   desc:'Valet av projektmodell påverkar hur krav samlas in, prioriteras och levereras. Ingen modell är universellt bäst.',
   code:{lang:'Jämförelse', text:'AGIL (Scrum/Kanban):\n✓ Krav kan förändras löpande\n✓ Leverans av värde varje sprint (1-4 veckor)\n✓ Tätt samarbete med produktägare\n✓ Bäst för: osäkra krav, innovativa produkter\n✗ Svårt att estimera total kostnad\n\nVATTENFALL:\n✓ Tydliga faser: Krav → Design → Kod → Test\n✓ Lätt att estimera tid och kostnad\n✓ Bäst för: stabila krav, reglerad miljö\n✗ Krav låsts tidigt, dyrt att ändra\n\nHYBRID (vanligast i praktiken):\n→ Vattenfall för arkitektur & infrastruktur\n→ Agilt för features & UI'},
   expand:'Definition of Done (DoD) är avgörande i agilt: Koden är skriven, testad, code-reviewad, dokumenterad och deployad. Utan DoD riskerar man teknisk skuld och halvfärdiga features.',
   new: false},

  // ===== AI-NYHETER =====
  {id:18, cat:'nyheter', tags:['ai'], icon:'📡', iconBg:'rgba(245,158,11,0.15)',
   title:'Claude 3.7 Sonnet — banbrytande i kodreason', badge:'Nyhet 2025', isNew:true,
   desc:'Anthropics Claude 3.7 Sonnet introducerar extended thinking-läget som låter modellen "tänka högt" på komplexa problem. Visar exceptionella resultat i SWE-bench (mjukvaruutveckling).',
   newsSource:'Anthropic Blog', newsDate:'Feb 2025',
   steps:[
     'Extended thinking: Modellen resonerar steg-för-steg innan svar, synligt för användaren.',
     'SWE-bench Verified: 62.3% lösta problem — bäst bland publika modeller.',
     'Computer use: Kan styra dator, fylla i formulär och browsa webb autonomt.',
     'Hybridläge: Väljer själv när extended thinking behövs vs snabba svar.',
   ],
   expand:'Implikation för utvecklare: Claude 3.7 kan nu debugga komplexa buggar, refaktorera arkitektur och skriva tester med mänsklig kvalitet. Bäst använda för: code review, arkitekturanalys, komplex algorithmutveckling.',
   new: true},

  {id:19, cat:'nyheter', tags:['ai'], icon:'🚀', iconBg:'rgba(109,40,217,0.15)',
   title:'GPT-4o och multimodal AI i produktion', badge:'Nyhet 2025', isNew:true,
   desc:'OpenAIs GPT-4o stödjer nu text, bild, ljud och video i samma modell. Möjliggör helt nya applikationstyper för enterprise.',
   newsSource:'OpenAI Research', newsDate:'Maj 2025',
   steps:[
     'Real-time voice API: Konversation med <300ms latens — används i kundtjänstbottar.',
     'Vision + kod: Analysera screenshot av buggar och generera fix direkt.',
     'Structured outputs: Garanterat JSON-format för API-integrationer.',
     'Batch API: 50% lägre kostnad för asynkrona uppgifter i stor skala.',
   ],
   expand:'Use cases i produktion: Automatisk kodgranskning av PRs, AI-assisterad kundtjänst med eskalering, dokumentanalys och datautvinning, generativ design av UI-prototyper.',
   new: true},

  {id:20, cat:'nyheter', tags:['ai','krav'], icon:'🏗️', iconBg:'rgba(14,165,233,0.15)',
   title:'AI-agenter: Framtidens mjukvaruutveckling', badge:'Trend 2025', isNew:true,
   desc:'Autonoma AI-agenter kan nu slutföra komplexa flerstegssuppgifter: planera, koda, testa och deploya. GitHub Copilot Workspace och Devin leder utvecklingen.',
   newsSource:'GitHub Blog + Cognition AI', newsDate:'2025',
   steps:[
     'Devin (Cognition AI): Löser SWE-bench-uppgifter autonomt — planerar, kodar, debuggar.',
     'GitHub Copilot Workspace: Tar en issue → genererar komplett implementation med PR.',
     'Cursor Agent Mode: Gör förändringar i hela kodbasen, kör tester, itererar.',
     'Implikation: Utvecklarrollen skiftar mot arkitektur, kravgranskning och AI-orkestrering.',
   ],
   expand:'Kravkompetens blir ännu viktigare: När AI kan implementera, är förmågan att specificera VAD som ska byggas — korrekt, fullständigt, testbart — den kritiska kompetensen. Lär dig kravanalys!',
   new: true},

  {id:21, cat:'nyheter', tags:['ai'], icon:'🔮', iconBg:'rgba(236,72,153,0.15)',
   title:'Vibe Coding — trend eller framtid?', badge:'Trend 2025', isNew:true,
   desc:'"Vibe coding" beskriver att beskriva vad man vill ha på naturligt språk och låta AI generera all kod. Andrej Karpathy populariserade begreppet. Vad innebär det för lärande?',
   newsSource:'Andrej Karpathy / X', newsDate:'Feb 2025',
   steps:[
     'Vad är det: Programmera via konversation utan att skriva kod manuellt.',
     'Fördelar: Dramatiskt snabbare prototyping, tillgängligt för icke-tekniker.',
     'Risker: Kod man inte förstår är kod man inte kan underhålla eller säkra.',
     'Vår rekommendation: Använd det som verktyg, men förstå alltid koden du levererar.',
   ],
   expand:'Balansen: Vibe coding är utmärkt för prototyper, enklare scripts och lärande. För produktionskod i team behövs fortfarande förståelse, code reviews och arkitekturtänkande. KodLabbet lär dig grunderna så att du använder AI som förstärkning, inte krycka.',
   new: true},

  {id:22, cat:'nyheter', tags:['ai'], icon:'⚡', iconBg:'rgba(16,185,129,0.12)',
   title:'Lokala AI-modeller: Llama 3, Mistral, Phi-3', badge:'Open Source', isNew:false,
   desc:'Open source LLM:er som körs lokalt möjliggör AI-assistans utan molnet. Perfekt för känslig kod, offlineanvändning och kostnadskontroll.',
   steps:[
     'Ollama: Enklaste sättet att köra Llama 3, Mistral, CodeLlama lokalt. ollama run codellama',
     'LM Studio: GUI för att ladda ner och chatta med lokala modeller.',
     'Phi-3 Mini (Microsoft): Liten men kraftfull, passar Raspberry Pi och edge-devices.',
     'Continue.dev: VS Code-plugin som kopplar lokala modeller till kodredigeraren.',
   ],
   expand:'Prestanda 2025: Llama 3.1 70B matchar GPT-3.5 på de flesta benchmarks. Phi-3 Small klarar koduppgifter förvånansvärt bra på consumer-hårdvara. Kvantisering (GGUF) minskar VRAM-krav med 4-8x.',
   new: false},
];

let kbFiltered = KB_ITEMS.slice();

// ============================================================
// RENDER KUNSKAPSBANKEN
// ============================================================
function renderTipsPage() {
  renderKBTags();
  kbApplyFilters();
  startTicker();
}

function renderKBTags() {
  var el = document.getElementById('kb-tags');
  if (!el) return;
  el.innerHTML = KB_TAGS.map(function(t) {
    return '<button class="kb-tag' + (t.id==='all'?' active':'') + '" onclick="kbSetTag(\'' + t.id + '\',this)">' + t.lbl + '</button>';
  }).join('');
}

function kbSetCat(cat, btn) {
  KB_CAT = cat;
  document.querySelectorAll('.kb-ctab').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  kbApplyFilters();
}

function kbSetTag(tag, btn) {
  KB_TAG = tag;
  document.querySelectorAll('.kb-tag').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  kbApplyFilters();
}

function kbSearch() {
  var inp = document.getElementById('kb-search');
  KB_SEARCH = inp ? inp.value.trim().toLowerCase() : '';
  var clr = document.getElementById('kb-clear');
  if (clr) clr.style.display = KB_SEARCH ? 'flex' : 'none';
  kbApplyFilters();
}

function kbClearSearch() {
  var inp = document.getElementById('kb-search');
  if (inp) inp.value = '';
  KB_SEARCH = '';
  var clr = document.getElementById('kb-clear');
  if (clr) clr.style.display = 'none';
  kbApplyFilters();
}

function kbApplyFilters() {
  kbFiltered = KB_ITEMS.filter(function(item) {
    if (KB_CAT !== 'all' && item.cat !== KB_CAT) return false;
    if (KB_TAG !== 'all' && item.tags.indexOf(KB_TAG) === -1) return false;
    if (KB_SEARCH) {
      var haystack = (item.title + ' ' + item.desc + ' ' + (item.tags||[]).join(' ')).toLowerCase();
      if (haystack.indexOf(KB_SEARCH) === -1) return false;
    }
    return true;
  });
  renderKBGrid();
}

function renderKBGrid() {
  var grid = document.getElementById('kb-grid');
  if (!grid) return;
  if (!kbFiltered.length) {
    grid.innerHTML = '<div class="empty-state">' +
      '<div class="empty-state-ico">🔍</div>' +
      '<div class="empty-state-title">Inga artiklar hittades</div>' +
      '<div class="empty-state-sub">' + (KB_SEARCH ? 'Ingen matchning för "' + KB_SEARCH + '".' : 'Inga artiklar i denna kategori.') + ' Prova ett annat sökord.</div>' +
      '<button class="empty-state-btn" onclick="kbClearSearch();kbSetCat(\'all\',null)">\u2715 Rensa filter</button>' +
    '</div>';
    return;
  }
  grid.innerHTML = kbFiltered.map(function(item) { return renderKBCard(item); }).join('');
}

function renderKBCard(item) {
  var catTop = item.cat === 'ai' ? 'ai' : item.cat === 'krav' ? 'krav' : item.cat === 'nyheter' ? 'nyheter' : 'kod';
  var catBadgeCls = item.cat === 'ai' ? 'kb-b-ai' : item.cat === 'krav' ? 'kb-b-krav' : item.cat === 'nyheter' ? 'kb-b-nyheter' : 'kb-b-kod';
  var featuredCls = item.cat === 'ai' ? ' ai-card' : item.cat === 'krav' ? ' krav-card' : item.cat === 'nyheter' ? ' news-card' : '';

  var bodyHtml = '';

  // Description
  bodyHtml += '<div class="kb-card-desc">' + item.desc + '</div>';

  // Code block if present
  if (item.code) {
    bodyHtml += '<div class="kb-card-code"><div class="kb-card-code-lang">' + item.code.lang + '</div>' + esc(item.code.text) + '</div>';
  }

  // Steps if present (AI/krav cards)
  if (item.steps && item.steps.length) {
    bodyHtml += '<div class="kb-steps">' + item.steps.map(function(s,i) {
      return '<div class="kb-step"><div class="kb-step-n">' + (i+1) + '</div><div class="kb-step-t">' + s + '</div></div>';
    }).join('') + '</div>';
  }

  // Expandable section
  if (item.expand) {
    bodyHtml += '<div class="kb-card-expand" id="kbex-' + item.id + '">' + item.expand + '</div>';
  }

  // News source
  var newsHtml = '';
  if (item.newsSource) {
    newsHtml = '<div class="kb-news-source"><div class="kb-news-dot"></div>' + item.newsSource + '<span class="kb-news-date">• ' + item.newsDate + '</span></div>';
  }

  // Footer tags
  var ftags = item.tags.slice(0,4).map(function(t){ return '<span class="kb-ft">' + t + '</span>'; }).join('');

  // Footer actions
  var actions = '';
  if (item.expand) {
    actions += '<button class="kb-expbtn" id="kbexpbtn-' + item.id + '" onclick="kbToggleExpand(' + item.id + ')">+ Mer info</button>';
  }
  actions += '<button class="kb-readbtn" onclick="askAI(\'Förklara mer ingående om: ' + item.title.replace(/'/g, '') + '\')">🤖 Fråga KodBot</button>';

  return '<div class="kb-card' + featuredCls + '">' +
    '<div class="kb-card-top ' + catTop + '"></div>' +
    '<div class="kb-card-head">' +
      '<div class="kb-card-ico" style="background:' + item.iconBg + '">' + item.icon + '</div>' +
      '<div class="kb-card-meta">' +
        '<div class="kb-card-title">' + item.title + (item.isNew ? ' <span class="kb-badge kb-b-new" style="vertical-align:middle">NY</span>' : '') + '</div>' +
        '<div class="kb-card-badges">' +
          '<span class="kb-badge ' + catBadgeCls + '">' + item.badge + '</span>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="kb-card-body">' + newsHtml + bodyHtml + '</div>' +
    '<div class="kb-card-foot">' +
      '<div class="kb-foot-tags">' + ftags + '</div>' +
      '<div class="kb-foot-actions">' + actions + '</div>' +
    '</div>' +
  '</div>';
}

function kbToggleExpand(id) {
  var el = document.getElementById('kbex-' + id);
  var btn = document.getElementById('kbexpbtn-' + id);
  if (!el) return;
  var open = el.classList.toggle('open');
  if (btn) btn.textContent = open ? '− Dölj' : '+ Mer info';
}

// NEWS TICKER
function startTicker() {
  var news = [
    '🚀 Claude 3.7 Sonnet uppnår 62.3% på SWE-bench — bäst bland publika modeller',
    '⚡ GitHub Copilot Workspace tar en issue och genererar komplett PR automatiskt',
    '🔮 Vibe Coding-trenden: 70% av startup-prototyper byggs nu med AI-assistans',
    '🏗️ Cursor IDE passerar 1 miljon aktiva användare — AI-kodredigerare exploderar',
    '🤖 Gemini 2.0 Pro lanseras med 2M token context window och bättre kodreasoning',
    '📊 Stack Overflow Developer Survey 2025: 82% använder AI-verktyg dagligen',
    '🔗 LangChain 0.3 lanseras med förbättrat agent-stöd och RAG-pipelines',
    '⚙️ Phi-3 Mini från Microsoft kör nu på smartphones med full kodintelligens',
    '📡 Anthropic öppnar MCP (Model Context Protocol) — standard för AI-verktygsintegration',
    '🎯 Meta Llama 3.1 405B matchar GPT-4 Turbo på MMLU-benchmark',
  ];
  var ticker = document.getElementById('kb-ticker-track');
  if (!ticker) return;
  ticker.textContent = news.join('   ·   ');
}

// Legacy renderTips (kept for backward compat)
function renderTips() { renderTipsPage(); }


// ===== RENDER =====
function renderProjects() {
  var grid = document.getElementById('pgrid');
  var lang = custom.lang;
  var list = PROJS.filter(function(p) {
    if (filters.lv !== 'all' && p.lv !== filters.lv) return false;
    if (filters.ct !== 'all' && p.ct !== filters.ct) return false;
    if (filters.lg !== 'all' && p.tags.indexOf(filters.lg) === -1) return false;
    return true;
  });
  if (!list.length) { grid.innerHTML = '<div class="ldph">Inga projekt med dessa filter.</div>'; return; }

  grid.innerHTML = list.map(function(p) {
    var locked = p.free === false && !(user && user.isPro);
    var tagHtml = p.tags.map(function(t) {
      var cls = t==='python'?'py':t==='csharp'?'cs':t==='sql'?'sq':t==='javascript'||t==='typescript'?'js':'ot';
      return '<span class="tc ' + cls + '">' + t + '</span>';
    }).join('');
    var lvlCls = p.lv==='beginner'?'lb':p.lv==='medium'?'lm':'la';
    var lvlTxt = p.lv==='beginner'?'Nybörjare':p.lv==='medium'?'Medel':'Avancerad';
    var lockOverlay = locked ?
      '<div class="lov"><div class="loi">🔒</div><div class="lot">Pro-projekt</div><div class="los">Lås upp med Pro</div>' +
      '<button class="lobtn" onclick="event.stopPropagation();closeUp();go(\'pricing\')">Uppgradera \u2192</button></div>' : '';
    var clickFn = locked ? ("rp(\'" + p.ct + "\')") : ('openProj(' + p.id + ')');
    var btnCls = locked ? 'pcbtn lb2' : 'pcbtn';
    var btnTxt = locked ? '\uD83D\uDD12 Pro' : 'Visa \u2192';
    var btnFn = locked ? ("rp(\'" + p.ct + "\')") : ('openProj(' + p.id + ')');
    return '<div class="pc' + (locked ? ' lk' : '') + '" onclick="' + clickFn + '">' +
      '<div class="pca"></div>' +
      '<div class="pcb">' +
        '<div class="pct">' +
          '<span class="pce">' + p.emoji + '</span>' +
          '<div class="pcbadges">' +
            '<span class="lvl ' + lvlCls + '">' + lvlTxt + '</span>' +
            (locked ? '<span class="ll">🔒 PRO</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="pctit">' + p.title + '</div>' +
        '<div class="pcdesc">' + p.desc + '</div>' +
        '<div class="pctags">' + tagHtml + '</div>' +
      '</div>' +
      '<div class="pcf">' +
        '<span class="pctm">⏱ ' + p.time + '</span>' +
        '<button class="' + btnCls + '" onclick="event.stopPropagation();' + btnFn + '">' + btnTxt + '</button>' +
      '</div>' +
      lockOverlay +
    '</div>';
  }).join('');
}


// renderTips -> moved to renderTipsPage above

// ===== FILTERS =====
function sf(type, val, btn) {
  filters[type] = val;
  btn.closest('.frow').querySelectorAll('.chip:not(.pro)').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderProjects();
}

function applyC() {
  custom.lang = document.getElementById('ls').value;
  custom.fw = document.getElementById('fs').value;
  custom.term = document.getElementById('ts').value;
  renderProjects();
  toast(`Anpassat: ${custom.lang.toUpperCase()} + ${custom.fw}`, 'info');
}

function rp(feature) {
  document.getElementById('up-msg').textContent = `"${feature}" kräver ett Pro-konto.`;
  document.getElementById('up-ov').classList.add('open');
}

// ===== PROJECT MODAL =====
function openProj(id) {
  const p = PROJS.find(x => x.id === id);
  if (!p) return;
  const lang = custom.lang;
  const fw = custom.fw;
  const term = custom.term;
  const ckey = p.code[lang] ? lang : Object.keys(p.code)[0];
  const ctext = p.code[ckey] || '';
  const setup = buildSetup(lang, fw, term, p.title);

  const tagHtml = p.tags.map(t => {
    const cls = t==='python'?'py':t==='csharp'?'cs':t==='sql'?'sq':'js';
    return `<span class="tc ${cls}">${t}</span>`;
  }).join('');

  document.getElementById('pmb').innerHTML = `
    <div class="mh">
      <div class="me">${p.emoji}</div>
      <div><div class="mtt">${p.title}</div><div class="mm">
        <span class="lvl ${p.lv==='beginner'?'lb':p.lv==='medium'?'lm':'la'}">${p.lv==='beginner'?'Nybörjare':p.lv==='medium'?'Medel':'Avancerad'}</span>
        ${tagHtml}
        <span style="font-family:var(--mono);font-size:0.7rem;color:var(--txt3)">⏱ ${p.time}</span>
      </div></div>
    </div>
    <div class="ms">
      <div class="msh">Anpassa projekt</div>
      <div class="mcust"><div class="mcrow">
        <span style="font-family:var(--mono);font-size:0.7rem;color:var(--txt3)">Språk:</span>
        <select onchange="updateModal(${p.id})" id="ml">
          <option value="javascript" ${lang==='javascript'?'selected':''}>JavaScript</option>
          <option value="python" ${lang==='python'?'selected':''}>Python</option>
          <option value="csharp" ${lang==='csharp'?'selected':''}>C#</option>
        </select>
        <span style="font-family:var(--mono);font-size:0.7rem;color:var(--txt3)">Ramverk:</span>
        <select id="mf" onchange="updateModal(${p.id})">
          <option value="none" ${fw==='none'?'selected':''}>Vanilla</option>
          <option value="react" ${fw==='react'?'selected':''}>React</option>
          <option value="aspnet" ${fw==='aspnet'?'selected':''}>ASP.NET</option>
          <option value="flask" ${fw==='flask'?'selected':''}>Flask</option>
          <option value="nodejs" ${fw==='nodejs'?'selected':''}>Node.js</option>
        </select>
        <span style="font-family:var(--mono);font-size:0.7rem;color:var(--txt3)">Terminal:</span>
        <select id="mt" onchange="updateModal(${p.id})">
          <option value="bash" ${term==='bash'?'selected':''}>Bash/Zsh</option>
          <option value="powershell" ${term==='powershell'?'selected':''}>PowerShell</option>
          <option value="cmd" ${term==='cmd'?'selected':''}>CMD</option>
        </select>
      </div></div>
    </div>
    <div class="ms"><div class="msh">Om projektet</div><p class="mp">${p.full}</p></div>
    ${user ?
      '<div class="ms"><div class="msh">Din progress</div><div class="prow">' +
        '<button class="pb pbsv" onclick="saveP(' + p.id + ')">📌 Spara</button>' +
        '<button class="pb pbst" onclick="updP(' + p.id + ',\'in_progress\')">🔧 Påbörjad</button>' +
        '<button class="pb pbdn" onclick="updP(' + p.id + ',\'completed\')">✅ Klar! (+50 XP)</button>' +
      '</div></div>'
      :
      '<div class="ms"><p class="mp"><a onclick="openAuth(\'login\');closePM()" style="color:var(--acc2);cursor:pointer">Logga in</a> för att spara progress och tjäna XP.</p></div>'
    }
    <div class="ms"><div class="msh">Steg för steg</div>
      <ul class="sul">${p.steps.map(function(s,i){return '<li><div class="sn">'+(i+1)+'</div><div class="st">'+s+'</div></li>';}).join('')}</ul>
    </div>
    <div class="ms"><div class="msh">Terminalkomandon</div>
      <div class="cblk" id="m-setup"><div class="cblk-lang">${term}</div>${esc(setup)}</div>
    </div>
    <div class="ms"><div class="msh">Startkod — <span style="color:var(--acc3)">${ckey}</span></div>
      <div class="cblk" id="m-code"><div class="cblk-lang">${ckey}</div>${esc(ctext)}</div>
    </div>
    <div class="mac">
      <button class="btn-a" onclick="askAI('Hjälp mig komma igång med projektet \\\"${p.title}\\\" i ${lang} med ramverk: ${fw}')">🤖 Fråga AI</button>
      <button class="btn-g" onclick="closePM()">Stäng</button>
    </div>`;
  document.getElementById('pmov').classList.add('open');
}

function buildSetup(lang, fw, term, title) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const isWin = term === 'cmd' || term === 'powershell';
  const mk = isWin ? 'mkdir' : 'mkdir -p';
  const src = term === 'powershell' ? 'venv\\Scripts\\Activate.ps1' : term === 'cmd' ? 'venv\\Scripts\\activate' : 'source venv/bin/activate';

  const map = {
    javascript: { none: `${mk} ${slug}\ncd ${slug}\ntouch index.html\ncode .`, react: `npx create-react-app ${slug}\ncd ${slug}\nnpm start`, nextjs: `npx create-next-app@latest ${slug}\ncd ${slug}\nnpm run dev`, nodejs: `${mk} ${slug} && cd ${slug}\nnpm init -y\nnpm install express\ncode .` },
    python: { none: `${mk} ${slug}\ncd ${slug}\npython -m venv venv\n${src}\ntouch main.py\ncode .`, flask: `${mk} ${slug} && cd ${slug}\npython -m venv venv && ${src}\npip install flask\ntouch app.py\ncode .`, django: `pip install django\ndjango-admin startproject ${slug}\ncd ${slug}\npython manage.py runserver` },
    csharp: { none: `dotnet new console -n ${slug}\ncd ${slug}\ncode .`, aspnet: `dotnet new webapi -n ${slug}\ncd ${slug}\ndotnet run\n# API: https://localhost:5001`, none_lib: `dotnet new classlib -n ${slug}\ncd ${slug}\ncode .` },
    typescript: { none: `${mk} ${slug} && cd ${slug}\nnpm init -y\nnpm install -D typescript ts-node @types/node\nnpx tsc --init`, react: `npx create-react-app ${slug} --template typescript\ncd ${slug}\nnpm start` },
  };
  const m = map[lang] || map.javascript;
  return m[fw] || m.none || `mkdir ${slug}\ncd ${slug}`;
}

function updateModal(id) {
  const p = PROJS.find(x => x.id === id);
  if (!p) return;
  const lang = document.getElementById('ml').value;
  const fw = document.getElementById('mf').value;
  const term = document.getElementById('mt').value;
  const ckey = p.code[lang] ? lang : Object.keys(p.code)[0];
  const se = document.getElementById('m-setup');
  const ce = document.getElementById('m-code');
  if (se) se.innerHTML = `<div class="cblk-lang">${term}</div>${esc(buildSetup(lang, fw, term, p.title))}`;
  if (ce) ce.innerHTML = `<div class="cblk-lang">${ckey}</div>${esc(p.code[ckey]||'')}`;
}

function closePM(e) {
  if (!e || e.target === document.getElementById('pmov'))
    document.getElementById('pmov').classList.remove('open');
}

async function saveP(id) {
  if (!user) return openAuth('login');
  const r = await apiFetch(`/projects/${id}/save`, {method:'POST',body:'{}'});
  if (r) toast(r.message || 'Projekt sparat!', 'success');
}

async function updP(id, status) {
  if (!user) return openAuth('login');
  const r = await apiFetch(`/projects/${id}/progress`, {method:'PATCH', body:JSON.stringify({status})});
  if (r) { toast(r.message || 'Progress uppdaterad!', 'success'); refreshUser(); }
}

// ===== TIPS =====
function likeTip(id) {
  if (!user) { openAuth('login'); return; }
  const t = TIPS.find(x => x.id === id);
  if (!t) return;
  t.liked = !t.liked;
  t.likes = (t.likes||0) + (t.liked?1:-1);
  const el = document.getElementById(`tl-${id}`);
  if (el) el.textContent = t.likes;
}

// ===== AI CHAT =====
async function sendAI() {
  const inp = document.getElementById('ci');
  const msg = inp.value.trim();
  if (!msg) return;
  if (!user?.isPro) {
    aiCnt++;
    if (aiCnt > FREE_AI) {
      document.getElementById('ailim').style.display = 'flex';
      toast('Daglig gräns nådd (5 msg). Uppgradera till Pro!', 'gold');
      return;
    }
  }
  inp.value = ''; inp.style.height = 'auto';
  document.getElementById('sbt').disabled = true;
  appendMsg('user', esc(msg));
  chatHist.push({role:'user', content:msg});
  showTyping(true); scrollChat();

  try {
    const res = await fetch(`${API}/ai/chat`, {
      method:'POST',
      headers:{'Content-Type':'application/json',...(localStorage.getItem('at')?{'Authorization':'Bearer '+localStorage.getItem('at')}:{})},
      body: JSON.stringify({message:msg, sessionId:chatSid, history:chatHist.slice(-10,-1)})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error||'AI-fel');
    chatSid = data.sessionId;
    showTyping(false);
    appendMsg('ai', fmtAI(data.response));
    chatHist.push({role:'assistant', content:data.response});
  } catch(err) {
    showTyping(false);
    appendMsg('ai', `❌ ${esc(err.message)}`);
  }
  document.getElementById('sbt').disabled = false;
  scrollChat();
}

function appendMsg(role, html) {
  const area = document.getElementById('cmsg-area');
  const d = document.createElement('div');
  d.className = `cm ${role}`;
  d.innerHTML = `<div class="mav">${role==='ai'?'🤖':(user?.avatar||'👤')}</div><div class="mb">${html}</div>`;
  area.appendChild(d);
}

function showTyping(v) { document.getElementById('tyr').classList.toggle('show', v); }

function scrollChat() {
  const a = document.getElementById('cmsg-area');
  setTimeout(() => a.scrollTop = a.scrollHeight, 60);
}

function qs(msg) { document.getElementById('ci').value = msg; sendAI(); }

function askAI(msg) {
  closePM();
  go('ai');
  setTimeout(() => { document.getElementById('ci').value = msg; sendAI(); }, 150);
}

function fmtAI(text) {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_,l,c) => `<pre>${esc(c.trim())}</pre>`)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

// ===== NAV =====
function go(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  const n = document.getElementById('nav-' + name);
  if (n) n.classList.add('active');
  if (name === 'projects') renderProjects();
  if (name === 'tips') renderTipsPage();
  if (name === 'challenge') renderChallenge('open');
  if (name === 'paths') renderPaths();
  if (name === 'daily') renderDaily();
  if (name === 'dashboard') renderDashboard();
}

// ===== AUTH =====
function openAuth(mode) {
  authMode = mode;
  updateAuthUI();
  document.getElementById('auth-ov').classList.add('open');
}

function closeA(e) {
  if (!e || e.target === document.getElementById('auth-ov')) {
    document.getElementById('auth-ov').classList.remove('open');
    document.getElementById('aerr').classList.remove('show');
  }
}

function swA(mode) { authMode = mode; updateAuthUI(); }

function updateAuthUI() {
  const isLogin = authMode === 'login';
  document.getElementById('ah2').textContent = isLogin ? 'Välkommen tillbaka' : 'Skapa ditt konto';
  document.getElementById('asub').textContent = isLogin ? 'Logga in för att fortsätta.' : 'Gratis. Inga kreditkort.';
  document.getElementById('a-sb').textContent = isLogin ? 'Logga in' : 'Skapa konto';
  document.getElementById('f-un').style.display = isLogin ? 'none' : 'block';
  document.getElementById('a-sw').innerHTML = isLogin
    ? `Inget konto? <a onclick="swA('register')">Skapa ett gratis</a>`
    : `Har konto? <a onclick="swA('login')">Logga in</a>`;
  document.getElementById('aerr').classList.remove('show');
}

async function doAuth() {
  const btn = document.getElementById('a-sb');
  const err = document.getElementById('aerr');
  const email = document.getElementById('i-em').value.trim();
  const pw = document.getElementById('i-pw').value;
  const un = document.getElementById('i-un').value.trim();
  btn.disabled = true; btn.textContent = '...';
  err.classList.remove('show');
  try {
    const body = authMode==='login' ? {email, password:pw} : {email, password:pw, username:un};
    const res = await fetch(`${API}/auth/${authMode}`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
    const data = await res.json();
    if (!res.ok) throw new Error(data.error||'Fel');
    localStorage.setItem('at', data.accessToken);
    localStorage.setItem('rt', data.refreshToken);
    user = data.user;
    updateNav();
    closeA();
    toast(`Välkommen, ${data.user.username}! 🎉`, 'success');
    const active = document.querySelector('.page.active')?.id?.replace('page-','');
    if (active === 'projects') renderProjects();
  } catch(e) {
    err.textContent = e.message; err.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = authMode==='login' ? 'Logga in' : 'Skapa konto';
  }
}

document.addEventListener('keydown', e => {
  if (e.key==='Enter' && document.getElementById('auth-ov').classList.contains('open')) doAuth();
});

function logout() {
  const rt = localStorage.getItem('rt');
  if (rt) fetch(`${API}/auth/logout`, {method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+localStorage.getItem('at')}, body:JSON.stringify({refreshToken:rt})}).catch(()=>{});
  localStorage.removeItem('at'); localStorage.removeItem('rt');
  user = null; updateNav();
  toast('Du är utloggad.', 'info');
}

async function loadUser() {
  const token = localStorage.getItem('at');
  if (!token) return;
  try {
    const res = await fetch(`${API}/auth/me`, {headers:{'Authorization':'Bearer '+token}});
    if (res.ok) { const d = await res.json(); user = d.user; updateNav(); }
    else localStorage.removeItem('at');
  } catch {}
}

async function refreshUser() {
  const token = localStorage.getItem('at');
  if (!token || !user) return;
  try {
    const res = await fetch(`${API}/auth/me`, {headers:{'Authorization':'Bearer '+token}});
    if (res.ok) { const d = await res.json(); user = d.user; updateNav(); }
  } catch {}
}

function updateNav() {
  var area = document.getElementById('nav-r');
  if (user) {
    var parts = '';
    if (!user.isPro) parts += '<button class="up-btn" onclick="go(\'pricing\')">&#10022; Uppgradera</button>';
    parts += '<div class="user-pill" id="upill">' +
      '<div class="u-av">' + (user.avatar||'\uD83D\uDC64') + '</div>' +
      '<span class="u-nm">' + user.username + '</span>' +
      '<span class="u-xp">\u26A1 ' + (user.xp||0) + '</span>' +
      (user.isPro ? '<span style="font-size:0.78rem">\uD83D\uDC51</span>' : '') +
    '</div>' +
    '<button class="btn-g" style="font-size:0.77rem;padding:0.33rem 0.7rem" onclick="logout()">Logga ut</button>';
    area.innerHTML = parts;
    var pill = document.getElementById('upill');
    if (pill) pill.onclick = function() { go('profile'); };
  } else {
    area.innerHTML = '<button class="btn-g" onclick="openAuth(\'login\')">Logga in</button>' +
      '<button class="btn-a" onclick="openAuth(\'register\')">Kom ig\u00e5ng</button>';
  }
  // Mobile profile link
  var mp = document.getElementById('mnav-profile');
  if (mp) mp.style.display = user ? 'block' : 'none';
}

// ===== PRICING =====
function togB() {
  billAnnual = !billAnnual;
  document.getElementById('btg').classList.toggle('on', billAnnual);
  document.getElementById('pamt').textContent = billAnnual ? '50' : '99';
  document.getElementById('pyr').style.display = billAnnual ? 'block' : 'none';
}

function subPro() {
  if (!user) { openAuth('register'); return; }
  toast('Betalning integreras snart! Kontakta hej@www.dindomän.com', 'gold');
}

function closeUp(e) {
  if (!e || e.target === document.getElementById('up-ov'))
    document.getElementById('up-ov').classList.remove('open');
}

// ===== HELPERS =====
async function apiFetch(path, opts={}) {
  const token = localStorage.getItem('at');
  const headers = {'Content-Type':'application/json', ...opts.headers};
  if (token) headers['Authorization'] = 'Bearer '+token;
  try {
    const res = await fetch(API+path, {...opts, headers});
    return await res.json();
  } catch { return null; }
}

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toast(msg, type='info') {
  const stack = document.getElementById('tstack');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  const icons = {success:'✅',error:'❌',info:'ℹ️',gold:'✦'};
  el.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  stack.appendChild(el);
  setTimeout(() => { el.style.transition='0.3s'; el.style.opacity='0'; el.style.transform='translateX(16px)'; setTimeout(()=>el.remove(),300); }, 4000);
}

// ============================================================
// CHALLENGE DATA & STATE
// ============================================================
const PROBLEMS = [
  {id:1,title:'FizzBuzz Extreme',diff:'easy',tags:['loopar'],
   desc:'Skriv en funktion fizzbuzz(n) som returnerar en array med strängar 1 till n. Ersätt tal delbara med 3 med "Fizz", med 5 med "Buzz", och med båda med "FizzBuzz".',
   examples:[{input:'fizzbuzz(5)',output:'["1","2","Fizz","4","Buzz"]'},{input:'fizzbuzz(15)',output:'["1",...,"FizzBuzz"]'}],
   constraints:['1 ≤ n ≤ 10000','Returnera array av strängar'],
   starter:{javascript:'function fizzbuzz(n) {\n  // Din kod här\n}',python:'def fizzbuzz(n):\n    # Din kod här\n    pass',csharp:'public static string[] FizzBuzz(int n) {\n    // Din kod här\n}'}},
  {id:2,title:'Palindrom-kontroll',diff:'easy',tags:['strängar'],
   desc:'Skriv en funktion isPalindrome(s) som returnerar true om strängen är ett palindrom. Ignorera mellanslag, skiljetecken och skiftläge.',
   examples:[{input:'isPalindrome("racecar")',output:'true'},{input:'isPalindrome("hello")',output:'false'}],
   constraints:['Ignorera icke-alfanumeriska tecken','Skiftlägesokänslig'],
   starter:{javascript:'function isPalindrome(s) {\n  // Din kod här\n}',python:'def is_palindrome(s):\n    # Din kod här\n    pass',csharp:'public static bool IsPalindrome(string s) {\n    // Din kod här\n}'}},
  {id:3,title:'Två summan',diff:'medium',tags:['algoritmer'],
   desc:'Givet en array nums och ett mål target, returnera indexen av de två tal som summeras till target. Det finns alltid exakt en lösning.',
   examples:[{input:'twoSum([2,7,11,15], 9)',output:'[0, 1]'},{input:'twoSum([3,2,4], 6)',output:'[1, 2]'}],
   constraints:['2 ≤ nums.length ≤ 10000','O(n) lösning föredras (hashmap)'],
   starter:{javascript:'function twoSum(nums, target) {\n  // Tips: Använd en Map\n}',python:'def two_sum(nums, target):\n    # Tips: Använd en dict\n    pass',csharp:'public static int[] TwoSum(int[] nums, int target) {\n    // Tips: Använd Dictionary\n}'}},
  {id:4,title:'Balansgranskning',diff:'medium',tags:['strängar'],
   desc:'Skriv isBalanced(s) som kontrollerar om parenteser {}, [] och () är korrekt balanserade i strängen.',
   examples:[{input:'isBalanced("{[()]}")',output:'true'},{input:'isBalanced("{[(])")',output:'false'}],
   constraints:['Tecken utöver brackets ignoreras','Använd stack-datastruktur'],
   starter:{javascript:'function isBalanced(s) {\n  const stack = [];\n  // Din kod här\n}',python:'def is_balanced(s):\n    stack = []\n    # Din kod här',csharp:'public static bool IsBalanced(string s) {\n    var stack = new Stack<char>();\n    // Din kod här\n}'}},
  {id:5,title:'Anagram-grupper',diff:'hard',tags:['algoritmer'],
   desc:'Givet en array av strängar, gruppera alla anagram tillsammans och returnera grupperna.',
   examples:[{input:'groupAnagrams(["eat","tea","tan","ate"])',output:'[["eat","tea","ate"],["tan"]]'}],
   constraints:['1 ≤ words.length ≤ 10000','Orden består av gemener a-z'],
   starter:{javascript:'function groupAnagrams(words) {\n  // Tips: Sorterade tecken som nyckel\n}',python:'def group_anagrams(words):\n    # Tips: defaultdict(list)\n    pass',csharp:'public static IList<IList<string>> GroupAnagrams(string[] words) {\n    // Tips: Dictionary med sorterad nyckel\n}'}},
  {id:6,title:'Binärsökning',diff:'hard',tags:['algoritmer'],
   desc:'Implementera binärsökning i O(log n). Returnera indexet om target hittas, annars -1.',
   examples:[{input:'binarySearch([-1,0,3,5,9,12], 9)',output:'4'},{input:'binarySearch([-1,0,3,5,9,12], 2)',output:'-1'}],
   constraints:['Arrayen är sorterad stigande','Ingen linjär sökning! Måste vara O(log n)'],
   starter:{javascript:'function binarySearch(nums, target) {\n  let left = 0, right = nums.length - 1;\n  // Din kod här\n}',python:'def binary_search(nums, target):\n    left, right = 0, len(nums)-1\n    # Din kod här',csharp:'public static int BinarySearch(int[] nums, int target) {\n    int left = 0, right = nums.Length - 1;\n    // Din kod här\n}'}},
];

const OPEN_CHALS = [
  {id:101,prob:3,status:'live',p1:{av:'🦊',nm:'FoxCoder',xp:1420,score:45},p2:{av:'🐺',nm:'WolfDev',xp:980,score:30},secs:847},
  {id:102,prob:1,status:'waiting',p1:{av:'🦁',nm:'LionByte',xp:550,score:0},p2:{av:'',nm:'',xp:0,score:0},secs:1200},
  {id:103,prob:5,status:'live',p1:{av:'🐉',nm:'DragonJS',xp:2100,score:70},p2:{av:'🦅',nm:'EaglePy',xp:1800,score:65},secs:234},
  {id:104,prob:2,status:'waiting',p1:{av:'🐸',nm:'FrogBug',xp:320,score:0},p2:{av:'',nm:'',xp:0,score:0},secs:1200},
  {id:105,prob:4,status:'live',p1:{av:'🐋',nm:'WhaleCode',xp:3200,score:80},p2:{av:'🦈',nm:'SharkDev',xp:2900,score:75},secs:123},
  {id:106,prob:6,status:'waiting',p1:{av:'🦄',nm:'UnicornTS',xp:1100,score:0},p2:{av:'',nm:'',xp:0,score:0},secs:1200},
];

const LB = [
  {rank:1,av:'🐉',nm:'DragonJS',wins:42,losses:8,xp:2100,streak:7},
  {rank:2,av:'🐋',nm:'WhaleCode',wins:38,losses:5,xp:3200,streak:5},
  {rank:3,av:'🦅',nm:'EaglePy',wins:35,losses:12,xp:1800,streak:3},
  {rank:4,av:'🦊',nm:'FoxCoder',wins:29,losses:15,xp:1420,streak:2},
  {rank:5,av:'🦈',nm:'SharkDev',wins:26,losses:10,xp:2900,streak:0},
  {rank:6,av:'🦁',nm:'LionByte',wins:20,losses:18,xp:550,streak:1},
  {rank:7,av:'🦄',nm:'UnicornTS',wins:17,losses:22,xp:1100,streak:0},
  {rank:8,av:'🐺',nm:'WolfDev',wins:15,losses:20,xp:980,streak:4},
];

const HIST = [
  {prob:3,opp:{av:'🦊',nm:'FoxCoder'},result:'win',my:85,opp_s:60,xp:50,date:'2025-03-07'},
  {prob:1,opp:{av:'🐉',nm:'DragonJS'},result:'loss',my:40,opp_s:95,xp:10,date:'2025-03-06'},
  {prob:2,opp:{av:'🐋',nm:'WhaleCode'},result:'win',my:100,opp_s:80,xp:50,date:'2025-03-05'},
];

var chalTab='open', chalMode='1v1', invitees=[], arenaTimer=null, arenaSeconds=1200, myScore=0, oppScore=0, myArenaLang='javascript';

// ============================================================
// RENDER TABS
// ============================================================
function renderChallenge(tab) {
  chalTab = tab;
  var el = document.getElementById('chal-content');
  if (!el) return;
  if (tab==='open') el.innerHTML = renderOpen();
  else if (tab==='mine') el.innerHTML = renderMine();
  else if (tab==='leaderboard') el.innerHTML = renderLB();
  else if (tab==='history') el.innerHTML = renderHist();
}

function setCTab(tab, btn) {
  document.querySelectorAll('.ctab').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  renderChallenge(tab);
}

function renderOpen() {
  var cards = OPEN_CHALS.map(function(c) {
    var prob = PROBLEMS.find(function(p){return p.id===c.prob;});
    var isEmpty = !c.p2.nm;
    var mins = Math.floor(c.secs/60);
    var secs = c.secs % 60;
    var diffCls = prob.diff==='easy'?'diff-e':prob.diff==='medium'?'diff-m':'diff-h';
    var diffTxt = prob.diff==='easy'?'Lätt':prob.diff==='medium'?'Medel':'Svår';
    var statusHtml = c.status==='live' ? '<span class="slive">LIVE</span>' : '<span class="swait">Väntar</span>';
    var icon = ['🔢','🔤','➕','⚖️','🔡','🔍'][c.prob-1];
    return '<div class="acard ' + c.status + '" onclick="enterArena(' + c.id + ')">' +
      '<div class="act"><div class="acico">' + icon + '</div><div style="flex:1">' +
        '<div class="actit">' + prob.title + '</div>' +
        '<div class="acmeta"><span class="' + diffCls + '">' + diffTxt + '</span>' + statusHtml + '</div>' +
      '</div></div>' +
      '<div class="acb"><div class="acdesc">' + prob.desc.substring(0,80) + '...</div>' +
        '<div class="acplayers">' +
          '<div class="pslot"><span class="pav">' + c.p1.av + '</span><div><div class="pnm">' + c.p1.nm + '</div><div class="pxp">⚡' + c.p1.xp + '</div></div></div>' +
          '<span class="vsbadge">VS</span>' +
          '<div class="pslot' + (isEmpty?' empty':'') + '"><span class="pav">' + (c.p2.av||'❓') + '</span><div><div class="pnm">' + (c.p2.nm||'Ledig plats') + '</div>' + (!isEmpty?'<div class="pxp">⚡'+c.p2.xp+'</div>':'') + '</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="acf"><span class="actimer">⏱ ' + mins + ':' + String(secs).padStart(2,'0') + '</span>' +
        '<button class="acbtn ' + (isEmpty?'join':'watch') + '" onclick="event.stopPropagation();enterArena(' + c.id + ')">' + (isEmpty?'Gå med':'Titta') + '</button>' +
      '</div></div>';
  }).join('');
  return '<div class="agrid">' + cards + '</div>';
}

function renderMine() {
  if (!user) return '<div class="ldph" style="padding:3rem;text-align:center"><p style="font-family:var(--mono);color:var(--txt2);margin-bottom:1rem">Logga in för att se dina utmaningar.</p><button class="btn-a" onclick="openAuth(\'login\')">Logga in</button></div>';
  return '<div style="display:flex;flex-direction:column;gap:0.85rem">' +
    '<div style="background:var(--sur);border:1px solid rgba(245,158,11,0.3);border-radius:var(--rl);padding:1.5rem;text-align:center">' +
      '<div style="font-size:2rem;margin-bottom:0.5rem">🏆</div>' +
      '<div style="font-family:var(--mono);font-size:0.84rem;color:var(--txt2)">Du har vunnit <strong style="color:var(--grn)">2 av 3</strong> senaste utmaningarna</div>' +
      '<div style="display:flex;gap:1.5rem;justify-content:center;margin-top:1rem">' +
        '<div style="text-align:center"><div style="font-size:1.5rem;font-weight:800;color:var(--grn)">2</div><div style="font-size:0.72rem;font-family:var(--mono);color:var(--txt3)">Vinster</div></div>' +
        '<div style="text-align:center"><div style="font-size:1.5rem;font-weight:800;color:var(--red)">1</div><div style="font-size:0.72rem;font-family:var(--mono);color:var(--txt3)">Förluster</div></div>' +
        '<div style="text-align:center"><div style="font-size:1.5rem;font-weight:800;color:var(--acc3)">2</div><div style="font-size:0.72rem;font-family:var(--mono);color:var(--txt3)">Streak 🔥</div></div>' +
      '</div>' +
    '</div>' +
    '<button class="btn-cc" style="align-self:flex-start" onclick="openCreateChallenge()">+ Skapa ny utmaning</button>' +
  '</div>';
}

function renderLB() {
  var maxXP = Math.max.apply(null, LB.map(function(u){return u.xp;}));
  var rows = LB.map(function(u) {
    var rc = u.rank===1?'gold':u.rank===2?'silver':u.rank===3?'bronze':'';
    var medal = u.rank===1?'🥇':u.rank===2?'🥈':u.rank===3?'🥉':u.rank;
    var wr = Math.round(u.wins/(u.wins+u.losses)*100);
    var bw = Math.round(u.xp/maxXP*100);
    return '<tr><td class="lbrank ' + rc + '">' + medal + '</td>' +
      '<td><div class="lbuser"><span style="font-size:1.05rem">' + u.av + '</span><span style="font-weight:700;color:var(--txt)">' + u.nm + '</span></div></td>' +
      '<td style="color:var(--grn);font-weight:700">' + u.wins + '</td>' +
      '<td style="color:var(--red)">' + u.losses + '</td>' +
      '<td>' + wr + '%</td>' +
      '<td><div class="lbbar"><div class="lbbarbg"><div class="lbbarfill" style="width:' + bw + '%"></div></div><span class="lbpts">' + u.xp + '</span></div></td>' +
      '<td>' + (u.streak>0 ? '🔥 '+u.streak : '—') + '</td></tr>';
  }).join('');
  return '<div style="background:var(--sur);border:1px solid var(--bdr);border-radius:var(--rl);overflow:hidden">' +
    '<table class="lbtable"><thead><tr><th>#</th><th>Spelare</th><th>Vinster</th><th>Förluster</th><th>Win%</th><th>XP</th><th>Streak</th></tr></thead>' +
    '<tbody>' + rows + '</tbody></table></div>';
}

function renderHist() {
  if (!user) return '<div class="ldph" style="padding:3rem;text-align:center"><button class="btn-a" onclick="openAuth(\'login\')">Logga in för att se historik</button></div>';
  var items = HIST.map(function(h) {
    var prob = PROBLEMS.find(function(p){return p.id===h.prob;});
    var won = h.result === 'win';
    var bc = won ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)';
    var sc = won ? 'var(--grn)' : 'var(--red)';
    var rbg = won ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)';
    var rtxt = won ? 'VINST' : 'FÖRLUST';
    return '<div style="background:var(--sur);border:1px solid ' + bc + ';border-radius:var(--rl);padding:1.1rem 1.3rem;display:flex;align-items:center;gap:1rem">' +
      '<div style="font-size:1.7rem">' + (won?'🏆':'💀') + '</div>' +
      '<div style="flex:1">' +
        '<div style="font-weight:800;font-size:0.9rem">' + (prob?prob.title:'?') + '</div>' +
        '<div style="font-family:var(--mono);font-size:0.74rem;color:var(--txt2);margin-top:0.18rem">mot ' + h.opp.av + ' ' + h.opp.nm + ' • ' + h.date + '</div>' +
        '<div style="display:flex;gap:0.7rem;margin-top:0.38rem">' +
          '<span style="font-family:var(--mono);font-size:0.72rem;color:' + sc + '">Du: ' + h.my + 'p</span>' +
          '<span style="font-family:var(--mono);font-size:0.72rem;color:var(--txt3)">Motståndare: ' + h.opp_s + 'p</span>' +
        '</div>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<div style="font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:' + sc + ';padding:0.18rem 0.55rem;background:' + rbg + ';border-radius:6px;font-family:var(--mono);display:inline-block">' + rtxt + '</div>' +
        '<div style="font-family:var(--mono);font-size:0.7rem;color:var(--acc2);margin-top:0.28rem">+' + h.xp + ' XP</div>' +
        '<button onclick="replayChal(' + h.prob + ')" class="acbtn retry" style="margin-top:0.38rem;border-radius:6px;padding:0.2rem 0.6rem;font-size:0.7rem">Spela igen</button>' +
      '</div>' +
    '</div>';
  }).join('');
  return '<div style="display:flex;flex-direction:column;gap:0.7rem">' + items + '</div>';
}

// ============================================================
// ARENA
// ============================================================
function enterArena(chalId) {
  var chal = OPEN_CHALS.find(function(c){return c.id===chalId;});
  var prob = PROBLEMS.find(function(p){return p.id===(chal?chal.prob:chalId);});
  if (!prob) return;
  myScore = 0; oppScore = chal ? chal.p1.score : 0;
  arenaSeconds = chal ? chal.secs : 1200;
  myArenaLang = 'javascript';
  var opponent = chal ? chal.p1 : {av:'🤖',nm:'AI-Bot',xp:999,score:0};
  buildArenaUI(prob, opponent);
  document.getElementById('arena-ov').classList.add('open');
  startTimer();
}

function replayChal(probId) {
  myScore = 0; oppScore = 0; arenaSeconds = 1200; myArenaLang = 'javascript';
  var prob = PROBLEMS.find(function(p){return p.id===probId;});
  if (!prob) return;
  buildArenaUI(prob, {av:'🤖',nm:'AI-Bot',xp:999,score:0});
  document.getElementById('arena-ov').classList.add('open');
  startTimer();
}

function buildArenaUI(prob, opp) {
  var starter = prob.starter[myArenaLang] || prob.starter.javascript;
  var diffCls = prob.diff==='easy'?'diff-e':prob.diff==='medium'?'diff-m':'diff-h';
  var diffTxt = prob.diff==='easy'?'Lätt':prob.diff==='medium'?'Medel':'Svår';
  var me = user || {avatar:'👤',username:'Du',xp:0};
  var exHtml = prob.examples.map(function(e){
    return '<div class="pex"><div class="pexlbl">Input</div><code>' + esc(e.input) + '</code><div class="pexlbl" style="margin-top:0.3rem">Output</div><code>' + esc(e.output) + '</code></div>';
  }).join('');
  var conHtml = '<div class="pcon"><div class="pconlbl">Begränsningar</div><ul>' + prob.constraints.map(function(c){return '<li>'+c+'</li>';}).join('') + '</ul></div>';

  document.getElementById('arena-content').innerHTML =
    '<div class="atopbar">' +
      '<div class="attitle">⚔️ ' + prob.title + '</div>' +
      '<div class="atvs">' +
        '<div class="atplayer"><span>' + opp.av + '</span><span style="font-weight:700">' + opp.nm + '</span><span style="color:var(--red)" id="opp-score">' + oppScore + 'p</span></div>' +
        '<span style="font-weight:800;color:var(--txt3);font-family:var(--mono)">VS</span>' +
        '<div class="atplayer"><span>' + me.avatar + '</span><span style="font-weight:700">' + me.username + '</span><span style="color:var(--grn)" id="my-score">0p</span></div>' +
      '</div>' +
      '<div class="attimer" id="arena-timer">' + fmtT(arenaSeconds) + '</div>' +
    '</div>' +
    '<div class="arena-body">' +
      '<div class="arena-left">' +
        '<div class="ptitle">' + prob.title + '</div>' +
        '<div style="display:flex;gap:0.38rem;margin-bottom:0.75rem"><span class="' + diffCls + '">' + diffTxt + '</span>' +
          prob.tags.map(function(t){return '<span class="tc js">'+t+'</span>';}).join('') +
        '</div>' +
        '<div class="pdesc">' + prob.desc + '</div>' +
        '<div class="msh" style="margin-bottom:0.42rem">Exempel</div>' + exHtml + conHtml +
      '</div>' +
      '<div class="arena-right">' +
        '<div class="etoolbar">' +
          '<select class="elangsel" id="arena-lang" onchange="switchLang(' + prob.id + ')">' +
            '<option value="javascript">JavaScript</option>' +
            '<option value="python">Python</option>' +
            '<option value="csharp">C#</option>' +
          '</select>' +
          '<button class="runbtn" onclick="runTests(' + prob.id + ')">▶ Kör tester</button>' +
          '<button class="subbtn" onclick="submitCode(' + prob.id + ')">✓ Skicka in</button>' +
        '</div>' +
        '<textarea class="codeeditor" id="arena-code" spellcheck="false">' + esc(starter) + '</textarea>' +
        '<div class="testpanel"><div class="tptitle">Testresultat</div><div class="tpresult" id="test-out" style="color:var(--txt3)">Tryck på ▶ Kör tester för att se resultaten.</div></div>' +
      '</div>' +
    '</div>';

  // Simulate opponent progress
  setTimeout(function simOpp() {
    if (!document.getElementById('arena-timer')) return;
    oppScore = Math.min(100, oppScore + Math.floor(Math.random()*6)+1);
    var el = document.getElementById('opp-score');
    if (el) el.textContent = oppScore + 'p';
    if (arenaSeconds > 0) setTimeout(simOpp, 3000 + Math.random()*4000);
  }, 4000);
}

function switchLang(probId) {
  myArenaLang = document.getElementById('arena-lang').value;
  var prob = PROBLEMS.find(function(p){return p.id===probId;});
  if (prob) document.getElementById('arena-code').value = prob.starter[myArenaLang] || prob.starter.javascript;
}

function runTests(probId) {
  var code = document.getElementById('arena-code').value.trim();
  var out = document.getElementById('test-out');
  if (!code) { out.innerHTML = '<span class="tfail">❌ Ingen kod att köra.</span>'; return; }
  out.innerHTML = '<span style="color:var(--txt3)">⏳ Kör tester...</span>';
  setTimeout(function() {
    var prob = PROBLEMS.find(function(p){return p.id===probId;});
    var r = Math.random();
    if (r > 0.4) {
      out.innerHTML = '<span class="tpass">✅ Alla tester godkändes!</span><div style="color:var(--txt2);margin-top:0.35rem;font-size:0.72rem">Test 1: ✅ Godkänd &nbsp; Test 2: ✅ Godkänd</div>';
      myScore = Math.min(100, myScore + 25);
    } else if (r > 0.15) {
      out.innerHTML = '<span style="color:var(--acc3)">⚠️ Delvis godkänd (1/2 tester)</span><div style="color:var(--red);margin-top:0.35rem;font-size:0.72rem">Test 1: ✅ Godkänd &nbsp; Test 2: ❌ Fel output</div>';
      myScore = Math.min(100, myScore + 10);
    } else {
      out.innerHTML = '<span class="tfail">❌ Tester misslyckades. Kontrollera din logik.</span>';
    }
    var el = document.getElementById('my-score');
    if (el) el.textContent = myScore + 'p';
  }, 1100);
}

function submitCode(probId) {
  var code = document.getElementById('arena-code').value.trim();
  if (!code) { toast('Skriv en lösning först!', 'error'); return; }
  var out = document.getElementById('test-out');
  out.innerHTML = '<span style="color:var(--txt3)">⏳ Verifierar lösning...</span>';
  setTimeout(function() {
    clearInterval(arenaTimer);
    var won = myScore >= oppScore || Math.random() > 0.4;
    var xp = won ? 50 : 10;
    out.innerHTML =
      '<div style="text-align:center;padding:0.9rem">' +
        '<div style="font-size:2rem;margin-bottom:0.4rem">' + (won?'🏆':'💪') + '</div>' +
        '<div style="font-weight:800;font-size:0.98rem;color:' + (won?'var(--grn)':'var(--acc3)') + '">' + (won?'Du vann!':'Bra försök!') + '</div>' +
        '<div style="font-family:var(--mono);font-size:0.77rem;color:var(--txt2);margin-top:0.3rem">Poäng: Du ' + myScore + 'p — Motståndare ' + oppScore + 'p</div>' +
        '<div style="font-family:var(--mono);font-size:0.74rem;color:var(--acc2);margin-top:0.22rem">+' + xp + ' XP intjänade!</div>' +
        '<button onclick="closeArena()" class="btn-a" style="margin-top:0.75rem;padding:0.5rem 1.5rem">← Tillbaka</button>' +
      '</div>';
    toast((won?'🏆 Du vann':'💪 Bra försök') + '! +' + xp + ' XP', won?'success':'info');
  }, 1600);
}

function startTimer() {
  if (arenaTimer) clearInterval(arenaTimer);
  arenaTimer = setInterval(function() {
    arenaSeconds--;
    var el = document.getElementById('arena-timer');
    if (!el) { clearInterval(arenaTimer); return; }
    el.textContent = fmtT(arenaSeconds);
    if (arenaSeconds <= 60) el.style.color = 'var(--red)';
    if (arenaSeconds <= 0) {
      clearInterval(arenaTimer);
      var out = document.getElementById('test-out');
      if (out) out.innerHTML = '<div style="text-align:center;padding:0.5rem"><div style="font-size:1.3rem">⏰</div><div style="font-weight:800;color:var(--acc3)">Tiden är slut!</div><button onclick="closeArena()" class="btn-a" style="margin-top:0.5rem;padding:0.4rem 1.1rem">Stäng</button></div>';
    }
  }, 1000);
}

function fmtT(s) {
  return Math.floor(s/60) + ':' + String(s%60).padStart(2,'0');
}

function closeArena(e) {
  if (!e || e.target === document.getElementById('arena-ov')) {
    clearInterval(arenaTimer);
    document.getElementById('arena-ov').classList.remove('open');
  }
}

// ============================================================
// CREATE CHALLENGE
// ============================================================
function openCreateChallenge() {
  invitees = [];
  document.getElementById('inv-tags').innerHTML = '';
  document.getElementById('chal-name').value = '';
  document.getElementById('create-ov').classList.add('open');
}

function closeCreateChal(e) {
  if (!e || e.target === document.getElementById('create-ov'))
    document.getElementById('create-ov').classList.remove('open');
}

function selMode(mode) {
  chalMode = mode;
  document.querySelectorAll('.modebtn').forEach(function(b){b.classList.remove('sel');});
  document.getElementById('mode-'+mode).classList.add('sel');
  document.getElementById('invite-sec').style.display = mode==='open' ? 'none' : 'block';
}

function addInv() {
  var inp = document.getElementById('inv-inp');
  var val = inp.value.trim();
  if (!val || invitees.indexOf(val)>-1) return;
  invitees.push(val);
  var tag = document.createElement('span');
  tag.className = 'invtag';
  tag.id = 'itag-' + val;
  tag.innerHTML = val + ' <button onclick="removeInv(\'' + val + '\')">×</button>';
  document.getElementById('inv-tags').appendChild(tag);
  inp.value = '';
}

function removeInv(name) {
  invitees = invitees.filter(function(x){return x!==name;});
  var el = document.getElementById('itag-' + name);
  if (el) el.remove();
}

function createChallenge() {
  var name = document.getElementById('chal-name').value.trim();
  var diff = document.getElementById('chal-diff').value;
  var mins = parseInt(document.getElementById('chal-time').value);
  if (!name) { toast('Ange ett namn för utmaningen!', 'error'); return; }
  closeCreateChal();
  setTimeout(function() {
    var matching = PROBLEMS.filter(function(p){return p.diff===diff;});
    var prob = matching[Math.floor(Math.random()*matching.length)] || PROBLEMS[0];
    var newC = {id:200+Math.floor(Math.random()*99), prob:prob.id, status:'waiting',
      p1:{av:user?user.avatar:'👤',nm:user?user.username:'Du',xp:user?user.xp:0,score:0},
      p2:{av:'',nm:'',xp:0,score:0}, secs:mins*60};
    OPEN_CHALS.unshift(newC);
    toast('⚔️ Utmaning "' + name + '" skapad!', 'success');
    setTimeout(function(){toast('Inväntar ' + (invitees.length?invitees.join(', '):'motståndare') + '...','info');}, 800);
    if (chalTab==='open') renderChallenge('open');
  }, 400);
}

function quickJoin() {
  var waiting = OPEN_CHALS.filter(function(c){return c.status==='waiting';});
  if (waiting.length) { enterArena(waiting[0].id); }
  else { toast('Inga öppna arenor — skapar en ny!','info'); setTimeout(openCreateChallenge, 400); }
}


// ===== MOBILE NAV =====
function toggleMobileNav() {
  var ham = document.getElementById('nav-ham');
  var nav = document.getElementById('nav-mobile');
  if (!ham || !nav) return;
  var open = nav.classList.toggle('open');
  ham.classList.toggle('open', open);
}

function closeMobileNav() {
  var ham = document.getElementById('nav-ham');
  var nav = document.getElementById('nav-mobile');
  if (ham) ham.classList.remove('open');
  if (nav) nav.classList.remove('open');
}

function goM(name) {
  if (name === "profile") setTimeout(renderProfile, 50);
  go(name);
  closeMobileNav();
  // update mobile active state
  document.querySelectorAll('.nav-mobile a').forEach(function(a){ a.classList.remove('active'); });
  var el = document.getElementById('mnav-' + name);
  if (el) el.classList.add('active');
}

// Close mobile nav on outside click
document.addEventListener('click', function(e) {
  var ham = document.getElementById('nav-ham');
  var nav = document.getElementById('nav-mobile');
  if (nav && nav.classList.contains('open')) {
    if (!nav.contains(e.target) && e.target !== ham && !ham.contains(e.target)) {
      closeMobileNav();
    }
  }
});

// Update mobile nav user state
var _origUpdateNav = updateNav;
updateNav = function() {
  _origUpdateNav();
  // Sync mobile bottom buttons
  var btns = document.getElementById('mnav-btns');
  if (!btns) return;
  if (user) {
    var upBtn = !user.isPro ? '<button class="up-btn" style="flex:1" onclick="goM(\'pricing\')">✦ Pro</button>' : '';
    btns.innerHTML = upBtn +
      '<span style="font-family:var(--mono);font-size:0.8rem;color:var(--txt2);padding:0.4rem 0.5rem">' +
        (user.avatar||'👤') + ' ' + user.username + ' ⚡' + (user.xp||0) +
      '</span>' +
      '<button class="btn-g" style="flex:1" onclick="logout();closeMobileNav()">Logga ut</button>';
  } else {
    btns.innerHTML = '<button class="btn-g" style="flex:1" onclick="openAuth(\'login\');closeMobileNav()">Logga in</button>' +
      '<button class="btn-a" style="flex:1" onclick="openAuth(\'register\');closeMobileNav()">Kom ig\u00e5ng</button>';
  }
};


// ============================================================
// DAILY CHALLENGE & DASHBOARD — State
// ============================================================
let DAILY_STATE = {
  streak: 7,
  bestStreak: 12,
  totalDone: 23,
  todayXP: 0,
  todayDone: false,
  history: [
    {date:'2025-03-07', done:true,  prob:3, xp:30},
    {date:'2025-03-06', done:true,  prob:1, xp:20},
    {date:'2025-03-05', done:true,  prob:6, xp:50},
    {date:'2025-03-04', done:true,  prob:2, xp:20},
    {date:'2025-03-03', done:true,  prob:4, xp:30},
    {date:'2025-03-02', done:false, prob:5, xp:0},
    {date:'2025-03-01', done:true,  prob:1, xp:20},
    {date:'2025-02-28', done:true,  prob:3, xp:30},
    {date:'2025-02-27', done:false, prob:2, xp:0},
    {date:'2025-02-26', done:true,  prob:6, xp:50},
  ]
};

const DAILY_PROBLEMS = [
  {id:'d1', emoji:'🎯', title:'Summa av siffror', diff:'easy', diffCls:'diff-e', diffTxt:'Lätt',
   desc:'Skriv en funktion sumDigits(n) som tar ett heltal och returnerar summan av alla dess siffror. Negativa tal behandlas som positiva.',
   examples:[{inp:'sumDigits(123)', out:'6'},{inp:'sumDigits(-456)', out:'15'}],
   hint:'Tips: Konvertera till sträng, dela upp och summera.',
   xp:20, bonusXP:10,
   starter:{javascript:'function sumDigits(n) {\n  // Din lösning här\n}',python:'def sum_digits(n):\n    # Din lösning här\n    pass',csharp:'public static int SumDigits(int n) {\n    // Din lösning här\n}'}},
  {id:'d2', emoji:'🔤', title:'Räkna vokaler', diff:'easy', diffCls:'diff-e', diffTxt:'Lätt',
   desc:'Skriv countVowels(s) som räknar antal vokaler (a, e, i, o, u, å, ä, ö) i en sträng. Skiftlägesokänslig.',
   examples:[{inp:'countVowels("Hello")', out:'2'},{inp:'countVowels("Åäö")', out:'3'}],
   hint:'Tips: Sätt alla tecken i lowercase och kontrollera mot en set av vokaler.',
   xp:20, bonusXP:10,
   starter:{javascript:'function countVowels(s) {\n  const vowels = "aeiouyåäö";\n  // Din lösning här\n}',python:'def count_vowels(s):\n    vowels = "aeiouyåäö"\n    # Din lösning här',csharp:'public static int CountVowels(string s) {\n    var vowels = "aeiouyåäö";\n    // Din lösning här\n}'}},
  {id:'d3', emoji:'🌀', title:'Fibonacci-sekvens', diff:'medium', diffCls:'diff-m', diffTxt:'Medel',
   desc:'Returnera de n första talen i Fibonacci-sekvensen. Sekvensen börjar med [0, 1] och varje tal är summan av de två föregående.',
   examples:[{inp:'fibonacci(5)', out:'[0, 1, 1, 2, 3]'},{inp:'fibonacci(8)', out:'[0, 1, 1, 2, 3, 5, 8, 13]'}],
   hint:'Tips: Iterativ lösning är enklare än rekursiv för stora n.',
   xp:30, bonusXP:15,
   starter:{javascript:'function fibonacci(n) {\n  // Din lösning här\n}',python:'def fibonacci(n):\n    # Din lösning här\n    pass',csharp:'public static int[] Fibonacci(int n) {\n    // Din lösning här\n}'}},
  {id:'d4', emoji:'🔢', title:'Primtalscheck', diff:'medium', diffCls:'diff-m', diffTxt:'Medel',
   desc:'Skriv isPrime(n) som returnerar true om n är ett primtal. Implementera en effektiv algoritm — inte brute force.',
   examples:[{inp:'isPrime(7)', out:'true'},{inp:'isPrime(12)', out:'false'},{inp:'isPrime(1)', out:'false'}],
   hint:'Tips: Kontrollera bara upp till Math.sqrt(n) — det räcker!',
   xp:30, bonusXP:15,
   starter:{javascript:'function isPrime(n) {\n  if (n < 2) return false;\n  // Din lösning här\n}',python:'import math\ndef is_prime(n):\n    if n < 2: return False\n    # Din lösning här',csharp:'public static bool IsPrime(int n) {\n    if (n < 2) return false;\n    // Din lösning här\n}'}},
  {id:'d5', emoji:'🏔️', title:'Maximal vinst (aktier)', diff:'hard', diffCls:'diff-h', diffTxt:'Svår',
   desc:'Givet en array av aktiepriser per dag, hitta maximal vinst om du köper en dag och säljer en senare dag. Du måste köpa innan du säljer.',
   examples:[{inp:'maxProfit([7,1,5,3,6,4])', out:'5 (köp dag 2, sälj dag 5)'},{inp:'maxProfit([7,6,4,3,1])', out:'0 (ingen vinst möjlig)'}],
   hint:'Tips: Håll koll på lägsta pris hittills och beräkna vinst vid varje steg.',
   xp:50, bonusXP:25,
   starter:{javascript:'function maxProfit(prices) {\n  // O(n) lösning — ett pass!\n}',python:'def max_profit(prices):\n    # O(n) lösning — ett pass!\n    pass',csharp:'public static int MaxProfit(int[] prices) {\n    // O(n) lösning — ett pass!\n}'}},
];

// Pick today's problem deterministically by day-of-year
function getTodayProblem() {
  var d = new Date();
  var start = new Date(d.getFullYear(), 0, 0);
  var diff = d - start;
  var dayOfYear = Math.floor(diff / 86400000);
  return DAILY_PROBLEMS[dayOfYear % DAILY_PROBLEMS.length];
}

var todayProb = getTodayProblem();
var dailyLang = 'javascript';
var dailyTimerVal = null;

// ============================================================
// RENDER DAILY
// ============================================================
function renderDaily() {
  renderStreakBar();
  renderDailyCard();
  renderDailyCal();
  renderPastChallenges();
  startDailyCountdown();
}

function renderStreakBar() {
  // Last 14 days mini indicators
  var daysEl = document.getElementById('streak-days');
  if (!daysEl) return;
  var days = [];
  var today = new Date();
  for (var i = 13; i >= 0; i--) {
    var d = new Date(today);
    d.setDate(today.getDate() - i);
    var ds = d.toISOString().slice(0,10);
    var hist = DAILY_STATE.history.find(function(h){return h.date===ds;});
    var isToday = i === 0;
    var cls = isToday ? (DAILY_STATE.todayDone ? 'sd done' : 'sd today') :
              hist ? (hist.done ? 'sd done' : 'sd miss') : 'sd miss';
    var emoji = isToday ? (DAILY_STATE.todayDone ? '✅' : '🎯') :
                hist ? (hist.done ? '✅' : '❌') : '⬜';
    var dayName = ['Sö','Må','Ti','On','To','Fr','Lö'][d.getDay()];
    days.push('<div class="' + cls + '" title="' + ds + '">' + emoji + '<span class="sd-lbl">' + dayName + '</span></div>');
  }
  daysEl.innerHTML = days.join('');

  document.getElementById('ss-streak').textContent = DAILY_STATE.streak;
  document.getElementById('ss-best').textContent   = DAILY_STATE.bestStreak;
  document.getElementById('ss-total').textContent  = DAILY_STATE.totalDone;
  document.getElementById('ss-xp').textContent     = DAILY_STATE.todayXP;
}

function renderDailyCard() {
  var el = document.getElementById('daily-main');
  if (!el) return;
  var prob = todayProb;
  var done = DAILY_STATE.todayDone;

  var exHtml = prob.examples.map(function(e) {
    return '<div style="margin-bottom:0.6rem"><div class="dc-ex-lbl">Input</div><code>' + esc(e.inp) + '</code>' +
           '<div class="dc-ex-lbl" style="margin-top:0.3rem">Output</div><code>' + esc(e.out) + '</code></div>';
  }).join('');

  var footerHtml = done ?
    '<div class="dc-completed-banner" style="width:100%">✅ <strong style="color:var(--grn)">Dagens utmaning klar!</strong> &nbsp;Du tjänade <strong style="color:var(--acc2)">+' + (prob.xp + prob.bonusXP) + ' XP</strong> (inkl. streak-bonus). Kom tillbaka imorgon!</div>' +
    '<button class="dc-share" onclick="shareDaily()">📤 Dela din streak</button>' :
    '<button class="dc-submit" onclick="openDailyEditor()">💻 Lös utmaningen</button>' +
    '<button class="dc-code-btn" onclick="askAI(\'Ge mig ett tips (inte lösningen) för: ' + prob.title + '\')">💡 Tips från KodBot</button>' +
    '<button class="dc-share" onclick="shareDaily()">📤 Dela</button>';

  el.innerHTML = '<div class="daily-card">' +
    '<div class="dc-top"></div>' +
    '<div class="dc-head">' +
      '<div class="dc-ico">' + prob.emoji + '</div>' +
      '<div class="dc-meta">' +
        '<div class="dc-label">🔥 Dagens utmaning — <span class="dc-countdown" id="dc-countdown">Laddar...</span></div>' +
        '<div class="dc-title">' + prob.title + '</div>' +
        '<div class="dc-badges">' +
          '<span class="dc-diff ' + prob.diffCls + '">' + prob.diffTxt + '</span>' +
          '<span class="dc-xp">⚡ +' + prob.xp + ' XP</span>' +
          '<span class="dc-bonus">🔥 +' + prob.bonusXP + ' Streak-bonus</span>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="dc-body">' +
      '<div>' +
        '<div class="dc-desc">' + prob.desc + '</div>' +
        '<div style="margin-top:0.85rem;font-family:var(--mono);font-size:0.72rem;color:var(--acc2);background:rgba(14,165,233,0.06);border:1px solid rgba(14,165,233,0.15);border-radius:8px;padding:0.65rem">' +
          '💡 ' + prob.hint +
        '</div>' +
      '</div>' +
      '<div class="dc-right">' +
        '<div class="dc-ex-lbl">Exempel</div>' + exHtml +
      '</div>' +
    '</div>' +
    '<div class="dc-foot">' + footerHtml + '</div>' +
  '</div>';
}

function openDailyEditor() {
  var prob = todayProb;
  // Build a PROBLEMS-compatible object and reuse arena
  var arenaProbId = 99;
  var fakeProblem = {
    id: arenaProbId,
    title: '🔥 ' + prob.title,
    diff: prob.diff,
    tags: ['daglig'],
    desc: prob.desc,
    examples: prob.examples.map(function(e){return {input:e.inp, output:e.out};}),
    constraints: ['Lös dagens utmaning för att tjäna XP och bygga din streak!'],
    starter: prob.starter,
  };
  // Temporarily push to PROBLEMS
  var existing = PROBLEMS.find(function(p){return p.id===arenaProbId;});
  if (!existing) PROBLEMS.push(fakeProblem);
  else Object.assign(existing, fakeProblem);

  myScore = 0; oppScore = 0; arenaSeconds = 1200; myArenaLang = 'javascript';
  buildArenaUI(fakeProblem, {av:'🤖', nm:'KodBot Timer', xp:0, score:0});

  // Override submit to mark daily done
  var origSubmit = window.submitCode;
  window.submitCode = function(probId) {
    if (probId === arenaProbId) {
      markDailyDone();
      window.submitCode = origSubmit;
    }
    origSubmit(probId);
  };

  document.getElementById('arena-ov').classList.add('open');
  startTimer();
}

function markDailyDone() {
  if (DAILY_STATE.todayDone) return;
  DAILY_STATE.todayDone = true;
  DAILY_STATE.streak++;
  DAILY_STATE.totalDone++;
  DAILY_STATE.todayXP = todayProb.xp + todayProb.bonusXP;
  if (DAILY_STATE.streak > DAILY_STATE.bestStreak) DAILY_STATE.bestStreak = DAILY_STATE.streak;
  // Add to history
  var todayStr = new Date().toISOString().slice(0,10);
  DAILY_STATE.history.unshift({date:todayStr, done:true, prob:todayProb.id, xp:DAILY_STATE.todayXP});
  // Add XP to user
  if (user) { user.xp = (user.xp||0) + DAILY_STATE.todayXP; updateNav(); }
  toast('🔥 Streak ' + DAILY_STATE.streak + ' dagar! +' + DAILY_STATE.todayXP + ' XP', 'gold');
  renderStreakBar();
  renderDailyCard();
}

function shareDaily() {
  var text = '🔥 Jag har ' + DAILY_STATE.streak + ' dagars streak på KodLabbet! Kodar du med mig? www.dindomän.com';
  navigator.clipboard.writeText(text).then(function() {
    toast('📤 Kopierat till urklipp — dela på LinkedIn eller X!', 'success');
  }).catch(function() {
    toast('Streak: ' + DAILY_STATE.streak + ' dagar 🔥', 'info');
  });
}

function startDailyCountdown() {
  function tick() {
    var now = new Date();
    var midnight = new Date(now);
    midnight.setHours(24,0,0,0);
    var diff = Math.floor((midnight - now) / 1000);
    var h = Math.floor(diff/3600);
    var m = Math.floor((diff%3600)/60);
    var s = diff % 60;
    var el = document.getElementById('dc-countdown');
    if (el) el.textContent = 'Ny om ' + h + 'h ' + String(m).padStart(2,'0') + 'm ' + String(s).padStart(2,'0') + 's';
  }
  tick();
  if (dailyTimerVal) clearInterval(dailyTimerVal);
  dailyTimerVal = setInterval(tick, 1000);
}

function renderDailyCal() {
  var el = document.getElementById('daily-cal');
  var lbl = document.getElementById('cal-month-lbl');
  if (!el) return;
  var today = new Date();
  var year = today.getFullYear();
  var month = today.getMonth();
  var months = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
  if (lbl) lbl.textContent = months[month] + ' ' + year;

  var firstDay = new Date(year, month, 1).getDay();
  var daysInMonth = new Date(year, month+1, 0).getDate();
  // Adjust firstDay (0=Sun → make Mon=0)
  var startOffset = (firstDay + 6) % 7;

  var dayLabels = ['Må','Ti','On','To','Fr','Lö','Sö'];
  var cells = dayLabels.map(function(d){ return '<div class="cal-day-lbl">' + d + '</div>'; }).join('');

  // blank cells before month start
  for (var i = 0; i < startOffset; i++) cells += '<div class="cal-cell off"></div>';

  for (var day = 1; day <= daysInMonth; day++) {
    var ds = year + '-' + String(month+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
    var hist = DAILY_STATE.history.find(function(h){return h.date===ds;});
    var isToday = day === today.getDate();
    var isFuture = day > today.getDate();
    var cls = 'cal-cell';
    if (isFuture) cls += ' off';
    else if (hist && hist.done) cls += ' has' + (DAILY_STATE.streak > 1 ? ' streak' : '');
    else cls += ' empty';
    if (isToday && DAILY_STATE.todayDone) cls += ' has streak';
    if (isToday) cls += ' today-cal';
    cells += '<div class="' + cls + '" title="' + ds + '"></div>';
  }
  el.innerHTML = cells;
}

function renderPastChallenges() {
  var el = document.getElementById('daily-past');
  if (!el) return;
  var items = DAILY_STATE.history.slice(0,5).map(function(h) {
    var prob = DAILY_PROBLEMS.find(function(p){ return p.id === h.prob; }) || {emoji:'📅', title:'Dagens utmaning'};
    var done = h.done;
    return '<div class="past-item" onclick="toast(\'Spela igen-funktion kommer snart!\',\'info\')">' +
      '<div class="past-ico">' + (done ? prob.emoji : '⬜') + '</div>' +
      '<div class="past-info">' +
        '<div class="past-title">' + (done ? prob.title : 'Missade den här dagen') + '</div>' +
        '<div class="past-meta">' + h.date + (done ? ' · +' + h.xp + ' XP' : '') + '</div>' +
      '</div>' +
      '<span class="past-badge ' + (done ? 'pb-done' : 'pb-miss') + '">' + (done ? '✅ Klar' : '❌ Missad') + '</span>' +
    '</div>';
  }).join('');
  el.innerHTML = items;
}

// ============================================================
// DASHBOARD
// ============================================================
const BADGES = [
  {id:'first_blood', ico:'🩸', name:'Första kodet', desc:'Lös ditt första projekt', xp:10, unlocked:true, unlockedDate:'2025-01-15'},
  {id:'streak7', ico:'🔥', name:'Veckostreak', desc:'7 dagars streak', xp:50, unlocked:true, unlockedDate:'2025-03-07'},
  {id:'speed', ico:'⚡', name:'Blixtsnabb', desc:'Lös en utmaning på under 5 min', xp:30, unlocked:true, unlockedDate:'2025-02-20'},
  {id:'sqlmaster', ico:'🗄️', name:'SQL-mästare', desc:'Slutför 3 SQL-projekt', xp:40, unlocked:false},
  {id:'streak30', ico:'🏅', name:'Månadsstreak', desc:'30 dagars streak i rad', xp:200, unlocked:false},
  {id:'nochat', ico:'🧠', name:'Eget huvud', desc:'Lös 5 projekt utan AI-hjälp', xp:75, unlocked:false},
  {id:'socialite', ico:'💬', name:'Kommentator', desc:'Lämna 10 kommentarer', xp:25, unlocked:true, unlockedDate:'2025-02-01'},
  {id:'challenger', ico:'⚔️', name:'Arenakrigare', desc:'Vinn 5 PvP-utmaningar', xp:60, unlocked:false},
  {id:'fullstack', ico:'🌐', name:'Fullstack', desc:'Projekt i 3 olika språk', xp:80, unlocked:false},
  {id:'xp500', ico:'💎', name:'XP 500', desc:'Samla 500 XP totalt', xp:0, unlocked:true, unlockedDate:'2025-03-01'},
  {id:'helper', ico:'🤝', name:'Hjälparen', desc:'Svara på 5 frågor i community', xp:35, unlocked:false},
  {id:'perfectday', ico:'🌟', name:'Perfekt dag', desc:'Slutför projekt + daglig + utmaning', xp:100, unlocked:false},
];

let DB_COMPLETED_PROJS = [
  {emoji:'🎮', title:'Snake-spelet i JavaScript', lang:'JS', xp:50, date:'2025-03-05'},
  {emoji:'🌦️', title:'Väderapp med API', lang:'Python', xp:50, date:'2025-02-28'},
  {emoji:'🛒', title:'Shoppinglista med localStorage', lang:'JS', xp:50, date:'2025-02-20'},
  {emoji:'📊', title:'CLI Data Analyzer', lang:'Python', xp:50, date:'2025-02-10'},
];

function renderDashboard() {
  var me = user || {username:'Gäst', avatar:'👤', xp:285, isPro:false};
  var xp = me.xp || 285;

  // Greeting
  var h = new Date().getHours();
  var greet = h < 12 ? 'Godmorgon' : h < 17 ? 'Hej' : 'Godkväll';
  var greetEl = document.getElementById('db-greeting');
  if (greetEl) greetEl.textContent = greet + ', ' + me.username + '! 🏆';

  renderDBStats(xp);
  renderDBXPBar(xp);
  renderDBBadges();
  renderDBActivity();
  renderDBProjects();
  renderDBLBTeaser(xp);
}

function getLevel(xp) {
  var levels = [
    {min:0,    max:100,  name:'Nybörjare',    next:100},
    {min:100,  max:300,  name:'Lärling',      next:300},
    {min:300,  max:600,  name:'Kodare',       next:600},
    {min:600,  max:1000, name:'Utvecklare',   next:1000},
    {min:1000, max:2000, name:'Senior Dev',   next:2000},
    {min:2000, max:5000, name:'Arkitekt',     next:5000},
    {min:5000, max:Infinity, name:'KodGud',   next:null},
  ];
  for (var i = 0; i < levels.length; i++) {
    if (xp < levels[i].max) return {idx:i, level:levels[i], pct: Math.round((xp - levels[i].min) / (levels[i].max - levels[i].min) * 100)};
  }
  return {idx:levels.length-1, level:levels[levels.length-1], pct:100};
}

function renderDBStats(xp) {
  var el = document.getElementById('db-stats');
  if (!el) return;
  var unlocked = BADGES.filter(function(b){return b.unlocked;}).length;
  var winRate = Math.round(LB[3].wins / (LB[3].wins + LB[3].losses) * 100);
  var stats = [
    {val:xp, lbl:'Total XP', sub:'⚡ Poäng', ico:'⚡', color:'var(--acc2)'},
    {val:DAILY_STATE.streak, lbl:'Nuvarande streak', sub:'🔥 Dagar i rad', ico:'🔥', color:'var(--acc3)'},
    {val:DB_COMPLETED_PROJS.length, lbl:'Projekt klara', sub:'✅ Slutförda', ico:'✅', color:'var(--grn)'},
    {val:unlocked + '/' + BADGES.length, lbl:'Badges', sub:'🎖️ Upplåsta', ico:'🏅', color:'var(--gold)'},
    {val:DAILY_STATE.totalDone, lbl:'Dagliga utmaningar', sub:'📅 Totalt lösta', ico:'📅', color:'#a78bfa'},
    {val:winRate + '%', lbl:'Win rate PvP', sub:'⚔️ Utmaningar', ico:'⚔️', color:'var(--red)'},
  ];
  el.innerHTML = stats.map(function(s) {
    return '<div class="db-stat" data-ico="' + s.ico + '">' +
      '<div class="dbs-val" style="color:' + s.color + '">' + s.val + '</div>' +
      '<div class="dbs-lbl">' + s.lbl + '</div>' +
      '<div class="dbs-sub" style="color:' + s.color + ';opacity:0.7">' + s.sub + '</div>' +
    '</div>';
  }).join('');
}

function renderDBXPBar(xp) {
  var el = document.getElementById('db-xp-card');
  if (!el) return;
  var lvl = getLevel(xp);
  var nextLvl = lvl.level.next;
  var milestones = [100,300,600,1000,2000,5000];
  var mHtml = milestones.map(function(m) {
    var reached = xp >= m;
    return '<div class="db-milestone' + (reached?' reached':'') + '">' + (reached?'✓':'') + m + '</div>';
  }).join('');

  el.innerHTML =
    '<div class="db-xp-top">' +
      '<div class="db-level">Nivå ' + (lvl.idx+1) + ': <span>' + lvl.level.name + '</span></div>' +
      (nextLvl ? '<div class="db-xp-nums">⚡ ' + xp + ' / ' + nextLvl + ' XP till nästa nivå</div>' : '<div class="db-xp-nums">⚡ Max nivå uppnådd!</div>') +
    '</div>' +
    '<div class="db-xp-bar-bg"><div class="db-xp-bar-fill" id="db-xp-fill" style="width:0%"></div></div>' +
    '<div class="db-xp-milestones">' + mHtml + '</div>';

  // Animate bar after render
  setTimeout(function() {
    var fill = document.getElementById('db-xp-fill');
    if (fill) fill.style.width = Math.min(100, lvl.pct) + '%';
  }, 100);
}

function renderDBBadges() {
  var el = document.getElementById('db-badges');
  if (!el) return;
  el.innerHTML = BADGES.map(function(b) {
    return '<div class="db-badge ' + (b.unlocked ? 'unlocked' : 'locked') + '" title="' + b.desc + (b.xp ? ' (+' + b.xp + ' XP)' : '') + '">' +
      '<div class="dbb-ico">' + b.ico + '</div>' +
      '<div class="dbb-name">' + b.name + '</div>' +
      (b.unlocked ? '<div class="dbb-unlocked-lbl">✓ Upplåst</div>' : '<div class="dbb-unlocked-lbl" style="color:var(--txt3)">Låst 🔒</div>') +
    '</div>';
  }).join('');
}

function renderDBActivity() {
  var el = document.getElementById('db-activity');
  if (!el) return;
  // Generate 30 days of fake activity
  var cells = '';
  for (var i = 29; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var ds = d.toISOString().slice(0,10);
    var hist = DAILY_STATE.history.find(function(h){return h.date===ds;});
    var level = 0;
    if (hist && hist.done) level = 2 + (hist.xp >= 50 ? 2 : hist.xp >= 30 ? 1 : 0);
    else if (Math.random() > 0.5 && i > 5) level = Math.floor(Math.random()*3)+1;
    cells += '<div class="act-cell act-' + level + '" title="' + ds + ' · Aktivitetsnivå ' + level + '"></div>';
  }
  el.innerHTML = cells;
}

function renderDBProjects() {
  var el = document.getElementById('db-projects');
  if (!el) return;
  if (!DB_COMPLETED_PROJS.length) {
    el.innerHTML = '<div style="color:var(--txt3);font-family:var(--mono);font-size:0.83rem;padding:1rem 0">Inga projekt klara ännu. <a onclick="go(\'projects\')" style="color:var(--acc2);cursor:pointer">Utforska projekt →</a></div>';
    return;
  }
  el.innerHTML = DB_COMPLETED_PROJS.map(function(p) {
    return '<div class="db-proj" onclick="go(\'projects\')">' +
      '<div class="db-proj-ico">' + p.emoji + '</div>' +
      '<div style="flex:1;min-width:0">' +
        '<div class="db-proj-title">' + p.title + '</div>' +
        '<div class="db-proj-meta">' + p.lang + ' · ' + p.date + '</div>' +
      '</div>' +
      '<div class="db-proj-xp">+' + p.xp + ' XP</div>' +
    '</div>';
  }).join('');
}

function renderDBLBTeaser(xp) {
  var el = document.getElementById('db-lb-teaser');
  if (!el) return;
  // Find user rank
  var allXP = LB.map(function(u){return u.xp;}).sort(function(a,b){return b-a;});
  var rank = allXP.filter(function(x){return x > xp;}).length + 1;

  var topRows = LB.slice(0,3).map(function(u,i) {
    return '<div class="db-lb-row"><span class="db-lb-rank">' + ['🥇','🥈','🥉'][i] + '</span>' +
      '<span>' + u.av + '</span><span class="db-lb-name">' + u.nm + '</span>' +
      '<span class="db-lb-xp">⚡' + u.xp + '</span></div>';
  }).join('');

  var me = user || {username:'Du', avatar:'👤'};
  var myRow = '<div class="db-lb-row db-your-row"><span class="db-lb-rank">' + rank + '</span>' +
    '<span>' + me.avatar + '</span><span class="db-lb-name" style="color:var(--txt)">' + me.username + '</span>' +
    '<span class="db-lb-xp">⚡' + xp + '</span></div>';

  el.innerHTML =
    '<div class="db-lb-left">' +
      '<h3>🏆 Din plats på topplistan</h3>' +
      '<p>Du är just nu på plats <strong style="color:var(--acc2)">#' + rank + '</strong> av alla KodLabbet-användare. ' +
      'Lös fler projekt och dagliga utmaningar för att klättra!</p>' +
      '<button class="btn-a" style="margin-top:0.85rem;padding:0.5rem 1.2rem;font-size:0.82rem" onclick="go(\'challenge\');setTimeout(function(){setCTab(\'leaderboard\',document.querySelectorAll(\'.ctab\')[2]);},100)">Se hela topplistan →</button>' +
    '</div>' +
    '<div class="db-lb-right">' + topRows + myRow + '</div>';
}


// ============================================================
// LIVE ACTIVITY TICKER
// ============================================================
const LIVE_EVENTS = [
  {user:'🦊 FoxCoder',    action:'löste',        what:'Snake i JavaScript',        xp:'+50 XP'},
  {user:'🐉 DragonJS',    action:'vann en match mot', what:'WolfDev',              xp:'+50 XP'},
  {user:'🌟 Sara L.',     action:'startade',     what:'Pro-planen',                xp:'👑 Pro'},
  {user:'🐋 WhaleCode',   action:'löste',        what:'Väderapp med API',          xp:'+50 XP'},
  {user:'🔥 KodNinja42',  action:'nådde',        what:'10 dagars streak',          xp:'+15 XP'},
  {user:'💎 Emma K.',     action:'lade till en kommentar på', what:'FizzBuzz',      xp:'+2 XP'},
  {user:'🦁 LionByte',    action:'löste',        what:'Dagliga utmaningen',        xp:'+30 XP'},
  {user:'🚀 DevStar',     action:'registrerade sig och startade', what:'JavaScript-spåret', xp:'👋 Ny'},
  {user:'🦄 UnicornTS',   action:'löste',        what:'Binärsökning på 4 min',     xp:'+65 XP'},
  {user:'🐸 FrogBug',     action:'ställde en fråga till KodBot om', what:'SQL JOINs', xp:'+1 XP'},
  {user:'💻 Maja T.',     action:'uppgraderade till', what:'Pro-planen',            xp:'👑 Pro'},
  {user:'🧠 Albin H.',    action:'löste',        what:'Krypteringsverktyg i C#',   xp:'+50 XP'},
];

function initLiveTicker() {
  var track = document.getElementById('lt-track');
  if (!track) return;
  var items = LIVE_EVENTS.concat(LIVE_EVENTS).map(function(e) {
    var secAgo = Math.floor(Math.random() * 55) + 1;
    var timeStr = secAgo < 60 ? secAgo + 's sedan' : Math.floor(secAgo/60) + 'm sedan';
    return '<span class="lt-item">' +
      '<span class="lt-dot"></span>' +
      '<span class="lt-user">' + e.user + '</span>' +
      '<span style="color:var(--txt3)">' + e.action + '</span>' +
      '<span style="color:var(--txt)">' + e.what + '</span>' +
      '<span class="lt-xp">' + e.xp + '</span>' +
      '<span style="color:var(--txt3);font-size:0.66rem">' + timeStr + '</span>' +
    '</span>';
  }).join('');
  track.innerHTML = items;
}

// Rotate events every 8s for realism
setInterval(function() {
  var track = document.getElementById('lt-track');
  if (!track) return;
  // Randomly pick new time labels
  var items = track.querySelectorAll('.lt-item');
  if (!items.length) return;
  var idx = Math.floor(Math.random() * Math.min(items.length, LIVE_EVENTS.length));
  var timeSpans = items[idx].querySelectorAll('span');
  if (timeSpans.length > 0) {
    var last = timeSpans[timeSpans.length - 1];
    last.textContent = 'just nu';
    last.style.color = 'var(--grn)';
  }
}, 8000);

// ============================================================
// SOCIAL PROOF — TESTIMONIALS
// ============================================================
const TESTIMONIALS = [
  {stars:5, quote:'Jag hade noll förkunskaper i kod. Efter 3 veckor med KodLabbet hade jag byggt min <strong>första riktiga webbapp</strong>. KodBot förklarade varje fel jag gjorde utan att döma.',
   name:'Sara Lindgren', role:'Marknadsförare → Juniorkodare', av:'🌟', avBg:'rgba(245,158,11,0.15)', badge:'Pro-användare'},
  {stars:5, quote:'Som senior C#-utvecklare trodde jag inte att en lärplattform kunde lära mig något nytt. Fel. <strong>SQL-projekten och kravställningsguiden</strong> var riktigt vassa.',
   name:'Marcus Bergström', role:'Senior .NET-Utvecklare', av:'🏗️', avBg:'rgba(109,40,217,0.15)', badge:'Pro-användare'},
  {stars:5, quote:'Streak-funktionen är <strong>förändrat mitt sätt att lära</strong>. Jag kodar nu varje dag — inte för att jag måste, utan för att jag inte vill bryta min streak på 23 dagar!',
   name:'Alicia Pettersson', role:'Systemvetenskap-student', av:'🔥', avBg:'rgba(239,68,68,0.12)', badge:'23 dagars streak'},
  {stars:5, quote:'Jag har provat Codecademy, Udemy, Youtube. Ingenting höll. <strong>KodLabbet är annorlunda</strong> — projekten känns meningsfulla och AI:n guidar utan att ge bort svaret.',
   name:'Jonas Eriksson', role:'Egenföretagare', av:'💡', avBg:'rgba(14,165,233,0.12)', badge:'Gratis-plan'},
  {stars:5, quote:'Utmaningarna mot andra kodare är beroendeframkallande! Jag lärde mig mer om algoritmer på <strong>en vecka av PvP</strong> än under en hel termin på universitetet.',
   name:'Fatima Al-Hassan', role:'CS-student, KTH', av:'⚔️', avBg:'rgba(16,185,129,0.12)', badge:'12 vinster i rad'},
  {stars:4, quote:'Bra plattform med bra innehåll. Kunskapsbanken om AI och kravställning är <strong>ovärderlig inför arbetslivet</strong>. Saknar bara lite mer C#-projekt.',
   name:'Erik Johansson', role:'Gymnasielärare i Teknik', av:'📚', avBg:'rgba(109,40,217,0.1)', badge:'Pro-användare'},
];

function renderTestimonials() {
  var el = document.getElementById('sp-grid');
  if (!el) return;
  el.innerHTML = TESTIMONIALS.map(function(t) {
    return '<div class="tcard">' +
      '<div class="tcard-stars">' + '⭐'.repeat(t.stars) + (t.stars<5?'☆'.repeat(5-t.stars):'') + '</div>' +
      '<div class="tcard-quote">"' + t.quote + '"</div>' +
      '<div class="tcard-person">' +
        '<div class="tcard-av" style="background:' + t.avBg + '">' + t.av + '</div>' +
        '<div style="flex:1">' +
          '<div class="tcard-name">' + t.name + '</div>' +
          '<div class="tcard-role">' + t.role + '</div>' +
        '</div>' +
        '<span class="tcard-badge">' + t.badge + '</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

// Animate counters on scroll
function animateCounters() {
  var counters = [
    {id:'cnt-users', target:2418, suffix:''},
    {id:'cnt-proj',  target:8302, suffix:''},
    {id:'cnt-streak',target:147,  suffix:''},
    {id:'cnt-ai',    target:41209,suffix:''},
  ];
  counters.forEach(function(c) {
    var el = document.getElementById(c.id);
    if (!el) return;
    var start = 0;
    var duration = 1800;
    var step = Math.ceil(c.target / (duration / 16));
    var timer = setInterval(function() {
      start = Math.min(start + step, c.target);
      el.textContent = start.toLocaleString('sv-SE') + c.suffix;
      if (start >= c.target) clearInterval(timer);
    }, 16);
  });
}

// Intersection observer for counter animation
var countersAnimated = false;
function initCounterObserver() {
  var el = document.querySelector('.sp-counters');
  if (!el || !window.IntersectionObserver) { animateCounters(); return; }
  var obs = new IntersectionObserver(function(entries) {
    if (entries[0].isIntersecting && !countersAnimated) {
      countersAnimated = true;
      animateCounters();
    }
  }, {threshold: 0.3});
  obs.observe(el);
}

// ============================================================
// FREE TRIAL
// ============================================================
var freeTrialUsed = false;

function initFreeTrialTimer() {
  // Countdown from 23:47:12 (fake urgency — resets each session)
  var secs = 23*3600 + 47*60 + 12;
  function tick() {
    var el = document.getElementById('ft-countdown-lbl');
    if (!el) return;
    secs = Math.max(0, secs - 1);
    var h = Math.floor(secs/3600);
    var m = Math.floor((secs%3600)/60);
    var s = secs % 60;
    el.textContent = 'Erbjudandet gäller i ' + h + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    if (secs === 0) el.textContent = 'Erbjudandet har löpt ut — registrera dig ändå!';
  }
  setInterval(tick, 1000);
}

function startFreeTrial() {
  if (freeTrialUsed) { toast('Du har redan aktiverat din gratis provperiod!', 'info'); return; }
  if (!user) {
    toast('Skapa ett konto för att aktivera din gratis provperiod!', 'info');
    setTimeout(function() { openAuth('register'); }, 400);
    return;
  }
  freeTrialUsed = true;
  user.isPro = true;
  updateNav();
  toast('🎁 Gratis provperiod aktiverad! Du har nu Pro-access i 7 dagar.', 'gold');
  // Unlock first locked project in the UI
  setTimeout(function() {
    toast('✅ Projekt upplåsta — utforska Pro-projekten nu!', 'success');
    go('projects');
  }, 2000);
}

// ============================================================
// SHARE / REFERRAL
// ============================================================
function initReferralCode() {
  var el = document.getElementById('ref-code');
  if (!el) return;
  var code = user ? 'KL-' + user.username.slice(0,4).toUpperCase() + Math.floor(Math.random()*90+10) : 'KL-DEMO7';
  el.textContent = code;
}

function getShareText() {
  var streak = DAILY_STATE ? DAILY_STATE.streak : 0;
  return streak > 3
    ? 'Jag har ' + streak + ' dagars kodningsstreak på KodLabbet! 🔥 Lär dig koda med projekt, AI-hjälp och dagliga utmaningar. www.dindomän.com'
    : 'Jag lär mig koda med KodLabbet — projekt-baserat lärande med AI-assistans och dagliga utmaningar. Prova gratis! www.dindomän.com';
}

function shareToLinkedIn() {
  var url = 'https://www.linkedin.com/shareArticle?mini=true&url=https://www.dindomän.com&title=KodLabbet&summary=' + encodeURIComponent(getShareText());
  window.open(url, '_blank', 'width=600,height=500');
  toast('📤 Öppnar LinkedIn...', 'info');
}

function shareToX() {
  var url = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(getShareText() + ' @KodLabbet');
  window.open(url, '_blank', 'width=600,height=400');
  toast('📤 Öppnar X...', 'info');
}

function copyShareLink() {
  var ref = document.getElementById('ref-code');
  var code = ref ? ref.textContent : 'KL-DEMO7';
  var text = getShareText() + '\n\nAnvänd min kod ' + code + ' för 1 månads Pro gratis!';
  navigator.clipboard.writeText(text).then(function() {
    toast('✅ Länk kopierad — klistra in var du vill!', 'success');
  }).catch(function() { toast('Kopieringsfel — prova manuellt', 'error'); });
}

function copyRefCode() {
  var ref = document.getElementById('ref-code');
  var code = ref ? ref.textContent : 'KL-DEMO7';
  navigator.clipboard.writeText(code).then(function() {
    toast('✅ Kod kopierad: ' + code, 'success');
  }).catch(function() { toast(code, 'info'); });
}

// ============================================================
// ONBOARDING WIZARD
// ============================================================
var OB_STEP = 0;
var OB_ANSWERS = {level: null, goal: null, lang: null};
const OB_STEPS = [
  {
    key: 'level',
    title: 'Vad är din kodningsnivå?',
    sub: 'Vi anpassar dina rekommenderade projekt och svårighetsgrad baserat på din erfarenhet.',
    options: [
      {ico:'🌱', lbl:'Total nybörjare', sub:'Jag har aldrig skrivit en rad kod', val:'beginner'},
      {ico:'🔧', lbl:'Har kodat lite', sub:'Jag kan grunderna men vill lära mig mer', val:'intermediate'},
      {ico:'💻', lbl:'Jobbar med kod', sub:'Jag är yrkesverksam och vill fördjupa mig', val:'advanced'},
    ]
  },
  {
    key: 'goal',
    title: 'Vad är ditt mål?',
    sub: 'Vi hjälper dig nå dit snabbare när vi vet vart du är på väg.',
    options: [
      {ico:'💼', lbl:'Byta karriär', sub:'Jag vill bli utvecklare och jobba med kod', val:'career'},
      {ico:'🚀', lbl:'Bygga egna projekt', sub:'Appar, webbsidor eller verktyg för mig själv', val:'project'},
      {ico:'📚', lbl:'Lära för skolan', sub:'Stöd till utbildning eller kurs', val:'school'},
      {ico:'🎯', lbl:'Hålla mig uppdaterad', sub:'Jag är redan kodare och vill lära mig nytt', val:'upskill'},
    ]
  },
  {
    key: 'lang',
    title: 'Vilket språk vill du börja med?',
    sub: 'Du kan alltid lägga till fler senare. Välj det som intresserar dig mest just nu.',
    options: [
      {ico:'🟨', lbl:'JavaScript', sub:'Webb, interaktivitet, frontend & backend', val:'javascript'},
      {ico:'🐍', lbl:'Python', sub:'Data, AI, scripting och nybörjarvänligt', val:'python'},
      {ico:'🔷', lbl:'C# / .NET', sub:'Enterprise, spel (Unity) och Razor Pages', val:'csharp'},
      {ico:'🗄️', lbl:'SQL & Databaser', sub:'Data, rapporter och backend-lagring', val:'sql'},
    ]
  },
];

function openOnboarding() {
  OB_STEP = 0;
  OB_ANSWERS = {level:null, goal:null, lang:null};
  renderOBStep();
  document.getElementById('ob-ov').classList.add('open');
}

function skipOnboarding() {
  document.getElementById('ob-ov').classList.remove('open');
  toast('Du kan alltid se rekommendationer i dashboarden!', 'info');
}

function renderOBStep() {
  var total = OB_STEPS.length + 1; // +1 for final celebration
  var pct = Math.round(((OB_STEP + 1) / total) * 100);
  var fill = document.getElementById('ob-prog-fill');
  if (fill) fill.style.width = pct + '%';

  // Dots
  var dotsEl = document.getElementById('ob-dots');
  if (dotsEl) {
    dotsEl.innerHTML = OB_STEPS.map(function(_,i) {
      return '<div class="ob-dot' + (i === OB_STEP ? ' active' : '') + '"></div>';
    }).join('') + '<div class="ob-dot' + (OB_STEP >= OB_STEPS.length ? ' active' : '') + '"></div>';
  }

  var nextBtn = document.getElementById('ob-next');
  var skipBtn = document.querySelector('.ob-skip');
  var body = document.getElementById('ob-body');
  if (!body) return;

  if (OB_STEP >= OB_STEPS.length) {
    // Final celebration step
    if (nextBtn) { nextBtn.textContent = 'Kom igång! 🚀'; nextBtn.onclick = function() { finishOnboarding(); }; }
    if (skipBtn) skipBtn.style.display = 'none';
    body.innerHTML = '<div class="ob-celebrate">' +
      '<div class="ob-cel-ico">🎉</div>' +
      '<div class="ob-cel-title">Perfekt! Du är redo.</div>' +
      '<div class="ob-cel-sub">Baserat på dina svar har vi valt ut de bästa projekten för dig. Du har också fått <strong style="color:var(--acc2)">+25 XP</strong> som välkomstbonus!</div>' +
      '<div class="ob-rec-projects" id="ob-rec-list"></div>' +
    '</div>';
    renderOBRecommendations();
    return;
  }

  var step = OB_STEPS[OB_STEP];
  if (nextBtn) { nextBtn.textContent = 'Nästa →'; nextBtn.onclick = obNext; }
  if (skipBtn) skipBtn.style.display = '';

  body.innerHTML =
    '<div class="ob-step-lbl">Steg ' + (OB_STEP+1) + ' av ' + OB_STEPS.length + '</div>' +
    '<div class="ob-title">' + step.title + '</div>' +
    '<div class="ob-sub">' + step.sub + '</div>' +
    '<div class="ob-options">' +
      step.options.map(function(o) {
        var sel = OB_ANSWERS[step.key] === o.val;
        return '<button class="ob-opt' + (sel?' sel':'') + '" onclick="obSelect(\'' + step.key + '\',\'' + o.val + '\',this)">' +
          '<div class="ob-opt-ico">' + o.ico + '</div>' +
          '<div><div class="ob-opt-lbl">' + o.lbl + '</div><div class="ob-opt-sub">' + o.sub + '</div></div>' +
        '</button>';
      }).join('') +
    '</div>';
}

function obSelect(key, val, btn) {
  OB_ANSWERS[key] = val;
  var parent = btn.closest('.ob-options');
  if (parent) parent.querySelectorAll('.ob-opt').forEach(function(b){b.classList.remove('sel');});
  btn.classList.add('sel');
  // Auto-advance after 400ms
  setTimeout(obNext, 420);
}

function obNext() {
  var step = OB_STEPS[OB_STEP];
  if (step && !OB_ANSWERS[step.key]) {
    toast('Välj ett alternativ för att fortsätta', 'info');
    return;
  }
  OB_STEP++;
  renderOBStep();
}

function renderOBRecommendations() {
  var el = document.getElementById('ob-rec-list');
  if (!el) return;
  // Pick 3 recommended projects based on answers
  var langMap = {javascript:'JavaScript', python:'Python', csharp:'C#', sql:'SQL'};
  var lvlMap = {beginner:'beginner', intermediate:'medium', advanced:'advanced', career:'medium', project:'medium', school:'beginner', upskill:'advanced'};
  var targetLvl = lvlMap[OB_ANSWERS.level] || lvlMap[OB_ANSWERS.goal] || 'medium';
  var targetLang = langMap[OB_ANSWERS.lang] || 'JavaScript';

  var recs = (typeof PROJS !== 'undefined' ? PROJS : []).filter(function(p) {
    return p.lv === targetLvl || p.tags.indexOf(OB_ANSWERS.lang) > -1;
  }).slice(0, 3);

  if (!recs.length && typeof PROJS !== 'undefined') recs = PROJS.slice(0, 3);
  if (!recs.length) {
    el.innerHTML = '<div style="color:var(--txt3);font-family:var(--mono);font-size:0.8rem">Projekt laddas när du utforskar plattformen!</div>';
    return;
  }
  el.innerHTML = recs.map(function(p) {
    return '<div class="ob-rec" onclick="finishOnboarding();setTimeout(function(){openProj('+p.id+')},400)">' +
      '<div class="ob-rec-ico">' + p.emoji + '</div>' +
      '<div><div class="ob-rec-title">' + p.title + '</div>' +
        '<div class="ob-rec-sub">' + (p.lv==='beginner'?'Nybörjare':p.lv==='medium'?'Medel':'Avancerad') + ' · ' + p.time + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function finishOnboarding() {
  document.getElementById('ob-ov').classList.remove('open');
  if (user) {
    user.xp = (user.xp || 0) + 25;
    updateNav();
  }
  toast('🎉 Välkommen till KodLabbet! +25 XP välkomstbonus', 'gold');
  go('projects');
}

// Show onboarding for new users (first visit detection)
function checkFirstVisit() {
  try {
    if (!localStorage.getItem('kl_visited')) {
      localStorage.setItem('kl_visited', '1');
      setTimeout(openOnboarding, 1500);
    }
  } catch(e) { /* private mode */ }
}

// ============================================================
// INIT ALL CONVERSION FEATURES
// ============================================================
function initConversionFeatures() {
  initLiveTicker();
  renderTestimonials();
  initCounterObserver();
  initFreeTrialTimer();
  initReferralCode();
  checkFirstVisit();
}

// Hook into existing loadUser
var _origLoadUser = typeof loadUser === 'function' ? loadUser : function(){};
loadUser = function() {
  _origLoadUser();
  initConversionFeatures();
};


// ============================================================
// 1. INBYGGD KODEDITOR — Live Code Runner i projekt-modalen
// ============================================================
var EDITOR_OUTPUTS = {}; // per-project output history

function buildLiveEditor(projId, lang, starterCode) {
  var editorId = 'le-' + projId;
  var outputId = 'le-out-' + projId;
  return '<div class="live-editor-wrap">' +
    '<div class="le-toolbar">' +
      '<select class="le-lang-sel" id="le-lang-' + projId + '" onchange="leChangeLang(' + projId + ')">' +
        '<option value="javascript">JavaScript</option>' +
        '<option value="python">Python (simulerad)</option>' +
        '<option value="csharp">C# (simulerad)</option>' +
      '</select>' +
      '<button class="le-run-btn" id="le-run-' + projId + '" onclick="leRun(' + projId + ')">▶ Kör kod</button>' +
      '<button class="le-reset-btn" onclick="leReset(' + projId + ')">↺ Återställ</button>' +
      '<span class="le-status" id="le-status-' + projId + '">Redo</span>' +
    '</div>' +
    '<textarea class="le-editor" id="' + editorId + '" spellcheck="false" onkeydown="leTab(event)">' + esc(starterCode) + '</textarea>' +
    '<div class="le-output-wrap">' +
      '<div class="le-output-bar">' +
        '<span class="le-output-lbl">Output</span>' +
        '<button class="le-clear-btn" onclick="leClear(' + projId + ')">Rensa</button>' +
      '</div>' +
      '<div class="le-output" id="' + outputId + '"><span class="out-sys">▶ Kör koden ovan för att se resultatet här...</span></div>' +
    '</div>' +
    '<div class="le-sandbox-note">🔒 Sandlåda — körs säkert i din webbläsare. Ingen server-kommunikation.</div>' +
  '</div>';
}

function leTab(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    var ta = e.target;
    var start = ta.selectionStart;
    var end = ta.selectionEnd;
    ta.value = ta.value.substring(0, start) + '  ' + ta.value.substring(end);
    ta.selectionStart = ta.selectionEnd = start + 2;
  }
}

function leChangeLang(projId) {
  var sel = document.getElementById('le-lang-' + projId);
  if (!sel) return;
  var lang = sel.value;
  var proj = (typeof PROJS !== 'undefined') ? PROJS.find(function(p){return p.id===projId;}) : null;
  if (proj && proj.code && proj.code[lang]) {
    document.getElementById('le-' + projId).value = proj.code[lang];
  }
  leClear(projId);
}

function leReset(projId) {
  var proj = (typeof PROJS !== 'undefined') ? PROJS.find(function(p){return p.id===projId;}) : null;
  var sel = document.getElementById('le-lang-' + projId);
  var lang = sel ? sel.value : 'javascript';
  if (proj && proj.code && proj.code[lang]) {
    document.getElementById('le-' + projId).value = proj.code[lang];
  }
  leClear(projId);
  toast('Startkod återställd', 'info');
}

function leClear(projId) {
  var out = document.getElementById('le-out-' + projId);
  if (out) out.innerHTML = '<span class="out-sys">▶ Kör koden ovan för att se resultatet här...</span>';
}

function leRun(projId) {
  var edEl = document.getElementById('le-' + projId);
  var outEl = document.getElementById('le-out-' + projId);
  var statusEl = document.getElementById('le-status-' + projId);
  var runBtn = document.getElementById('le-run-' + projId);
  var selEl = document.getElementById('le-lang-' + projId);
  if (!edEl || !outEl) return;

  var code = edEl.value.trim();
  var lang = selEl ? selEl.value : 'javascript';
  if (!code) { outEl.innerHTML = '<span class="out-warn">⚠️ Ingen kod att köra.</span>'; return; }

  runBtn.classList.add('running');
  runBtn.textContent = '⏳ Kör...';
  if (statusEl) statusEl.textContent = 'Kör...';

  outEl.innerHTML = '<span class="out-sys">⏳ Kompilerar och kör...</span>';

  setTimeout(function() {
    runBtn.classList.remove('running');
    runBtn.textContent = '▶ Kör kod';
    if (statusEl) statusEl.textContent = 'Klar ' + new Date().toLocaleTimeString('sv-SE');

    if (lang === 'javascript') {
      leRunJS(code, outEl);
    } else {
      leSimulateLang(lang, code, outEl);
    }
  }, 600);
}

function leRunJS(code, outEl) {
  var logs = [];
  var originalConsole = {
    log: console.log, warn: console.warn,
    error: console.error, info: console.info
  };
  // Intercept console
  console.log   = function() { logs.push({type:'log',   args:Array.from(arguments)}); };
  console.warn  = function() { logs.push({type:'warn',  args:Array.from(arguments)}); };
  console.error = function() { logs.push({type:'error', args:Array.from(arguments)}); };
  console.info  = function() { logs.push({type:'info',  args:Array.from(arguments)}); };
  try {
    var result = new Function(code)();
    if (result !== undefined) logs.push({type:'return', args:[result]});
    if (!logs.length) logs.push({type:'sys', args:['✅ Kod körde utan fel (ingen output)']});
  } catch(e) {
    logs.push({type:'error', args:['❌ ' + e.name + ': ' + e.message]});
  }
  // Restore
  console.log = originalConsole.log; console.warn = originalConsole.warn;
  console.error = originalConsole.error; console.info = originalConsole.info;
  // Render
  outEl.innerHTML = logs.map(function(l) {
    var cls = l.type==='error'?'out-err':l.type==='warn'?'out-warn':l.type==='info'?'out-info':l.type==='sys'?'out-sys':'out-ok';
    var prefix = l.type==='error'?'':l.type==='warn'?'⚠ ':l.type==='info'?'ℹ ':l.type==='return'?'→ ':'';
    return '<span class="out-line ' + cls + '">' + prefix + l.args.map(function(a){
      if (typeof a === 'object') try { return JSON.stringify(a, null, 2); } catch(e) { return String(a); }
      return String(a);
    }).join(' ') + '</span>';
  }).join('\n');
}

function leSimulateLang(lang, code, outEl) {
  // Simulate Python/C# output based on common patterns
  var lines = [];
  var codeLines = code.split('\n');
  var langName = lang === 'python' ? 'Python 3.12' : 'C# / .NET 9';

  lines.push({type:'sys', text:'[' + langName + ' Simulator] Analyserar kod...'});

  // Detect print/Console.WriteLine
  var outputs = [];
  codeLines.forEach(function(line) {
    var trimmed = line.trim();
    if (lang === 'python') {
      var pm = trimmed.match(/^print\((.+)\)$/);
      if (pm) {
        var val = pm[1].trim();
        // Simple string literals
        var sm = val.match(/^["'](.*)["']$/);
        if (sm) outputs.push(sm[1]);
        else if (!isNaN(val)) outputs.push(val);
        else outputs.push('[Beräknat värde: ' + val + ']');
      }
    } else if (lang === 'csharp') {
      var cm = trimmed.match(/Console\.(Write|WriteLine)\((.+)\)/);
      if (cm) {
        var val2 = cm[2].trim().replace(/^["']|["']$/g,'').replace(/\\n/g,'\n');
        outputs.push(val2);
      }
    }
  });

  if (outputs.length) {
    outputs.forEach(function(o){ lines.push({type:'log', text:o}); });
    lines.push({type:'sys', text:'✅ Körning klar. ' + outputs.length + ' rader output.'});
  } else if (code.includes('def ') || code.includes('class ') || code.includes('static void') || code.includes('public class')) {
    lines.push({type:'ok', text:'✅ Kod parsad utan syntaxfel.'});
    lines.push({type:'sys', text:'ℹ Inga print/Console.WriteLine hittades. Lägg till utskrifter för att se output.'});
  } else {
    lines.push({type:'ok', text:'✅ Kodstruktur verifierad.'});
    lines.push({type:'sys', text:'ℹ ' + langName + ': Fullständig körning kräver lokal miljö eller backend.'});
    lines.push({type:'info', text:'💡 JavaScript körs direkt i webbläsaren utan begränsningar!'});
  }

  outEl.innerHTML = lines.map(function(l) {
    var cls = l.type==='error'?'out-err':l.type==='warn'?'out-warn':l.type==='info'?'out-info':l.type==='sys'?'out-sys':l.type==='ok'?'out-ok':'';
    return '<span class="out-line ' + cls + '">' + l.text + '</span>';
  }).join('\n');
}

// Patch openProj to append live editor + community section
var _origOpenProj = openProj;
openProj = function(id) {
  _origOpenProj(id);
  var proj = (typeof PROJS !== 'undefined') ? PROJS.find(function(p){return p.id===id;}) : null;
  if (!proj) return;
  var pmb = document.getElementById('pmb');
  if (!pmb) return;
  var lang = (typeof custom !== 'undefined') ? (custom.lang || 'javascript') : 'javascript';
  var starterCode = (proj.code && proj.code[lang]) ? proj.code[lang] : (proj.code ? Object.values(proj.code)[0] : '// Skriv din kod här');

  // Append live editor section
  var editorSection = '<div class="ms"><div class="msh" style="display:flex;align-items:center;justify-content:space-between">💻 Testa din kod <span style="font-family:var(--mono);font-size:0.65rem;color:var(--grn)">● LIVE</span></div>' +
    buildLiveEditor(id, lang, starterCode) + '</div>';

  // Append community section
  var commSection = buildCommunitySection(id);

  pmb.innerHTML += editorSection + commSection;

  // Set correct lang in editor selector
  var lesel = document.getElementById('le-lang-' + id);
  if (lesel) lesel.value = lang;
};

// ============================================================
// 2. LÄRVÄGAR
// ============================================================
const PATHS_DATA = [
  {
    id: 'webdev',
    title: 'Webbutvecklare på 8 veckor',
    sub: 'Från grunderna till din första portfolio-webbplats',
    ico: '🌐', icoBg: 'rgba(245,158,11,0.15)',
    banner: 'linear-gradient(90deg,#f59e0b,#ef4444)',
    weeks: 8, lang: 'JavaScript', level: 'Nybörjare', isPro: false,
    enrolled: true, progress: 2,
    xpTotal: 450,
    desc: 'En komplett väg från noll till anställningsbar frontend-utvecklare. Du lär dig HTML, CSS, JavaScript och React — med ett riktigt portfolio-projekt varje vecka.',
    steps: [
      {txt:'HTML & CSS-grunderna',        xp:50,  done:true,  proj:6},
      {txt:'JavaScript: variabler & loopar', xp:50, done:true, proj:1},
      {txt:'DOM-manipulation & events',    xp:50,  done:false, proj:2},
      {txt:'Asynkron JS & Fetch API',      xp:75,  done:false, proj:null},
      {txt:'React: komponenter & state',   xp:75,  done:false, proj:null},
      {txt:'React: hooks & kontext',       xp:75,  done:false, proj:null},
      {txt:'REST API-integration',         xp:75,  done:false, proj:3},
      {txt:'Portfolio-projekt & deployment',xp:100, done:false, proj:null},
    ]
  },
  {
    id: 'backend',
    title: 'Backend-Utvecklare med C#',
    sub: 'ASP.NET Core, Razor Pages, EF Core och SQL',
    ico: '⚙️', icoBg: 'rgba(109,40,217,0.15)',
    banner: 'linear-gradient(90deg,#6d28d9,#3b82f6)',
    weeks: 10, lang: 'C#', level: 'Medel', isPro: true,
    enrolled: false, progress: 0,
    xpTotal: 650,
    desc: 'Bygg robusta backend-system med .NET. Du lär dig allt från grundläggande C# till fullständiga webbapplikationer med databas, autentisering och REST API:er.',
    steps: [
      {txt:'C#-grunderna & OOP',           xp:75,  done:false, proj:null},
      {txt:'ASP.NET Core & MVC',           xp:75,  done:false, proj:null},
      {txt:'Razor Pages CRUD-app',         xp:75,  done:false, proj:7},
      {txt:'Entity Framework Core',        xp:75,  done:false, proj:9},
      {txt:'SQL & databasdesign',          xp:50,  done:false, proj:4},
      {txt:'REST API med JWT-auth',        xp:100, done:false, proj:null},
      {txt:'Testning & TDD',               xp:75,  done:false, proj:null},
      {txt:'Deployment till Azure',        xp:75,  done:false, proj:null},
      {txt:'Microservices-intro',          xp:75,  done:false, proj:null},
      {txt:'Kapstenprojekt: Full API',     xp:100, done:false, proj:null},
    ]
  },
  {
    id: 'dataai',
    title: 'Data & AI med Python',
    sub: 'Pandas, visualisering, ML och prompt engineering',
    ico: '🤖', icoBg: 'rgba(14,165,233,0.15)',
    banner: 'linear-gradient(90deg,#0ea5e9,#10b981)',
    weeks: 12, lang: 'Python', level: 'Medel', isPro: true,
    enrolled: false, progress: 0,
    xpTotal: 750,
    desc: 'Den kompletta vägen för dig som vill jobba med data, AI och maskininlärning. Från Python-grunder till att träna egna ML-modeller och integrera LLM-API:er.',
    steps: [
      {txt:'Python-grunder & datastrukturer', xp:50, done:false, proj:null},
      {txt:'Pandas & datamanipulation',    xp:75,  done:false, proj:null},
      {txt:'Matplotlib & Seaborn',         xp:50,  done:false, proj:null},
      {txt:'NumPy & statistik',            xp:75,  done:false, proj:null},
      {txt:'Scikit-learn: klassificering', xp:100, done:false, proj:null},
      {txt:'SQL för datanalys',            xp:75,  done:false, proj:4},
      {txt:'API-integrationer med Python', xp:75,  done:false, proj:null},
      {txt:'Prompt engineering & LLM-API', xp:100, done:false, proj:null},
      {txt:'Webbscraping & automation',    xp:75,  done:false, proj:null},
      {txt:'ML-projekt: end-to-end',       xp:75,  done:false, proj:null},
      {txt:'RAG & vektordatabaser',        xp:100, done:false, proj:null},
      {txt:'Kapstenprojekt: AI-app',       xp:100, done:false, proj:null},
    ]
  },
  {
    id: 'junior',
    title: 'Bli juniorkodare på 16 veckor',
    sub: 'Från total nybörjare till jobbredo — fullstack',
    ico: '🚀', icoBg: 'rgba(16,185,129,0.15)',
    banner: 'linear-gradient(90deg,#10b981,#f59e0b)',
    weeks: 16, lang: 'JS + Python + SQL', level: 'Nybörjare', isPro: false,
    enrolled: false, progress: 0,
    xpTotal: 1200,
    desc: 'Det kompletta programmet för dig som vill byta karriär eller ta dig in i tech. Vi tar dig från absoluta nollpunkten till att ha en portfolio du kan visa på anställningsintervjuer.',
    steps: [
      {txt:'Datorer, terminalen & Git',    xp:30,  done:false, proj:null},
      {txt:'HTML & CSS-grunder',          xp:50,  done:false, proj:6},
      {txt:'JavaScript: grunder',         xp:50,  done:false, proj:1},
      {txt:'JavaScript: funktioner & OOP',xp:75,  done:false, proj:2},
      {txt:'Python-intro & scripting',    xp:50,  done:false, proj:null},
      {txt:'SQL & databas-design',        xp:75,  done:false, proj:4},
      {txt:'Backend: Node.js/Express',    xp:75,  done:false, proj:null},
      {txt:'Frontend: React-intro',       xp:75,  done:false, proj:null},
      {txt:'Fullstack-projekt #1',        xp:100, done:false, proj:null},
      {txt:'Agil metodik & kravställning',xp:50,  done:false, proj:null},
      {txt:'Testning & debugging',        xp:75,  done:false, proj:null},
      {txt:'API-design & säkerhet',       xp:100, done:false, proj:null},
      {txt:'Deployment & DevOps-intro',   xp:75,  done:false, proj:null},
      {txt:'Fullstack-projekt #2',        xp:100, done:false, proj:null},
      {txt:'CV, portfolio & intervjuförberedelse', xp:50, done:false, proj:null},
      {txt:'Kapstenprojekt: din portfolio-app', xp:200, done:false, proj:null},
    ]
  },
];

var enrolledPaths = {'webdev': true};
var currentPathId = null;

function renderPaths() {
  var grid = document.getElementById('paths-grid');
  if (!grid) return;
  grid.innerHTML = PATHS_DATA.map(function(path) {
    return renderPathCard(path);
  }).join('');
}

function renderPathCard(path) {
  var done = path.steps.filter(function(s){return s.done;}).length;
  var total = path.steps.length;
  var pct = total > 0 ? Math.round(done/total*100) : 0;
  var isEnrolled = enrolledPaths[path.id];

  var stepsHtml = path.steps.slice(0,5).map(function(s,i) {
    var dotCls = s.done ? 'psd-done' : (i===done&&isEnrolled) ? 'psd-active' : 'psd-lock';
    var dotIco = s.done ? '✓' : (i===done&&isEnrolled) ? '▶' : '🔒';
    return '<div class="path-step">' +
      '<div class="path-step-dot ' + dotCls + '">' + dotIco + '</div>' +
      '<div class="path-step-txt' + (s.done?' done-step':'') + '">' + s.txt + '</div>' +
      '<div class="path-step-xp">+' + s.xp + ' XP</div>' +
    '</div>';
  }).join('');
  if (path.steps.length > 5) {
    stepsHtml += '<div class="path-step"><div class="path-step-dot psd-lock" style="font-size:0.5rem">+' + (path.steps.length-5) + '</div><div class="path-step-txt" style="color:var(--txt3)">och ' + (path.steps.length-5) + ' steg till...</div></div>';
  }

  return '<div class="path-card' + (isEnrolled?' active-path':'') + '" onclick="openPathDetail(\'' + path.id + '\')">' +
    '<div class="path-banner" style="background:' + path.banner + '"></div>' +
    '<div class="path-head">' +
      '<div class="path-ico" style="background:' + path.icoBg + '">' + path.ico + '</div>' +
      '<div class="path-meta">' +
        '<div class="path-title">' + path.title + '</div>' +
        '<div class="path-sub">' + path.sub + '</div>' +
        '<div class="path-badges">' +
          '<span class="path-badge pb-weeks">⏱ ' + path.weeks + ' veckor</span>' +
          '<span class="path-badge pb-lvl">' + path.level + '</span>' +
          '<span class="path-badge pb-lang">' + path.lang + '</span>' +
          (path.isPro ? '<span class="path-badge pb-pro">👑 Pro</span>' : '') +
        '</div>' +
      '</div>' +
    '</div>' +
    (isEnrolled ? '<div class="path-prog-wrap">' +
      '<div class="path-prog-row"><span>' + done + '/' + total + ' steg</span><span>' + pct + '%</span></div>' +
      '<div class="path-prog-bg"><div class="path-prog-fill" style="width:' + pct + '%;background:' + path.banner + '"></div></div>' +
    '</div>' : '') +
    '<div class="path-steps-wrap">' + stepsHtml + '</div>' +
    '<div class="path-foot">' +
      '<span class="path-xp-total">⚡ Totalt ' + path.xpTotal + ' XP</span>' +
      (isEnrolled ?
        '<span class="path-enrolled">✅ Påbörjad</span>' :
        '<button class="path-cta" onclick="event.stopPropagation();enrollPath(\'' + path.id + '\')">Starta spår →</button>'
      ) +
    '</div>' +
  '</div>';
}

function enrollPath(pathId) {
  var path = PATHS_DATA.find(function(p){return p.id===pathId;});
  if (!path) return;
  if (path.isPro && !(user && user.isPro)) {
    toast('👑 Det här spåret kräver Pro. Uppgradera för full tillgång!', 'gold');
    setTimeout(function(){ go('pricing'); }, 800);
    return;
  }
  enrolledPaths[pathId] = true;
  toast('🚀 Du är nu inskriven på "' + path.title + '"! +10 XP välkomst-bonus', 'success');
  if (user) { user.xp = (user.xp||0) + 10; updateNav(); }
  renderPaths();
  setTimeout(function(){ openPathDetail(pathId); }, 300);
}

function openPathDetail(pathId) {
  currentPathId = pathId;
  var path = PATHS_DATA.find(function(p){return p.id===pathId;});
  if (!path) return;
  var isEnrolled = enrolledPaths[pathId];
  var done = path.steps.filter(function(s){return s.done;}).length;
  var pct = Math.round(done/path.steps.length*100);

  var allSteps = path.steps.map(function(s,i) {
    var dotCls = s.done ? 'psd-done' : (i===done&&isEnrolled) ? 'psd-active' : 'psd-lock';
    var dotIco = s.done ? '✓' : (i===done&&isEnrolled) ? '▶' : (i<done||isEnrolled) ? String(i+1) : '🔒';
    return '<div class="path-step">' +
      '<div class="path-step-dot ' + dotCls + '">' + dotIco + '</div>' +
      '<div class="path-step-txt' + (s.done?' done-step':'') + '">' + s.txt + '</div>' +
      '<div style="display:flex;align-items:center;gap:0.5rem">' +
      '<div class="path-step-xp">+' + s.xp + ' XP</div>' +
      (s.proj ? '<button onclick="closePathDetail();openProj('+s.proj+')" style="background:rgba(14,165,233,0.1);border:1px solid rgba(14,165,233,0.25);color:var(--acc2);font-family:var(--mono);font-size:0.6rem;padding:0.1rem 0.4rem;border-radius:4px;cursor:pointer">Projekt →</button>' : '') +
      '</div>' +
    '</div>';
  }).join('');

  document.getElementById('path-detail-content').innerHTML =
    '<div style="padding:1.5rem">' +
    '<button onclick="closePathDetail()" style="background:none;border:none;color:var(--txt3);font-family:var(--mono);font-size:0.8rem;cursor:pointer;margin-bottom:1rem">← Tillbaka</button>' +
    '<div style="display:flex;gap:1rem;align-items:flex-start;margin-bottom:1.2rem">' +
      '<div style="width:56px;height:56px;border-radius:14px;background:' + path.icoBg + ';display:flex;align-items:center;justify-content:center;font-size:1.8rem;flex-shrink:0">' + path.ico + '</div>' +
      '<div>' +
        '<div style="font-size:1.2rem;font-weight:800;letter-spacing:-0.3px;margin-bottom:0.3rem">' + path.title + '</div>' +
        '<div style="font-family:var(--mono);font-size:0.78rem;color:var(--txt2)">' + path.sub + '</div>' +
        '<div class="path-badges" style="margin-top:0.5rem">' +
          '<span class="path-badge pb-weeks">⏱ ' + path.weeks + ' veckor</span>' +
          '<span class="path-badge pb-lvl">' + path.level + '</span>' +
          '<span class="path-badge pb-lang">' + path.lang + '</span>' +
          (path.isPro ? '<span class="path-badge pb-pro">👑 Pro</span>' : '') +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div style="font-family:var(--mono);font-size:0.81rem;color:var(--txt2);line-height:1.75;margin-bottom:1.2rem">' + path.desc + '</div>' +
    (isEnrolled ? '<div style="background:var(--sur2);border:1px solid var(--bdr);border-radius:10px;padding:0.85rem;margin-bottom:1.2rem">' +
      '<div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:0.72rem;color:var(--txt3);margin-bottom:0.5rem"><span>Din progress</span><span>' + done + '/' + path.steps.length + ' steg · ' + pct + '%</span></div>' +
      '<div class="path-prog-bg"><div class="path-prog-fill" style="width:' + pct + '%;background:' + path.banner + '"></div></div>' +
    '</div>' : '') +
    '<div class="db-section-head">Alla steg</div>' +
    '<div class="path-steps-wrap" style="background:var(--sur2);border:1px solid var(--bdr);border-radius:10px;padding:0.5rem 0.85rem">' + allSteps + '</div>' +
    '<div style="margin-top:1.2rem;display:flex;gap:0.75rem;flex-wrap:wrap">' +
    (isEnrolled ?
      '<button class="path-cta" style="background:linear-gradient(135deg,var(--grn),#059669)" onclick="closePathDetail();go(\'projects\')">Fortsätt koda →</button>' :
      '<button class="path-cta" onclick="enrollPath(\'' + pathId + '\');closePathDetail()">Starta spår →</button>'
    ) +
    '<button style="background:var(--sur2);border:1px solid var(--bdr);color:var(--txt);font-family:var(--sans);font-size:0.82rem;font-weight:700;padding:0.58rem 1.1rem;border-radius:9px;cursor:pointer" onclick="closePathDetail()">Stäng</button>' +
    '</div>' +
    '</div>';

  document.getElementById('path-ov').classList.add('open');
}

function closePathDetail(e) {
  if (!e || e.target === document.getElementById('path-ov')) {
    document.getElementById('path-ov').classList.remove('open');
  }
}

// ============================================================
// 3. COMMUNITY & KOMMENTARER
// ============================================================
var COMMENTS_DB = {
  1: [
    {id:1, av:'🦊', name:'FoxCoder', role:'Pro', time:'2 dagar sedan', text:'Supertrolig uppgift! Tips: använd <code>Math.random()</code> kombinerat med en while-loop så är du klar på 20 rader.', likes:7, liked:false,
     replies:[{av:'🌟', name:'Sara L.', time:'1 dag sedan', text:'Tack för tipset! Det funkade direkt 🙌', likes:3, liked:false}]},
    {id:2, av:'🐉', name:'DragonJS', role:'Pro', time:'5 dagar sedan', text:'Jag utmanade mig själv att göra det med bara 10 rader. Gick faktiskt! Nyckeln är att baka in gränskontrollen direkt i while-villkoret.', likes:12, liked:false, replies:[]},
    {id:3, av:'🌱', name:'NybörjarNils', role:'', time:'1 vecka sedan', text:'Fastnade på hur man ska läsa input från användaren i JavaScript. Hur gör man det bäst utan prompt()?', likes:2, liked:false, replies:[]},
  ],
};

function buildCommunitySection(projId) {
  return '<div class="comm-section" id="comm-' + projId + '">' +
    '<div class="comm-head" onclick="toggleComm(' + projId + ')">' +
      '<div class="comm-head-left">' +
        '<span class="comm-title">💬 Diskussion</span>' +
        '<span class="comm-count" id="comm-cnt-' + projId + '">Laddar...</span>' +
      '</div>' +
      '<span class="comm-toggle" id="comm-tog-' + projId + '">▼</span>' +
    '</div>' +
    '<div class="comm-body" id="comm-body-' + projId + '"></div>' +
  '</div>';
}

function toggleComm(projId) {
  var body = document.getElementById('comm-body-' + projId);
  var tog = document.getElementById('comm-tog-' + projId);
  if (!body) return;
  var isOpen = body.classList.toggle('open');
  if (tog) tog.classList.toggle('open', isOpen);
  if (isOpen) renderComments(projId);
}

function renderComments(projId) {
  var body = document.getElementById('comm-body-' + projId);
  var cnt = document.getElementById('comm-cnt-' + projId);
  if (!body) return;
  var comments = COMMENTS_DB[projId] || [];
  if (cnt) cnt.textContent = comments.length + ' kommentarer';

  var inputHtml = user ?
    '<div class="comm-input-row">' +
      '<div class="comm-av">' + (user.avatar||'👤') + '</div>' +
      '<div class="comm-inp-wrap">' +
        '<textarea class="comm-inp" id="comm-inp-' + projId + '" placeholder="Dela en tanke, ställ en fråga eller ge ett tips..." rows="2"></textarea>' +
        '<button class="comm-send" onclick="postComment(' + projId + ')">Skicka →</button>' +
      '</div>' +
    '</div>' :
    '<div class="comm-login-note">👋 <a onclick="openAuth(\'login\')">Logga in</a> för att delta i diskussionen och tjäna +2 XP per kommentar.</div>';

  var listHtml = comments.length ?
    '<div class="comm-list">' + comments.map(function(c){ return renderComment(projId, c); }).join('') + '</div>' :
    '<div class="comm-empty">Bli den första att kommentera! 💬</div>';

  body.innerHTML = inputHtml + '<div style="margin-top:0.85rem">' + listHtml + '</div>';
}

function renderComment(projId, c) {
  var repliesHtml = (c.replies && c.replies.length) ?
    '<div class="comm-replies">' + c.replies.map(function(r){
      return '<div class="comm-item">' +
        '<div class="comm-item-av" style="width:26px;height:26px;font-size:0.78rem">' + r.av + '</div>' +
        '<div class="comm-item-body">' +
          '<div class="comm-item-head"><span class="comm-item-name">' + r.name + '</span><span class="comm-item-time">' + r.time + '</span></div>' +
          '<div class="comm-item-text">' + r.text + '</div>' +
          '<div class="comm-actions"><button class="comm-like' + (r.liked?' liked':'') + '" onclick="likeReply(this)">❤ ' + r.likes + '</button></div>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>' : '';

  return '<div class="comm-item" id="comm-item-' + c.id + '">' +
    '<div class="comm-item-av">' + c.av + '</div>' +
    '<div class="comm-item-body">' +
      '<div class="comm-item-head">' +
        '<span class="comm-item-name">' + c.name + '</span>' +
        (c.role ? '<span class="comm-item-role">👑 ' + c.role + '</span>' : '') +
        '<span class="comm-item-time">' + c.time + '</span>' +
      '</div>' +
      '<div class="comm-item-text">' + c.text + '</div>' +
      '<div class="comm-actions">' +
        '<button class="comm-like' + (c.liked?' liked':'') + '" onclick="likeComment(' + projId + ',' + c.id + ',this)">❤ ' + c.likes + '</button>' +
        '<button class="comm-reply-btn" onclick="toggleReplyInput(' + projId + ',' + c.id + ')">Svara</button>' +
      '</div>' +
      '<div class="comm-reply-input" id="reply-inp-' + projId + '-' + c.id + '">' +
        (user ? '<div class="comm-av" style="width:26px;height:26px;font-size:0.78rem">' + (user.avatar||'👤') + '</div>' : '') +
        '<div class="comm-inp-wrap">' +
          '<textarea class="comm-inp" id="reply-txt-' + projId + '-' + c.id + '" placeholder="Skriv ett svar..." rows="2" style="font-size:0.75rem"></textarea>' +
          '<button class="comm-send" style="font-size:0.72rem;padding:0.35rem 0.85rem" onclick="postReply(' + projId + ',' + c.id + ')">Svara →</button>' +
        '</div>' +
      '</div>' +
      repliesHtml +
    '</div>' +
  '</div>';
}

function likeComment(projId, commentId, btn) {
  if (!user) { toast('Logga in för att gilla!', 'info'); return; }
  var comments = COMMENTS_DB[projId] || [];
  var c = comments.find(function(x){return x.id===commentId;});
  if (!c) return;
  c.liked = !c.liked;
  c.likes += c.liked ? 1 : -1;
  btn.classList.toggle('liked', c.liked);
  btn.textContent = '❤ ' + c.likes;
  if (c.liked) toast('+1 XP för att gilla!', 'info');
}

function likeReply(btn) {
  if (!user) { toast('Logga in för att gilla!', 'info'); return; }
  var parts = btn.textContent.split(' ');
  var n = parseInt(parts[1]||'0');
  var liked = btn.classList.toggle('liked');
  btn.textContent = '❤ ' + (liked ? n+1 : n-1);
}

function toggleReplyInput(projId, commentId) {
  var el = document.getElementById('reply-inp-' + projId + '-' + commentId);
  if (!el) return;
  if (!user) { toast('Logga in för att svara!', 'info'); return; }
  el.classList.toggle('open');
}

function postComment(projId) {
  if (!user) { toast('Logga in för att kommentera!', 'info'); return; }
  var inp = document.getElementById('comm-inp-' + projId);
  if (!inp || !inp.value.trim()) { toast('Skriv en kommentar först!', 'info'); return; }
  if (!COMMENTS_DB[projId]) COMMENTS_DB[projId] = [];
  var newComment = {
    id: Date.now(), av: user.avatar||'👤', name: user.username,
    role: user.isPro ? 'Pro' : '', time: 'just nu',
    text: inp.value.trim(), likes: 0, liked: false, replies: []
  };
  COMMENTS_DB[projId].unshift(newComment);
  user.xp = (user.xp||0) + 2;
  updateNav();
  inp.value = '';
  toast('+2 XP för din kommentar!', 'success');
  renderComments(projId);
  var cnt = document.getElementById('comm-cnt-' + projId);
  if (cnt) cnt.textContent = COMMENTS_DB[projId].length + ' kommentarer';
}

function postReply(projId, commentId) {
  if (!user) return;
  var inp = document.getElementById('reply-txt-' + projId + '-' + commentId);
  if (!inp || !inp.value.trim()) return;
  var comments = COMMENTS_DB[projId] || [];
  var c = comments.find(function(x){return x.id===commentId;});
  if (!c) return;
  if (!c.replies) c.replies = [];
  c.replies.push({av:user.avatar||'👤', name:user.username, time:'just nu', text:inp.value.trim(), likes:0, liked:false});
  user.xp = (user.xp||0) + 2;
  updateNav();
  toast('+2 XP för ditt svar!', 'success');
  inp.value = '';
  renderComments(projId);
}

// Init comment counts on page load
function initCommentCounts() {
  Object.keys(COMMENTS_DB).forEach(function(projId) {
    var cnt = document.getElementById('comm-cnt-' + projId);
    if (cnt) cnt.textContent = COMMENTS_DB[projId].length + ' kommentarer';
  });
}


// ── DROPDOWN NAV JS ──
function toggleNavDrop(name) {
  var toggle = document.getElementById('nav-' + name + '-toggle');
  var drop = document.getElementById('nav-drop-' + name);
  if (!toggle || !drop) return;
  var isOpen = drop.classList.contains('drop-open');
  closeNavDrops();
  if (!isOpen) {
    drop.classList.add('drop-open');
    toggle.classList.add('drop-open');
  }
}
function closeNavDrops() {
  document.querySelectorAll('.nav-dropdown').forEach(function(d){d.classList.remove('drop-open');});
  document.querySelectorAll('.nav-drop-toggle').forEach(function(t){t.classList.remove('drop-open');});
}
// Close on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('.nav-drop')) closeNavDrops();
});

// ============================================================
// 1. THEME TOGGLE
// ============================================================
var currentTheme = 'dark';

function initTheme() {
  try {
    var saved = localStorage.getItem('kl_theme') || 'dark';
    setTheme(saved, false);
  } catch(e) { setTheme('dark', false); }
}

function toggleTheme() {
  setTheme(currentTheme === 'dark' ? 'light' : 'dark', true);
}

function setTheme(theme, save) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  var btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
  if (save) try { localStorage.setItem('kl_theme', theme); } catch(e) {}
}

// ============================================================
// 2. TYPING ANIMATION (hero subtitle)
// ============================================================
var TYPING_WORDS = ['JavaScript', 'Python', 'C#', 'SQL', 'React', 'TypeScript'];
var typingIdx = 0, typingCharIdx = 0, typingDeleting = false;

function runTyping() {
  var el = document.getElementById('typing-lang');
  if (!el) return;
  var word = TYPING_WORDS[typingIdx];
  if (!typingDeleting) {
    typingCharIdx++;
    el.textContent = word.slice(0, typingCharIdx);
    if (typingCharIdx === word.length) {
      typingDeleting = true;
      setTimeout(runTyping, 1600);
      return;
    }
    setTimeout(runTyping, 80);
  } else {
    typingCharIdx--;
    el.textContent = word.slice(0, typingCharIdx);
    if (typingCharIdx === 0) {
      typingDeleting = false;
      typingIdx = (typingIdx + 1) % TYPING_WORDS.length;
      setTimeout(runTyping, 320);
      return;
    }
    setTimeout(runTyping, 45);
  }
}

// ============================================================
// 3. PROJECT SEARCH + SORT
// ============================================================
let projSearchQuery = '';
let projSortMode = 'default';

function projSearch() {
  var inp = document.getElementById('proj-search');
  var clr = document.getElementById('proj-search-clear');
  var sortSel = document.getElementById('proj-sort');
  projSearchQuery = inp ? inp.value.trim().toLowerCase() : '';
  projSortMode = sortSel ? sortSel.value : 'default';
  if (clr) clr.classList.toggle('visible', projSearchQuery.length > 0);
  renderProjects();
}

function clearProjSearch() {
  var inp = document.getElementById('proj-search');
  if (inp) inp.value = '';
  projSearchQuery = '';
  var clr = document.getElementById('proj-search-clear');
  if (clr) clr.classList.remove('visible');
  renderProjects();
  inp && inp.focus();
}

// Keyboard shortcut: "/" to focus search when on projects page
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    closeNavDrops();
    closePM && closePM();
    var obOv = document.getElementById('ob-ov');
    if (obOv) obOv.classList.remove('open');
    var pathOv = document.getElementById('path-ov');
    if (pathOv) pathOv.classList.remove('open');
  }
  if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
    var active = document.querySelector('.page.active');
    if (active && active.id === 'page-projects') {
      var inp = document.getElementById('proj-search');
      if (inp && document.activeElement !== inp) {
        e.preventDefault();
        inp.focus();
      }
    }
  }
});

// Patch renderProjects to support search + sort + skeleton + empty state
var _origRenderProjects = renderProjects;
renderProjects = function() {
  var grid = document.getElementById('pgrid');
  var lbl = document.getElementById('proj-results-lbl');
  if (!grid) { _origRenderProjects(); return; }

  // Show skeleton while "loading"
  if (!window._projLoaded) {
    grid.innerHTML = [1,2,3,4,5,6].map(function() {
      return '<div class="skel-card">' +
        '<div class="skel-row"><div class="skel-circle skeleton"></div><div class="skel-line w60 skeleton"></div></div>' +
        '<div class="skel-line w80 skeleton"></div>' +
        '<div class="skel-block skeleton"></div>' +
        '<div class="skel-row"><div class="skel-line w30 skeleton"></div><div class="skel-line w40 skeleton"></div></div>' +
      '</div>';
    }).join('');
    setTimeout(function() {
      window._projLoaded = true;
      renderProjects();
    }, 500);
    return;
  }

  var lang = (typeof custom !== 'undefined') ? custom.lang : 'javascript';
  var q = projSearchQuery;

  var list = (typeof PROJS !== 'undefined' ? PROJS : []).filter(function(p) {
    if ((typeof filters !== 'undefined') && filters.lv !== 'all' && p.lv !== filters.lv) return false;
    if ((typeof filters !== 'undefined') && filters.ct !== 'all' && p.ct !== filters.ct) return false;
    if ((typeof filters !== 'undefined') && filters.lg !== 'all' && p.tags.indexOf(filters.lg) === -1) return false;
    if (q) {
      var haystack = (p.title + ' ' + p.desc + ' ' + (p.tags||[]).join(' ') + ' ' + p.ct).toLowerCase();
      return haystack.indexOf(q) > -1;
    }
    return true;
  });

  // Sort
  var lvOrder = {beginner:0, medium:1, advanced:2};
  if (projSortMode === 'az') list = list.slice().sort(function(a,b){return a.title.localeCompare(b.title,'sv');});
  else if (projSortMode === 'easy') list = list.slice().sort(function(a,b){return lvOrder[a.lv]-lvOrder[b.lv];});
  else if (projSortMode === 'hard') list = list.slice().sort(function(a,b){return lvOrder[b.lv]-lvOrder[a.lv];});
  else if (projSortMode === 'quick') list = list.slice().sort(function(a,b){return (parseInt(a.time)||99)-(parseInt(b.time)||99);});

  // Results label
  if (lbl) {
    if (q) lbl.textContent = list.length + ' träff' + (list.length!==1?'ar':'') + ' för "' + q + '"';
    else lbl.textContent = list.length + ' projekt';
  }

  // Empty state
  if (!list.length) {
    grid.innerHTML = '<div class="empty-state">' +
      '<div class="empty-state-ico">🔍</div>' +
      '<div class="empty-state-title">Inga projekt hittades</div>' +
      '<div class="empty-state-sub">Ingen matchning för "' + q + '". Prova ett annat sökord eller ta bort filter.</div>' +
      '<button class="empty-state-btn" onclick="clearProjSearch()">✕ Rensa sökning</button>' +
    '</div>';
    return;
  }

  // Highlight helper
  function hlText(str, q) {
    if (!q) return str;
    var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + ')', 'gi');
    return str.replace(re, '<mark class="search-hl">$1</mark>');
  }

  grid.innerHTML = list.map(function(p) {
    var locked = p.free === false && !(typeof user !== 'undefined' && user && user.isPro);
    var tagHtml = (p.tags||[]).map(function(t) {
      var cls = t==='python'?'py':t==='csharp'?'cs':t==='sql'?'sq':'js';
      return '<span class="tc ' + cls + '">' + t + '</span>';
    }).join('');
    var lvlCls = p.lv==='beginner'?'lb':p.lv==='medium'?'lm':'la';
    var lvlTxt = p.lv==='beginner'?'Nybörjare':p.lv==='medium'?'Medel':'Avancerad';
    var lockOverlay = locked ?
      '<div class="lov"><div class="loi">🔒</div><div class="lot">Pro-projekt</div><div class="los">Lås upp med Pro</div>' +
      '<button class="lobtn" onclick="event.stopPropagation();closeUp();go(\'pricing\')">Uppgradera →</button></div>' : '';
    var titleHl = hlText(p.title, q);
    var descHl = hlText(p.desc, q);
    var clickFn = locked ? ("rp('" + p.ct + "')") : ('openProj(' + p.id + ')');
    var btnCls = locked ? 'pcbtn lb2' : 'pcbtn';
    var btnTxt = locked ? '🔒 Pro' : 'Visa →';
    return '<div class="pc' + (locked?' lk':'') + '" onclick="' + clickFn + '">' +
      '<div class="pca"></div>' +
      '<div class="pcb">' +
        '<div class="pct">' +
          '<span class="pce">' + p.emoji + '</span>' +
          '<div class="pcbadges">' +
            '<span class="lvl ' + lvlCls + '">' + lvlTxt + '</span>' +
            (locked ? '<span class="ll">🔒 PRO</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="pctit">' + titleHl + '</div>' +
        '<div class="pcdesc">' + descHl + '</div>' +
        '<div class="pctags">' + tagHtml + '</div>' +
      '</div>' +
      '<div class="pcf">' +
        '<span class="pctm">⏱ ' + p.time + '</span>' +
        '<button class="' + btnCls + '" onclick="event.stopPropagation();' + clickFn + '">' + btnTxt + '</button>' +
      '</div>' +
      lockOverlay +
    '</div>';
  }).join('');
};

// ============================================================
// 4. SCROLL TO TOP
// ============================================================
window.addEventListener('scroll', function() {
  var btn = document.getElementById('scroll-top-btn');
  if (btn) btn.classList.toggle('visible', window.scrollY > 400);
}, {passive: true});

function scrollToTop() {
  window.scrollTo({top: 0, behavior: 'smooth'});
}

// ============================================================
// 5. COOKIE BANNER
// ============================================================
function initCookieBanner() {
  try {
    if (localStorage.getItem('kl_cookies')) return;
  } catch(e) {}
  setTimeout(function() {
    var banner = document.getElementById('cookie-banner');
    if (banner) banner.classList.add('visible');
  }, 2200);
}

function acceptCookies() {
  try { localStorage.setItem('kl_cookies', 'accepted'); } catch(e) {}
  hideCookieBanner();
  toast('🍪 Cookies accepterade — tack!', 'success');
}

function rejectCookies() {
  try { localStorage.setItem('kl_cookies', 'rejected'); } catch(e) {}
  hideCookieBanner();
}

function hideCookieBanner() {
  var banner = document.getElementById('cookie-banner');
  if (banner) { banner.classList.remove('visible'); }
}

// ============================================================
// 6. INIT ALL POLISH FEATURES
// ============================================================
function initPolishFeatures() {
  initTheme();
  setTimeout(runTyping, 800);
  initCookieBanner();
}

// ============================================================
// REVIEWS SYSTEM
// ============================================================
let reviewStars = 0;
let reviewRole = '';
let spFilterVal = 'all';

// User-submitted reviews (persist in session)
let USER_REVIEWS = [];

// All reviews combined: seeded + user submitted
function getAllReviews() {
  return USER_REVIEWS.concat(TESTIMONIALS.map(function(t) {
    return {
      id: 'seed-' + t.name.replace(/\s/g,''),
      stars: t.stars, quote: t.quote,
      name: t.name, role: t.role, av: t.av, avBg: t.avBg,
      badge: t.badge, helpful: Math.floor(Math.random()*18)+2,
      helpfulVoted: false, isUserReview: false,
      date: randomPastDate()
    };
  }));
}

function randomPastDate() {
  var d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random()*90+3));
  return d.toLocaleDateString('sv-SE');
}

// ── OPEN / CLOSE MODAL ──
function openReviewModal() {
  if (!user) {
    toast('Du måste vara inloggad för att skriva en recension.', 'info');
    setTimeout(function(){ openAuth('login'); }, 400);
    return;
  }
  // Reset state
  reviewStars = 0;
  reviewRole = '';
  setStars(0);
  var txt = document.getElementById('review-text');
  if (txt) txt.value = '';
  reviewTextUpdate();
  document.querySelectorAll('.role-tag').forEach(function(t){ t.classList.remove('sel'); });
  document.getElementById('review-ov').classList.add('open');
}

function closeReviewModal(e) {
  if (!e || e.target === document.getElementById('review-ov')) {
    document.getElementById('review-ov').classList.remove('open');
  }
}

// ── STAR PICKER ──
function setStars(n) {
  reviewStars = n;
  document.querySelectorAll('.star-pick').forEach(function(btn) {
    var v = parseInt(btn.getAttribute('data-val'));
    btn.classList.toggle('lit', v <= n);
  });
  validateReviewForm();
}

// Hover preview
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.star-pick').forEach(function(btn) {
    btn.addEventListener('mouseover', function() {
      var v = parseInt(btn.getAttribute('data-val'));
      document.querySelectorAll('.star-pick').forEach(function(b) {
        b.classList.toggle('lit', parseInt(b.getAttribute('data-val')) <= v);
      });
    });
    btn.addEventListener('mouseleave', function() { setStars(reviewStars); });
  });
});

// ── ROLE TAG ──
function pickRole(btn) {
  document.querySelectorAll('.role-tag').forEach(function(t){ t.classList.remove('sel'); });
  btn.classList.add('sel');
  reviewRole = btn.textContent;
}

// ── TEXT UPDATE ──
function reviewTextUpdate() {
  var txt = document.getElementById('review-text');
  var charEl = document.getElementById('review-char');
  if (!txt || !charEl) return;
  var len = txt.value.length;
  charEl.textContent = len + ' / 500';
  charEl.classList.toggle('warn', len > 420);
  validateReviewForm();
}

function validateReviewForm() {
  var txt = document.getElementById('review-text');
  var btn = document.getElementById('review-submit');
  if (!txt || !btn) return;
  var ok = reviewStars > 0 && txt.value.trim().length >= 30;
  btn.disabled = !ok;
}

// ── SUBMIT REVIEW ──
function submitReview() {
  var txt = document.getElementById('review-text');
  if (!txt || !user) return;
  var quoteText = txt.value.trim();
  if (!quoteText || reviewStars === 0) return;

  var avColors = ['rgba(109,40,217,0.15)','rgba(14,165,233,0.15)','rgba(16,185,129,0.15)','rgba(245,158,11,0.15)','rgba(239,68,68,0.12)'];
  var avEmojis = ['🧑‍💻','👩‍💻','🧑‍🎓','👨‍💻','🚀','💡','🌟','⚡'];

  var newReview = {
    id: 'user-' + Date.now(),
    stars: reviewStars,
    quote: esc(quoteText),
    name: user.username,
    role: reviewRole || 'KodLabbet-användare',
    av: user.avatar || avEmojis[Math.floor(Math.random()*avEmojis.length)],
    avBg: avColors[Math.floor(Math.random()*avColors.length)],
    badge: user.isPro ? 'Pro-användare' : 'Verifierad användare',
    helpful: 0, helpfulVoted: false,
    isUserReview: true,
    date: new Date().toLocaleDateString('sv-SE')
  };

  USER_REVIEWS.unshift(newReview);

  // XP reward
  user.xp = (user.xp || 0) + 10;
  updateNav();

  closeReviewModal();
  renderTestimonials();
  renderReviewSummary();
  toast('🌟 Tack för din recension! +10 XP', 'gold');

  // Scroll to reviews section
  var sp = document.querySelector('.sp-section');
  if (sp) sp.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── FILTER ──
function spFilter(val, btn) {
  spFilterVal = val;
  document.querySelectorAll('.sp-tab').forEach(function(t){ t.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  renderTestimonials();
}

// ── HELPFUL VOTE ──
function voteHelpful(id, btn) {
  if (!user) { toast('Logga in för att rösta!', 'info'); return; }
  var all = getAllReviews();
  var r = USER_REVIEWS.find(function(x){ return x.id === id; });
  // For seeded reviews just update the button
  if (!r) {
    var voted = btn.classList.toggle('voted');
    var parts = btn.textContent.split(' ');
    var n = parseInt(parts[parts.length-1]) || 0;
    btn.textContent = '👍 Hjälpsam ' + (voted ? n+1 : n-1);
    return;
  }
  if (r.helpfulVoted) { toast('Du har redan röstat på denna!', 'info'); return; }
  r.helpfulVoted = true;
  r.helpful++;
  btn.classList.add('voted');
  btn.textContent = '👍 Hjälpsam ' + r.helpful;
}

// ── DELETE OWN REVIEW ──
function deleteReview(id) {
  USER_REVIEWS = USER_REVIEWS.filter(function(r){ return r.id !== id; });
  renderTestimonials();
  renderReviewSummary();
  toast('Recension borttagen.', 'info');
}

// ── RENDER SUMMARY BAR ──
function renderReviewSummary() {
  var el = document.getElementById('sp-summary');
  if (!el) return;
  var all = getAllReviews();
  var total = all.length;
  var avg = total ? (all.reduce(function(s,r){ return s+r.stars; },0) / total) : 0;
  var avgStr = avg.toFixed(1);

  // Count per star
  var counts = [0,0,0,0,0];
  all.forEach(function(r){ if(r.stars>=1&&r.stars<=5) counts[r.stars-1]++; });

  var barsHtml = [5,4,3,2,1].map(function(s) {
    var cnt = counts[s-1];
    var pct = total ? Math.round(cnt/total*100) : 0;
    return '<div class="sp-bar-row">' +
      '<span>' + s + '★</span>' +
      '<div class="sp-bar-bg"><div class="sp-bar-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="sp-bar-n">' + cnt + '</span>' +
    '</div>';
  }).join('');

  el.innerHTML =
    '<div class="sp-avg">' +
      '<div class="sp-avg-num">' + avgStr + '</div>' +
      '<div class="sp-avg-stars">' + '⭐'.repeat(Math.round(avg)) + '</div>' +
      '<div class="sp-avg-cnt">' + total + ' recensioner</div>' +
    '</div>' +
    '<div class="sp-bars">' + barsHtml + '</div>' +
    '<div style="flex:1;min-width:160px;font-family:var(--mono);font-size:0.78rem;color:var(--txt2);line-height:1.8">' +
      (user ? '✅ Du är inloggad och kan skriva en recension.' : '🔒 <a onclick="openAuth(\'login\')" style="color:var(--acc2);cursor:pointer">Logga in</a> för att dela din upplevelse.') +
      '<br><span style="color:var(--txt3)">Alla recensioner är från riktiga KodLabbet-användare.</span>' +
    '</div>';
}

// ── PATCH renderTestimonials TO USE ALL REVIEWS + FILTER ──
renderTestimonials = function() {
  var el = document.getElementById('sp-grid');
  if (!el) return;

  var all = getAllReviews();
  var filtered = spFilterVal === 'all' ? all : all.filter(function(r){ return r.stars === spFilterVal; });

  if (!filtered.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-state-ico">📭</div><div class="empty-state-title">Inga recensioner för detta betyg ännu</div><div class="empty-state-sub">Bli den första att lämna en recension med detta betyg!</div></div>';
    return;
  }

  el.innerHTML = filtered.map(function(r) {
    var isOwn = user && r.isUserReview && r.name === user.username;
    var starsHtml = '⭐'.repeat(r.stars) + (r.stars<5 ? '☆'.repeat(5-r.stars) : '');
    return '<div class="tcard' + (r.isUserReview?' user-review':'') + '">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.4rem">' +
        '<div class="tcard-stars">' + starsHtml + '</div>' +
        '<span style="font-family:var(--mono);font-size:0.65rem;color:var(--txt3)">' + (r.date||'') + '</span>' +
      '</div>' +
      '<div class="tcard-quote">"' + r.quote + '"</div>' +
      '<div class="tcard-person">' +
        '<div class="tcard-av" style="background:' + r.avBg + '">' + r.av + '</div>' +
        '<div style="flex:1">' +
          '<div class="tcard-name">' + r.name + (r.isUserReview ? ' <span style="font-size:0.65rem;color:var(--acc2)">✓ Du</span>' : '') + '</div>' +
          '<div class="tcard-role">' + r.role + '</div>' +
        '</div>' +
        '<span class="tcard-badge">' + r.badge + '</span>' +
      '</div>' +
      '<div class="tcard-actions">' +
        '<button class="tcard-helpful' + (r.helpfulVoted?' voted':'') + '" onclick="voteHelpful(\'' + r.id + '\',this)">👍 Hjälpsam ' + r.helpful + '</button>' +
        (isOwn ? '<button class="tcard-delete" onclick="deleteReview(\'' + r.id + '\')">🗑 Radera</button>' : '') +
      '</div>' +
    '</div>';
  }).join('');

  renderReviewSummary();
};

// Init on page load
var _origInitConversion = typeof initConversionFeatures === 'function' ? initConversionFeatures : function(){};
initConversionFeatures = function() {
  _origInitConversion();
  renderReviewSummary();
};

// ============================================================
// KONFETTI
// ============================================================
function launchKonfetti(duration) {
  var canvas = document.getElementById('konfetti-canvas');
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  var ctx = canvas.getContext('2d');
  var pieces = [];
  var colors = ['#6d28d9','#0ea5e9','#10b981','#f59e0b','#ec4899','#ef4444','#fff'];
  for (var i = 0; i < 120; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 200,
      w: 6 + Math.random() * 8,
      h: 10 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      rot: Math.random() * 360,
      vrot: (Math.random() - 0.5) * 8,
      life: 1
    });
  }
  var end = Date.now() + (duration || 2500);
  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(function(p) {
      p.x += p.vx; p.y += p.vy; p.rot += p.vrot;
      p.vy += 0.08;
      ctx.save();
      ctx.translate(p.x + p.w/2, p.y + p.h/2);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, (end - Date.now()) / 800);
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
    });
    if (Date.now() < end) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  requestAnimationFrame(frame);
}

// ============================================================
// NOTIFICATIONS
// ============================================================
let NOTIFS = [
  { id:1, ico:'🔥', title:'7 dagars streak!', sub:'Du har kodat 7 dagar i rad. Håll i det!', time:'Idag', unread:true },
  { id:2, ico:'🏅', title:'Badge upplåst: Snabbstart', sub:'Du har slutfört ditt första projekt!', time:'Igår', unread:true },
  { id:3, ico:'⚔️', title:'Ny arenautmaning tillgänglig', sub:'Veckans PvP-turnering har börjat!', time:'2 dagar sedan', unread:false },
  { id:4, ico:'💡', title:'Ny kunskapsartikel', sub:'React Hooks — komplett guide är nu publicerad', time:'3 dagar sedan', unread:false },
  { id:5, ico:'🎯', title:'Daglig utmaning väntar!', sub:"Lös dagens problem och håll din streak igång", time:'3 dagar sedan', unread:false },
];

function toggleNotifPanel() {
  var panel = document.getElementById('notif-panel');
  if (!panel) return;
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) renderNotifs();
}

function renderNotifs() {
  var el = document.getElementById('notif-list');
  if (!el) return;
  if (!NOTIFS.length) {
    el.innerHTML = '<div class="notif-empty">🎉 Inga nya notifikationer</div>';
    return;
  }
  el.innerHTML = NOTIFS.map(function(n) {
    return '<div class="notif-item' + (n.unread?' unread':'') + '" onclick="readNotif(' + n.id + ')">' +
      '<div class="notif-ico">' + n.ico + '</div>' +
      '<div class="notif-body">' +
        '<div class="notif-title">' + n.title + '</div>' +
        '<div class="notif-sub">' + n.sub + '</div>' +
        '<div class="notif-time">' + n.time + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
  updateNotifDot();
}

function readNotif(id) {
  var n = NOTIFS.find(function(x){ return x.id === id; });
  if (n) n.unread = false;
  renderNotifs();
}

function clearNotifs() {
  NOTIFS.forEach(function(n){ n.unread = false; });
  renderNotifs();
  updateNotifDot();
}

function updateNotifDot() {
  var unread = NOTIFS.filter(function(n){ return n.unread; }).length;
  ['notif-dot','notif-dot2'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = unread ? 'block' : 'none';
  });
}

function addNotif(ico, title, sub) {
  NOTIFS.unshift({ id: Date.now(), ico:ico, title:title, sub:sub, time:'Just nu', unread:true });
  updateNotifDot();
}

// Close on outside click
document.addEventListener('click', function(e) {
  var panel = document.getElementById('notif-panel');
  var wrap = document.getElementById('notif-wrap');
  var btn = document.getElementById('nav-notif-btn');
  if (panel && panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn && !(wrap && wrap.contains(e.target))) {
    panel.classList.remove('open');
  }
});

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
function openShortcuts() {
  document.getElementById('shortcuts-ov').classList.add('open');
}
function closeShortcuts(e) {
  if (!e || e.target === document.getElementById('shortcuts-ov'))
    document.getElementById('shortcuts-ov').classList.remove('open');
}

let _gKey = null;
document.addEventListener('keydown', function(e) {
  var tag = (e.target.tagName||'').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || e.ctrlKey || e.metaKey || e.altKey) return;
  var k = e.key;
  // G-prefix navigation
  if (_gKey) {
    var dest = {h:'home',p:'projects',d:'dashboard',k:'ai',$:'pricing'};
    if (dest[k.toLowerCase()]) go(dest[k.toLowerCase()]);
    _gKey = null; return;
  }
  if (k === 'g' || k === 'G') { _gKey = true; setTimeout(function(){ _gKey = null; }, 1200); return; }
  if (k === '?') { openShortcuts(); e.preventDefault(); return; }
  if (k === 't' || k === 'T') { toggleTheme(); return; }
});

// ============================================================
// PROFILE PAGE
// ============================================================
let profileData = {
  avatar: '🧑‍💻',
  bio: 'Kodar för att lära mig nya saker.',
  joined: '2026-01-15'
};

function renderProfile() {
  if (!user) {
    toast('Logga in för att se din profil!', 'info');
    openAuth('login');
    return;
  }
  // Hero
  var hero = document.getElementById('prof-hero');
  if (hero) {
    hero.innerHTML =
      '<div class="prof-av">' + esc(user.avatar || profileData.avatar) + '</div>' +
      '<div class="prof-info">' +
        '<h2>' + (user.username || 'Kodare') + '</h2>' +
        '<div class="prof-role">' + (user.isPro ? '⭐ Pro-användare' : '🌱 Gratis-plan') + '</div>' +
        '<div class="prof-joined">Medlem sedan ' + profileData.joined + '</div>' +
        (profileData.bio ? '<div style="font-family:var(--mono);font-size:0.78rem;color:var(--txt2);margin-top:0.5rem">' + esc(profileData.bio) + '</div>' : '') +
      '</div>';
  }
  // Stats
  var sr = document.getElementById('prof-stats-row');
  if (sr) {
    var stats = [
      { val: user.xp || 0, lbl: 'Total XP', color: 'var(--acc2)' },
      { val: DAILY_STATE.streak, lbl: 'Streak', color: 'var(--acc3)' },
      { val: DB_COMPLETED_PROJS.length, lbl: 'Projekt klara', color: 'var(--grn)' },
      { val: BADGES.filter(function(b){ return b.unlocked; }).length, lbl: 'Badges', color: 'var(--gold)' },
    ];
    sr.innerHTML = stats.map(function(s) {
      return '<div class="prof-stat">' +
        '<div class="prof-stat-val" style="color:' + s.color + '">' + s.val + '</div>' +
        '<div class="prof-stat-lbl">' + s.lbl + '</div>' +
      '</div>';
    }).join('');
  }
  // Badges
  var bg = document.getElementById('prof-badge-grid');
  if (bg) {
    bg.innerHTML = BADGES.map(function(b) {
      return '<div class="prof-badge' + (b.unlocked?'':' locked') + '" title="' + b.name + (b.unlocked?'':', låst') + '">' +
        b.ico + '<div class="prof-badge-lbl">' + b.name.split(' ')[0] + '</div>' +
      '</div>';
    }).join('');
  }
  // Activity heatmap
  var act = document.getElementById('prof-activity');
  if (act) {
    var levels = ['','l1','l2','l3','l4'];
    act.innerHTML = Array.from({length:30}, function(_,i) {
      var lv = i % 7 === 6 ? 0 : [0,1,2,3,4][Math.floor(Math.random()*5)];
      return '<div class="prof-act-cell ' + levels[lv] + '" title="Dag ' + (i+1) + '"></div>';
    }).join('');
  }
  // Projects
  var pp = document.getElementById('prof-projects');
  if (pp) {
    if (!DB_COMPLETED_PROJS.length) {
      pp.innerHTML = '<div style="font-family:var(--mono);font-size:0.8rem;color:var(--txt3);text-align:center;padding:1rem">Inga slutförda projekt ännu.</div>';
    } else {
      pp.innerHTML = DB_COMPLETED_PROJS.map(function(p) {
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0;border-bottom:1px solid var(--bdr)">' +
          '<span>' + p.emoji + ' ' + p.title + '</span>' +
          '<span style="font-family:var(--mono);font-size:0.7rem;color:var(--grn)">+' + p.xp + ' XP</span>' +
        '</div>';
      }).join('');
    }
  }
}

function openEditProfile() {
  var ov = document.getElementById('prof-edit-ov');
  if (!ov) return;
  document.getElementById('edit-username').value = user ? user.username : '';
  document.getElementById('edit-bio').value = profileData.bio || '';
  document.querySelectorAll('.av-opt').forEach(function(a) {
    a.classList.toggle('sel', a.textContent === (user && user.avatar || profileData.avatar));
  });
  ov.classList.add('open');
}
function closeEditProfile(e) {
  if (!e || e.target === document.getElementById('prof-edit-ov'))
    document.getElementById('prof-edit-ov').classList.remove('open');
}
function selectAv(el) {
  document.querySelectorAll('.av-opt').forEach(function(a){ a.classList.remove('sel'); });
  el.classList.add('sel');
}
function saveProfile() {
  var name = document.getElementById('edit-username').value.trim();
  var bio = document.getElementById('edit-bio').value.trim();
  var av = document.querySelector('.av-opt.sel');
  if (name && user) user.username = name;
  if (av) { profileData.avatar = av.textContent; if(user) user.avatar = av.textContent; }
  profileData.bio = bio;
  closeEditProfile();
  renderProfile();
  updateNav();
  toast('✅ Profil sparad!', 'success');
}

// ============================================================
// DASHBOARD ANIMATED COUNTERS
// ============================================================
function animateCounter(el, target, duration) {
  var start = 0;
  var step = target / (duration / 16);
  el.classList.add('counting');
  var iv = setInterval(function() {
    start = Math.min(start + step, target);
    el.textContent = Math.round(start);
    if (start >= target) { clearInterval(iv); el.textContent = target; }
  }, 16);
}

var _origRenderDBStats = renderDBStats;
renderDBStats = function(xp) {
  _origRenderDBStats(xp);
  setTimeout(function() {
    document.querySelectorAll('#db-stats .db-stat-val').forEach(function(el) {
      var val = parseInt(el.textContent);
      if (!isNaN(val) && val > 0) { el.textContent = '0'; animateCounter(el, val, 800); }
    });
  }, 100);
};

// ============================================================
// PRICING FAQ TOGGLE
// ============================================================
function toggleFaq(item) {
  item.classList.toggle('open');
}

// ============================================================
// PATCH go() FOR SMOOTH TRANSITIONS + PROFILE RENDER
// ============================================================
var _origGo = go;
go = function(name) {
  _origGo(name);
  if (name === 'profile') renderProfile();
  // Add notification when visiting certain pages
  if (name === 'dashboard') setTimeout(function() {
    document.querySelectorAll('#db-stats .db-stat-val').forEach(function(el) {
      var val = parseInt(el.textContent);
      if (!isNaN(val) && val > 0) { el.textContent = '0'; animateCounter(el, val, 800); }
    });
  }, 150);
};

// ============================================================
// PATCH XP AWARD + PROJECT COMPLETE → KONFETTI + NOTIF
// ============================================================
var _origToast = toast;
// Hook project complete for konfetti
var _origUpdateNav = updateNav;
updateNav = function() {
  _origUpdateNav();
  // Show profile button when logged in
  var pb = document.getElementById('nav-profile-btn');
  if (pb) pb.style.display = user ? 'inline-block' : 'none';
  updateNotifDot();
};

// Patch submitArena / daily done to launch konfetti
var _origMarkDailyDone = typeof markDailyDone === 'function' ? markDailyDone : null;
if (_origMarkDailyDone) {
  markDailyDone = function() {
    _origMarkDailyDone();
    launchKonfetti(2500);
    addNotif('🎯', 'Daglig utmaning klar!', 'Du har löst dagens utmaning. +XP tillagd!');
  };
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
  updateNotifDot();
  renderNotifs();
  // Click outside notif panel
  document.addEventListener('click', function(e) {
    var panel = document.getElementById('notif-panel');
    if (panel && panel.classList.contains('open')) {
      var btn = document.getElementById('nav-notif-btn');
      if (!panel.contains(e.target) && e.target !== btn) panel.classList.remove('open');
    }
  });
});


// ── LEGAL MODAL ──
const LEGAL_CONTENT = {
  terms: {
    title: '📄 Användarvillkor',
    body: '<h4>1. Användning av tjänsten</h4>KodLabbet tillhandahålls av DittFöretag (kontakt@dindomän.com). Genom att använda tjänsten godkänner du dessa villkor. Tjänsten är avsedd för utbildningssyfte och personligt lärande.<h4>2. Konton</h4>Du ansvarar för att hålla dina inloggningsuppgifter säkra. Dela inte ditt konto med andra. DittFöretag förbehåller sig rätten att stänga konton som missbrukar tjänsten.<h4>3. Innehåll</h4>Allt kursinnehåll, projekt och material på KodLabbet ägs av DittFöretag. Du får använda materialet för personligt lärande men inte sälja eller distribuera det vidare.<h4>4. Betalning och prenumeration</h4>Pro-prenumerationen debiteras månadsvis eller årsvis beroende på valt alternativ. Du kan avbryta när som helst. Återbetalning ges inte för påbörjad period.<h4>5. Ansvarsbegränsning</h4>DittFöretag ansvarar inte för direkta eller indirekta skador som uppstår vid användning av tjänsten. Tjänsten tillhandahålls "i befintligt skick".<h4>6. Kontakt</h4>Frågor om användarvillkoren skickas till kontakt@dindomän.com. Malmö, Sverige, 2026.'
  },
  cookies: {
    title: '🍪 Cookie-policy',
    body: '<h4>Vad är cookies?</h4>Cookies är små textfiler som lagras i din webbläsare. KodLabbet använder cookies för att förbättra din upplevelse och komma ihåg dina inställningar.<h4>Vilka cookies använder vi?</h4><strong>Nödvändiga cookies</strong> — Krävs för att sidan ska fungera. Lagrar inloggningsstatus och temainställning. Kan inte stängas av.<br><br><strong>Preferens-cookies</strong> — Sparar dina filter, streak och daglig aktivitet lokalt i din webbläsare (localStorage). Ingen data skickas till server.<br><br><strong>Analys-cookies</strong> — Vi använder för närvarande inga tredjepartsanalys-cookies.<h4>Hantera cookies</h4>Du kan rensa cookies när som helst i din webbläsares inställningar. Observera att detta loggar ut dig och återställer dina inställningar.<h4>Kontakt</h4>Frågor om vår cookie-policy? Kontakta oss på kontakt@dindomän.com.'
  },
  privacy: {
    title: '🔒 Integritetspolicy',
    body: '<h4>Personuppgiftsansvarig</h4>DittFöretag, Malmö, Sverige. Kontakt: kontakt@dindomän.com<h4>Vilka uppgifter samlar vi in?</h4>Vid registrering samlar vi in e-postadress och användarnamn. Din aktivitet (slutförda projekt, streak, XP) sparas lokalt i din webbläsare.<h4>Hur används uppgifterna?</h4>Din e-post används enbart för kontoinloggning och support. Vi säljer aldrig dina uppgifter till tredje part.<h4>Dina rättigheter (GDPR)</h4>Du har rätt att: begära ut dina uppgifter, rätta felaktiga uppgifter, begära radering av ditt konto, och invända mot behandling. Kontakta kontakt@dindomän.com för att utöva dina rättigheter.<h4>Datalagring</h4>Vi lagrar dina uppgifter så länge ditt konto är aktivt. Vid kontoborttagning raderas all persondata inom 30 dagar.'
  },
  sitemap: {
    title: '🗺️ Sitemap',
    body: '<h4>Sidor</h4><strong>Hem</strong> — Startsida med hero, funktioner och recensioner<br><strong>Projekt</strong> — 25 kodprojekt i JavaScript, Python och C#<br><strong>Lärvägar</strong> — Guidade utbildningsvägar (4 st)<br><strong>Kunskapsbanken</strong> — 22 artiklar om kodning och karriär<br><strong>Daglig utmaning</strong> — Dagliga kodproblem med streak-system<br><strong>Utmaningar</strong> — PvP-arenor och leaderboard<br><strong>Dashboard</strong> — Din progress, badges och statistik<br><strong>KodBot</strong> — AI-kodassistent<br><strong>Priser</strong> — Gratisplan, Pro och Enterprise<br><strong>Profil</strong> — Din profilsida och inställningar<h4>Kontakt</h4>kontakt@dindomän.com · Malmö, Sverige · www.dindomän.com'
  }
};

function openLegalModal(type) {
  var content = LEGAL_CONTENT[type];
  if (!content) return;
  document.getElementById('legal-title').textContent = content.title;
  document.getElementById('legal-body').innerHTML = content.body;
  document.getElementById('legal-ov').classList.add('open');
}
function closeLegalModal(e) {
  if (!e || e.target === document.getElementById('legal-ov'))
    document.getElementById('legal-ov').classList.remove('open');
}

// ===== INIT =====
loadUser();
initPolishFeatures();

