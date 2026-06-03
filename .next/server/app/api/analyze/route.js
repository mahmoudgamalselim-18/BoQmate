"use strict";(()=>{var e={};e.id=652,e.ids=[652],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},1399:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>f,patchFetch:()=>h,requestAsyncStorage:()=>p,routeModule:()=>l,serverHooks:()=>d,staticGenerationAsyncStorage:()=>u});var o={};r.r(o),r.d(o,{POST:()=>c});var n=r(9303),s=r(8716),a=r(670);let i=`أنت مهندس تكاليف خبير في السوق المصري.
مهمتك: تسعير بنود المقايسات الإنشائية بدقة عالية.

القواعد الصارمة:
1. أرجع JSON فقط — لا نص قبله أو بعده
2. ابدأ ردك بـ { مباشرة
3. استخدم أسعار السوق المصري الحالية المقدمة لك
4. إذا وُجدت أمثلة مرجعية، استخدم نفس طريقة التفكيك والنسب
5. احسب: (خامات \xd7 waste_factor) + (مصنعيات/عمالة) + (معدات) = التكلفة المباشرة

الـ JSON المطلوب:
{
  "itemName": "اسم البند",
  "quantity": الكمية,
  "unit": "الوحدة",
  "unitCost": تكلفة الوحدة بالجنيه,
  "totalCost": إجمالي التكلفة,
  "breakdown": {
    "materials": [{"name": "...", "qty": 0, "unit": "...", "unitPrice": 0, "total": 0}],
    "labor": [{"name": "...", "qty": 0, "unit": "...", "unitPrice": 0, "total": 0}],
    "equipment": [{"name": "...", "qty": 0, "unit": "...", "unitPrice": 0, "total": 0}]
  },
  "confidence": "high|medium|low",
  "notes": "ملاحظات"
}`;async function c(e){let t;let r=process.env.ANTHROPIC_API_KEY,o="https://aieqzabocmebjlnszzuw.supabase.co",n=process.env.SUPABASE_SERVICE_KEY;if(!r)return Response.json({error:"ANTHROPIC_API_KEY غير مضبوط"},{status:500});try{t=await e.json()}catch{return Response.json({error:"طلب غير صحيح"},{status:400})}let{messages:s,max_tokens:a=2e3}=t;if(!s||!Array.isArray(s))return Response.json({error:"messages مطلوبة"},{status:400});let c=s[s.length-1],l="string"==typeof c?.content?c.content:JSON.stringify(c?.content||""),p="";try{let e=l.replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g," ").trim().split(/\s+/).filter(e=>e.length>2).slice(0,5);if(e.length>0){let t=e.map(e=>`description.ilike.*${e}*`).concat(e.map(e=>`keywords.ilike.*${e}*`)).join(","),r=await fetch(`${o}/rest/v1/reference_boq?or=(${t})&limit=5`,{headers:{apikey:n,Authorization:`Bearer ${n}`}});if(r.ok){let t=await r.json();if(console.log(`📚 Reference search found ${t?.length||0} recipes for keywords: [${e.join(", ")}]`),t?.length>0){let r=new Set;t.forEach(e=>{let t=e.recipe;[...t.materials||[],...t.labor||[],...t.equipment||[]].forEach(e=>e.resource_id&&r.add(e.resource_id))});let s={};if(r.size>0){let e=Array.from(r).join(","),t=await fetch(`${o}/rest/v1/global_resources?resource_id=in.(${e})&select=resource_id,name,current_price`,{headers:{apikey:n,Authorization:`Bearer ${n}`}});t.ok?((await t.json()).forEach(e=>{s[e.resource_id]={current_price:parseFloat(e.current_price)||0,name:e.name}}),console.log(`✅ Loaded ${Object.keys(s).length} resource prices`)):console.warn(`⚠️ Failed to fetch resource prices: ${t.status}`)}let a={},i=e.slice(0,4);if(i.length>0){let e=i.map(e=>`name.ilike.*${e}*`).join(","),t=await fetch(`${o}/rest/v1/global_prices?or=(${e})&select=name,price&limit=20`,{headers:{apikey:n,Authorization:`Bearer ${n}`}});t.ok&&((await t.json()).forEach(e=>{a[e.name]=parseFloat(e.price)||0}),console.log(`✅ Loaded ${Object.keys(a).length} market prices`))}p=function(e,t,r){if(!e||0===e.length)return"";let o="\n\n=== أمثلة مرجعية من مشاريع سابقة ===\n";for(let n of e.slice(0,2)){o+=`
مثال: ${n.description.slice(0,80)}
الوحدة: ${n.unit}
`;let e=n.recipe;if(e.materials?.length>0)for(let n of(o+="الخامات:\n",e.materials)){let e=t[n.resource_id],s=e?.current_price||n.ref_price_snapshot||0,a=r[n.desc]||s;o+=`  - ${n.desc}: ${n.qty} ${n.unit} \xd7 waste ${n.waste_factor} | سعر السوق: ${a} ج.م
`}if(e.labor?.length>0)for(let r of(o+="مصنعيات/عمالة:\n",e.labor)){let e=t[r.resource_id],n=e?.current_price||r.ref_daily_cost_snapshot||0;o+=`  - ${r.desc}: ${r.qty_per_unit} ${r.unit} | معدل: ${n} ج.م
`}if(e.equipment?.length>0)for(let r of(o+="معدات:\n",e.equipment.slice(0,3))){let e=t[r.resource_id],n=e?.current_price||r.ref_daily_cost_snapshot||0;o+=`  - ${r.desc}: ${r.qty_per_unit} ${r.unit} | معدل: ${n} ج.م
`}o+=`هامش الربح: ${(100*(e.markup?.profit_pct||.35)).toFixed(0)}%
`}return o}(t.slice(0,2),s,a),console.log(`📝 Built reference context: ${p.length} characters`)}else console.log(`ℹ️ No reference recipes found - will use default pricing`)}else console.warn(`⚠️ Supabase search failed: ${r.status} ${r.statusText}`)}else console.log(`ℹ️ No keywords extracted from description`)}catch(e){console.error("❌ Reference search error:",e.message)}let u=i+p;p?console.log(`✅ Sending enhanced prompt to Claude with reference examples`):console.log(`ℹ️ Sending base prompt to Claude (no reference examples)`);try{let e=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":r,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:a,system:u,messages:s})}),t=await e.json();if(!e.ok)return Response.json({error:t?.error?.message||"خطأ من Anthropic API"},{status:e.status});if(t.content?.[0]?.text){let e=t.content[0].text.match(/\{[\s\S]*\}/);e&&(t.content[0].text=e[0])}return Response.json(t)}catch(e){return Response.json({error:`فشل الاتصال بـ Anthropic: ${e.message}`},{status:502})}}let l=new n.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/analyze/route",pathname:"/api/analyze",filename:"route",bundlePath:"app/api/analyze/route"},resolvedPagePath:"/workspaces/BoQmate/app/api/analyze/route.js",nextConfigOutput:"",userland:o}),{requestAsyncStorage:p,staticGenerationAsyncStorage:u,serverHooks:d}=l,f="/api/analyze/route";function h(){return(0,a.patchFetch)({serverHooks:d,staticGenerationAsyncStorage:u})}},9303:(e,t,r)=>{e.exports=r(517)}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[948],()=>r(1399));module.exports=o})();