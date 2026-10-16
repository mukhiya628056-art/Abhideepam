(function(){
 const $=id=>document.getElementById(id);
 const message=(text,error=false)=>{const el=$('statusMessage');el.textContent=text;el.classList.toggle('error',error)};
 const safeDate=value=>value?new Date(value).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—';
 const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 document.addEventListener('DOMContentLoaded',async()=>{
  $('logoutBtn').addEventListener('click',async()=>{if(window.sb) await sb.auth.signOut();location.replace('login.html')});
  if(!window.sb){message('Supabase सेट नहीं है। js/supabase-config.js में Project URL और publishable/anon key डालें।',true);return}
  try{
   const {data:{user},error:authError}=await sb.auth.getUser();if(authError||!user){location.replace('login.html');return}
   $('welcomeText').textContent='नमस्ते, '+(user.user_metadata?.full_name||user.email||'विद्यार्थी');
   const [enrollments,attempts]=await Promise.all([
    sb.from('enrollments').select('id,status,created_at,batches(title)').eq('student_id',user.id).order('created_at',{ascending:false}),
    sb.from('test_attempts').select('id,status,score,submitted_at,started_at').eq('student_id',user.id).order('started_at',{ascending:false}).limit(50)
   ]);
   if(enrollments.error) throw enrollments.error;if(attempts.error) throw attempts.error;
   const active=(enrollments.data||[]).filter(x=>x.status==='active');$('batchCount').textContent=active.length;
   $('batchesBody').innerHTML=(enrollments.data||[]).length?enrollments.data.map(x=>`<tr><td>${escapeHtml(x.batches?.title||'Batch')}</td><td><span class="pill">${escapeHtml(x.status)}</span></td><td>${safeDate(x.created_at)}</td></tr>`).join(''):'<tr><td colspan="3">अभी कोई बैच नहीं है।</td></tr>';
   const completed=(attempts.data||[]).filter(x=>x.status==='submitted'||x.status==='evaluated');$('attemptCount').textContent=completed.length;
   const scores=completed.map(x=>Number(x.score)).filter(Number.isFinite);$('averageScore').textContent=scores.length?(scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1):'—';
   $('attemptsBody').innerHTML=(attempts.data||[]).length?attempts.data.map(x=>`<tr><td>${escapeHtml(x.id.slice(0,8))}…</td><td>${escapeHtml(x.status)}</td><td>${x.score==null?'—':escapeHtml(x.score)}</td><td>${safeDate(x.submitted_at)}</td></tr>`).join(''):'<tr><td colspan="4">अभी कोई टेस्ट रिकॉर्ड नहीं है।</td></tr>';
   message('आपका Dashboard खुल गया है। डेटा आपके लॉगिन अकाउंट की अनुमति के अनुसार लोड किया गया है।');
  }catch(e){message('डेटा लोड नहीं हो सका: '+(e.message||'अज्ञात त्रुटि')+' — Supabase schema और RLS policies जाँचें।',true)}
 });
})();
