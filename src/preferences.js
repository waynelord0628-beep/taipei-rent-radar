// Explicit photo feedback only: do not infer windows or brightness from ad titles.
const feedback={
  f5e24a1efecc84cd:{rank:2,note:'你本輪最喜歡：明亮、整體合適'},
  '3781e4b8f4a55659':{rank:1,note:'你評為還行：可接受的參考'},
};
export function personalPreference(home){
  return (home.memberIds||[home.id]).map(id=>feedback[id]).filter(Boolean).sort((a,b)=>b.rank-a.rank)[0]||null;
}
export function personalRecommendations(items){
  return items.filter(x=>x.assessment.status!=='excluded'&&personalPreference(x)).sort((a,b)=>personalPreference(b).rank-personalPreference(a).rank).slice(0,3);
}
