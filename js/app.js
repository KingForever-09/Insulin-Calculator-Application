/* ============================================================
   ตัวช่วยฉีดอินซูลิน — app logic
   Uses Supabase for real auth + database (see config.js and README.md)
   ============================================================ */

let currentUser = null;
let currentProfile = null;
let calcType = 'carb';
let navStack = [];

/* ---------- navigation ---------- */
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-'+id).classList.add('active');
  const hideBackOn = ['login','signup','home'];
  document.getElementById('backBtn').style.visibility = hideBackOn.includes(id) ? 'hidden':'visible';
}
function goto(id){
  navStack.push(id);
  showScreen(id);
  if(id==='food') renderFoodList();
  if(id==='history') renderHistory();
}
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('backBtn').onclick = function(){
    navStack.pop();
    showScreen(navStack.length? navStack[navStack.length-1] : 'home');
  };
  document.getElementById('fontToggle').onclick = function(){
    document.documentElement.classList.toggle('large');
  };
  initSession();
});

/* ---------- session bootstrap ---------- */
async function initSession(){
  const { data: { session } } = await sb.auth.getSession();
  if(session){
    currentUser = session.user;
    await loadProfileAndRoute();
  } else {
    navStack = ['login'];
    showScreen('login');
  }
  sb.auth.onAuthStateChange((event, session) => {
    if(event === 'SIGNED_OUT'){
      currentUser = null; currentProfile = null;
      navStack = ['login']; showScreen('login');
    }
  });
}
async function loadProfileAndRoute(){
  const { data, error } = await sb.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
  if(error){ console.error(error); }
  if(data){
    currentProfile = data;
    enterHome();
  } else {
    document.getElementById('ob-name').value = currentUser.user_metadata?.full_name || '';
    navStack = ['onboard']; showScreen('onboard');
  }
}

/* ---------- signup / login ---------- */
function switchToSignup(){ navStack=['signup']; showScreen('signup'); }
function switchToLogin(){ navStack=['login']; showScreen('login'); }

