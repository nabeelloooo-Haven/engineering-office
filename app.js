const $=id=>document.getElementById(id);

$('form').addEventListener('submit',e=>{
  e.preventDefault();

  const land=+$('land').value;
  const aps=+$('apartments').value;
  const beds=+$('bedrooms').value;
  const baths=+$('baths').value;
  const kitchens=+$('kitchens').value;
  const living=+$('living').value;
  const maid=$('maid').value==='yes';
  const notes=$('notes').value.trim();

  const gross=land*0.65;
  const commonRatio=Math.min(0.08+(aps-1)*0.025,0.16);
  const common=gross*commonRatio;
  const net=gross-common;
  const unit=net/aps;

  const need=estimateNeed(beds,baths,kitchens,living,maid);
  const fit=unit/need;
  const overall=fit>=1.15?['مريح جداً','good']:fit>=1?['مناسب','good']:fit>=0.88?['مضغوط','warn']:['غير مريح','bad'];

  $('summary').innerHTML=`
    <div class="metric">مساحة الأرض<b>${land.toFixed(0)} م²</b></div>
    <div class="metric">مساحة البناء 65%<b>${gross.toFixed(1)} م²</b></div>
    <div class="metric">الخدمات المشتركة التقريبية<b>${common.toFixed(1)} م²</b></div>
    <div class="metric">مساحة الشقة الصافية تقريباً<b>${unit.toFixed(1)} م²</b></div>
    <div class="metric wide">تقييم الطلب الحالي <b class="status ${overall[1]}">${overall[0]}</b><small>المساحة التقديرية المطلوبة للشقة حسب البرنامج: ${need.toFixed(0)} م² تقريباً</small></div>`;

  const types=[
    {name:'اقتراح الراحة',desc:'أولوية للغرف والصالات الأكبر والخصوصية الأعلى',bed:.41,liv:.28,kit:.10,bath:.11,serv:.10,tag:'الأكثر راحة'},
    {name:'اقتراح متوازن',desc:'توزيع متوازن بين أحجام الفراغات وكفاءة الاستفادة',bed:.38,liv:.24,kit:.11,bath:.12,serv:.15,tag:'موصى به'},
    {name:'اقتراح الاستغلال',desc:'تقليل الهدر وزيادة كفاءة المساحة المتاحة',bed:.35,liv:.22,kit:.12,bath:.13,serv:.18,tag:'الأعلى كفاءة'}
  ];

  const cards=types.map((p,i)=>{
    const score=proposalScore(unit,need,i);
    const verdict=score>=85?['ممتاز','good']:score>=72?['جيد','good']:score>=60?['مقبول','warn']:['مضغوط','bad'];
    const roomArea=unit*p.bed;
    const livingArea=unit*p.liv;
    const kitchenArea=unit*p.kit;
    const bathArea=unit*p.bath;
    const serviceArea=unit*p.serv;
    const avgBed=roomArea/Math.max(beds,1);
    const avgBath=bathArea/Math.max(baths,1);
    const avgKitchen=kitchenArea/Math.max(kitchens,1);
    const avgLiving=livingArea/Math.max(living,1);

    return `<article class="proposal ${i===1?'recommended':''}">
      <div class="proposal-top"><div><span class="proposal-tag">${p.tag}</span><h3>${i+1}. ${p.name}</h3><p>${p.desc}</p></div><div class="score ${verdict[1]}"><b>${score}</b><span>/100</span><small>${verdict[0]}</small></div></div>
      <div class="allocation-grid">
        ${allocation('غرف النوم',roomArea,avgBed,beds,'متوسط الغرفة')}
        ${allocation('الصالات',livingArea,avgLiving,living,'متوسط الصالة')}
        ${allocation('المطابخ',kitchenArea,avgKitchen,kitchens,'متوسط المطبخ')}
        ${allocation('الحمامات',bathArea,avgBath,baths,'متوسط الحمام')}
        ${maid?allocation('غرفة الشغالة',Math.max(unit*.055,6),Math.max(unit*.055,6),1,'مساحة تقديرية'):''}
        ${allocation('ممرات وخدمات داخلية',serviceArea,serviceArea,1,'مساحة تقديرية')}
      </div>
      <div class="fit-note">${fitMessage(unit,need,i)}</div>
      <button type="button" class="choose" onclick="chooseProposal('${p.name}',${i})">اختر هذا الاقتراح وأرسله للمهندس</button>
    </article>`;
  }).join('');

  const compare=`<div class="comparison"><h3>مقارنة سريعة بين الاقتراحات</h3><div class="compare-grid">
    <div><b>الراحة</b><span>${types[0].name}</span></div>
    <div><b>التوازن</b><span>${types[1].name}</span></div>
    <div><b>كفاءة المساحة</b><span>${types[2].name}</span></div>
  </div><p>الاختيار النهائي يعتمد لاحقاً على أبعاد الأرض الفعلية، الارتدادات، اتجاه الشارع، مواقع الأعمدة، الدرج والمصعد، والاشتراطات البلدية.</p></div>`;

  $('proposals').innerHTML=cards+compare;

  const msgBase=`مرحباً، أريد تطوير تصميم مبدئي لبيتي.%0Aمساحة الأرض: ${land} م²%0Aمساحة البناء 65%: ${gross.toFixed(1)} م²%0Aالخدمات المشتركة التقديرية: ${common.toFixed(1)} م²%0Aعدد الشقق بالدور: ${aps}%0Aمساحة الشقة الصافية التقريبية: ${unit.toFixed(1)} م²%0Aغرف النوم: ${beds}%0Aالحمامات: ${baths}%0Aالمطابخ: ${kitchens}%0Aالصالات: ${living}%0Aغرفة شغالة: ${maid?'نعم':'لا'}${notes?`%0Aملاحظات: ${encodeURIComponent(notes)}`:''}`;
  window.currentDesign={msgBase};
  $('wa').href='https://wa.me/966542277575?text='+msgBase+'%0Aأرغب بالتواصل لتطوير التصميم.';

  $('results').classList.remove('hidden');
  $('results').scrollIntoView({behavior:'smooth'});
});

