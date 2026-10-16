// Auth wiring for register.html and login.html. Requires js/supabase-config.js and supabase-client.js.
document.addEventListener('DOMContentLoaded', async () => {
 const form = document.querySelector('[data-supabase-auth]'); if (!form) return;
 const msg = document.createElement('p'); msg.setAttribute('role','status'); msg.style.cssText='margin-top:12px;color:#b91c1c'; form.append(msg);
 const say = (s, ok=false) => {msg.textContent=s;msg.style.color=ok?'#047857':'#b91c1c';};
 if (!window.sb) {say('Supabase config set nahi hai. js/supabase-config.js mein Project URL aur publishable/anon key set karein.');return;}
 form.addEventListener('submit', async e => { e.preventDefault(); say('Please wait…');
  const v = Object.fromEntries(new FormData(form).entries());
  try {
   if(form.dataset.supabaseAuth==='register') {
    if(v.password!==v.confirm_password) return say('Passwords match nahi karte.');
    const {data,error}=await sb.auth.signUp({email:v.email.trim(),password:v.password,options:{data:{full_name:v.full_name.trim(),phone:v.phone.trim(),exam_preference:v.exam_preference}}});
    if(error) throw error;
    say(data.session ? 'Account ban gaya. Ab login karein.' : 'Registration request ho gayi. Email confirmation check karein, phir login karein.',true);
    if(data.session) setTimeout(()=>location.href='login.html',1200);
   } else {
    const {data,error}=await sb.auth.signInWithPassword({email:v.email.trim(),password:v.password}); if(error) throw error;
    say('Login successful. Redirecting…',true);
    const {data:profile,error:pe}=await sb.from('profiles').select('role,disabled').eq('id',data.user.id).maybeSingle();
    if(pe) throw pe; if(profile?.disabled) {await sb.auth.signOut();throw new Error('Account disabled hai. Support se contact karein.');}
    setTimeout(()=>location.href=profile?.role==='super_admin'||profile?.role==='admin'?'admin.html':'student-dashboard.html',500);
   }
  } catch(err) {say(err.message || 'Request fail hua.');}
 });
});
