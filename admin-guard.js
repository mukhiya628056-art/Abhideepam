document.addEventListener('DOMContentLoaded', async()=>{
 if(!window.sb){alert('Supabase config set karein.');location.replace('login.html');return;}
 const {data:{user},error}=await sb.auth.getUser();
 if(error||!user){location.replace('login.html');return;}
 const {data:p,error:pe}=await sb.from('profiles').select('role,disabled').eq('id',user.id).maybeSingle();
 if(pe||!p||p.disabled||!['super_admin','admin'].includes(p.role)){alert('Admin permission required.');location.replace('index.html');return;}
 document.querySelectorAll('[data-admin-email]').forEach(el=>el.textContent=user.email||'');
 document.querySelectorAll('[data-admin-logout]').forEach(el=>el.addEventListener('click',async e=>{e.preventDefault();await sb.auth.signOut();location.replace('login.html');}));
});
