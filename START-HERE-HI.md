# Abhideepam — मोबाइल से शुरू करने की गाइड

## इस अपडेट में
- मौजूदा वेबसाइट के साथ Supabase Auth wiring बरकरार रखी गई है।
- Login के बाद Student को `student-dashboard.html` पर भेजा जाता है।
- Student Dashboard में बैच, टेस्ट प्रयास और उपलब्ध स्कोर रिकॉर्ड लोड करने का प्रारंभिक ढाँचा जोड़ा गया है।
- SQL में Enrolment और Payment रिकॉर्ड में बदलाव का अधिकार Super Admin तक सीमित किया गया है।

## पहले ये काम करें
1. ZIP को मोबाइल में डाउनलोड करके Extract करें।
2. GitHub में अपनी Abhideepam repository खोलें और इस ZIP के अंदर वाले `abhideepam` folder की फाइलें repository root में upload/replace करें। Repository root में `index.html`, `login.html`, `css/` और `js/` दिखने चाहिए; `abhideepam/abhideepam/` जैसी double nesting न हो।
3. Supabase project बनाकर Project URL और publishable/anon key लें। `js/supabase-config.js` में केवल ये public values भरें। `service_role` key कभी न डालें।
4. Supabase → SQL Editor में `supabase-schema.sql` चलाएँ। यदि पिछली schema पहले ही चल चुकी है, तो यह शुरुआती schema idempotent migration नहीं है; इसे दोबारा सीधे न चलाएँ। पहले बताएं कि SQL पहले चलाया गया था या नहीं।
5. `register.html` से अपना अकाउंट बनाएँ और email confirmation पूरा करें।
6. Supabase SQL Editor में `YOUR-EMAIL@example.com` को अपने exact email से बदलकर केवल अपने खाते को Super Admin बनाएँ:

```sql
update public.profiles p set role='super_admin'
from auth.users u
where p.id=u.id and lower(u.email)=lower('YOUR-EMAIL@example.com');
```

7. GitHub में बदलाव commit करें और Netlify में repository deploy करें। Publish directory वही हो जहाँ `index.html` है।
8. Netlify का HTTPS URL Supabase → Authentication → URL Configuration में Site URL और Redirect URLs में जोड़ें।

## अभी पूर्ण करने के लिए बाकी
यह ZIP अभी शुरुआती connected foundation है, production-complete LMS नहीं। Student dashboard प्रारंभिक है; test runner, server-side scoring, answer-key secrecy, full CMS CRUD, secure payment order/webhook, refund workflow, private PDF access, language coverage और end-to-end testing अभी बाकी हैं। Paid test या वास्तविक payment चालू करने से पहले इन्हें पूरा और जाँचना जरूरी है।

## सुरक्षा
- Supabase `service_role` key, Razorpay secret और webhook secret GitHub/HTML/JS में कभी न रखें।
- किसी भी विद्यार्थी को केवल browser redirect के आधार पर Paid Batch न दें।
- Live exam से पहले answer key को public-readable `test_questions` table से अलग करना अनिवार्य है।
