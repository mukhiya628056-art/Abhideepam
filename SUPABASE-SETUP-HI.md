# Abhideepam + Supabase — setup (Hindi)

## Is package mein kya badla hai
- Login/register demo handlers ko Supabase Auth se joda gaya hai.
- Signup par profile row banane ke liye SQL trigger aur role-based profile table.
- Initial database schema: site sections/CMS, batches, enrollments, tests/questions, attempts/answers, payments, admin audit.
- Admin page ke liye auth/role guard.

**Important:** Yeh production-ready complete LMS/payment integration nahi hai. Existing `admin.html` mein abhi demo/static tables hain; har section CRUD, question editor, test runner/analysis charts, payment gateway checkout/webhook aur student dashboard ko alag frontend/server functions se implement aur test karna baaki hai. Payment success browser redirect se kabhi trust na karein.

## Step 1 — Supabase project
1. https://supabase.com par sign in karke New project banayein. Database password ko safe rakhein.
2. Project ke Connect/API settings se Project URL aur publishable (ya legacy anon) key copy karein.
3. `js/supabase-config.js` mein `YOUR-PROJECT-REF` aur key replace karein. **service_role key kabhi yahan nahi dalni.**

## Step 2 — Database
1. Supabase Dashboard → SQL Editor → New query.
2. Is folder ki `supabase-schema.sql` ka poora content paste karke Run karein.
3. Authentication → URL Configuration mein apni deployed website ka URL aur redirect URLs set karein. Local testing ke liye localhost origin bhi add karein.

## Step 3 — Super admin banana
1. Website par register karke apne email ko confirm/login karein.
2. Supabase → SQL Editor mein apne account ka exact email use karke yeh query run karein (email ko apne email se badlein):

```sql
update public.profiles p set role='super_admin'
from auth.users u where p.id=u.id and lower(u.email)=lower('YOUR-EMAIL@example.com');
```

3. Logout karke dobara login karein. Admin page role check karega. Public registration form se koi apna role admin nahi bana sakta.

## Step 4 — deploy
1. ZIP extract karein; folder `abhideepam` ke andar HTML files aur `css`, `js` folders honge.
2. Updated folder GitHub repository mein upload/commit karein. Netlify mein us repo ko import karein. Plain static HTML ke liye build command blank aur publish directory project root (jahan `index.html` hai) rakhein.
3. Netlify URL ko Supabase Auth URL Configuration mein add karein.
4. HTTPS live site par registration/login, unconfirmed email, wrong password aur non-admin ke admin.html access ko test karein.

## Step 5 — production features ke liye agla kaam
- CMS editor: site_sections ke liye secure CRUD, draft/publish, reorder, soft-delete/version history; public pages ko DB se render karna.
- Payments: Razorpay/other provider ka order server-side Edge Function se create; signature/webhook server-side verify; verified payment par hi `payments.status='paid'` aur enrollment active. Secret keys sirf Supabase Edge Function secrets mein.
- Paid content: private Storage buckets + signed URLs; RLS enrollment expiry/revocation bhi enforce kare. Current SQL ka basic content policy ek starting point hai, final audit zaroori hai.
- Tests: answer key ko students se hide rakhne ke liye current `test_questions` table ko production mein split karein: student-visible question table aur server-only answer key. Score server-side calculate ho; browser se score/correctness accept na karein.
- Student dashboard: attempts history, subject/topic-wise accuracy, time per question, rank (privacy rules ke saath), weak-topic analysis.
- Admin controls: least-privilege admin roles, audit logs, account suspension, refunds, enrollment expiry.

## Safety checklist
- `service_role`, Razorpay secret/webhook secret ko HTML/JS/GitHub mein kabhi commit na karein.
- SQL Editor ki super-admin query sirf apne account ke liye run karein.
- RLS policies aur payment webhook ko live karne se pehle test karein; SQL schema ko security review ke bina paid exams ke liye production na samjhein.
