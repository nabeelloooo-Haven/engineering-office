const $=id=>document.getElementById(id);
$('form').addEventListener('submit',e=>{
  e.preventDefault();
  const land=+$('land').value,aps=+$('apartments').value,beds=+$('bedrooms').value,baths=+$('baths').value,kitchens=+$('kitchens').value,living=+$('living').value,maid=$('maid').value==='yes',notes=$('notes').value.trim();
  const gross=land*.65;
  const common=Math.min(.08+(aps-1)*.025,.16);
  const net=gross*(1-common);
  const unit=net/aps;
  $('summary').innerHTML=`<div class="metric">مساحة الأرض<b>${land.toFixed(0)} م²</b></div><div class="metric">65% مساحة بناء<b>${gross.toFixed(1)} م²</b></div><div class="metric">الشقق بالدور<b>${aps}</b></div><div class="metric">مساحة الشقة تقريباً<b>${unit.toFixed(1)} م²</b></div>`;
  const types=[['اقتراح الراحة','مساحات غرف وصالات أوسع',.42,.27,.12,.12],['اقتراح متوازن','توازن بين الخصوصية والاستغلال',.38,.25,.14,.13],['اقتراح الاستغلال','استفادة أكبر من المساحة المتاحة',.35,.23,.15,.14]];
  $('proposals').innerHTML=types.map((p,i)=>{
    let service=1-p[2]-p[3]-p[4]-p[5];
    return `<article class="proposal"><h3>${i+1}. ${p[0]}</h3><p>${p[1]}</p>${row('غرف النوم',p[2],unit)}${row('الصالات',p[3],unit)}${row('المطبخ',p[4],unit)}${row('الحمامات',p[5],unit)}${row('ممرات وخدمات',service,unit)}<div class="plan-title">مخطط توزيع مبدئي</div>${planSvg(aps,beds,baths,kitchens,living,maid,i)}<small>${beds} نوم • ${baths} حمام • ${kitchens} مطبخ • ${living} صالة${maid?' • غرفة شغالة':''}</small></article>`
  }).join('');
  const msg=`مرحباً، أريد تطوير تصميم مبدئي لبيتي.%0Aمساحة الأرض: ${land} م²%0Aمساحة البناء المحسوبة 65%: ${gross.toFixed(1)} م²%0Aعدد الشقق بالدور: ${aps}%0Aمساحة الشقة التقريبية: ${unit.toFixed(1)} م²%0Aالغرف: ${beds}، الحمامات: ${baths}، المطابخ: ${kitchens}، الصالات: ${living}%0Aغرفة شغالة: ${maid?'نعم':'لا'}${notes?`%0Aملاحظات: ${encodeURIComponent(notes)}`:''}%0Aأرغب بالتواصل لتطوير أحد الاقتراحات إلى مخطط هندسي.`;
  $('wa').href='https://wa.me/966542277575?text='+msg;
  $('results').classList.remove('hidden');
  $('results').scrollIntoView({behavior:'smooth'});
});

function row(n,r,u){return `<b>${n}: ${(u*r).toFixed(1)} م²</b><div class="bar"><i style="width:${r*100}%"></i></div>`}

function planSvg(aps,beds,baths,kitchens,living,maid,variant){
  const W=720,H=520,coreW=150,coreX=(W-coreW)/2,corrY=210,corrH=100;
  let svg=`<svg class="floorplan" viewBox="0 0 ${W} ${H}" role="img" aria-label="مخطط مبدئي للشقق"><rect width="720" height="520" rx="18" class="plan-bg"/><rect x="${coreX}" y="90" width="${coreW}" height="330" rx="10" class="core"/><rect x="${coreX+18}" y="115" width="52" height="92" class="lift"/><text x="${coreX+44}" y="164" class="label small">مصعد</text><rect x="${coreX+80}" y="115" width="52" height="190" class="stairs"/><path d="M${coreX+84} 292h44v-20h-44v-20h44v-20h-44v-20h44v-20h-44v-20h44v-20h-44" class="stairline"/><text x="${coreX+106}" y="328" class="label small">درج</text><rect x="70" y="${corrY}" width="580" height="${corrH}" rx="8" class="corridor"/><text x="360" y="268" class="label">ممر توزيع الشقق</text>`;
  const boxes=unitBoxes(aps);
  boxes.forEach((b,idx)=>{svg+=apartmentBox(b,idx+1,beds,baths,kitchens,living,maid,variant)});
  svg+=`</svg>`;
  return svg;
}

function unitBoxes(aps){
  if(aps===1)return [{x:65,y:55,w:250,h:145},{x:405,y:325,w:250,h:145}];
  if(aps===2)return [{x:55,y:45,w:245,h:150},{x:420,y:45,w:245,h:150}];
  if(aps===3)return [{x:45,y:40,w:235,h:150},{x:440,y:40,w:235,h:150},{x:235,y:330,w:250,h:150}];
  return [{x:35,y:35,w:230,h:150},{x:455,y:35,w:230,h:150},{x:35,y:335,w:230,h:150},{x:455,y:335,w:230,h:150}];
}

function apartmentBox(b,n,beds,baths,kitchens,living,maid,variant){
  const x=b.x,y=b.y,w=b.w,h=b.h;
  const shift=variant*4;
  const labels=[];
  const roomNames=[];
  for(let i=0;i<beds;i++)roomNames.push('غرفة نوم');
  for(let i=0;i<living;i++)roomNames.push(i===0?'صالة':'مجلس/صالة');
  for(let i=0;i<kitchens;i++)roomNames.push('مطبخ');
  for(let i=0;i<baths;i++)roomNames.push('حمام');
  if(maid)roomNames.push('غرفة شغالة');
  const count=Math.min(roomNames.length,8),cols=2,rows=Math.ceil(count/cols),cw=(w-12)/cols,ch=(h-34)/rows;
  for(let i=0;i<count;i++){
    const cx=x+6+(i%cols)*cw,cy=y+28+Math.floor(i/cols)*ch;
    labels.push(`<rect x="${cx}" y="${cy}" width="${cw-4}" height="${ch-4}" rx="4" class="room r${(i+variant)%4}"/><text x="${cx+(cw-4)/2}" y="${cy+(ch-4)/2+4}" class="room-label">${roomNames[i]}</text>`)
  }
  return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" class="apt"/><text x="${x+w/2}" y="${y+20}" class="apt-title">شقة ${n}</text>${labels.join('')}<line x1="${x+w/2-shift}" y1="${y+h}" x2="${x+w/2-shift}" y2="${y+h+18}" class="door"/></g>`;
}