async function handleSignup(){
  const email = document.getElementById('su-email').value.trim();
  const password = document.getElementById('su-password').value;
  const name = document.getElementById('su-name').value.trim();
  const consent = document.getElementById('su-consent').checked;
  const errEl = document.getElementById('signupError');
  errEl.textContent = '';

  if(!email || !password || !name){ errEl.textContent = 'กรุณากรอกข้อมูลให้ครบทุกช่อง'; return; }
  if(password.length < 6){ errEl.textContent = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'; return; }
  if(!consent){ errEl.textContent = 'กรุณายืนยันการยินยอมให้จัดเก็บข้อมูลก่อนสมัคร'; return; }

  const { data, error } = await sb.auth.signUp({
    email, password,
    options: { data: { full_name: name } }
  });
  if(error){ errEl.textContent = translateAuthError(error.message); return; }

  if(data.session){
    currentUser = data.user;
    document.getElementById('ob-name').value = name;
    navStack = ['onboard']; showScreen('onboard');
  } else {
    // Email confirmation required (default Supabase setting)
    alert('สมัครสำเร็จ! กรุณาตรวจสอบอีเมลของท่านเพื่อยืนยันบัญชี จากนั้นกลับมาเข้าสู่ระบบ');
    switchToLogin();
  }
}

async function handleLogin(){
  const email = document.getElementById('li-email').value.trim();
  const password = document.getElementById('li-password').value;
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';
  if(!email || !password){ errEl.textContent = 'กรุณากรอกอีเมลและรหัสผ่าน'; return; }

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if(error){ errEl.textContent = translateAuthError(error.message); return; }
  currentUser = data.user;
  await loadProfileAndRoute();
}

async function handleForgotPassword(){
  const email = document.getElementById('li-email').value.trim();
  if(!email){ alert('กรุณากรอกอีเมลของท่านในช่องด้านบนก่อน แล้วกดลืมรหัสผ่านอีกครั้ง'); return; }
  const { error } = await sb.auth.resetPasswordForEmail(email);
  if(error){ alert('เกิดข้อผิดพลาด: ' + error.message); return; }
  alert('ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของท่านแล้ว');
}

function translateAuthError(msg){
  if(/already registered/i.test(msg)) return 'อีเมลนี้ถูกใช้สมัครแล้ว กรุณาเข้าสู่ระบบแทน';
  if(/invalid login credentials/i.test(msg)) return 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
  if(/email not confirmed/i.test(msg)) return 'กรุณายืนยันอีเมลของท่านก่อนเข้าสู่ระบบ';
  return msg;
}

async function logout(){
  await sb.auth.signOut();
}

/* ---------- onboarding / profile ---------- */
function showEstimator(){ document.getElementById('estimatorCard').style.display='block'; }
function runEstimator(){
  const w = parseFloat(document.getElementById('est-weight').value);
  if(!w || w<=0){ alert('กรุณากรอกน้ำหนักตัว'); return; }
  const tdi = 0.55 * w;
  const basal = tdi * 0.5;
  const icDenom = 500 / tdi;
  const isf = 1800 / tdi;
  document.getElementById('estimatorResult').innerHTML = `
    <div class="result-box">
      <p>ปริมาณอินซูลินรวมต่อวัน (โดยประมาณ): <b>${tdi.toFixed(1)} หน่วย</b></p>
      <p>อินซูลินพื้นฐาน (basal) โดยประมาณ: <b>${basal.toFixed(1)} หน่วย</b></p>
      <p>อัตราส่วน I:C โดยประมาณ: 1 หน่วยต่อ <b>${icDenom.toFixed(1)} กรัม</b></p>
      <p>Correction Factor โดยประมาณ: 1 หน่วยลด <b>${isf.toFixed(1)} mg/dl</b></p>
    </div>
    <div class="warn-box">นี่คือค่าประมาณจากสูตรน้ำหนักตัวเท่านั้น กรุณานำไปให้แพทย์ตรวจสอบและปรับให้เหมาะกับท่านก่อนนำไปกรอกด้านบน</div>
  `;
  document.getElementById('ob-ic').value = icDenom.toFixed(0);
  document.getElementById('ob-isf').value = isf.toFixed(0);
}

async function saveOnboard(){
  const full_name = document.getElementById('ob-name').value.trim();
  if(!full_name){ alert('กรุณากรอกชื่อ-นามสกุล'); return; }

  const payload = {
    id: currentUser.id,
    full_name,
    age: parseInt(document.getElementById('ob-age').value) || null,
    years_diagnosed: parseInt(document.getElementById('ob-years').value) || null,
    ic_ratio: parseFloat(document.getElementById('ob-ic').value) || null,
    isf: parseFloat(document.getElementById('ob-isf').value) || null,
    target_bg: parseFloat(document.getElementById('ob-target').value) || null,
    low_bg: parseFloat(document.getElementById('ob-low').value) || 70,
    pen_increment: parseFloat(document.getElementById('ob-increment').value) || 1,
    consent_given_at: new Date().toISOString()
  };
  const { data, error } = await sb.from('profiles').upsert(payload).select().maybeSingle();
  if(error){ alert('บันทึกไม่สำเร็จ: ' + error.message); return; }
  currentProfile = data;
  enterHome();
}

function enterHome(){
  document.getElementById('homeGreeting').textContent = 'สวัสดีคุณ ' + currentProfile.full_name;
  document.getElementById('homeSub').textContent = 'เป็นเบาหวานมา ' + (currentProfile.years_diagnosed ?? '-') + ' ปี';
  navStack=['home']; showScreen('home');
}

function openSettings(){
  // pre-fill onboarding form with current profile for editing
  document.getElementById('ob-name').value = currentProfile.full_name || '';
  document.getElementById('ob-age').value = currentProfile.age || '';
  document.getElementById('ob-years').value = currentProfile.years_diagnosed || '';
  document.getElementById('ob-ic').value = currentProfile.ic_ratio || '';
  document.getElementById('ob-isf').value = currentProfile.isf || '';
  document.getElementById('ob-target').value = currentProfile.target_bg || '';
  document.getElementById('ob-low').value = currentProfile.low_bg || 70;
  document.getElementById('ob-increment').value = currentProfile.pen_increment || 1;
  goto('onboard');
}

/* ---------- calculator ---------- */
function startCalc(type){
  calcType = type;
  document.getElementById('calc-carb-block').style.display = (type==='carb'||type==='both') ? 'block':'none';
  document.getElementById('calc-bg-block').style.display = (type==='correction'||type==='both') ? 'block':'none';
  document.getElementById('calcResultArea').innerHTML='';
  goto('calc-input');
}
function calculate(){
  if(!currentProfile || !currentProfile.ic_ratio || !currentProfile.isf || !currentProfile.target_bg){
    alert('กรุณากรอกค่า I:C, Correction Factor และเป้าหมายน้ำตาลในหน้า "ข้อมูลส่วนตัว / ตั้งค่า" ก่อนใช้งานเครื่องคำนวณ');
    return;
  }
  let carbDose=0, corrDose=0, carbs=0, bg=0;
  if(calcType==='carb' || calcType==='both'){
    carbs = parseFloat(document.getElementById('calc-carbs').value) || 0;
    carbDose = carbs / currentProfile.ic_ratio;
  }
  let lowWarning = false;
  if(calcType==='correction' || calcType==='both'){
    bg = parseFloat(document.getElementById('calc-bg').value) || 0;
    if(bg && bg <= currentProfile.low_bg){
      lowWarning = true;
    } else if(bg){
      corrDose = Math.max(0, (bg - currentProfile.target_bg) / currentProfile.isf);
    }
  }
  const inc = currentProfile.pen_increment || 1;
  const rawTotal = carbDose + corrDose;
  const total = Math.round(rawTotal / inc) * inc;

  let html = '';
  if(lowWarning){
    html += `<div class="warn-box">⚠️ ระดับน้ำตาล ${bg} mg/dl ต่ำกว่าเกณฑ์อันตรายของท่าน (${currentProfile.low_bg} mg/dl)<br>
      กรุณา<b>รับประทานอาหาร/เครื่องดื่มที่มีน้ำตาลทันที</b> และห้ามฉีดอินซูลินเพิ่มเพื่อแก้ไขน้ำตาลในรอบนี้<br>
      หากมีอาการรุนแรง เช่น หมดสติหรือชักเกร็ง ให้ติดต่อหน่วยฉุกเฉินทันที (โทร 1669)</div>`;
  } else {
    html += `<div class="result-box">`;
    if(calcType!=='correction') html += `<p>ปริมาณคาร์โบไฮเดรต ${carbs} กรัม → <b>${carbDose.toFixed(1)} หน่วย</b></p>`;
    if(calcType!=='carb') html += `<p>ปรับน้ำตาลสูง → <b>${corrDose.toFixed(1)} หน่วย</b></p>`;
    html += `<p>รวมทั้งหมด</p><div class="big">${total} หน่วย</div>`;
    html += `</div>`;
    html += `<button class="btn btn-primary" id="saveDoseBtn">💾 บันทึกการฉีดนี้</button>`;
  }
  document.getElementById('calcResultArea').innerHTML = html;
  const saveBtn = document.getElementById('saveDoseBtn');
  if(saveBtn){ saveBtn.onclick = () => saveDose(carbs,bg,carbDose,corrDose,total); }
}
async function saveDose(carbs,bg,carbDose,corrDose,total){
  const { error } = await sb.from('dose_logs').insert({
    user_id: currentUser.id,
    carbs, blood_glucose: bg || null,
    carb_dose: carbDose, correction_dose: corrDose, total_dose: total
  });
  if(error){ alert('บันทึกไม่สำเร็จ: ' + error.message); return; }
  alert('บันทึกเรียบร้อย');
  goto('history');
}

/* ---------- history ---------- */
async function renderHistory(){
  const el = document.getElementById('historyList');
  el.innerHTML = '<div class="spinner">กำลังโหลด...</div>';
  const { data, error } = await sb.from('dose_logs')
    .select('*').eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });
  if(error){ el.innerHTML = '<div class="empty">โหลดข้อมูลไม่สำเร็จ</div>'; return; }
  if(!data.length){ el.innerHTML = '<div class="empty">ยังไม่มีประวัติการฉีด</div>'; return; }
  el.innerHTML = data.map(h=>`
    <div class="list-item">
      <div>
        <div>${new Date(h.created_at).toLocaleString('th-TH')}</div>
        <div class="hint">คาร์บ ${h.carbs ?? 0}g · น้ำตาล ${h.blood_glucose ?? '-'} mg/dl</div>
      </div>
      <div style="text-align:right;">
        <span class="badge">${h.total_dose} หน่วย</span><br>
        <button class="btn-ghost" style="margin-top:.3rem;" onclick="deleteDose(${h.id})">ลบ</button>
      </div>
    </div>
  `).join('');
}
async function deleteDose(id){
  const { error } = await sb.from('dose_logs').delete().eq('id', id);
  if(error){ alert('ลบไม่สำเร็จ: ' + error.message); return; }
  renderHistory();
}

