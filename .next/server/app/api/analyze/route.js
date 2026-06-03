"use strict";(()=>{var e={};e.id=652,e.ids=[652],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},1399:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>d,patchFetch:()=>f,requestAsyncStorage:()=>p,routeModule:()=>l,serverHooks:()=>h,staticGenerationAsyncStorage:()=>u});var a={};r.r(a),r.d(a,{POST:()=>c});var i=r(9303),n=r(8716),o=r(670);let s=`أنت مهندس تكاليف خبير في السوق المصري.
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
}`;async function c(e){let t;let r=process.env.ANTHROPIC_API_KEY,a=process.env.NEXT_PUBLIC_SUPABASE_URL,i=process.env.SUPABASE_SERVICE_KEY;if(!r)return Response.json({error:"ANTHROPIC_API_KEY غير مضبوط"},{status:500});try{t=await e.json()}catch{return Response.json({error:"طلب غير صحيح"},{status:400})}let{messages:n,max_tokens:o=2e3}=t;if(!n||!Array.isArray(n))return Response.json({error:"messages مطلوبة"},{status:400});let c=n[n.length-1],l="string"==typeof c?.content?c.content:JSON.stringify(c?.content||""),p="";try{await fetch(`${a.replace(/\/$/,"")}/rest/v1/reference_boq?limit=3`,{headers:{apikey:i,Authorization:`Bearer ${i}`}});let e=l.replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g," ").trim().split(/\s+/).filter(e=>e.length>2).slice(0,4);if(e.length>0){let t=e.map(e=>`keywords.ilike.*${e}*`).join(","),r=await fetch(`${a}/rest/v1/reference_boq?or=(${t})&limit=3`,{headers:{apikey:i,Authorization:`Bearer ${i}`}});if(r.ok){let e=await r.json();if(e?.length>0){let t=new Set;e.forEach(e=>{let r=e.recipe;[...r.materials||[],...r.labor||[],...r.equipment||[]].forEach(e=>e.resource_id&&t.add(e.resource_id))});let r={};if(t.size>0){let e=Array.from(t).join(","),n=await fetch(`${a}/rest/v1/global_resources?resource_id=in.(${e})&select=resource_id,name,current_price`,{headers:{apikey:i,Authorization:`Bearer ${i}`}});n.ok&&(await n.json()).forEach(e=>{r[e.resource_id]={current_price:parseFloat(e.current_price)||0,name:e.name}})}let n=[];e.forEach(e=>(e.recipe.materials||[]).forEach(e=>{let t=e.desc.split(" ")[0];t.length>2&&n.push(t)}));let o={};if(n.length>0){let e=[...new Set(n)].slice(0,6).map(e=>`name.ilike.*${e}*`).join(","),t=await fetch(`${a}/rest/v1/global_prices?or=(${e})&select=name,price&limit=15`,{headers:{apikey:i,Authorization:`Bearer ${i}`}});t.ok&&(await t.json()).forEach(e=>{o[e.name]=parseFloat(e.price)||0})}p=function(e,t,r){if(!e||0===e.length)return"";let a="\n\n=== أمثلة مرجعية من مشاريع سابقة ===\n";for(let i of e.slice(0,2)){a+=`
مثال: ${i.description.slice(0,80)}
الوحدة: ${i.unit}
`;let e=i.recipe;if(e.materials?.length>0)for(let i of(a+="الخامات:\n",e.materials)){let e=t[i.resource_id],n=e?.current_price||i.ref_price_snapshot||0,o=r[i.desc]||n;a+=`  - ${i.desc}: ${i.qty} ${i.unit} \xd7 waste ${i.waste_factor} | سعر السوق: ${o} ج.م
`}if(e.labor?.length>0)for(let r of(a+="مصنعيات/عمالة:\n",e.labor)){let e=t[r.resource_id],i=e?.current_price||r.ref_daily_cost_snapshot||0;a+=`  - ${r.desc}: ${r.qty_per_unit} ${r.unit} | معدل: ${i} ج.م
`}if(e.equipment?.length>0)for(let r of(a+="معدات:\n",e.equipment.slice(0,3))){let e=t[r.resource_id],i=e?.current_price||r.ref_daily_cost_snapshot||0;a+=`  - ${r.desc}: ${r.qty_per_unit} ${r.unit} | معدل: ${i} ج.م
`}a+=`هامش الربح: ${(100*(e.markup?.profit_pct||.35)).toFixed(0)}%
`}return a}(e,r,o)}}}}catch(e){console.error("Reference search error:",e.message)}let u=s+p;try{let e=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":r,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:o,system:u,messages:n})}),t=await e.json();if(!e.ok)return Response.json({error:t?.error?.message||"خطأ من Anthropic API"},{status:e.status});if(t.content?.[0]?.text){let e=t.content[0].text.match(/\{[\s\S]*\}/);e&&(t.content[0].text=e[0])}return Response.json(t)}catch(e){return Response.json({error:`فشل الاتصال بـ Anthropic: ${e.message}`},{status:502})}}let l=new i.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/analyze/route",pathname:"/api/analyze",filename:"route",bundlePath:"app/api/analyze/route"},resolvedPagePath:"/workspaces/BoQmate/app/api/analyze/route.js",nextConfigOutput:"",userland:a}),{requestAsyncStorage:p,staticGenerationAsyncStorage:u,serverHooks:h}=l,d="/api/analyze/route";function f(){return(0,o.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:u})}},9303:(e,t,r)=>{e.exports=r(517)}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[948],()=>r(1399));module.exports=a})();