function estimateNeed(beds,baths,kitchens,living,maid){
  return beds*13+baths*5.2+kitchens*12+living*22+(maid?8:0)+26;
}

function proposalScore(unit,need,index){
  const ratio=unit/need;
  let base=Math.round(Math.min(100,ratio*82));
  if(index===1) base+=4;
  if(index===2 && ratio<1) base+=3;
  if(index===0 && ratio>1.15) base+=5;
  return Math.max(45,Math.min(98,base));
}

function allocation(title,total,avg,count,label){
  return `<div class="allocation"><div class="allocation-head"><b>${title}</b><strong>${total.toFixed(1)} م²</strong></div><div class="allocation-sub">${count>1?`${count} فراغات • `:''}${label}: ${avg.toFixed(1)} م²</div></div>`;
}

function fitMessage(unit,need,index){
  const ratio=unit/need;
  if(ratio>=1.18) return index===0?'هذا الخيار مناسب جداً لعمل فراغات واسعة وخصوصية أفضل.':'المساحة تسمح بتنفيذ البرنامج براحة جيدة مع مرونة في التوزيع.';
  if(ratio>=1) return index===2?'هذا الخيار يساعد على تقليل الهدر مع الحفاظ على كامل البرنامج المطلوب.':'البرنامج قابل للتنفيذ بشكل جيد، مع ضرورة ضبط الممرات وأحجام بعض الفراغات.';
  if(ratio>=0.88) return 'البرنامج ممكن مبدئياً لكنه مضغوط، وقد نحتاج تقليل بعض المساحات أو دمج بعض الاستخدامات.';
  return 'المساحة الحالية لا تناسب البرنامج براحة كافية. يُنصح بتقليل عدد الفراغات أو عدد الشقق في الدور.';
}

function chooseProposal(name,index){
  if(!window.currentDesign) return;
  const text=window.currentDesign.msgBase+`%0Aالاقتراح المختار: ${encodeURIComponent(name)}%0Aأرغب بتطوير هذا الاقتراح إلى مخطط هندسي فعلي.`;
  window.open('https://wa.me/966542277575?text='+text,'_blank');
}