/* ---------- food database (static reference list) ---------- */
const FOOD_DB = [
  // ข้าว / ข้าวผัด
  {name:'ข้าวสวย (1 ทัพพี ~90g)', carbs:33},
  {name:'ข้าวเหนียว (1 ก้อนเล็ก ~90g)', carbs:35},
  {name:'ข้าวผัด (1 จาน)', carbs:65},
  {name:'ข้าวผัดกุ้ง (1 จาน)', carbs:63},
  {name:'ข้าวผัดหมู (1 จาน)', carbs:63},
  {name:'ข้าวผัดไก่ (1 จาน)', carbs:63},
  {name:'ข้าวผัดปู (1 จาน)', carbs:63},
  {name:'ข้าวผัดอเมริกัน (1 จาน)', carbs:70},
  {name:'ข้าวมันไก่ (1 จาน)', carbs:68},
  {name:'ข้าวขาหมู (1 จาน)', carbs:60},
  {name:'ข้าวหมูแดง (1 จาน)', carbs:62},
  {name:'ข้าวไข่เจียว (1 จาน)', carbs:35},
  {name:'ข้าวคลุกกะปิ (1 จาน)', carbs:58},
  {name:'ข้าวต้มหมู (1 ชาม)', carbs:30},
  {name:'ข้าวต้มกุ้ง (1 ชาม)', carbs:30},
  {name:'โจ๊กหมู (1 ชาม)', carbs:25},

  // เส้น
  {name:'ผัดไทย (1 จาน)', carbs:60},
  {name:'ผัดไทยกุ้งสด (1 จาน)', carbs:60},
  {name:'ผัดซีอิ๊ว (1 จาน)', carbs:55},
  {name:'ราดหน้าหมู (1 จาน)', carbs:58},
  {name:'ก๋วยเตี๋ยวน้ำหมู (1 ชาม)', carbs:45},
  {name:'ก๋วยเตี๋ยวน้ำเนื้อ (1 ชาม)', carbs:45},
  {name:'ก๋วยเตี๋ยวเรือ (1 ชาม)', carbs:40},
  {name:'บะหมี่หมูแดง (1 ชาม)', carbs:48},
  {name:'บะหมี่เกี๊ยว (1 ชาม)', carbs:45},
  {name:'เส้นใหญ่แห้ง (1 จาน)', carbs:52},
  {name:'ขนมจีนน้ำยา (1 จาน)', carbs:40},
  {name:'สุกี้น้ำ (1 ชาม)', carbs:20},

  // กับข้าว/แกง (ไม่รวมข้าว)
  {name:'ผัดกะเพราหมู+ข้าว (1 จาน)', carbs:55},
  {name:'ผัดกะเพราไก่+ข้าว (1 จาน)', carbs:55},
  {name:'ต้มยำกุ้ง (1 ชาม ไม่รวมข้าว)', carbs:8},
  {name:'แกงเขียวหวาน (ไม่รวมข้าว)', carbs:10},
  {name:'แกงส้ม (ไม่รวมข้าว)', carbs:8},
  {name:'แกงมัสมั่น (ไม่รวมข้าว)', carbs:12},
  {name:'พะแนงหมู (ไม่รวมข้าว)', carbs:10},
  {name:'ไก่ทอด (2 ชิ้น)', carbs:8},
  {name:'หมูปิ้ง+ข้าวเหนียว (1 ชุด)', carbs:45},
  {name:'ลาบหมู (ไม่รวมข้าวเหนียว)', carbs:10},
  {name:'ยำวุ้นเส้น (1 จาน)', carbs:18},
  {name:'ส้มตำ (1 จาน)', carbs:15},
  {name:'น้ำพริกกะปิ+ผักสด (ไม่รวมข้าว)', carbs:8},
  {name:'ไข่เจียว (1 จาน)', carbs:2},
  {name:'ไข่ต้ม (1 ฟอง)', carbs:1},

  // ของหวาน/ผลไม้/เครื่องดื่ม
  {name:'มะม่วงน้ำปลาหวาน+ข้าวเหนียวมัน', carbs:75},
  {name:'ข้าวเหนียวมะม่วง (1 จาน)', carbs:75},
  {name:'ขนมครก (5 ชิ้น)', carbs:30},
  {name:'ปาท่องโก๋ (2 ชิ้น)', carbs:20},
  {name:'โรตีน้ำตาล (1 แผ่น)', carbs:35},
  {name:'กล้วยน้ำว้า (1 ผล)', carbs:24},
  {name:'มะม่วงสุก (1 ผล กลาง)', carbs:28},
  {name:'สับปะรด (1 ถ้วย)', carbs:22},
  {name:'แตงโม (1 ถ้วย)', carbs:12},
  {name:'ทุเรียน (2 เม็ด)', carbs:30},
  {name:'ขนมปังแผ่น (1 แผ่น)', carbs:14},
  {name:'ขนมปังปิ้งเนย (1 แผ่น)', carbs:18},
  {name:'นมจืด (1 แก้ว 250ml)', carbs:12},
  {name:'นมหวาน/นมข้น (1 แก้ว)', carbs:22},
  {name:'น้ำอัดลม (1 กระป๋อง)', carbs:35},
  {name:'ชาไทย (1 แก้ว)', carbs:30},
  {name:'กาแฟเย็นใส่นมข้นหวาน (1 แก้ว)', carbs:28},
];

// Strip serving-size notes like "(1 จาน)" so partial dish names still match
function foodSearchKey(name){
  return name.replace(/\(.*?\)/g, '').trim();
}
function renderFoodList(){
  const qRaw = (document.getElementById('foodSearch').value||'').trim();
  const el = document.getElementById('foodResults');
  if(!qRaw){ el.innerHTML = FOOD_DB.map(foodRow).join(''); return; }

  const list = FOOD_DB.filter(f=>{
    const key = foodSearchKey(f.name);
    return key.includes(qRaw) || qRaw.includes(key) || f.name.includes(qRaw);
  });

  if(!list.length){
    el.innerHTML = `<div class="empty">
      ไม่พบ "${qRaw}" ในฐานข้อมูล<br>
      <span class="hint">ลองพิมพ์ชื่ออาหารสั้นลง เช่น "ข้าวผัด" แทน "ข้าวผัดกุ้ง" หรือกรอกปริมาณคาร์บโดยประมาณด้วยตนเองในหน้าคำนวณ</span>
    </div>`;
    return;
  }
  el.innerHTML = list.map(foodRow).join('');
}
function foodRow(f){
  return `<div class="list-item">
      <div>${f.name}</div>
      <span class="badge">${f.carbs} g คาร์บ</span>
    </div>`;
}

/* ---------- camera + optional AI food recognition ---------- */
let camStream = null;
async function openCamera(){
  try{
    camStream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
    const v = document.getElementById('camVideo');
    v.srcObject = camStream;
    v.style.display='block';
    document.getElementById('snapBtn').style.display='block';
  }catch(e){
    alert('ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบการอนุญาตใช้กล้องของเบราว์เซอร์');
  }
}
async function snapPhoto(){
  const v = document.getElementById('camVideo');
  const c = document.getElementById('camCanvas');
  c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext('2d').drawImage(v,0,0);
  c.style.display='block';
  if(camStream){ camStream.getTracks().forEach(t=>t.stop()); }
  v.style.display='none';
  document.getElementById('snapBtn').style.display='none';

  if(typeof FOOD_SCAN_FUNCTION_URL === 'string' && FOOD_SCAN_FUNCTION_URL){
    await runFoodScan(c);
  } else {
    document.getElementById('foodSearch').focus();
    alert('ยังไม่ได้เชื่อมต่อระบบจดจำอาหารอัตโนมัติ (ดู README.md ขั้นตอนที่ 4) กรุณาค้นหา/กรอกปริมาณคาร์บด้วยตนเองด้านล่าง');
  }
}
async function runFoodScan(canvas){
  const resultsEl = document.getElementById('foodResults');
  resultsEl.innerHTML = '<div class="spinner">กำลังวิเคราะห์ภาพอาหาร...</div>';
  try{
    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.85));
    const { data: { session } } = await sb.auth.getSession();
    const form = new FormData();
    form.append('image', blob, 'food.jpg');
    const resp = await fetch(FOOD_SCAN_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + session.access_token },
      body: form
    });
    if(!resp.ok) throw new Error('การวิเคราะห์ล้มเหลว');
    const result = await resp.json(); // expected: { items: [{name, carbs_estimate}, ...] }
    if(!result.items || !result.items.length){
      resultsEl.innerHTML = '<div class="empty">ไม่สามารถระบุชนิดอาหารได้ กรุณาค้นหาด้วยตนเอง</div>';
      return;
    }
    resultsEl.innerHTML = result.items.map(it=>`
      <div class="list-item">
        <div>${it.name} <span class="hint">(ประมาณจากภาพ)</span></div>
        <span class="badge">${it.carbs_estimate} g คาร์บ</span>
      </div>
    `).join('') + '<p class="hint">ผลลัพธ์จากภาพเป็นการประมาณเท่านั้น กรุณาตรวจสอบกับรายการค้นหาด้วยตนเองหากไม่แน่ใจ</p>';
  }catch(e){
    console.error(e);
    resultsEl.innerHTML = '<div class="empty">เกิดข้อผิดพลาดในการวิเคราะห์ภาพ กรุณาลองใหม่หรือค้นหาด้วยตนเอง</div>';
  }
}
